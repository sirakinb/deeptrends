'use client';
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Home;
const react_1 = __importStar(require("react"));
const QueryForm_1 = require("../components/QueryForm");
const ScheduleList_1 = require("../components/ScheduleList");
function Home() {
    const [schedules, setSchedules] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [refreshing, setRefreshing] = (0, react_1.useState)(false);
    const [lastUpdated, setLastUpdated] = (0, react_1.useState)(null);
    const [pendingSchedules, setPendingSchedules] = (0, react_1.useState)([]);
    const isDeletingRef = (0, react_1.useRef)({});
    const isTogglingRef = (0, react_1.useRef)({});
    // Helper to check if schedules have changed
    const schedulesEqual = (a, b) => {
        if (a.length !== b.length)
            return false;
        // Create a map of b schedules by ID for faster lookup
        const bMap = new Map(b.map(schedule => [schedule.id, schedule]));
        return a.every(itemA => {
            const itemB = bMap.get(itemA.id);
            if (!itemB)
                return false;
            // Compare important fields
            return itemA.is_active === itemB.is_active &&
                itemA.frequency === itemB.frequency &&
                itemA.time === itemB.time &&
                itemA.week_day === itemB.week_day;
        });
    };
    const fetchSchedules = (0, react_1.useCallback)(async (showLoadingState = true) => {
        try {
            if (showLoadingState) {
                setRefreshing(true);
            }
            const response = await fetch('/api/schedules');
            if (!response.ok) {
                throw new Error('Failed to fetch schedules');
            }
            const data = await response.json();
            // Process any pending schedules first
            if (pendingSchedules.length > 0) {
                // Identify which pending schedules are now in the fetched data
                const pendingIdsToRemove = new Set();
                const dataQueries = new Map();
                // Create a map of queries to detect duplicates by content
                data.forEach(schedule => {
                    const key = `${schedule.query}|${schedule.frequency}|${schedule.time}|${schedule.week_day || ''}`;
                    dataQueries.set(key, schedule);
                });
                // Mark pending schedules that have matching queries in the data
                pendingSchedules.forEach(pending => {
                    // Check by ID
                    if (data.some(s => s.id === pending.id)) {
                        pendingIdsToRemove.add(pending.id);
                    }
                    else {
                        // Also check by content to catch cases where the ID might be different
                        const key = `${pending.query}|${pending.frequency}|${pending.time}|${pending.week_day || ''}`;
                        if (dataQueries.has(key)) {
                            pendingIdsToRemove.add(pending.id);
                        }
                    }
                });
                // Remove pending schedules that now appear in the fetched data
                if (pendingIdsToRemove.size > 0) {
                    setPendingSchedules(pendingSchedules.filter(pendingSchedule => !pendingIdsToRemove.has(pendingSchedule.id)));
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
        }
        catch (error) {
            console.error('Error fetching schedules:', error);
        }
        finally {
            setRefreshing(false);
        }
    }, [schedules, loading, pendingSchedules]);
    (0, react_1.useEffect)(() => {
        // Initial fetch
        fetchSchedules();
        // Poll for updates every 30 seconds
        const intervalId = setInterval(() => fetchSchedules(false), 30000);
        return () => clearInterval(intervalId);
    }, [fetchSchedules]);
    const addSchedule = async (schedule) => {
        // Create a unique ID for new schedules
        const tempId = Date.now().toString();
        // Check if we already have a pending schedule with the same query
        const key = `${schedule.query}|${schedule.frequency}|${schedule.time}|${schedule.week_day || ''}`;
        const hasDuplicate = pendingSchedules.some(p => `${p.query}|${p.frequency}|${p.time}|${p.week_day || ''}` === key);
        // Don't add a duplicate pending schedule
        if (hasDuplicate) {
            console.log("Skipping duplicate pending schedule");
            return;
        }
        // Create a temporary schedule object with a pending status
        const tempSchedule = {
            id: tempId,
            query: schedule.query,
            frequency: schedule.frequency,
            time: schedule.time,
            week_day: schedule.week_day,
            model: schedule.model,
            is_active: true,
            status: 'scheduled',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            isPending: true // UI-only flag to indicate pending state
        };
        // Add to pending schedules for immediate display
        setPendingSchedules([...pendingSchedules, tempSchedule]);
        // Force an immediate fetch to update with the real schedule data
        setTimeout(() => fetchSchedules(), 1000);
    };
    const toggleSchedule = async (id) => {
        // Prevent multiple toggle requests for the same ID
        if (isTogglingRef.current[id])
            return;
        isTogglingRef.current[id] = true;
        try {
            const schedule = schedules.find(s => s.id === id);
            if (!schedule)
                return;
            const updatedSchedule = { ...schedule, is_active: !schedule.is_active };
            // Update local state immediately for better UX
            setSchedules(prevSchedules => prevSchedules.map(s => s.id === id ? updatedSchedule : s));
            const response = await fetch(`/api/schedules/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updatedSchedule),
            });
            if (!response.ok) {
                // Revert the local state if the server update failed
                setSchedules(prevSchedules => prevSchedules.map(s => s.id === id ? schedule : s));
                throw new Error('Failed to update schedule');
            }
        }
        catch (error) {
            console.error('Error toggling schedule:', error);
        }
        finally {
            delete isTogglingRef.current[id];
        }
    };
    const deleteSchedule = async (id) => {
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
            }
            else if (response.status !== 404) {
                console.error('Failed to delete schedule:', await response.text());
            }
        }
        catch (error) {
            console.error('Error deleting schedule:', error);
        }
        finally {
            isDeletingRef.current[id] = false;
        }
    };
    // Combined list of confirmed and pending schedules
    const allSchedules = [...schedules, ...pendingSchedules];
    return (<main className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-4xl font-bold text-center mb-8 text-white">
        Deep Trends
      </h1>
      {lastUpdated && (<div className="text-center text-xs text-gray-500 mb-4">
          Last updated: {lastUpdated.toLocaleTimeString()}
          {refreshing && <span className="ml-2 inline-block w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>}
        </div>)}
      <div className="space-y-8">
        <QueryForm_1.QueryForm onSubmit={addSchedule}/>
        {loading ? (<div className="card text-center text-gray-400">
            Loading schedules...
          </div>) : (<ScheduleList_1.ScheduleList schedules={allSchedules} onToggle={toggleSchedule} onDelete={deleteSchedule}/>)}
      </div>
    </main>);
}
