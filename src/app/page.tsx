'use client';

import React, { useState } from 'react';
import { QueryForm } from '../components/QueryForm';
import { ScheduleList } from '../components/ScheduleList';
import type { QuerySchedule } from '../types';

export default function Home() {
  const [schedules, setSchedules] = useState<QuerySchedule[]>([]);

  const addSchedule = async (schedule: Omit<QuerySchedule, 'id' | 'isActive'>) => {
    const newSchedule: QuerySchedule = {
      ...schedule,
      id: Date.now().toString(),
      isActive: true,
    };
    setSchedules([...schedules, newSchedule]);
  };

  const toggleSchedule = (id: string) => {
    setSchedules(schedules.map(schedule => 
      schedule.id === id 
        ? { ...schedule, isActive: !schedule.isActive }
        : schedule
    ));
  };

  const deleteSchedule = (id: string) => {
    setSchedules(schedules.filter(schedule => schedule.id !== id));
  };

  return (
    <main className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-4xl font-bold text-center mb-8 text-white">
        Deep Trends
      </h1>
      <div className="space-y-8">
        <QueryForm onSubmit={addSchedule} />
        <ScheduleList 
          schedules={schedules}
          onToggle={toggleSchedule}
          onDelete={deleteSchedule}
        />
      </div>
    </main>
  );
} 