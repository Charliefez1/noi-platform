import React from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MoreHorizontal, RefreshCw, ListTree, Link2, Users } from 'lucide-react';
import { format } from 'date-fns';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function TaskCard({ task, index, subtaskCount = 0, hasDepndencies = false, onClick }) {
  const priorityColor = {
    low: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
    medium: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20',
    high: 'text-red-500 bg-red-500/10 border-red-500/20',
    critical: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
  };

  const assigneeCount = task.assignee_ids?.length || 0;

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className="mb-3"
          style={{ ...provided.draggableProps.style }}
          onClick={() => onClick && onClick(task)}
        >
          <Card 
            className={`
              bg-card hover:shadow-md transition-all border-l-4 cursor-pointer
              ${snapshot.isDragging ? 'shadow-xl rotate-2 scale-105 ring-2 ring-primary/50' : 'shadow-sm'}
              ${task.priority === 'high' || task.priority === 'critical' ? 'border-l-destructive' : 'border-l-transparent'}
            `}
          >
            <CardContent className="p-4 space-y-3">
              <div className="flex justify-between items-start gap-2">
                <h4 className="font-medium text-sm leading-tight line-clamp-2">{task.title}</h4>
                <button className="text-muted-foreground hover:text-foreground" onClick={(e) => e.stopPropagation()}>
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className={`text-xs h-5 px-1.5 border ${priorityColor[task.priority] || priorityColor.medium}`}>
                  {task.priority}
                </Badge>
                {task.category && (
                  <Badge variant="secondary" className="text-xs h-5 px-1.5 bg-muted text-muted-foreground">
                    {task.category.replace('_', ' ')}
                  </Badge>
                )}
                {task.is_recurring && (
                  <Badge variant="outline" className="text-xs h-5 px-1.5 gap-1 text-primary border-primary/30">
                    <RefreshCw className="w-2.5 h-2.5" />
                  </Badge>
                )}
                {subtaskCount > 0 && (
                  <Badge variant="outline" className="text-xs h-5 px-1.5 gap-1">
                    <ListTree className="w-2.5 h-2.5" /> {subtaskCount}
                  </Badge>
                )}
                {hasDepndencies && (
                  <Badge variant="outline" className="text-xs h-5 px-1.5 gap-1 text-orange-500 border-orange-500/30">
                    <Link2 className="w-2.5 h-2.5" />
                  </Badge>
                )}
              </div>

              <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/50">
                <div className="flex items-center gap-3">
                  {task.due_date && (
                    <span className={`flex items-center gap-1 ${new Date(task.due_date) < new Date() && task.status !== 'done' ? 'text-red-500 font-bold' : ''}`}>
                      <Calendar className="w-3 h-3" />
                      {format(new Date(task.due_date), 'MMM d')}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {task.estimated_minutes}m
                  </span>
                </div>
                {assigneeCount > 1 ? (
                  <div className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    <span className="text-[10px]">{assigneeCount}</span>
                  </div>
                ) : (
                  <Avatar className="w-5 h-5">
                    <AvatarFallback className="text-[10px]">ME</AvatarFallback>
                  </Avatar>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </Draggable>
  );
}