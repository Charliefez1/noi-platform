import React from 'react';
import { format, startOfWeek, addDays, isSameDay, isToday } from 'date-fns';

const hours = Array.from({ length: 24 }, (_, i) => i);

const typeColors = {
  meeting: 'bg-blue-500/20 border-blue-500 text-blue-400',
  deep_work: 'bg-purple-500/20 border-purple-500 text-purple-400',
  break: 'bg-green-500/20 border-green-500 text-green-400',
  learning_block: 'bg-amber-500/20 border-amber-500 text-amber-400',
};

export default function WeekView({ selectedDate, meetings, onTimeClick, onDayClick }) {
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const getMeetingsForDay = (day) => meetings.filter(m => isSameDay(new Date(m.start_time), day));

  const getEventPosition = (meeting) => {
    const start = new Date(meeting.start_time);
    const end = new Date(meeting.end_time);
    const startHour = start.getHours() + start.getMinutes() / 60;
    const endHour = end.getHours() + end.getMinutes() / 60;
    const top = startHour * 48;
    const height = (endHour - startHour) * 48;
    return { top, height: Math.max(height, 24) };
  };

  return (
    <div className="relative">
      {/* Header */}
      <div className="grid grid-cols-8 border-b border-border/50">
        <div className="w-14"></div>
        {weekDays.map((day, i) => (
          <div
            key={i}
            className={`text-center py-2 cursor-pointer hover:bg-accent/30 ${isToday(day) ? 'bg-primary/10' : ''}`}
            onClick={() => onDayClick(day)}
          >
            <div className="text-xs text-muted-foreground">{format(day, 'EEE')}</div>
            <div className={`text-lg font-semibold ${isToday(day) ? 'text-primary' : ''}`}>
              {format(day, 'd')}
            </div>
          </div>
        ))}
      </div>

      {/* Time grid */}
      <div className="overflow-y-auto max-h-[550px]">
        <div className="grid grid-cols-8" style={{ height: 24 * 48 }}>
          {/* Time labels */}
          <div className="relative w-14">
            {hours.map((hour) => (
              <div
                key={hour}
                className="absolute w-full text-xs text-muted-foreground text-right pr-2"
                style={{ top: hour * 48 - 6 }}
              >
                {format(new Date().setHours(hour, 0), 'h a')}
              </div>
            ))}
          </div>

          {/* Day columns */}
          {weekDays.map((day, dayIdx) => {
            const dayMeetings = getMeetingsForDay(day);
            return (
              <div key={dayIdx} className="relative border-l border-border/30">
                {hours.map((hour) => (
                  <div
                    key={hour}
                    className="absolute w-full border-t border-border/20 hover:bg-accent/10 cursor-pointer"
                    style={{ top: hour * 48, height: 48 }}
                    onClick={() => onTimeClick(day, hour)}
                  />
                ))}
                {dayMeetings.map((meeting, i) => {
                  const { top, height } = getEventPosition(meeting);
                  return (
                    <div
                      key={i}
                      className={`absolute left-0.5 right-0.5 rounded border-l-2 px-1 py-0.5 overflow-hidden text-xs ${typeColors[meeting.type] || typeColors.meeting}`}
                      style={{ top, height, minHeight: 24 }}
                    >
                      <div className="font-medium truncate">{meeting.title}</div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}