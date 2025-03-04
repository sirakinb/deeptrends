"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.scheduler = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const axios_1 = __importDefault(require("axios"));
const date_fns_1 = require("date-fns");
const supabase_1 = require("../lib/supabase");
const MAKE_WEBHOOK_URL = 'https://hook.us2.make.com/9hgfpiw3sd4y9giaodcyl01hnkc4jxsh';
class Scheduler {
    constructor() {
        this.schedules = new Map();
        this.errorHandlers = new Map();
    }
    // Convert weekday to cron day number (0-6, where 0 is Sunday)
    weekDayToCron(day) {
        const days = {
            sunday: 0,
            monday: 1,
            tuesday: 2,
            wednesday: 3,
            thursday: 4,
            friday: 5,
            saturday: 6
        };
        return days[day];
    }
    // Get cron expression based on frequency and time
    getCronExpression(schedule) {
        // Otherwise, build from frequency and time
        const [hours, minutes] = schedule.time.split(':');
        switch (schedule.frequency) {
            case 'daily':
                return `${minutes} ${hours} * * *`;
            case 'weekly':
                if (!schedule.week_day)
                    throw new Error('Weekly schedule requires a week_day');
                const dayNum = this.weekDayToCron(schedule.week_day);
                return `${minutes} ${hours} * * ${dayNum}`;
            default:
                throw new Error(`Unsupported frequency: ${schedule.frequency}`);
        }
    }
    // Calculate the next run time
    getNextRunTime(schedule) {
        const now = new Date();
        const [hours, minutes] = schedule.time.split(':');
        const targetTime = (0, date_fns_1.parse)(`${hours}:${minutes}`, 'HH:mm', now);
        if (schedule.frequency === 'daily') {
            // If today's time has passed, schedule for tomorrow
            if ((0, date_fns_1.isBefore)(targetTime, now)) {
                return (0, date_fns_1.addDays)(targetTime, 1).toISOString();
            }
            return targetTime.toISOString();
        }
        else if (schedule.frequency === 'weekly' && schedule.week_day) {
            const targetDay = this.weekDayToCron(schedule.week_day);
            const currentDay = now.getDay();
            const daysUntilTarget = (targetDay - currentDay + 7) % 7;
            // If it's the target day but time has passed, or if we need to wait for next week
            if ((daysUntilTarget === 0 && (0, date_fns_1.isBefore)(targetTime, now)) || daysUntilTarget === 0) {
                return (0, date_fns_1.addWeeks)(targetTime, 1).toISOString();
            }
            // Add the necessary days to get to the target day
            return (0, date_fns_1.addDays)(targetTime, daysUntilTarget).toISOString();
        }
        return now.toISOString();
    }
    // Schedule a new query
    async scheduleQuery(schedule) {
        if (!schedule.is_active) {
            console.log(`Schedule ${schedule.id} is not active, skipping`);
            return;
        }
        // Remove existing schedule if any
        this.unscheduleQuery(schedule.id);
        const cronExpression = this.getCronExpression(schedule);
        console.log(`Setting up schedule ${schedule.id} with cron: ${cronExpression}`);
        // Create the cron job
        const task = node_cron_1.default.schedule(cronExpression, async () => {
            try {
                console.log(`Executing scheduled query ${schedule.id} at ${new Date().toISOString()}`);
                // Update status to processing
                await supabase_1.supabase
                    .from('schedules')
                    .update({
                    status: 'processing',
                    updated_at: new Date().toISOString()
                })
                    .eq('id', schedule.id);
                // Call Perplexity API
                const perplexityResponse = await axios_1.default.post('https://api.perplexity.ai/chat/completions', {
                    model: schedule.model || 'pplx-7b-online',
                    messages: [
                        {
                            role: 'system',
                            content: 'You are a helpful research assistant. Provide detailed, well-researched answers.'
                        },
                        {
                            role: 'user',
                            content: schedule.query
                        }
                    ],
                    temperature: 0.2,
                    max_tokens: schedule.model === 'sonar-pro' ? 6000 : 4000,
                    top_p: 0.9
                }, {
                    headers: {
                        'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
                        'Content-Type': 'application/json'
                    }
                });
                const result = perplexityResponse.data.choices[0].message.content;
                const citations = perplexityResponse.data.citations || [];
                // Store the query result
                const { error: resultError } = await supabase_1.supabase
                    .from('query_results')
                    .insert([{
                        schedule_id: schedule.id,
                        query: schedule.query,
                        result,
                        model: schedule.model,
                        citations,
                        created_at: new Date().toISOString()
                    }]);
                if (resultError) {
                    console.error('Error storing query result:', resultError);
                    throw resultError;
                }
                // Update schedule status and next run time
                const { error: updateError } = await supabase_1.supabase
                    .from('schedules')
                    .update({
                    status: 'completed',
                    last_run: new Date().toISOString(),
                    next_run: this.getNextRunTime(schedule),
                    updated_at: new Date().toISOString(),
                    last_result: result
                })
                    .eq('id', schedule.id);
                if (updateError) {
                    console.error('Failed to update schedule status:', updateError);
                    throw updateError;
                }
                console.log(`Query ${schedule.id} executed successfully`);
                // Send to Make.com webhook
                await axios_1.default.post(MAKE_WEBHOOK_URL, {
                    query: schedule.query,
                    frequency: schedule.frequency,
                    time: schedule.time,
                    week_day: schedule.week_day,
                    model: schedule.model,
                    result,
                    citations,
                    timestamp: new Date().toISOString(),
                    scheduleId: schedule.id,
                    status: 'success'
                });
            }
            catch (error) {
                const errorMessage = error.response?.data?.error || error.message || 'Unknown error';
                // Update schedule with error info
                await supabase_1.supabase
                    .from('schedules')
                    .update({
                    status: 'error',
                    last_error: errorMessage,
                    last_error_time: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                    .eq('id', schedule.id);
                this.handleError(schedule.id, new Error(`Failed to execute scheduled query: ${errorMessage}`));
                // Try to notify webhook about the failure
                try {
                    await axios_1.default.post(MAKE_WEBHOOK_URL, {
                        query: schedule.query,
                        frequency: schedule.frequency,
                        time: schedule.time,
                        week_day: schedule.week_day,
                        model: schedule.model,
                        error: errorMessage,
                        timestamp: new Date().toISOString(),
                        scheduleId: schedule.id,
                        status: 'error'
                    });
                }
                catch (webhookError) {
                    console.error('Failed to send error notification to webhook:', webhookError);
                }
            }
        });
        // Start the task
        task.start();
        console.log(`Schedule ${schedule.id} started`);
        // Store the task
        this.schedules.set(schedule.id, task);
        // Set initial next run time in Supabase
        const { error: updateError } = await supabase_1.supabase
            .from('schedules')
            .update({
            status: 'scheduled',
            next_run: this.getNextRunTime(schedule),
            updated_at: new Date().toISOString()
        })
            .eq('id', schedule.id);
        if (updateError) {
            console.error('Failed to set initial schedule status:', updateError);
        }
    }
    // Handle errors for a schedule
    handleError(scheduleId, error) {
        const handler = this.errorHandlers.get(scheduleId);
        if (handler) {
            handler(error);
        }
        console.error(`Error in schedule ${scheduleId}:`, error);
    }
    // Register an error handler for a schedule
    onError(scheduleId, handler) {
        this.errorHandlers.set(scheduleId, handler);
    }
    // Remove error handler
    removeErrorHandler(scheduleId) {
        this.errorHandlers.delete(scheduleId);
    }
    // Stop and remove a scheduled query
    unscheduleQuery(scheduleId) {
        const task = this.schedules.get(scheduleId);
        if (task) {
            task.stop();
            this.schedules.delete(scheduleId);
            this.removeErrorHandler(scheduleId);
            console.log(`Schedule ${scheduleId} stopped and removed`);
        }
    }
    // Stop all schedules (useful for cleanup)
    stopAll() {
        console.log('Stopping all schedules...');
        for (const [id, task] of this.schedules) {
            task.stop();
            this.schedules.delete(id);
            this.removeErrorHandler(id);
            console.log(`Schedule ${id} stopped`);
        }
    }
    // Get number of active schedules
    getActiveSchedules() {
        return this.schedules.size;
    }
}
// Export a singleton instance
exports.scheduler = new Scheduler();
