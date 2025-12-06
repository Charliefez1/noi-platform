import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { PlayCircle, FileText, BookOpen, Clock, CheckCircle2, Link2 } from 'lucide-react';

const categoryColors = {
  productivity: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  communication: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  leadership: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  technical: 'bg-green-500/10 text-green-500 border-green-500/20',
  wellbeing: 'bg-pink-500/10 text-pink-500 border-pink-500/20',
  collaboration: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20',
};

const ModuleIcon = ({ type }) => {
  if (type === 'video') return <PlayCircle className="w-5 h-5 text-blue-500" />;
  if (type === 'template') return <FileText className="w-5 h-5 text-green-500" />;
  if (type === 'assessment') return <CheckCircle2 className="w-5 h-5 text-orange-500" />;
  return <BookOpen className="w-5 h-5 text-purple-500" />;
};

export default function LearningCard({ module, progress, onClick, variant = 'default' }) {
  const isCompleted = progress?.status === 'completed';
  const isInProgress = progress?.status === 'in_progress';
  const hasLinks = module.linked_task_ids?.length > 0 || module.linked_project;

  if (variant === 'featured') {
    return (
      <Card 
        className="bg-gradient-to-br from-card to-accent/20 border-accent hover:shadow-lg transition-all cursor-pointer group"
        onClick={onClick}
      >
        <CardHeader>
          <div className="flex justify-between items-start mb-2">
            <Badge className={categoryColors[module.category] || categoryColors.productivity}>
              {module.category || 'productivity'}
            </Badge>
            <ModuleIcon type={module.type} />
          </div>
          <CardTitle className="group-hover:text-primary transition-colors">{module.title}</CardTitle>
          <p className="text-sm text-muted-foreground line-clamp-2">{module.description}</p>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-2">
          {(isInProgress || isCompleted) && (
            <div className="w-full">
              <div className="flex justify-between text-xs mb-1">
                <span>{isCompleted ? 'Completed' : 'In Progress'}</span>
                <span>{progress.progress_percent}%</span>
              </div>
              <Progress value={progress.progress_percent} className="h-1" />
            </div>
          )}
          <div className="text-xs text-muted-foreground flex items-center gap-4 flex-wrap">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" /> {module.duration_minutes || 5} min
            </span>
            {hasLinks && (
              <span className="flex items-center gap-1 text-primary">
                <Link2 className="w-3 h-3" /> Linked
              </span>
            )}
            {module.skills?.slice(0, 2).map(skill => (
              <span key={skill} className="px-2 py-0.5 rounded-full bg-background border">
                {skill.replace('_', ' ')}
              </span>
            ))}
          </div>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card 
      className={`hover:bg-accent/50 transition-colors cursor-pointer relative ${
        isCompleted ? 'border-green-500/30' : ''
      }`}
      onClick={onClick}
    >
      {isCompleted && (
        <div className="absolute top-2 right-2">
          <CheckCircle2 className="w-5 h-5 text-green-500" />
        </div>
      )}
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <ModuleIcon type={module.type} />
          <Badge variant="outline" className={`text-[10px] h-5 ${categoryColors[module.category] || ''}`}>
            {module.category || 'productivity'}
          </Badge>
        </div>
        <CardTitle className="text-base mt-2">{module.title}</CardTitle>
      </CardHeader>
      <CardContent className="pb-3">
        <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
          {module.description}
        </p>
        {isInProgress && !isCompleted && (
          <Progress value={progress.progress_percent} className="h-1" />
        )}
      </CardContent>
      <CardFooter className="pt-0 text-xs text-muted-foreground flex justify-between">
        <span className="flex items-center">
          <Clock className="w-3 h-3 mr-1" /> {module.duration_minutes || 5} min
        </span>
        {hasLinks && (
          <span className="flex items-center gap-1 text-primary">
            <Link2 className="w-3 h-3" />
          </span>
        )}
      </CardFooter>
    </Card>
  );
}