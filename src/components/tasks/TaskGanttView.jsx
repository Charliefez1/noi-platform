import React, { useMemo } from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format, startOfWeek, addDays, differenceInDays, isSameDay } from 'date-fns';

const priorityColors = {
  low: 'bg-blue-500',
  medium: 'bg-yellow-500',
  high: 'bg-orange-500',
  critical: 'bg-red-500',
};

export default function TaskGanttView({ tasks, onTaskClick }) {
  // Filter tasks with dates
  const tasksWithDates = useMemo(() => 
    tasks.filter(t => t.due_date || t.scheduled_date),
    [tasks]
  );

  // Calculate date range
  const { startDate, endDate, totalDays } = useMemo(() => {
    if (tasksWithDates.length === 0) {
      const today = new Date();
      return {
        startDate: startOfWeek(today),
        endDate: addDays(startOfWeek(today), 13),
        totalDays: 14
      };
    }

    const dates = tasksWithDates.map(t => new Date(t.due_date || t.scheduled_date));
    const minDate = new Date(Math.min(...dates));
    const maxDate = new Date(Math.max(...dates));
    
    const start = startOfWeek(minDate);
    const days = Math.max(differenceInDays(maxDate, start) + 7, 14);
    
    return {
      startDate: start,
      endDate: addDays(start, days),
      totalDays: days
    };
  }, [tasksWithDates]);

  const days = useMemo(() => 
    Array.from({ length: totalDays }, (_, i) => addDays(startDate, i)),
    [startDate, totalDays]
  );

  const getTaskPosition = (task) => {
    const taskDate = new Date(task.due_date || task.scheduled_date);
    const dayIndex = differenceInDays(taskDate, startDate);
    const duration = Math.max(1, Math.ceil((task.estimated_minutes || 30) / 480)); // Convert to days
    
    return {
      left: `${(dayIndex / totalDays) * 100}%`,
      width: `${(duration / totalDays) * 100}%`,
      dayIndex
    };
  };

  const today = new Date();
  const todayIndex = differenceInDays(today, startDate);

  return (
    <Card className="p-4 overflow-x-auto">
      <div className="min-w-[800px]">
        {/* Timeline Header */}
        <div className="flex border-b pb-2 mb-4">
          <div className="w-48 flex-shrink-0 font-medium text-sm">Task</div>
          <div className="flex-1 flex">
            {days.map((day, i) => (
              <div 
                key={i} 
                className={`flex-1 text-center text-xs ${isSameDay(day, today) ? 'text-primary font-bold' : 'text-muted-foreground'}`}
              >
                <div>{format(day, 'EEE')}</div>
                <div className={isSameDay(day, today) ? 'text-primary' : ''}>{format(day, 'd')}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Tasks */}
        <div className="space-y-2">
          {tasksWithDates.map((task) => {
            const position = getTaskPosition(task);
            
            return (
              <div key={task.id} className="flex items-center group">
                {/* Task Name */}
                <div className="w-48 flex-shrink-0 pr-4">
                  <div 
                    className="text-sm font-medium truncate cursor-pointer hover:text-primary"
                    onClick={() => onTaskClick && onTaskClick(task)}
                    title={task.title}
                  >
                    {task.title}
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center gap-2">
                    <Badge variant="outline" className={`text-[10px] h-4 px-1 ${priorityColors[task.priority]} text-white`}>
                      {task.priority}
                    </Badge>
                    {task.category && (
                      <span>{task.category.replace('_', ' ')}</span>
                    )}
                  </div>
                </div>

                {/* Timeline */}
                <div className="flex-1 relative h-10 border-l">
                  {/* Today indicator */}
                  {todayIndex >= 0 && todayIndex < totalDays && (
                    <div 
                      className="absolute top-0 bottom-0 w-0.5 bg-primary/50"
                      style={{ left: `${(todayIndex / totalDays) * 100}%` }}
                    />
                  )}
                  
                  {/* Task Bar */}
                  {position.dayIndex >= 0 && position.dayIndex < totalDays && (
                    <div
                      className={`
                        absolute top-1/2 -translate-y-1/2 h-6 rounded px-2 
                        flex items-center cursor-pointer transition-all
                        ${priorityColors[task.priority]} 
                        ${task.status === 'done' ? 'opacity-50 line-through' : 'opacity-90 hover:opacity-100'}
                        group-hover:shadow-lg
                      `}
                      style={{ left: position.left, width: position.width, minWidth: '60px' }}
                      onClick={() => onTaskClick && onTaskClick(task)}
                    >
                      <span className="text-xs font-medium text-white truncate">
                        {task.title}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {tasksWithDates.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p>No tasks with dates to display in Gantt view</p>
          </div>
        )}
      </div>
    </Card>
  );
}