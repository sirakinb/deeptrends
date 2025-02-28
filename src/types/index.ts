export interface QuerySchedule {
  id: string;
  query: string;
  frequency: 'immediate' | 'daily' | 'weekly' | 'weekend';
  time: string;
  isActive: boolean;
}

export interface ScheduleFormData {
  query: string;
  frequency: 'immediate' | 'daily' | 'weekly' | 'weekend';
  time: string;
} 