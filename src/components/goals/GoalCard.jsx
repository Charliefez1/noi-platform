import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Target, TrendingUp, TrendingDown, Minus, Calendar, BookOpen, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { base44 } from '@/api/base44Client';

export default function GoalCard({ goal, onEdit }) {
  const [learningStats, setLearningStats] = useState({ total: 0, completed: 0 });

  useEffect(() => {
    if (goal.linked_pathway_ids?.length > 0) {
      fetchLearningProgress();
    }
  }, [goal]);

  const fetchLearningProgress = async () => {
    try {
      const progressData = await base44.entities.LearningProgress.filter({
        module_id: { $in: goal.linked_pathway_ids }
      });
      const completed = progressData.filter(p => p.status === 'completed').length;
      setLearningStats({ total: goal.linked_pathway_ids.length, completed });
    } catch (error) {
      console.error('Error fetching learning progress:', error);
    }
  };

  const progress = goal.baseline_value && goal.target_value
    ? Math.min(Math.max(
        ((goal.current_value - goal.baseline_value) / (goal.target_value - goal.baseline_value)) * 100,
        0
      ), 100)
    : 0;

  const isImproving = goal.current_value !== undefined && goal.baseline_value !== undefined
    ? goal.current_value > goal.baseline_value
    : null;

  const statusColors = {
    draft: 'bg-gray-500/10 text-gray-500',
    active: 'bg-blue-500/10 text-blue-500',
    on_track: 'bg-green-500/10 text-green-500',
    at_risk: 'bg-orange-500/10 text-orange-500',
    achieved: 'bg-emerald-500/10 text-emerald-500',
    archived: 'bg-gray-500/10 text-gray-500'
  };

  return (
    <Card className="hover:shadow-lg transition-all cursor-pointer" onClick={onEdit}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Target className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">{goal.name}</CardTitle>
              <p className="text-xs text-muted-foreground capitalize">{goal.scope} • {goal.owner_type}</p>
            </div>
          </div>
          <Badge className={statusColors[goal.status]}>
            {goal.status.replace('_', ' ')}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {goal.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">{goal.description}</p>
        )}

        {/* Metric Display */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground capitalize">
              {goal.target_metric.replace(/_/g, ' ')}
            </span>
            <div className="flex items-center gap-2">
              <span className="font-medium">{goal.current_value ?? 'N/A'}</span>
              {isImproving !== null && (
                isImproving ? 
                  <TrendingUp className="w-4 h-4 text-green-500" /> :
                  <TrendingDown className="w-4 h-4 text-red-500" />
              )}
            </div>
          </div>
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Baseline: {goal.baseline_value}</span>
            <span>Target: {goal.target_value}</span>
          </div>
        </div>

        {/* Timeline */}
        {goal.target_date && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="w-3 h-3" />
            <span>Target: {format(new Date(goal.target_date), 'MMM d, yyyy')}</span>
          </div>
        )}

        {/* Learning Progress */}
        {goal.linked_pathway_ids?.length > 0 && (
          <div className="pt-3 border-t space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs">
                <BookOpen className="w-3 h-3 text-primary" />
                <span className="text-muted-foreground">Learning Progress</span>
              </div>
              <span className="text-xs font-medium">
                {learningStats.completed}/{learningStats.total} completed
              </span>
            </div>
            <Progress 
              value={(learningStats.completed / learningStats.total) * 100} 
              className="h-1.5"
            />
            {learningStats.completed === learningStats.total && learningStats.total > 0 && (
              <div className="flex items-center gap-1 text-xs text-green-500">
                <CheckCircle2 className="w-3 h-3" />
                All learning completed
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}