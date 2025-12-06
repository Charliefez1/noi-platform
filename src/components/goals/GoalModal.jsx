import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from 'lucide-react';

const METRIC_OPTIONS = [
  { value: 'friction_index', label: 'Friction Index' },
  { value: 'capacity_score', label: 'Capacity Score' },
  { value: 'meeting_pressure', label: 'Meeting Pressure' },
  { value: 'slippage_rate', label: 'Slippage Rate' },
  { value: 'on_time_completion', label: 'On-Time Completion' },
  { value: 'learning_completion', label: 'Learning Completion' },
  { value: 'overload_incidents', label: 'Overload Incidents' }
];

export default function GoalModal({ open, goal, onClose, onSave, saving, learningModules = [] }) {
  const [form, setForm] = useState({
    name: '',
    description: '',
    scope: 'org',
    owner_type: 'exec',
    target_metric: 'friction_index',
    baseline_value: 0,
    target_value: 0,
    current_value: 0,
    start_date: '',
    target_date: '',
    status: 'active',
    visibility: 'managers_only',
    linked_pathway_ids: []
  });

  useEffect(() => {
    if (goal) {
      setForm({
        name: goal.name || '',
        description: goal.description || '',
        scope: goal.scope || 'org',
        owner_type: goal.owner_type || 'exec',
        target_metric: goal.target_metric || 'friction_index',
        baseline_value: goal.baseline_value || 0,
        target_value: goal.target_value || 0,
        current_value: goal.current_value || 0,
        start_date: goal.start_date || '',
        target_date: goal.target_date || '',
        status: goal.status || 'active',
        visibility: goal.visibility || 'managers_only',
        linked_pathway_ids: goal.linked_pathway_ids || []
      });
    } else {
      setForm({
        name: '',
        description: '',
        scope: 'org',
        owner_type: 'exec',
        target_metric: 'friction_index',
        baseline_value: 0,
        target_value: 0,
        current_value: 0,
        start_date: '',
        target_date: '',
        status: 'active',
        visibility: 'managers_only',
        linked_pathway_ids: []
      });
    }
  }, [goal, open]);

  const pathwayModules = learningModules.filter(m => m.type === 'pathway');

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{goal ? 'Edit Goal' : 'Create Goal'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Goal Name *</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g., Reduce meeting overload"
            />
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="What does success look like?"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Scope</Label>
              <Select value={form.scope} onValueChange={(v) => setForm({ ...form, scope: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="org">Organization</SelectItem>
                  <SelectItem value="department">Department</SelectItem>
                  <SelectItem value="team">Team</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Owner Type</Label>
              <Select value={form.owner_type} onValueChange={(v) => setForm({ ...form, owner_type: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="exec">Executive</SelectItem>
                  <SelectItem value="hr">HR</SelectItem>
                  <SelectItem value="ld">L&D</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="on_track">On Track</SelectItem>
                  <SelectItem value="at_risk">At Risk</SelectItem>
                  <SelectItem value="achieved">Achieved</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Target Metric</Label>
            <Select value={form.target_metric} onValueChange={(v) => setForm({ ...form, target_metric: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {METRIC_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Baseline Value</Label>
              <Input
                type="number"
                value={form.baseline_value}
                onChange={(e) => setForm({ ...form, baseline_value: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <Label>Target Value *</Label>
              <Input
                type="number"
                value={form.target_value}
                onChange={(e) => setForm({ ...form, target_value: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <Label>Current Value</Label>
              <Input
                type="number"
                value={form.current_value}
                onChange={(e) => setForm({ ...form, current_value: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input
                type="date"
                value={form.start_date}
                onChange={(e) => setForm({ ...form, start_date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Target Date</Label>
              <Input
                type="date"
                value={form.target_date}
                onChange={(e) => setForm({ ...form, target_date: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Visibility</Label>
            <Select value={form.visibility} onValueChange={(v) => setForm({ ...form, visibility: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all_employees">All Employees</SelectItem>
                <SelectItem value="managers_only">Managers Only</SelectItem>
                <SelectItem value="hr_ld_exec_only">HR/L&D/Exec Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onSave(form)} disabled={saving || !form.name || !form.target_value}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {goal ? 'Save Changes' : 'Create Goal'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}