"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const scheduler_1 = require("../services/scheduler");
const supabase_1 = require("../lib/supabase");
async function loadSchedules() {
    try {
        const { data, error } = await supabase_1.supabase
            .from('schedules')
            .select('*')
            .eq('is_active', true);
        if (error) {
            console.error('Error loading schedules:', error);
            return [];
        }
        return data || [];
    }
    catch (error) {
        console.error('Error loading schedules:', error);
        return [];
    }
}
async function saveSchedule(schedule) {
    try {
        const schedules = await loadSchedules();
        const existingIndex = schedules.findIndex(s => s.id === schedule.id);
        if (existingIndex >= 0) {
            schedules[existingIndex] = schedule;
        }
        else {
            schedules.push(schedule);
        }
        await supabase_1.supabase
            .from('schedules')
            .update({
            is_active: schedule.is_active,
            updated_at: new Date().toISOString()
        })
            .eq('id', schedule.id);
    }
    catch (error) {
        console.error('Error saving schedule:', error);
    }
}
async function removeSchedule(scheduleId) {
    try {
        const schedules = await loadSchedules();
        const filteredSchedules = schedules.filter(s => s.id !== scheduleId);
        await supabase_1.supabase
            .from('schedules')
            .update({
            is_active: false,
            updated_at: new Date().toISOString()
        })
            .eq('id', scheduleId);
    }
    catch (error) {
        console.error('Error removing schedule:', error);
    }
}
// Initialize schedules from Supabase
async function initializeSchedules() {
    const schedules = await loadSchedules();
    console.log(`Loading ${schedules.length} active schedules from Supabase...`);
    // Stop all existing schedules
    scheduler_1.scheduler.stopAll();
    for (const schedule of schedules) {
        try {
            // Register error handler for this schedule
            scheduler_1.scheduler.onError(schedule.id, async (error) => {
                console.error(`Schedule ${schedule.id} failed:`, error);
                // Update schedule in Supabase with error info
                const { error: updateError } = await supabase_1.supabase
                    .from('schedules')
                    .update({
                    last_error: error.message,
                    last_error_time: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                    .eq('id', schedule.id);
                if (updateError) {
                    console.error('Failed to update schedule error state:', updateError);
                }
            });
            // Schedule the query
            await scheduler_1.scheduler.scheduleQuery(schedule);
            console.log(`Scheduled query: ${schedule.id}`);
        }
        catch (error) {
            console.error(`Error scheduling query ${schedule.id}:`, error);
        }
    }
}
// Watch for changes in Supabase using polling
async function watchSchedules() {
    let lastCheck = new Date();
    setInterval(async () => {
        try {
            const { data: changes, error } = await supabase_1.supabase
                .from('schedules')
                .select('*')
                .gt('updated_at', lastCheck.toISOString());
            if (error) {
                console.error('Error checking for schedule changes:', error);
                return;
            }
            if (changes && changes.length > 0) {
                console.log(`Detected ${changes.length} schedule changes, reinitializing...`);
                await initializeSchedules();
            }
            lastCheck = new Date();
        }
        catch (error) {
            console.error('Error watching for schedule changes:', error);
        }
    }, 30000); // Check every 30 seconds
}
// Start the scheduler
async function main() {
    await initializeSchedules();
    await watchSchedules();
    console.log('Scheduler is running and watching for Supabase changes...');
}
main().catch(error => {
    console.error('Fatal error in scheduler:', error);
    process.exit(1);
});
