import React from 'react';
import { format, isSameDay } from 'date-fns';

const hours = Array.from({ length: 24 }, (_, i) => i);

const typeColors = {
  meeting: 'bg-blue-500/20 border-blue-500 text-blue-400',
  deep_work: 'bg-purple-500/20 border-purple-500 text-purple-400',
  break: 'bg-green-500/20 border-green-500 text-green-400',
  learning_block: 'bg-amber-500/20 border-amber-500 text-amber-400',
};

export default function DayView({ selectedDate, meetings, onTimeClick }) {
  const dayMeetings = meetings.filter(m => isSameDay(new Date(m.start_time), selectedDate));

  const getEventPosition = (meeting) => {
    const start = new Date(meeting.start_time);
    const end = new Date(meeting.end_time);
    const startHour = start.getHours() + start.getMinutes() / 60;
    const endHour = end.getHours() + end.getMinutes() / 60;
    const top = startHour * 60;
    const height = (endHour - startHour) * 60;
    return { top, height: Math.max(height, 30) };
  };

  return (
    <div className="relative">
      <div className="text-center py-3 border-b border-border/50 font-semibold">
        {format(selectedDate, 'EEEE, MMMM d, yyyy')}
      </div>
      <div className="overflow-y-auto max-h-[600px]">
        <div className="relative" style={{ height: 24 * 60 }}>
          {hours.map((hour) => (
            <div
              key={hour}
              className="absolute w-full border-t border-border/30 flex cursor-pointer hover:bg-accent/20"
              style={{ top: hour * 60, height: 60 }}
              onClick={() => onTimeClick(selectedDate, hour)}
            >
              <div className="w-16 text-xs text-muted-foreground pr-2 text-right -mt-2">
                {format(new Date().setHours(hour, 0), 'h a')}
              </div>
              <div className="flex-1 relative"></div>
            </div>
          ))}
          
          {dayMeetings.map((meeting, i) => {
            const { top, height } = getEventPosition(meeting);
            return (
              <div
                key={i}
                className={`absolute left-16 right-2 rounded-lg border-l-4 px-2 py-1 overflow-hidden ${typeColors[meeting.type] || typeColors.meeting}`}
                style={{ top, height, minHeight: 30 }}
              >
                <div className="font-medium text-sm truncate">{meeting.title}</div>
                <div className="text-xs opacity-70">
                  {format(new Date(meeting.start_time), 'h:mm a')} - {format(new Date(meeting.end_time), 'h:mm a')}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}