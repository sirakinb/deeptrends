'use client';

import React from 'react';
import { Switch } from '@headlessui/react';
import { TrashIcon } from '@heroicons/react/24/outline';
import type { QuerySchedule } from '../types';

interface ScheduleListProps {
  schedules: QuerySchedule[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

export function ScheduleList({ schedules, onToggle, onDelete }: ScheduleListProps) {
  if (schedules.length === 0) {
    return (
      <div className="card text-center text-gray-400">
        No schedules created yet
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {schedules.map((schedule) => (
        <div key={schedule.id} className="card">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-medium mb-2">Query</h3>
              <p className="text-gray-300 text-sm mb-4">{schedule.query}</p>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Frequency:</span>{' '}
                  <span className="text-gray-200 capitalize">{schedule.frequency}</span>
                </div>
                <div>
                  <span className="text-gray-400">Time:</span>{' '}
                  <span className="text-gray-200">{schedule.time} EST</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Switch
                checked={schedule.isActive}
                onChange={() => onToggle(schedule.id)}
                className={`${
                  schedule.isActive ? 'bg-blue-600' : 'bg-gray-700'
                } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
              >
                <span
                  className={`${
                    schedule.isActive ? 'translate-x-6' : 'translate-x-1'
                  } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                />
              </Switch>
              
              <button
                onClick={() => onDelete(schedule.id)}
                className="text-gray-400 hover:text-red-500 transition-colors"
              >
                <TrashIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
} 