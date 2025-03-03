import { createClient } from '@supabase/supabase-js';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL');
}

if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export type QuerySchedule = {
  id: string;
  query: string;
  model?: string;
  is_active: boolean;
  status?: 'scheduled' | 'processing' | 'completed' | 'error';
  frequency?: 'immediate' | 'daily' | 'weekly';
  time?: string;
  week_day?: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  next_run?: string;
  last_run?: string;
  last_error?: string;
  last_error_time?: string;
  last_result?: string;
  created_at: string;
  updated_at: string;
};

export type QueryResult = {
  id: number;
  query: string;
  result: string;
  citations: string[];
  model?: string;
  created_at: string;
}; 