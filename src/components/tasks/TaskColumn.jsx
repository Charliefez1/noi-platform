import React from 'react';
import { Droppable } from '@hello-pangea/dnd';
import TaskCard from './TaskCard';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function TaskColumn({ id, title, tasks, allTasks = [], count, onAddClick, onTaskClick }) {
  // Get subtask count for each task
  const getSubtaskCount = (taskId) => {
    return allTasks.filter(t => t.parent_task_id === taskId).length;
  };

  const hasDependencies = (task) => {
    return task.dependency_ids?.length > 0;
  };

  return (
    <div className="flex flex-col h-full flex-1 min-w-[280px] max-w-[450px] bg-muted/30 rounded-2xl border border-border/50">
      {/* Column Header */}
      <div className="p-4 flex items-center justify-between sticky top-0 bg-muted/30 backdrop-blur-sm rounded-t-2xl z-10">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">{title}</h3>
          <span className="flex items-center justify-center w-6 h-6 bg-background rounded-full text-xs font-bold shadow-sm border border-border">
            {count}
          </span>
        </div>
        {onAddClick && (
          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={onAddClick}>
            <Plus className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Tasks List */}
      <div className="flex-1 p-3 overflow-y-auto scrollbar-hide">
        <Droppable droppableId={id}>
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={`min-h-[150px] rounded-xl transition-colors ${snapshot.isDraggingOver ? 'bg-primary/5 ring-2 ring-inset ring-primary/20' : ''}`}
            >
              {tasks.map((task, index) => (
                <TaskCard 
                  key={task.id} 
                  task={task} 
                  index={index}
                  subtaskCount={getSubtaskCount(task.id)}
                  hasDepndencies={hasDependencies(task)}
                  onClick={onTaskClick}
                />
              ))}
              {provided.placeholder}
              
              {tasks.length === 0 && !snapshot.isDraggingOver && (
                <div className="h-32 flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed border-muted rounded-xl">
                  <span className="text-sm">Drop tasks here</span>
                </div>
              )}
            </div>
          )}
        </Droppable>
      </div>
    </div>
  );
}