import React from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Calendar, Clock, RefreshCw, ListTree, Link2, Users } from 'lucide-react';
import { format } from 'date-fns';

const priorityColors = {
  low: 'text-blue-500',
  medium: 'text-yellow-500',
  high: 'text-orange-500',
  critical: 'text-red-500',
};

export default function TaskListView({ tasks, allTasks = [], onTaskClick }) {
  const getSubtaskCount = (taskId) => {
    return allTasks.filter(t => t.parent_task_id === taskId).length;
  };

  const getSubtasksCompleted = (taskId) => {
    const subtasks = allTasks.filter(t => t.parent_task_id === taskId);
    return subtasks.filter(s => s.status === 'done').length;
  };

  return (
    <div className="space-y-2">
      {tasks.map((task) => {
        const subtaskCount = getSubtaskCount(task.id);
        const subtasksCompleted = getSubtasksCompleted(task.id);
        const assigneeCount = task.assignee_ids?.length || 0;
        const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done';

        return (
          <Card 
            key={task.id} 
            className="p-4 hover:bg-accent/50 transition-colors cursor-pointer"
            onClick={() => onTaskClick && onTaskClick(task)}
          >
            <div className="flex items-center gap-4">
              {/* Checkbox */}
              <Checkbox 
                checked={task.status === 'done'}
                onClick={(e) => e.stopPropagation()}
                className="h-5 w-5"
              />

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className={`font-medium ${task.status === 'done' ? 'line-through text-muted-foreground' : ''}`}>
                    {task.title}
                  </h4>
                  <Badge variant="outline" className={`text-xs ${priorityColors[task.priority]}`}>
                    {task.priority}
                  </Badge>
                  {task.is_recurring && (
                    <RefreshCw className="w-3 h-3 text-primary" />
                  )}
                  {task.dependency_ids?.length > 0 && (
                    <Link2 className="w-3 h-3 text-orange-500" />
                  )}
                </div>
                
                {task.description && (
                  <p className="text-sm text-muted-foreground line-clamp-1 mb-2">{task.description}</p>
                )}

                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  {task.due_date && (
                    <span className={`flex items-center gap-1 ${isOverdue ? 'text-red-500 font-medium' : ''}`}>
                      <Calendar className="w-3 h-3" />
                      {format(new Date(task.due_date), 'MMM d')}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {task.estimated_minutes}m
                  </span>
                  {task.category && (
                    <Badge variant="secondary" className="text-xs">
                      {task.category.replace('_', ' ')}
                    </Badge>
                  )}
                  {subtaskCount > 0 && (
                    <span className="flex items-center gap-1">
                      <ListTree className="w-3 h-3" />
                      {subtasksCompleted}/{subtaskCount}
                    </span>
                  )}
                </div>
              </div>

              {/* Assignees */}
              <div className="flex-shrink-0">
                {assigneeCount > 1 ? (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Users className="w-4 h-4" />
                    {assigneeCount}
                  </div>
                ) : (
                  <Avatar className="w-6 h-6">
                    <AvatarFallback className="text-xs">ME</AvatarFallback>
                  </Avatar>
                )}
              </div>

              {/* Status Badge */}
              <div className="flex-shrink-0 w-24">
                <Badge variant={task.status === 'done' ? 'default' : 'outline'} className="w-full justify-center">
                  {task.status.replace('_', ' ')}
                </Badge>
              </div>
            </div>
          </Card>
        );
      })}
      
      {tasks.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p>No tasks to display</p>
        </div>
      )}
    </div>
  );
}