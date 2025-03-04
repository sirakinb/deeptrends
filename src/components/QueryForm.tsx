'use client';

import React, { useState } from 'react';
import { Listbox } from '@headlessui/react';
import { ChevronUpDownIcon, CalendarIcon } from '@heroicons/react/24/outline';
import type { QuerySchedule } from '@/lib/supabase';
import axios from 'axios';
import type { QueryFrequency, WeekDay, PerplexityModel } from '@/types';

const frequencies = [
  { id: 'immediate', name: 'Immediate' },
  { id: 'daily', name: 'Daily' },
  { id: 'weekly', name: 'Weekly' },
] as const;

const weekDays = [
  { id: 'monday', name: 'Monday' },
  { id: 'tuesday', name: 'Tuesday' },
  { id: 'wednesday', name: 'Wednesday' },
  { id: 'thursday', name: 'Thursday' },
  { id: 'friday', name: 'Friday' },
  { id: 'saturday', name: 'Saturday' },
  { id: 'sunday', name: 'Sunday' },
] as const;

const models = [
  { id: 'sonar-deep-research' as const, name: 'Sonar Deep Research' },
  { id: 'sonar-pro' as const, name: 'Sonar Pro' },
] as const;

interface FormData {
  query: string;
  model: PerplexityModel;
  frequency: QueryFrequency;
  time: string;
  week_day: WeekDay;
}

interface QueryFormProps {
  onSubmit: (schedule: Partial<QuerySchedule>) => void;
}

