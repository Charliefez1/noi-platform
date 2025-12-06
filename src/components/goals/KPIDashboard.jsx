import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Users, Zap, BookOpen, Clock } from 'lucide-react';

export default function KPIDashboard({ kpis, signals, tasks, learningProgress }) {
  // Calculate real KPI values from data
  const calculateKPI = (kpi) => {
    switch (kpi.metric_type) {
      case 'friction_index':
        const avgFriction = signals
          .filter(s => s.signal_type === 'friction')
          .slice(-kpi.time_window_days)
          .reduce((acc, s) => acc + s.value, 0) / Math.max(signals.filter(s => s.signal_type === 'friction').length, 1);
        return Math.round(avgFriction);
      
      case 'capacity_score':
        const avgCapacity = signals
          .filter(s => s.signal_type === 'capacity')
          .slice(-kpi.time_window_days)
          .reduce((acc, s) => acc + s.value, 0) / Math.max(signals.filter(s => s.signal_type === 'capacity').length, 1);
        return Math.round(avgCapacity);
      
      case 'on_time_completion':
        const completedTasks = tasks.filter(t => t.status === 'done');
        const onTime = completedTasks.filter(t => 
          !t.due_date || new Date(t.completed_at) <= new Date(t.due_date)
        ).length;
        return completedTasks.length > 0 ? Math.round((onTime / completedTasks.length) * 100) : 0;
      
      case 'learning_completion':
        const completed = learningProgress.filter(p => p.status === 'completed').length;
        const total = learningProgress.length;
        return total > 0 ? Math.round((completed / total) * 100) : 0;
      
      case 'meeting_pressure':
        const avgPressure = signals
          .filter(s => s.signal_type === 'meeting_pressure')
          .slice(-kpi.time_window_days)
          .reduce((acc, s) => acc + s.value, 0) / Math.max(signals.filter(s => s.signal_type === 'meeting_pressure').length, 1);
        return Math.round(avgPressure);
      
      default:
        return 0;
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'people': return Users;
      case 'workload': return Zap;
      case 'learning': return BookOpen;
      default: return Clock;
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'people': return 'text-blue-500 bg-blue-500/10';
      case 'workload': return 'text-orange-500 bg-orange-500/10';
      case 'learning': return 'text-purple-500 bg-purple-500/10';
      default: return 'text-gray-500 bg-gray-500/10';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {kpis.map(kpi => {
        const Icon = getCategoryIcon(kpi.category);
        const value = calculateKPI(kpi);
        const hasTarget = kpi.target_value !== undefined && kpi.target_value !== null;
        const isOnTrack = hasTarget ? value >= kpi.target_value : null;

        return (
          <Card key={kpi.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${getCategoryColor(kpi.category)}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{kpi.name}</CardTitle>
                    <p className="text-xs text-muted-foreground capitalize">{kpi.category}</p>
                  </div>
                </div>
                {hasTarget && (
                  isOnTrack ? 
                    <TrendingUp className="w-5 h-5 text-green-500" /> :
                    <TrendingDown className="w-5 h-5 text-red-500" />
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold">{value}</span>
                  <span className="text-sm text-muted-foreground">{kpi.unit}</span>
                </div>
                {hasTarget && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Target: {kpi.target_value}{kpi.unit}</span>
                    <Badge variant={isOnTrack ? 'default' : 'destructive'} className="text-xs">
                      {isOnTrack ? 'On Track' : 'Below Target'}
                    </Badge>
                  </div>
                )}
                {kpi.description && (
                  <p className="text-xs text-muted-foreground pt-2 border-t">{kpi.description}</p>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}