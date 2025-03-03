import express from 'express';
import { scheduler } from '../services/scheduler';
import { QuerySchedule } from '../types';
import { supabase } from '../lib/supabase';

const app = express();
const port = process.env.PORT || 3001;

async function loadSchedules(): Promise<QuerySchedule[]> {
  try {
    const { data, error } = await supabase
      .from('schedules')
      .select('*')
      .eq('is_active', true);

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error loading schedules from Supabase:', error);
    return [];
  }
}

async function initializeSchedules() {
  const schedules = await loadSchedules();
  console.log(`Loading ${schedules.length} schedules from Supabase...`);
  
  scheduler.stopAll();
  
  for (const schedule of schedules) {
    try {
      scheduler.onError(schedule.id, async (error: Error) => {
        console.error(`Schedule ${schedule.id} failed:`, error);
      });

      await scheduler.scheduleQuery(schedule);
      console.log(`Scheduled query: ${schedule.id}`);
    } catch (error) {
      console.error(`Error scheduling query ${schedule.id}:`, error);
    }
  }
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', activeSchedules: scheduler.getActiveSchedules() });
});

// Start the scheduler and express server
console.log('Starting production scheduler...');

initializeSchedules().then(() => {
  app.listen(port, () => {
    console.log(`Scheduler running on port ${port}`);
  });
}).catch((error) => {
  console.error('Failed to initialize schedules:', error);
  process.exit(1);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('Received SIGTERM. Shutting down gracefully...');
  scheduler.stopAll();
  process.exit(0);
}); 