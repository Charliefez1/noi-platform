import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { 
  Plus, X, Users, Link2, RefreshCw, ListTree, Loader2, CheckCircle2, Circle, MessageSquare
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import CommentSection from '@/components/comments/CommentSection';

export default function TaskDetailModal({ 
  open, 
  task, 
  allTasks = [],
  users = [],
  onClose, 
  onSave, 
  onCreateSubtask,
  saving 
}) {
  const [currentUser, setCurrentUser] = useState(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    status: 'todo',
    priority: 'medium',
    category: 'admin',
    due_date: '',
    estimated_minutes: 30,
    assignee_ids: [],
    dependency_ids: [],
    is_recurring: false,
    recurrence_pattern: 'weekly',
    recurrence_end_date: '',
    project_id: '',
  });
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [addingSubtask, setAddingSubtask] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  useEffect(() => {
    if (task) {
      setForm({
        title: task.title || '',
        description: task.description || '',
        status: task.status || 'todo',
        priority: task.priority || 'medium',
        category: task.category || 'admin',
        due_date: task.due_date || '',
        estimated_minutes: task.estimated_minutes || 30,
        assignee_ids: task.assignee_ids || [],
        dependency_ids: task.dependency_ids || [],
        is_recurring: task.is_recurring || false,
        recurrence_pattern: task.recurrence_pattern || 'weekly',
        recurrence_end_date: task.recurrence_end_date || '',
        project_id: task.project_id || '',
      });
    } else {
      setForm({
        title: '',
        description: '',
        status: 'todo',
        priority: 'medium',
        category: 'admin',
        due_date: '',
        estimated_minutes: 30,
        assignee_ids: [],
        dependency_ids: [],
        is_recurring: false,
        recurrence_pattern: 'weekly',
        recurrence_end_date: '',
        project_id: '',
      });
    }
  }, [task, open]);

  // Get subtasks
  const subtasks = task ? allTasks.filter(t => t.parent_task_id === task.id) : [];
  const completedSubtasks = subtasks.filter(s => s.status === 'done').length;
  const subtaskProgress = subtasks.length > 0 ? (completedSubtasks / subtasks.length) * 100 : 0;

  // Get dependencies
  const dependencies = task?.dependency_ids?.map(id => allTasks.find(t => t.id === id)).filter(Boolean) || [];
  const blockedByIncomplete = dependencies.some(d => d.status !== 'done');

  // Available tasks for dependencies (exclude self and subtasks)
  const availableForDependency = allTasks.filter(t => 
    t.id !== task?.id && 
    t.parent_task_id !== task?.id &&
    !form.dependency_ids.includes(t.id)
  );

  const handleAddSubtask = async () => {
    if (!newSubtaskTitle.trim() || !task) return;
    setAddingSubtask(true);
    try {
      await onCreateSubtask({
        title: newSubtaskTitle,
        parent_task_id: task.id,
        status: 'todo',
        priority: task.priority,
        due_date: task.due_date,
      });
      setNewSubtaskTitle('');
      toast.success('Subtask added');
    } catch (error) {
      toast.error('Failed to add subtask');
    } finally {
      setAddingSubtask(false);
    }
  };

  const toggleAssignee = (userId) => {
    setForm(prev => ({
      ...prev,
      assignee_ids: prev.assignee_ids.includes(userId)
        ? prev.assignee_ids.filter(id => id !== userId)
        : [...prev.assignee_ids, userId]
    }));
  };

  const addDependency = (taskId) => {
    setForm(prev => ({
      ...prev,
      dependency_ids: [...prev.dependency_ids, taskId]
    }));
  };

  const removeDependency = (taskId) => {
    setForm(prev => ({
      ...prev,
      dependency_ids: prev.dependency_ids.filter(id => id !== taskId)
    }));
  };

  const handleSubmit = () => {
    if (!form.title.trim()) return;
    onSave(form);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{task ? 'Edit Task' : 'Create Task'}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="comments" disabled={!task}>
              <MessageSquare className="w-4 h-4 mr-2" />
              Comments
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-6 py-4">
          {/* Basic Info */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input 
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="What needs to be done?"
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea 
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Add details..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todo">To Do</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="done">Done</SelectItem>
                    <SelectItem value="deferred">Deferred</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="deep_work">Deep Work</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="meeting_prep">Meeting Prep</SelectItem>
                    <SelectItem value="communication">Communication</SelectItem>
                    <SelectItem value="learning">Learning</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Due Date</Label>
                <Input 
                  type="date"
                  value={form.due_date}
                  onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Estimated Time (mins)</Label>
                <Input 
                  type="number"
                  value={form.estimated_minutes}
                  onChange={(e) => setForm({ ...form, estimated_minutes: parseInt(e.target.value) || 30 })}
                />
              </div>
            </div>
          </div>

          {/* Assignees */}
          <div className="space-y-3 p-4 bg-accent/30 rounded-xl">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              <Label className="font-medium">Assignees</Label>
            </div>
            <div className="flex flex-wrap gap-2">
              {users.map(user => (
                <Badge
                  key={user.id}
                  variant={form.assignee_ids.includes(user.id) ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => toggleAssignee(user.id)}
                >
                  {user.full_name || user.email}
                </Badge>
              ))}
              {users.length === 0 && (
                <p className="text-sm text-muted-foreground">No users available</p>
              )}
            </div>
          </div>

          {/* Recurring */}
          <div className="space-y-3 p-4 bg-accent/30 rounded-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-primary" />
                <Label className="font-medium">Recurring Task</Label>
              </div>
              <Switch 
                checked={form.is_recurring}
                onCheckedChange={(v) => setForm({ ...form, is_recurring: v })}
              />
            </div>
            {form.is_recurring && (
              <div className="grid grid-cols-2 gap-4 mt-3">
                <div className="space-y-2">
                  <Label className="text-xs">Repeat</Label>
                  <Select value={form.recurrence_pattern} onValueChange={(v) => setForm({ ...form, recurrence_pattern: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="biweekly">Bi-weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">End Date</Label>
                  <Input 
                    type="date"
                    value={form.recurrence_end_date}
                    onChange={(e) => setForm({ ...form, recurrence_end_date: e.target.value })}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Dependencies */}
          <div className="space-y-3 p-4 bg-accent/30 rounded-xl">
            <div className="flex items-center gap-2">
              <Link2 className="w-4 h-4 text-primary" />
              <Label className="font-medium">Dependencies</Label>
              {blockedByIncomplete && (
                <Badge variant="destructive" className="text-xs">Blocked</Badge>
              )}
            </div>
            {form.dependency_ids.length > 0 && (
              <div className="space-y-2">
                {form.dependency_ids.map(depId => {
                  const depTask = allTasks.find(t => t.id === depId);
                  if (!depTask) return null;
                  return (
                    <div key={depId} className="flex items-center justify-between p-2 bg-background rounded-lg">
                      <div className="flex items-center gap-2">
                        {depTask.status === 'done' ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        ) : (
                          <Circle className="w-4 h-4 text-muted-foreground" />
                        )}
                        <span className="text-sm">{depTask.title}</span>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => removeDependency(depId)}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
            {availableForDependency.length > 0 && (
              <Select onValueChange={addDependency}>
                <SelectTrigger>
                  <SelectValue placeholder="Add dependency..." />
                </SelectTrigger>
                <SelectContent>
                  {availableForDependency.slice(0, 10).map(t => (
                    <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Subtasks (only for existing tasks) */}
          {task && (
            <div className="space-y-3 p-4 bg-accent/30 rounded-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ListTree className="w-4 h-4 text-primary" />
                  <Label className="font-medium">Subtasks ({completedSubtasks}/{subtasks.length})</Label>
                </div>
                {subtasks.length > 0 && (
                  <span className="text-xs text-muted-foreground">{Math.round(subtaskProgress)}%</span>
                )}
              </div>
              {subtasks.length > 0 && (
                <>
                  <Progress value={subtaskProgress} className="h-1" />
                  <div className="space-y-2">
                    {subtasks.map(subtask => (
                      <div key={subtask.id} className="flex items-center gap-3 p-2 bg-background rounded-lg">
                        <Checkbox 
                          checked={subtask.status === 'done'}
                          onCheckedChange={async (checked) => {
                            await base44.entities.Task.update(subtask.id, { 
                              status: checked ? 'done' : 'todo',
                              completed_at: checked ? new Date().toISOString() : null
                            });
                            toast.success(checked ? 'Subtask completed' : 'Subtask reopened');
                          }}
                        />
                        <span className={`text-sm flex-1 ${subtask.status === 'done' ? 'line-through text-muted-foreground' : ''}`}>
                          {subtask.title}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}
              <div className="flex gap-2">
                <Input 
                  placeholder="Add subtask..."
                  value={newSubtaskTitle}
                  onChange={(e) => setNewSubtaskTitle(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddSubtask()}
                />
                <Button size="sm" onClick={handleAddSubtask} disabled={addingSubtask || !newSubtaskTitle.trim()}>
                  {addingSubtask ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          )}
          </TabsContent>

          <TabsContent value="comments" className="py-4">
            {task && (
              <CommentSection 
                entityType="task"
                entityId={task.id}
                currentUser={currentUser}
                users={users}
              />
            )}
          </TabsContent>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={saving || !form.title.trim()}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {task ? 'Save Changes' : 'Create Task'}
            </Button>
          </DialogFooter>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}