export function QueryForm({ onSubmit }: QueryFormProps) {
  const [formData, setFormData] = useState<FormData>({
    query: '',
    model: 'sonar-pro',
    frequency: 'immediate',
    time: '09:00',
    week_day: 'monday',
  });
  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState<string>('');
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      setLoading(true);
      setResult(null);
      setError(null);
      setProgress(20);

      // Send query to backend
      const response = await axios.post('/api/query', {
        query: formData.query,
        model: formData.model,
        ...(formData.frequency !== 'immediate' && {
          schedule: {
            frequency: formData.frequency,
            time: formData.time,
            week_day: formData.week_day,
            next_run: new Date().toISOString()
          }
        })
      });
      
      setLoadingStage('Synthesizing research findings...');
      setProgress(80);
      
      // If immediate, show the result
      if (formData.frequency === 'immediate') {
        setResult(response.data.result);
        setLoadingStage('Research complete!');
        setProgress(100);
      } else {
        // For scheduled queries, notify the parent component
        onSubmit({
          id: response.data.scheduleId,
          query: formData.query,
          frequency: formData.frequency,
          time: formData.time,
          week_day: formData.week_day,
          model: formData.model,
          is_active: true,
          status: 'scheduled',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
        
        // Show success message
        setResult('Schedule created successfully!');
        
        // Reset form for scheduled queries
        resetForm();
      }
    } catch (error: any) {
      console.error('Error submitting query:', error);
      setError(error.response?.data?.error || 'An unexpected error occurred');
    } finally {
      setLoading(false);
      setIsSubmitting(false);
      setProgress(0);
    }
  };

  const resetForm = () => {
    setFormData({
      query: '',
      model: 'sonar-pro',
      frequency: 'immediate',
      time: '09:00',
      week_day: 'monday',
    });
  };

  const selectedFrequency = frequencies.find(f => f.id === formData.frequency);
  const selectedWeekDay = weekDays.find(d => d.id === formData.week_day);
  const selectedModel = models.find(m => m.id === formData.model);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <label htmlFor="query" className="block text-sm font-medium mb-1">
            Research Query
          </label>
          <textarea
            id="query"
            rows={4}
            className="input-field w-full"
            value={formData.query}
            onChange={(e) => setFormData({ ...formData, query: e.target.value })}
            placeholder="Enter your research query..."
            required
            disabled={loading}
          />
        </div>

        <div>
          <Listbox
            value={selectedModel}
            onChange={(model) => setFormData({ ...formData, model: model.id })}
            disabled={loading}
          >
            <div className="relative">
              <Listbox.Label className="block text-sm font-medium mb-1">Model</Listbox.Label>
              <Listbox.Button className="input-field w-full text-left flex justify-between items-center">
                <span>{selectedModel?.name}</span>
                <ChevronUpDownIcon className="h-5 w-5 text-gray-400" />
              </Listbox.Button>
              <Listbox.Options className="absolute z-10 mt-1 w-full bg-gray-800 rounded-md shadow-lg max-h-60 overflow-auto focus:outline-none">
                {models.map((model) => (
                  <Listbox.Option
                    key={model.id}
                    value={model}
                    className={({ active }) =>
                      `relative cursor-pointer select-none py-2 px-4 ${
                        active ? 'bg-blue-600' : ''
                      }`
                    }
                  >
                    {model.name}
                  </Listbox.Option>
                ))}
              </Listbox.Options>
            </div>
          </Listbox>
        </div>

        <div>
          <Listbox
            value={selectedFrequency}
            onChange={(frequency) => setFormData({ ...formData, frequency: frequency.id })}
            disabled={loading}
          >
            <div className="relative">
              <Listbox.Label className="block text-sm font-medium mb-1">Frequency</Listbox.Label>
              <Listbox.Button className="input-field w-full text-left flex justify-between items-center">
                <span>{selectedFrequency?.name}</span>
                <ChevronUpDownIcon className="h-5 w-5 text-gray-400" />
              </Listbox.Button>
              <Listbox.Options className="absolute z-10 mt-1 w-full bg-gray-800 rounded-md shadow-lg max-h-60 overflow-auto focus:outline-none">
                {frequencies.map((frequency) => (
                  <Listbox.Option
                    key={frequency.id}
                    value={frequency}
                    className={({ active }) =>
                      `relative cursor-pointer select-none py-2 px-4 ${
                        active ? 'bg-blue-600' : ''
                      }`
                    }
                  >
                    <div>
                      <div className="font-medium">{frequency.name}</div>
                    </div>
                  </Listbox.Option>
                ))}
              </Listbox.Options>
            </div>
          </Listbox>
        </div>

        {formData.frequency !== 'immediate' && (
          <div className="space-y-4">
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
                required
                disabled={loading}
              />
            </div>

            {formData.frequency === 'weekly' && (
              <div>
                <Listbox
                  value={selectedWeekDay}
                  onChange={(day) => setFormData({ ...formData, week_day: day.id })}
                  disabled={loading}
                >
                  <div className="relative">
                    <Listbox.Label className="block text-sm font-medium mb-1">Day of Week</Listbox.Label>
                    <Listbox.Button className="input-field w-full text-left flex justify-between items-center">
                      <span>{selectedWeekDay?.name}</span>
                      <ChevronUpDownIcon className="h-5 w-5 text-gray-400" />
                    </Listbox.Button>
                    <Listbox.Options className="absolute z-10 mt-1 w-full bg-gray-800 rounded-md shadow-lg max-h-60 overflow-auto focus:outline-none">
                      {weekDays.map((day) => (
                        <Listbox.Option
                          key={day.id}
                          value={day}
                          className={({ active }) =>
                            `relative cursor-pointer select-none py-2 px-4 ${
                              active ? 'bg-blue-600' : ''
                            }`
                          }
                        >
                          {day.name}
                        </Listbox.Option>
                      ))}
                    </Listbox.Options>
                  </div>
                </Listbox>
              </div>
            )}
          </div>
        )}

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

        {error && (
          <div className="mt-4 p-4 bg-red-900/50 rounded-lg border border-red-700">
            <h3 className="text-sm font-medium text-red-400 mb-1">Error</h3>
            <div className="text-red-100">{error}</div>
          </div>
        )}

        {result && (
          <div className="mt-4 p-4 bg-gray-800 rounded-lg border border-gray-700">
            <h3 className="text-sm font-medium text-gray-300 mb-2">Result</h3>
            <div className="text-gray-200 whitespace-pre-wrap">{result}</div>
          </div>
        )}
      </div>
    </form>
  );
} 