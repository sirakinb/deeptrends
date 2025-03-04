'use client';
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScheduleList = ScheduleList;
const react_1 = __importDefault(require("react"));
const react_2 = require("@headlessui/react");
const outline_1 = require("@heroicons/react/24/outline");
function ScheduleList({ schedules, onToggle, onDelete }) {
    if (schedules.length === 0) {
        return (<div className="card text-center text-gray-400">
        No schedules created yet
      </div>);
    }
    // Group schedules by content to identify potential duplicates
    const groupedSchedules = new Map();
    schedules.forEach(schedule => {
        const key = `${schedule.query}|${schedule.frequency}|${schedule.time}|${schedule.week_day}`;
        if (!groupedSchedules.has(key)) {
            groupedSchedules.set(key, []);
        }
        groupedSchedules.get(key).push(schedule);
    });
    // For any grouped schedules, prefer non-pending over pending
    const dedupedSchedules = [];
    groupedSchedules.forEach(group => {
        // If there's only one item in the group, add it as is
        if (group.length === 1) {
            dedupedSchedules.push(group[0]);
            return;
        }
        // If there are multiple items, prefer the non-pending one
        const nonPending = group.find(s => !('isPending' in s) || !s.isPending);
        if (nonPending) {
            dedupedSchedules.push(nonPending);
        }
        else {
            // If all are pending, just take the first one
            dedupedSchedules.push(group[0]);
        }
    });
    return (<div className="space-y-4">
      {dedupedSchedules.map((schedule) => {
            const isPending = 'isPending' in schedule && schedule.isPending;
            return (<div key={schedule.id} className={`card ${isPending ? 'border-2 border-blue-500 bg-blue-900/20 relative' : 'relative'}`}>
            {isPending && (<div className="absolute top-2 right-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-md flex items-center shadow-md">
                <outline_1.ClockIcon className="h-3 w-3 mr-1"/>
                <span className="animate-pulse font-medium">Processing</span>
              </div>)}
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-medium mb-2">Query</h3>
                <p className="text-gray-300 text-sm mb-4">{schedule.query}</p>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Frequency:</span>{' '}
                    <span className="text-gray-200 capitalize">{schedule.frequency}</span>
                  </div>
                  {schedule.time && (<div>
                      <span className="text-gray-400">Time:</span>{' '}
                      <span className="text-gray-200">{schedule.time} EST</span>
                    </div>)}
                  {schedule.frequency === 'weekly' && schedule.week_day && (<div>
                      <span className="text-gray-400">Day:</span>{' '}
                      <span className="text-gray-200 capitalize">{schedule.week_day}</span>
                    </div>)}
                  {schedule.model && (<div>
                      <span className="text-gray-400">Model:</span>{' '}
                      <span className="text-gray-200">{schedule.model}</span>
                    </div>)}
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <react_2.Switch checked={schedule.is_active} onChange={() => !isPending && onToggle(schedule.id)} className={`${schedule.is_active ? 'bg-blue-600' : 'bg-gray-700'} relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${isPending ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  <span className={`${schedule.is_active ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}/>
                </react_2.Switch>
                
                <button onClick={() => !isPending && onDelete(schedule.id)} className={`text-gray-400 hover:text-red-500 transition-colors ${isPending ? 'opacity-50 cursor-not-allowed' : ''}`} disabled={isPending}>
                  <outline_1.TrashIcon className="h-5 w-5"/>
                </button>
              </div>
            </div>
          </div>);
        })}
    </div>);
}
