import { format, addDays } from 'date-fns';
import { QueryFrequency, WeekDay } from '../types';

export function getNextRunPreview(frequency: QueryFrequency, time: string, weekDay?: WeekDay): string {
  const [hours, minutes] = time.split(':');
  const now = new Date();
  let nextRun = new Date();
  nextRun.setHours(parseInt(hours, 10));
  nextRun.setMinutes(parseInt(minutes, 10));
  nextRun.setSeconds(0);
  nextRun.setMilliseconds(0);

  if (frequency === 'daily') {
    // If the time has passed today, schedule for tomorrow
    if (nextRun <= now) {
      nextRun = addDays(nextRun, 1);
    }
  } else if (frequency === 'weekly' && weekDay) {
    const days = {
      sunday: 0,
      monday: 1,
      tuesday: 2,
      wednesday: 3,
      thursday: 4,
      friday: 5,
      saturday: 6
    };
    const targetDay = days[weekDay];
    const currentDay = now.getDay();
    let daysToAdd = targetDay - currentDay;
    
    if (daysToAdd < 0) {
      daysToAdd += 7;
    } else if (daysToAdd === 0 && nextRun <= now) {
      daysToAdd = 7;
    }
    
    nextRun = addDays(nextRun, daysToAdd);
  }

  return format(nextRun, "EEEE, MMMM d 'at' h:mm a 'EST'");
} 