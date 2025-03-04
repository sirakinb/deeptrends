"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNextRunPreview = getNextRunPreview;
const date_fns_1 = require("date-fns");
function getNextRunPreview(frequency, time, weekDay) {
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
            nextRun = (0, date_fns_1.addDays)(nextRun, 1);
        }
    }
    else if (frequency === 'weekly' && weekDay) {
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
        }
        else if (daysToAdd === 0 && nextRun <= now) {
            daysToAdd = 7;
        }
        nextRun = (0, date_fns_1.addDays)(nextRun, daysToAdd);
    }
    return (0, date_fns_1.format)(nextRun, "EEEE, MMMM d 'at' h:mm a 'EST'");
}
