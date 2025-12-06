import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  AlertTriangle, 
  Calendar, 
  BookOpen, 
  Clock, 
  MessageSquare,
  Zap,
  X
} from 'lucide-react';
import { useNoi } from '@/components/core/NoiContext';

const nudgeIcons = {
  overload_warning: AlertTriangle,
  schedule_suggestion: Calendar,
  learning_recommendation: BookOpen,
  deadline_negotiation: Clock,
  clarity_prompt: MessageSquare,
  meeting_prep: Calendar,
  break_reminder: Clock,
  friction_reduction: Zap,
};

const nudgeColors = {
  overload_warning: 'from-red-500/10 to-orange-500/10 border-red-500/20',
  schedule_suggestion: 'from-blue-500/10 to-cyan-500/10 border-blue-500/20',
  learning_recommendation: 'from-purple-500/10 to-indigo-500/10 border-purple-500/20',
  deadline_negotiation: 'from-yellow-500/10 to-amber-500/10 border-yellow-500/20',
  clarity_prompt: 'from-green-500/10 to-emerald-500/10 border-green-500/20',
  meeting_prep: 'from-indigo-500/10 to-violet-500/10 border-indigo-500/20',
  break_reminder: 'from-teal-500/10 to-cyan-500/10 border-teal-500/20',
  friction_reduction: 'from-amber-500/10 to-yellow-500/10 border-amber-500/20',
};

const nudgeIconColors = {
  overload_warning: 'text-red-500',
  schedule_suggestion: 'text-blue-500',
  learning_recommendation: 'text-purple-500',
  deadline_negotiation: 'text-yellow-500',
  clarity_prompt: 'text-green-500',
  meeting_prep: 'text-indigo-500',
  break_reminder: 'text-teal-500',
  friction_reduction: 'text-amber-500',
};

export default function NudgeCard({ nudge, compact = false }) {
  const { acceptNudge, dismissNudge, tasks, updateTask, learningModules } = useNoi();
  const Icon = nudgeIcons[nudge.nudge_type] || Zap;
  const colorClass = nudgeColors[nudge.nudge_type] || 'from-primary/10 to-primary/5 border-primary/20';
  const iconColor = nudgeIconColors[nudge.nudge_type] || 'text-primary';

  const handleAccept = async () => {
    // Execute action based on action_data if available
    if (nudge.action_data) {
      // Auto-defer suggested tasks
      if (nudge.action_data.suggested_task_ids?.length > 0 && nudge.action_type === 'defer') {
        for (const taskId of nudge.action_data.suggested_task_ids.slice(0, 3)) {
          try {
            await updateTask(taskId, { status: 'deferred', deferred_count: (tasks.find(t => t.id === taskId)?.deferred_count || 0) + 1 });
          } catch (error) {
            console.error('Error deferring task:', error);
          }
        }
      }
    }
    
    await acceptNudge(nudge.id);
  };

  const handleDismiss = async () => {
    await dismissNudge(nudge.id);
  };

  if (compact) {
    return (
      <div className={`p-3 rounded-xl bg-gradient-to-r ${colorClass} border flex items-center gap-3`}>
        <Icon className={`w-5 h-5 ${iconColor} flex-shrink-0`} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{nudge.title}</p>
        </div>
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" onClick={handleAccept} className="h-7 px-2">
            View
          </Button>
          <Button size="icon" variant="ghost" onClick={handleDismiss} className="h-7 w-7">
            <X className="w-3 h-3" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Card className={`bg-gradient-to-r ${colorClass} border overflow-hidden`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg bg-background/50 ${iconColor}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm mb-1">{nudge.title}</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {nudge.message}
            </p>
            <div className="mt-3 flex gap-2">
              <Button size="sm" onClick={handleAccept} className="bg-background/80 hover:bg-background text-foreground">
                {nudge.action_type === 'reschedule' && 'View Suggestions'}
                {nudge.action_type === 'learn' && 'Start Learning'}
                {nudge.action_type === 'clarify' && 'Clarify Now'}
                {nudge.action_type === 'acknowledge' && 'Got It'}
                {!['reschedule', 'learn', 'clarify', 'acknowledge'].includes(nudge.action_type) && 'Take Action'}
              </Button>
              <Button size="sm" variant="ghost" onClick={handleDismiss}>
                Dismiss
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}