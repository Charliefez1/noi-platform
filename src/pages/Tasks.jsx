import React, { useState, useEffect, useMemo } from 'react';
import { DragDropContext } from '@hello-pangea/dnd';
import { useNoi } from '@/components/core/NoiContext';
import TaskColumn from '@/components/tasks/TaskColumn';
import TaskDetailModal from '@/components/tasks/TaskDetailModal';
import TaskCalendarView from '@/components/tasks/TaskCalendarView';
import TaskListView from '@/components/tasks/TaskListView';
import TaskGanttView from '@/components/tasks/TaskGanttView';
import LoadingState from '@/components/shared/LoadingState';
import ErrorBanner from '@/components/shared/ErrorBanner';
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Filter, LayoutGrid, AlertTriangle, CalendarDays, ListTree, RefreshCw, List, GanttChart, Maximize2, Minimize2 } from 'lucide-react';
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import CapacityRing from '@/components/dashboard/CapacityRing';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { base44 } from '@/api/base44Client';
import { addDays, addWeeks, addMonths } from 'date-fns';

export default function TasksPage() {
  const { tasks, meetings, createTask, updateTask, capacityScore, frictionIndex, currentState, refreshData, loading, error } = useNoi();
  
  // Default view based on currentState
  const getDefaultView = () => {
    if (currentState?.label === 'overloaded' || currentState?.label === 'critical') {
      return 'list';
    }
    return 'board';
  };
  
  const [viewMode, setViewMode] = useState(getDefaultView());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [saving, setSaving] = useState(false);
  const [users, setUsers] = useState([]);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const data = await base44.entities.User.list();
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  // Filter out subtasks for main view, show only parent tasks
  const parentTasks = useMemo(() => 
    tasks.filter(t => !t.parent_task_id), 
    [tasks]
  );

  // Group tasks by status
  const groupedTasks = useMemo(() => ({
    todo: parentTasks.filter(t => t.status === 'todo'),
    in_progress: parentTasks.filter(t => t.status === 'in_progress'),
    done: parentTasks.filter(t => t.status === 'done')
  }), [parentTasks]);

  // Stats
  const recurringCount = parentTasks.filter(t => t.is_recurring).length;
  const withSubtasks = parentTasks.filter(t => tasks.some(st => st.parent_task_id === t.id)).length;

  const handleSaveTask = async (formData) => {
    setSaving(true);
    try {
      if (editingTask) {
        // Check for assignee changes and notify
        const newAssignees = formData.assignee_ids?.filter(id => !editingTask.assignee_ids?.includes(id)) || [];
        
        await updateTask(editingTask.id, formData);
        
        // Notify new assignees
        for (const userId of newAssignees) {
          const currentUser = await base44.auth.me();
          await base44.entities.Notification.create({
            user_id: userId,
            type: 'task_assigned',
            title: 'New task assigned',
            message: `${currentUser.full_name || 'Someone'} assigned you to: ${formData.title}`,
            entity_type: 'task',
            entity_id: editingTask.id,
            is_read: false
          });
        }
        
        // Handle recurring task completion - create next instance
        if (formData.status === 'done' && editingTask.is_recurring && editingTask.recurrence_pattern) {
          const nextDate = getNextRecurrenceDate(editingTask.due_date, editingTask.recurrence_pattern);
          if (!editingTask.recurrence_end_date || new Date(nextDate) <= new Date(editingTask.recurrence_end_date)) {
            await createTask({
              ...editingTask,
              ...formData,
              status: 'todo',
              due_date: nextDate,
              completed_at: null,
            });
            toast.success('Next recurring task created');
          }
        }
        
        toast.success('Task updated');
      } else {
        const newTask = await createTask({
          ...formData,
          friction_score: 0,
          clarity_score: 100,
          source: 'manual'
        });
        
        // Notify assignees of new task
        if (formData.assignee_ids?.length > 0) {
          const currentUser = await base44.auth.me();
          for (const userId of formData.assignee_ids) {
            await base44.entities.Notification.create({
              user_id: userId,
              type: 'task_assigned',
              title: 'New task assigned',
              message: `${currentUser.full_name || 'Someone'} assigned you to: ${formData.title}`,
              entity_type: 'task',
              entity_id: newTask.id,
              is_read: false
            });
          }
        }
        
        toast.success('Task created');
      }
      setIsModalOpen(false);
      setEditingTask(null);
      refreshData();
    } catch (error) {
      toast.error('Failed to save task');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateSubtask = async (subtaskData) => {
    await createTask(subtaskData);
    refreshData();
  };

  const getNextRecurrenceDate = (currentDate, pattern) => {
    const date = new Date(currentDate);
    switch (pattern) {
      case 'daily': return addDays(date, 1).toISOString().split('T')[0];
      case 'weekly': return addWeeks(date, 1).toISOString().split('T')[0];
      case 'biweekly': return addWeeks(date, 2).toISOString().split('T')[0];
      case 'monthly': return addMonths(date, 1).toISOString().split('T')[0];
      default: return currentDate;
    }
  };

  const onDragEnd = async (result) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const newStatus = destination.droppableId;
    const task = tasks.find(t => t.id === draggableId);
    
    // Check dependencies
    if (newStatus === 'done' && task?.dependency_ids?.length > 0) {
      const incompleteDeps = task.dependency_ids.filter(depId => {
        const dep = tasks.find(t => t.id === depId);
        return dep && dep.status !== 'done';
      });
      if (incompleteDeps.length > 0) {
        toast.error('Cannot complete: has incomplete dependencies');
        return;
      }
    }

    await updateTask(draggableId, { 
      status: newStatus,
      completed_at: newStatus === 'done' ? new Date().toISOString() : null
    });
    
    // Handle recurring
    if (newStatus === 'done' && task?.is_recurring && task?.recurrence_pattern) {
      const nextDate = getNextRecurrenceDate(task.due_date, task.recurrence_pattern);
      if (!task.recurrence_end_date || new Date(nextDate) <= new Date(task.recurrence_end_date)) {
        await createTask({
          ...task,
          id: undefined,
          status: 'todo',
          due_date: nextDate,
          completed_at: null,
        });
        toast.success('Next recurring task created');
      }
    }
    
    toast.success(`Task moved to ${newStatus.replace('_', ' ')}`);
  };

  const handleTaskClick = (task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  if (loading && tasks.length === 0) {
    return <LoadingState message="Loading tasks..." />;
  }

  return (
    <div className={`${isExpanded ? 'fixed inset-0 z-50 bg-background p-4 md:p-6' : 'h-[calc(100vh-140px)] w-full max-w-full'} flex flex-col`}>
      {error && <ErrorBanner error={error} onRetry={refreshData} />}
      
      {/* Toolbar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-3">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight">Tasks</h1>
            <p className="text-xs md:text-sm text-muted-foreground">Manage your workload with subtasks, dependencies & recurrence.</p>
          </div>
          {/* Mini capacity indicator - moved inline */}
          <Card className="bg-card/50 hidden lg:block min-w-[140px]">
            <CardContent className="p-1.5 flex items-center gap-2">
              <div className="w-8 h-8 flex-shrink-0">
                <CapacityRing value={capacityScore} size="sm" showLabel={false} />
              </div>
              <div className="text-xs leading-tight">
                <p className="font-medium text-xs">{capacityScore}%</p>
                <p className="text-muted-foreground text-[10px]">{frictionIndex}% Friction</p>
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Stats */}
          <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
            {recurringCount > 0 && (
              <Badge variant="outline" className="gap-1">
                <RefreshCw className="w-3 h-3" /> {recurringCount} recurring
              </Badge>
            )}
            {withSubtasks > 0 && (
              <Badge variant="outline" className="gap-1">
                <ListTree className="w-3 h-3" /> {withSubtasks} with subtasks
              </Badge>
            )}
            </div>

            <div className="flex gap-2 flex-shrink-0">
            {/* View Toggle */}
            <Tabs value={viewMode} onValueChange={setViewMode}>
              <TabsList className="h-9">
                <TabsTrigger value="board" className="gap-1 px-2 md:px-3">
                  <LayoutGrid className="w-4 h-4" />
                  <span className="hidden sm:inline">Board</span>
                </TabsTrigger>
                <TabsTrigger value="list" className="gap-1 px-2 md:px-3">
                  <List className="w-4 h-4" />
                  <span className="hidden sm:inline">List</span>
                </TabsTrigger>
                <TabsTrigger value="gantt" className="gap-1 px-2 md:px-3 hidden lg:flex">
                  <GanttChart className="w-4 h-4" />
                  <span className="hidden sm:inline">Gantt</span>
                </TabsTrigger>
                <TabsTrigger value="calendar" className="gap-1 px-2 md:px-3 hidden md:flex">
                  <CalendarDays className="w-4 h-4" />
                  <span className="hidden sm:inline">Cal</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <Button variant="ghost" size="icon" onClick={() => setIsExpanded(!isExpanded)} className="hidden md:flex">
              {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>

            <Button className="bg-primary text-white gap-2" onClick={() => { setEditingTask(null); setIsModalOpen(true); }}>
              <Plus className="w-4 h-4" /> <span className="hidden sm:inline">New Task</span>
            </Button>
          </div>
        </div>
      </div>

      {/* View Hint */}
      {(currentState?.label === 'overloaded' || currentState?.label === 'critical') && (
        <Alert className="mb-4 border-blue-500/50 bg-blue-500/10">
          <AlertDescription>
            You look close to capacity, so we are keeping the view simpler. You can switch back if you prefer.
          </AlertDescription>
        </Alert>
      )}

      {/* Overload Warning */}
      {capacityScore > 80 && (
        <Alert className="mb-4 border-orange-500/50 bg-orange-500/10">
          <AlertTriangle className="h-4 w-4 text-orange-500" />
          <AlertDescription className="text-orange-200">
            Your cognitive load is at {capacityScore}%. Consider deferring low-priority tasks or declining optional meetings.
          </AlertDescription>
        </Alert>
      )}

      {/* Views */}
      {viewMode === 'board' && (
        <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4">
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="flex h-full gap-3 md:gap-4 lg:gap-6 px-1 w-full min-w-[900px] md:min-w-0">
              <TaskColumn 
                id="todo" 
                title="To Do" 
                tasks={groupedTasks.todo} 
                allTasks={tasks}
                count={groupedTasks.todo.length}
                onAddClick={() => { setEditingTask(null); setIsModalOpen(true); }}
                onTaskClick={handleTaskClick}
              />
              <TaskColumn 
                id="in_progress" 
                title="In Progress" 
                tasks={groupedTasks.in_progress}
                allTasks={tasks}
                count={groupedTasks.in_progress.length}
                onTaskClick={handleTaskClick}
              />
              <TaskColumn 
                id="done" 
                title="Done" 
                tasks={groupedTasks.done}
                allTasks={tasks}
                count={groupedTasks.done.length}
                onTaskClick={handleTaskClick}
              />
            </div>
          </DragDropContext>
        </div>
      )}

      {viewMode === 'list' && (
        <div className="flex-1 overflow-y-auto pb-4">
          <TaskListView 
            tasks={parentTasks}
            allTasks={tasks}
            onTaskClick={handleTaskClick}
          />
        </div>
      )}

      {viewMode === 'gantt' && (
        <div className="flex-1 overflow-y-auto pb-4">
          <TaskGanttView 
            tasks={parentTasks}
            onTaskClick={handleTaskClick}
          />
        </div>
      )}

      {viewMode === 'calendar' && (
        <div className="flex-1 overflow-y-auto pb-4">
          <TaskCalendarView 
            tasks={parentTasks}
            currentMonth={calendarMonth}
            onMonthChange={setCalendarMonth}
            onTaskClick={handleTaskClick}
            onDayClick={(day) => {
              setEditingTask(null);
              setIsModalOpen(true);
            }}
          />
        </div>
      )}

      {/* Task Detail Modal */}
      <TaskDetailModal
        open={isModalOpen}
        task={editingTask}
        allTasks={tasks}
        users={users}
        onClose={() => { setIsModalOpen(false); setEditingTask(null); }}
        onSave={handleSaveTask}
        onCreateSubtask={handleCreateSubtask}
        saving={saving}
      />
    </div>
  );
}