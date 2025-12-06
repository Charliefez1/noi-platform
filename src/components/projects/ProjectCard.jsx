import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Calendar, Users, CheckCircle2, BookOpen, Clock } from 'lucide-react';
import { format, differenceInDays, isPast } from 'date-fns';

const statusColors = {
  planning: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  active: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  on_hold: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  completed: 'bg-green-500/10 text-green-500 border-green-500/20',
  archived: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
};

const priorityColors = {
  low: 'text-slate-400',
  medium: 'text-blue-400',
  high: 'text-orange-400',
  critical: 'text-red-400',
};

export default function ProjectCard({ project, tasks = [], learningModules = [], onClick }) {
  const projectTasks = tasks.filter(t => t.project_id === project.id);
  const projectModules = learningModules.filter(m => m.project_id === project.id);
  
  const completedTasks = projectTasks.filter(t => t.status === 'done').length;
  const totalTasks = projectTasks.length;
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  
  const daysUntilDeadline = project.deadline ? differenceInDays(new Date(project.deadline), new Date()) : null;
  const isOverdue = project.deadline && isPast(new Date(project.deadline)) && project.status !== 'completed';

  return (
    <Card 
      className="hover:bg-accent/50 transition-all cursor-pointer group relative overflow-hidden"
      onClick={onClick}
    >
      <div 
        className="absolute top-0 left-0 w-1 h-full" 
        style={{ backgroundColor: project.color || '#1e9df1' }}
      />
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <Badge className={statusColors[project.status]}>
            {project.status?.replace('_', ' ')}
          </Badge>
          <span className={`text-xs font-medium ${priorityColors[project.priority]}`}>
            {project.priority}
          </span>
        </div>
        <CardTitle className="text-lg mt-2 group-hover:text-primary transition-colors">
          {project.name}
        </CardTitle>
        {project.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">{project.description}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{progress}%</span>
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {completedTasks}/{totalTasks} tasks
          </span>
          {projectModules.length > 0 && (
            <span className="flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5" />
              {projectModules.length} modules
            </span>
          )}
          {project.team_members?.length > 0 && (
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              {project.team_members.length}
            </span>
          )}
        </div>

        {/* Deadline */}
        {project.deadline && (
          <div className={`flex items-center gap-1.5 text-xs ${isOverdue ? 'text-red-400' : 'text-muted-foreground'}`}>
            <Calendar className="w-3.5 h-3.5" />
            <span>
              {isOverdue ? 'Overdue: ' : 'Due: '}
              {format(new Date(project.deadline), 'MMM d, yyyy')}
            </span>
            {!isOverdue && daysUntilDeadline !== null && daysUntilDeadline <= 7 && (
              <Badge variant="outline" className="text-[10px] h-4 ml-1 border-orange-500/50 text-orange-400">
                {daysUntilDeadline} days left
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}