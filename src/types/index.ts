export type PerplexityModel = 'sonar-deep-research' | 'sonar-pro';

export type WeekDay = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

/**
 * Frequency options for scheduling queries:
 * - immediate: Run the query right away
 * - daily: Run every day at the specified time
 * - weekly: Run on the specified day of the week at the specified time
 */
export type QueryFrequency = 'immediate' | 'daily' | 'weekly';

export type QuerySchedule = {
  id: string;
  query: string;
  model: string;
  frequency: 'daily' | 'weekly';
  time: string;
  week_day?: WeekDay; // Required when frequency is 'weekly'
  is_active: boolean;
  status: 'scheduled' | 'running' | 'completed' | 'error';
  created_at: string;
  updated_at: string;
  next_run?: string;
  last_error?: string;
  last_error_time?: string;
};

export interface ScheduleFormData {
  query: string;
  frequency: QueryFrequency;
  time: string; // 24-hour format in EST (e.g., "09:00")
  week_day: WeekDay;
  model: PerplexityModel;
} 