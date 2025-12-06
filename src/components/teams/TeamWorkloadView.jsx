import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users, Clock, CheckCircle2, AlertTriangle, Info } from 'lucide-react';
import { calculateUserLoad, calculateUserFriction, hasUserData } from './teamMetrics';

export default function TeamWorkloadView({ tasks, projects, users = [], meetings = [] }) {
  const teamWorkload = useMemo(() => {
    return users.map(user => {
      const userTasks = tasks.filter(t => 
        t.assignee_ids?.includes(user.id) && t.status !== 'done'
      );
      
      const userProjects = projects.filter(p => 
        p.team_members?.includes(user.id) && p.status !== 'completed'
      );
      
      const totalMinutes = userTasks.reduce((acc, t) => acc + (t.estimated_minutes || 30), 0);
      const overdueTasks = userTasks.filter(t => 
        t.due_date && new Date(t.due_date) < new Date()
      ).length;
      const highPriorityTasks = userTasks.filter(t => 
        t.priority === 'high' || t.priority === 'critical'
      ).length;
      
      // Use real metrics
      const loadPercentage = calculateUserLoad(user.id, tasks, meetings);
      const friction = calculateUserFriction(user.id, tasks, meetings);
      const hasData = hasUserData(user.id, tasks, meetings);
      
      return {
        user,
        taskCount: userTasks.length,
        projectCount: userProjects.length,
        totalHours: Math.round(totalMinutes / 60 * 10) / 10,
        overdueTasks,
        highPriorityTasks,
        loadPercentage,
        friction,
        hasData,
        status: loadPercentage > 85 ? 'overloaded' : loadPercentage > 65 ? 'busy' : 'available'
      };
    }).sort((a, b) => b.loadPercentage - a.loadPercentage);
  }, [tasks, projects, users, meetings]);

  const avgLoad = teamWorkload.length > 0
    ? Math.round(teamWorkload.reduce((acc, w) => acc + w.loadPercentage, 0) / teamWorkload.length)
    : 0;

  const overloadedMembers = teamWorkload.filter(w => w.loadPercentage > 85).length;

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Users className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{teamWorkload.length}</p>
                <p className="text-xs text-muted-foreground">Team Members</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-500/10">
                <Clock className="w-5 h-5 text-yellow-500" />
              </div>
              <div>
                <p className={`text-2xl font-bold ${avgLoad > 80 ? 'text-orange-500' : avgLoad > 60 ? 'text-yellow-500' : 'text-green-500'}`}>
                  {avgLoad}%
                </p>
                <p className="text-xs text-muted-foreground">Avg Load</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/10">
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-500">{overloadedMembers}</p>
                <p className="text-xs text-muted-foreground">Overloaded</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {tasks.filter(t => t.status === 'done').length}
                </p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Legend */}
      <Card className="bg-muted/30">
        <CardContent className="p-4">
          <div className="flex items-start gap-2 text-xs text-muted-foreground">
            <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-foreground mb-1">Metrics Legend</p>
              <p><strong>Load:</strong> Based on pending tasks (weighted by priority) and meeting hours this week.</p>
              <p><strong>Friction:</strong> High = multiple overdue/deferred tasks or back-to-back meetings. Low = smooth workflow.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Team Members Workload */}
      <Card>
        <CardHeader>
          <CardTitle>Team Workload Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {teamWorkload.map(({ user, taskCount, projectCount, totalHours, overdueTasks, highPriorityTasks, loadPercentage, friction, hasData, status }) => (
              <div key={user.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="text-xs">
                        {(user.full_name || user.email || 'U').split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">{user.full_name || user.email}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{taskCount} tasks</span>
                        <span>•</span>
                        <span>{projectCount} projects</span>
                        <span>•</span>
                        <span>{totalHours}h</span>
                        {!hasData && (
                          <>
                            <span>•</span>
                            <span className="text-muted-foreground">limited data</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {friction && hasData && (
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${
                          friction === 'high' ? 'border-red-500/50 text-red-500' :
                          friction === 'medium' ? 'border-yellow-500/50 text-yellow-500' :
                          'border-green-500/50 text-green-500'
                        }`}
                      >
                        {friction} friction
                      </Badge>
                    )}
                    {overdueTasks > 0 && (
                      <Badge variant="destructive" className="text-xs">
                        {overdueTasks} overdue
                      </Badge>
                    )}
                    {highPriorityTasks > 0 && (
                      <Badge variant="outline" className="text-xs text-orange-500 border-orange-500/50">
                        {highPriorityTasks} high priority
                      </Badge>
                    )}
                    <Badge 
                      variant={status === 'overloaded' ? 'destructive' : status === 'busy' ? 'default' : 'secondary'}
                      className="text-xs min-w-[80px] justify-center"
                    >
                      {status}
                    </Badge>
                    <span className={`text-sm font-medium w-12 text-right ${!hasData ? 'text-muted-foreground' : ''}`}>
                      {hasData ? `${loadPercentage}%` : '—'}
                    </span>
                  </div>
                </div>
                <Progress 
                  value={hasData ? loadPercentage : 0}
                  className={`h-2 ${
                    !hasData ? 'opacity-30' :
                    loadPercentage > 85 ? '[&>div]:bg-red-500' : 
                    loadPercentage > 65 ? '[&>div]:bg-yellow-500' : 
                    '[&>div]:bg-green-500'
                  }`}
                />
              </div>
            ))}
            {teamWorkload.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-8">
                No team members with assigned work
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}