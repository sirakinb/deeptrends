'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { QueryForm } from '../components/QueryForm';
import { ScheduleList } from '../components/ScheduleList';
import type { QuerySchedule } from '@/lib/supabase';

// Extended interface for UI purposes
interface ExtendedQuerySchedule extends QuerySchedule {
  isPending?: boolean;
}

export default function Home() {
  const [schedules, setSchedules] = useState<QuerySchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [pendingSchedules, setPendingSchedules] = useState<ExtendedQuerySchedule[]>([]);
  const isDeletingRef = useRef<{[key: string]: boolean}>({});
  const isTogglingRef = useRef<{[key: string]: boolean}>({});

  // Helper to check if schedules have changed
  const schedulesEqual = (a: QuerySchedule[], b: QuerySchedule[]): boolean => {
    if (a.length !== b.length) return false;
    
    // Create a map of IDs for quick lookup
    const bMap = new Map(b.map(item => [item.id, item]));
    
    // Check if all items in a exist in b with the same values
    return a.every(itemA => {
      const itemB = bMap.get(itemA.id);
      if (!itemB) return false;
      
      // Compare important fields
      return itemA.is_active === itemB.is_active &&
             itemA.cron === itemB.cron;
    });
  };

  const fetchSchedules = useCallback(async (showLoadingState = true) => {
    try {
      if (showLoadingState) {
        setRefreshing(true);
      }
      
      const response = await fetch('/api/schedules');
      if (!response.ok) {
        throw new Error('Failed to fetch schedules');
      }
      
      const data = await response.json() as QuerySchedule[];
      
      // Process any pending schedules first
      if (pendingSchedules.length > 0) {
        // Identify which pending schedules are now in the fetched data
        const pendingIdsToRemove = new Set<string>();
        const dataQueries = new Map<string, QuerySchedule>();
        
        // Create a map of queries to detect duplicates by content
        data.forEach(schedule => {
          const key = `${schedule.query}|${schedule.cron}`;
          dataQueries.set(key, schedule);
        });
        
        // Mark pending schedules that have matching queries in the data
        pendingSchedules.forEach(pending => {
          // Check by ID
          if (data.some(s => s.id === pending.id)) {
            pendingIdsToRemove.add(pending.id);
          } else {
            // Also check by content to catch cases where the ID might be different
            const key = `${pending.query}|${pending.cron}`;
            if (dataQueries.has(key)) {
              pendingIdsToRemove.add(pending.id);
            }
          }
        });
        
        // Remove pending schedules that now appear in the fetched data
        if (pendingIdsToRemove.size > 0) {
          setPendingSchedules(pendingSchedules.filter(
            pendingSchedule => !pendingIdsToRemove.has(pendingSchedule.id)
          ));
        }
      }
      
      // Only update state if data actually changed
      if (!schedulesEqual(data, schedules)) {
        setSchedules(data);
      }
      
      // Only show initial loading state
      if (loading) {
        setLoading(false);
      }
      
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching schedules:', error);
    } finally {
      setRefreshing(false);
    }
  }, [schedules, loading, pendingSchedules]);

  useEffect(() => {
    // Initial fetch
    fetchSchedules();
    
    // Poll for updates every 30 seconds
    const intervalId = setInterval(() => fetchSchedules(false), 30000);
    
    return () => clearInterval(intervalId);
  }, [fetchSchedules]);

  const addSchedule = async (schedule: Partial<QuerySchedule>) => {
    // Create a unique ID for new schedules
    const tempId = Date.now().toString();
    
    // Check if we already have a pending schedule with the same query
    const key = `${schedule.query}|${schedule.cron}`;
    const hasDuplicate = pendingSchedules.some(p => 
      `${p.query}|${p.cron}` === key
    );
    
    // Don't add a duplicate pending schedule
    if (hasDuplicate) {
      console.log("Skipping duplicate pending schedule");
      return;
    }
    
    // Create a temporary schedule object with a pending status
    const tempSchedule: ExtendedQuerySchedule = {
      id: tempId,
      query: schedule.query!,
      cron: schedule.cron!,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      model: schedule.model,
      isPending: true // UI-only flag to indicate pending state
    };
    
    // Add to pending schedules for immediate display
    setPendingSchedules([...pendingSchedules, tempSchedule]);
    
    // Force an immediate fetch to update with the real schedule data
    setTimeout(() => fetchSchedules(), 1000);
  };

  const toggleSchedule = async (id: string) => {
    // Prevent multiple toggle requests for the same ID
    if (isTogglingRef.current[id]) return;
    isTogglingRef.current[id] = true;

    try {
      const schedule = schedules.find(s => s.id === id);
      if (!schedule) return;
      
      const updatedSchedule = { ...schedule, is_active: !schedule.is_active };
      
      // Update local state immediately for better UX
      setSchedules(prevSchedules => 
        prevSchedules.map(s => s.id === id ? updatedSchedule : s)
      );
      
      const response = await fetch(`/api/schedules/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedSchedule),
      });
      
      if (!response.ok) {
        // Revert the local state if the server update failed
        setSchedules(prevSchedules => 
          prevSchedules.map(s => s.id === id ? schedule : s)
        );
        throw new Error('Failed to update schedule');
      }
    } catch (error) {
      console.error('Error toggling schedule:', error);
    } finally {
      delete isTogglingRef.current[id];
    }
  };

  const deleteSchedule = async (id: string) => {
    // Prevent multiple delete requests for the same schedule
    if (isDeletingRef.current[id]) {
      return;
    }

    try {
      isDeletingRef.current[id] = true;
      const response = await fetch(`/api/schedules/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setSchedules(prev => prev.filter(s => s.id !== id));
        setPendingSchedules(prev => prev.filter(s => s.id !== id));
      } else if (response.status !== 404) {
        console.error('Failed to delete schedule:', await response.text());
      }
    } catch (error) {
      console.error('Error deleting schedule:', error);
    } finally {
      isDeletingRef.current[id] = false;
    }
  };

  // Combined list of confirmed and pending schedules
  const allSchedules = [...schedules, ...pendingSchedules];

  return (
    <main className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-4xl font-bold text-center mb-8 text-white">
        Deep Trends
      </h1>
      {lastUpdated && (
        <div className="text-center text-xs text-gray-500 mb-4">
          Last updated: {lastUpdated.toLocaleTimeString()}
          {refreshing && <span className="ml-2 inline-block w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>}
        </div>
      )}
      <div className="space-y-8">
        <QueryForm onSubmit={addSchedule} />
        {loading ? (
          <div className="card text-center text-gray-400">
            Loading schedules...
          </div>
        ) : (
          <ScheduleList 
            schedules={allSchedules}
            onToggle={toggleSchedule}
            onDelete={deleteSchedule}
          />
        )}
      </div>
    </main>
  );
} 