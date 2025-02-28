'use client';

import React, { useState } from 'react';
import { Listbox } from '@headlessui/react';
import { ChevronUpDownIcon } from '@heroicons/react/24/outline';
import type { ScheduleFormData } from '../types';
import axios from 'axios';

const frequencies = [
  { id: 'immediate', name: 'Run Now' },
  { id: 'daily', name: 'Daily' },
  { id: 'weekly', name: 'Weekly' },
  { id: 'weekend', name: 'Weekend' },
];

interface QueryFormProps {
  onSubmit: (data: ScheduleFormData) => void;
}

export function QueryForm({ onSubmit }: QueryFormProps) {
  const [formData, setFormData] = useState<ScheduleFormData>({
    query: '',
    frequency: 'immediate',
    time: '09:00',
  });
  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState<string>('');
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setProgress(0);
    
    try {
      // Start query process
      setLoadingStage('Initiating deep research analysis...');
      setProgress(20);

      // Send query to backend
      const response = await axios.post('/api/query', formData);
      
      setLoadingStage('Synthesizing research findings...');
      setProgress(80);
      
      // If immediate, show the result
      if (formData.frequency === 'immediate') {
        setResult(response.data.result);
        setLoadingStage('Research complete!');
        setProgress(100);
      } else {
        // Update UI for scheduled queries
        onSubmit(formData);
        
        // Reset form for scheduled queries
        setFormData({
          query: '',
          frequency: 'immediate',
          time: '09:00',
        });
      }
    } catch (error) {
      console.error('Error submitting query:', error);
      setLoadingStage('Error: Research analysis failed. Please try again.');
      setProgress(100);
      alert('Failed to complete research. Please try again.');
    } finally {
      setTimeout(() => {
        setLoading(false);
        setLoadingStage('');
        setProgress(0);
      }, 1500); // Keep the final state visible a bit longer
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card">
      <div className="space-y-4">
        <div>
          <label htmlFor="query" className="block text-sm font-medium mb-1">
            Research Query
          </label>
          <textarea
            id="query"
            className="input-field w-full h-32 resize-none"
            value={formData.query}
            onChange={(e) => setFormData({ ...formData, query: e.target.value })}
            required
            placeholder="Enter your research query here..."
            disabled={loading}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Frequency</label>
            <Listbox
              value={formData.frequency}
              onChange={(value) => setFormData({ ...formData, frequency: value as 'immediate' | 'daily' | 'weekly' | 'weekend' })}
              disabled={loading}
            >
              <div className="relative">
                <Listbox.Button className="input-field w-full flex justify-between items-center">
                  <span className="block truncate">
                    {frequencies.find(f => f.id === formData.frequency)?.name}
                  </span>
                  <ChevronUpDownIcon className="h-5 w-5 text-gray-400" />
                </Listbox.Button>
                <Listbox.Options className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-lg">
                  {frequencies.map((frequency) => (
                    <Listbox.Option
                      key={frequency.id}
                      value={frequency.id}
                      className={({ active }) =>
                        `cursor-pointer select-none relative py-2 px-4 ${
                          active ? 'bg-blue-600 text-white' : 'text-gray-100'
                        }`
                      }
                    >
                      {frequency.name}
                    </Listbox.Option>
                  ))}
                </Listbox.Options>
              </div>
            </Listbox>
          </div>

          {formData.frequency !== 'immediate' && (
            <div>
              <label htmlFor="time" className="block text-sm font-medium mb-1">
                Time (EST)
              </label>
              <input
                type="time"
                id="time"
                className="input-field w-full"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                required={formData.frequency !== 'immediate'}
                disabled={loading}
              />
            </div>
          )}
        </div>

        {loading && (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-300">{loadingStage}</span>
              <span className="text-sm text-gray-400">{progress}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        <button 
          type="submit" 
          className={`btn-primary w-full ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={loading}
        >
          {loading ? 'Researching...' : formData.frequency === 'immediate' ? 'Run Query Now' : 'Create Schedule'}
        </button>

        {result && (
          <div className="mt-4 p-4 bg-gray-800 rounded-lg border border-gray-700">
            <h3 className="text-sm font-medium text-gray-300 mb-2">Research Findings:</h3>
            <div className="text-gray-100 whitespace-pre-wrap">{result}</div>
          </div>
        )}
      </div>
    </form>
  );
} 