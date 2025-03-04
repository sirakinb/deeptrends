"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const scheduler_1 = require("../services/scheduler");
const supabase_1 = require("../lib/supabase");
const app = (0, express_1.default)();
const port = process.env.PORT || 3001;
async function loadSchedules() {
    try {
        const { data, error } = await supabase_1.supabase
            .from('schedules')
            .select('*')
            .eq('is_active', true);
        if (error) {
            throw error;
        }
        return data || [];
    }
    catch (error) {
        console.error('Error loading schedules from Supabase:', error);
        return [];
    }
}
async function initializeSchedules() {
    const schedules = await loadSchedules();
    console.log(`Loading ${schedules.length} schedules from Supabase...`);
    scheduler_1.scheduler.stopAll();
    for (const schedule of schedules) {
        try {
            scheduler_1.scheduler.onError(schedule.id, async (error) => {
                console.error(`Schedule ${schedule.id} failed:`, error);
            });
            await scheduler_1.scheduler.scheduleQuery(schedule);
            console.log(`Scheduled query: ${schedule.id}`);
        }
        catch (error) {
            console.error(`Error scheduling query ${schedule.id}:`, error);
        }
    }
}
// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'healthy', activeSchedules: scheduler_1.scheduler.getActiveSchedules() });
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
    scheduler_1.scheduler.stopAll();
    process.exit(0);
});
