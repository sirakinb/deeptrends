"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const uuid_1 = require("uuid");
const SCHEDULES_FILE = path_1.default.join(process.cwd(), 'src/data/schedules.json');
async function loadSchedules() {
    try {
        const data = await promises_1.default.readFile(SCHEDULES_FILE, 'utf-8');
        return JSON.parse(data);
    }
    catch (error) {
        console.error('Error loading schedules:', error);
        return [];
    }
}
async function saveSchedules(schedules) {
    try {
        await promises_1.default.writeFile(SCHEDULES_FILE, JSON.stringify(schedules, null, 2));
        console.log('Schedules saved successfully');
    }
    catch (error) {
        console.error('Error saving schedules:', error);
    }
}
async function listSchedules() {
    const schedules = await loadSchedules();
    console.log('\nCurrent schedules:');
    schedules.forEach(schedule => {
        console.log(`\nID: ${schedule.id}`);
        console.log(`Query: ${schedule.query}`);
        console.log(`Time: ${schedule.time}`);
        console.log(`Frequency: ${schedule.frequency}`);
        console.log(`Active: ${schedule.is_active}`);
    });
}
async function deleteAllSchedules() {
    await saveSchedules([]);
    console.log('All schedules deleted');
}
async function deleteSchedule(id) {
    const schedules = await loadSchedules();
    const filtered = schedules.filter(s => s.id !== id);
    if (filtered.length === schedules.length) {
        console.log(`No schedule found with ID: ${id}`);
        return;
    }
    await saveSchedules(filtered);
    console.log(`Schedule ${id} deleted`);
}
async function addTestSchedule() {
    const now = new Date();
    const minutes = now.getMinutes() + 5; // 5 minutes from now
    const hours = now.getHours();
    const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    const schedule = {
        id: (0, uuid_1.v4)(),
        query: "What are the latest developments in AI?",
        frequency: "daily",
        time: timeString,
        week_day: "monday",
        model: "sonar-pro",
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        next_run: new Date().toISOString(),
        status: 'scheduled'
    };
    const schedules = await loadSchedules();
    schedules.push(schedule);
    await saveSchedules(schedules);
    console.log(`Test schedule added for ${timeString} (5 minutes from now)`);
    console.log(`ID: ${schedule.id}`);
}
async function removeDuplicateSchedules() {
    const schedules = await loadSchedules();
    const uniqueMap = new Map();
    // Keep only the latest entry for each duplicate set
    schedules.forEach(schedule => {
        // Create a key based on the unique attributes that define a duplicate
        const key = `${schedule.query}-${schedule.frequency}-${schedule.time}-${schedule.week_day || ''}`;
        // If we haven't seen this key yet, or this schedule is newer than the one we've seen
        if (!uniqueMap.has(key) ||
            new Date(schedule.created_at) > new Date(uniqueMap.get(key).created_at)) {
            uniqueMap.set(key, schedule);
        }
    });
    const uniqueSchedules = Array.from(uniqueMap.values());
    const removedCount = schedules.length - uniqueSchedules.length;
    if (removedCount > 0) {
        await saveSchedules(uniqueSchedules);
        console.log(`Removed ${removedCount} duplicate schedules`);
    }
    else {
        console.log('No duplicate schedules found');
    }
}
// Parse command line arguments
const command = process.argv[2];
const arg = process.argv[3];
async function main() {
    switch (command) {
        case 'list':
            await listSchedules();
            break;
        case 'delete':
            if (arg) {
                await deleteSchedule(arg);
            }
            else {
                await deleteAllSchedules();
            }
            break;
        case 'add-test':
            await addTestSchedule();
            break;
        case 'clean-duplicates':
            await removeDuplicateSchedules();
            break;
        default:
            console.log(`
Usage:
  ts-node src/scripts/manageSchedules.ts list
  ts-node src/scripts/manageSchedules.ts delete [id]  # Delete specific schedule
  ts-node src/scripts/manageSchedules.ts delete       # Delete all schedules
  ts-node src/scripts/manageSchedules.ts add-test     # Add a test schedule for 5 minutes from now
  ts-node src/scripts/manageSchedules.ts clean-duplicates # Remove duplicate schedules
      `);
    }
}
main().catch(console.error);
