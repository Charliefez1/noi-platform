import React from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay } from 'date-fns';

const typeColors = {
  meeting: 'bg-blue-500',
  deep_work: 'bg-purple-500',
  break: 'bg-green-500',
  learning_block: 'bg-amber-500',
};

export default function MonthView({ currentMonth, selectedDate, meetings, onDayClick }) {
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const startDay = monthStart.getDay();
  const paddingDays = startDay === 0 ? 6 : startDay - 1;

  const getMeetingsForDay = (day) => meetings.filter(m => isSameDay(new Date(m.start_time), day));

  return (
    <div>
      {/* Week day headers */}
      <div className="grid grid-cols-7 mb-2">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
          <div key={day} className="text-center text-xs text-muted-foreground font-medium py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar days */}
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: paddingDays }).map((_, i) => (
          <div key={`pad-${i}`} className="aspect-square p-1"></div>
        ))}

        {days.map((day, i) => {
          const dayMeetings = getMeetingsForDay(day);
          const isSelected = isSameDay(day, selectedDate);

          return (
            <button
              key={i}
              onClick={() => onDayClick(day)}
              className={`
                aspect-square p-1 rounded-xl text-sm transition-all flex flex-col items-center justify-start pt-2
                ${!isSameMonth(day, currentMonth) ? 'text-muted-foreground/30' : ''}
                ${isToday(day) ? 'bg-primary/10 text-primary font-bold' : ''}
                ${isSelected ? 'ring-2 ring-primary bg-primary/5' : 'hover:bg-accent/50'}
              `}
            >
              <span>{format(day, 'd')}</span>
              {dayMeetings.length > 0 && (
                <div className="flex flex-wrap gap-0.5 mt-1 justify-center max-w-full">
                  {dayMeetings.slice(0, 3).map((m, idx) => (
                    <span key={idx} className={`w-1.5 h-1.5 rounded-full ${typeColors[m.type] || 'bg-primary'}`}></span>
                  ))}
                  {dayMeetings.length > 3 && (
                    <span className="text-[10px] text-muted-foreground">+{dayMeetings.length - 3}</span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}