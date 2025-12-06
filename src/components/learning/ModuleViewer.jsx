import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, CheckCircle2, Loader2, Link2, ExternalLink, Eye, FileText, Headphones, MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useNoi } from '@/components/core/NoiContext';
import ReactMarkdown from 'react-markdown';

const categoryColors = {
  productivity: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  communication: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  leadership: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  technical: 'bg-green-500/10 text-green-500 border-green-500/20',
  wellbeing: 'bg-pink-500/10 text-pink-500 border-pink-500/20',
  collaboration: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20',
};

export default function ModuleViewer({ 
  module, 
  progress, 
  linkedTasks = [],
  onClose, 
  onComplete, 
  onUpdateProgress,
  completing 
}) {
  const { learningPreference, currentState } = useNoi();
  const [localProgress, setLocalProgress] = useState(progress?.progress_percent || 0);
  const [viewMode, setViewMode] = useState('overview');
  const [scenarioStep, setScenarioStep] = useState(0);
  const isCompleted = progress?.status === 'completed';

  // Determine initial view mode based on preference and state
  useEffect(() => {
    if (!module) return;

    const isOverloaded = currentState?.label === 'overloaded' || currentState?.label === 'critical';
    const modePref = learningPreference?.mode_preference || 'mixed';
    
    // Check available modalities
    const hasAudio = module.modalities?.audio_url;
    const hasScenario = module.modalities?.interactive_scenario;
    const hasDeepText = module.modalities?.text_deep_dive;
    
    if (isOverloaded) {
      // Prefer lighter content when overloaded
      if (modePref === 'audio' && hasAudio) {
        setViewMode('audio');
      } else {
        setViewMode('overview');
      }
    } else {
      // Use user preference when clear
      if (modePref === 'audio' && hasAudio) {
        setViewMode('audio');
      } else if (modePref === 'visual') {
        setViewMode('overview');
      } else if (hasDeepText) {
        setViewMode('text');
      } else {
        setViewMode('overview');
      }
    }
    
    // Reset scenario step when module changes
    setScenarioStep(0);
  }, [module, learningPreference, currentState]);

  const handleProgressChange = async (value) => {
    setLocalProgress(value[0]);
    if (onUpdateProgress) {
      await onUpdateProgress(value[0]);
    }
  };

  if (!module) return null;

  // Check available modalities
  const hasAudio = module.modalities?.audio_url;
  const hasScenario = module.modalities?.interactive_scenario;
  const hasDeepText = module.modalities?.text_deep_dive;
  const hasVisualSummary = module.modalities?.visual_summary;

  // Show helper text when overloaded
  const isOverloaded = currentState?.label === 'overloaded' || currentState?.label === 'critical';
  
  // Render content based on view mode
  const renderContent = () => {
    switch (viewMode) {
      case 'overview':
        return (
          <div className="prose prose-slate dark:prose-invert max-w-none">
            {hasVisualSummary ? (
              <ReactMarkdown>{module.modalities.visual_summary}</ReactMarkdown>
            ) : (
              <>
                <h3>Overview</h3>
                <p>{module.description || module.content?.substring(0, 300) || "This module will help you improve your workflow and reduce friction."}</p>
                {module.skills?.length > 0 && (
                  <>
                    <h4>Key Skills</h4>
                    <ul>
                      {module.skills.map(skill => (
                        <li key={skill}>{skill.replace('_', ' ')}</li>
                      ))}
                    </ul>
                  </>
                )}
              </>
            )}
          </div>
        );

      case 'text':
        return (
          <div className="prose prose-slate dark:prose-invert max-w-none">
            {hasDeepText ? (
              <ReactMarkdown>{module.modalities.text_deep_dive}</ReactMarkdown>
            ) : (
              <ReactMarkdown>{module.content || "Content not available."}</ReactMarkdown>
            )}
          </div>
        );

      case 'audio':
        if (!hasAudio) {
          return <p className="text-muted-foreground text-center py-8">Audio not available for this module.</p>;
        }
        return (
          <div className="space-y-4">
            <div className="p-4 bg-background rounded-lg border">
              <p className="text-sm text-muted-foreground mb-3">Audio version available</p>
              <audio controls className="w-full" src={module.modalities.audio_url}>
                Your browser does not support audio playback.
              </audio>
            </div>
            {module.modalities.audio_transcript && (
              <details className="p-4 bg-muted/20 rounded-lg border">
                <summary className="font-medium cursor-pointer">View Transcript</summary>
                <div className="mt-3 text-sm prose prose-slate dark:prose-invert max-w-none">
                  <ReactMarkdown>{module.modalities.audio_transcript}</ReactMarkdown>
                </div>
              </details>
            )}
          </div>
        );

      case 'scenario':
        if (!hasScenario) {
          return <p className="text-muted-foreground text-center py-8">Interactive scenario not available.</p>;
        }
        const scenario = module.modalities.interactive_scenario;
        const steps = scenario.steps || [];
        const currentScenario = steps[scenarioStep];
        
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <Badge variant="outline">Step {scenarioStep + 1} of {steps.length}</Badge>
              <Progress value={((scenarioStep + 1) / steps.length) * 100} className="w-32 h-2" />
            </div>
            
            {currentScenario && (
              <div className="space-y-4">
                <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                  <h4 className="font-semibold mb-2">{currentScenario.title || `Scenario ${scenarioStep + 1}`}</h4>
                  <p className="text-sm">{currentScenario.text}</p>
                </div>
                
                {currentScenario.question && (
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <p className="font-medium text-sm mb-3">{currentScenario.question}</p>
                    <div className="space-y-2">
                      {currentScenario.choices?.map((choice, idx) => (
                        <Button
                          key={idx}
                          variant="outline"
                          className="w-full justify-start text-left h-auto py-3"
                          onClick={() => {
                            if (scenarioStep < steps.length - 1) {
                              setScenarioStep(scenarioStep + 1);
                            }
                          }}
                        >
                          {choice}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="flex gap-2">
                  {scenarioStep > 0 && (
                    <Button variant="outline" onClick={() => setScenarioStep(scenarioStep - 1)}>
                      Previous
                    </Button>
                  )}
                  {scenarioStep < steps.length - 1 && !currentScenario.question && (
                    <Button onClick={() => setScenarioStep(scenarioStep + 1)} className="ml-auto">
                      Next
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        );

      default:
        return <p>Select a view mode</p>;
    }
  };

  return (
    <Dialog open={!!module} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <Badge className={categoryColors[module.category] || categoryColors.productivity}>
              {module.category || 'productivity'}
            </Badge>
            <Badge variant="outline">{module.type}</Badge>
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" /> {module.duration_minutes || 5} min
            </span>
            {module.is_mandatory && (
              <Badge variant="destructive">Mandatory</Badge>
            )}
            {module.level && (
              <Badge variant="secondary" className="capitalize">{module.level}</Badge>
            )}
            {isCompleted && (
              <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
                <CheckCircle2 className="w-3 h-3 mr-1" /> Completed
              </Badge>
            )}
          </div>
          <DialogTitle className="text-2xl">{module.title}</DialogTitle>
          <DialogDescription>{module.description}</DialogDescription>
        </DialogHeader>
        
        <div className="mt-4 space-y-6">
          {/* Helper text when overloaded */}
          {isOverloaded && (
            <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
              <p className="text-sm text-muted-foreground">
                You look a bit stretched today, so we're starting with a lighter view. You can switch modes any time.
              </p>
            </div>
          )}

          {/* View Mode Selector */}
          <Tabs value={viewMode} onValueChange={setViewMode}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview" className="gap-1">
                <Eye className="w-3 h-3" />
                <span className="hidden sm:inline">Overview</span>
              </TabsTrigger>
              <TabsTrigger value="text" className="gap-1" disabled={!hasDeepText && !module.content}>
                <FileText className="w-3 h-3" />
                <span className="hidden sm:inline">Text</span>
              </TabsTrigger>
              <TabsTrigger value="audio" className="gap-1" disabled={!hasAudio}>
                <Headphones className="w-3 h-3" />
                <span className="hidden sm:inline">Audio</span>
              </TabsTrigger>
              <TabsTrigger value="scenario" className="gap-1" disabled={!hasScenario}>
                <MessageSquare className="w-3 h-3" />
                <span className="hidden sm:inline">Scenario</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Content Area */}
          <div className="p-6 bg-muted/30 rounded-xl border border-border/50 min-h-[200px]">
            {module.content_url && viewMode === 'overview' ? (
              <div className="aspect-video bg-black rounded-lg flex items-center justify-center">
                <a 
                  href={module.content_url} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="flex items-center gap-2 text-white underline hover:text-primary"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open Resource
                </a>
              </div>
            ) : (
              renderContent()
            )}
          </div>

          {/* Progress Slider */}
          {!isCompleted && (
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="font-medium">Your Progress</span>
                <span className="text-muted-foreground">{localProgress}%</span>
              </div>
              <Slider
                value={[localProgress]}
                onValueChange={handleProgressChange}
                max={100}
                step={10}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Drag to update your progress through this module
              </p>
            </div>
          )}
          
          {/* Skills */}
          {module.skills?.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Skills you'll gain:</p>
              <div className="flex flex-wrap gap-2">
                {module.skills.map(skill => (
                  <Badge key={skill} variant="secondary">{skill.replace('_', ' ')}</Badge>
                ))}
              </div>
            </div>
          )}

          {/* Linked Tasks/Project */}
          {(linkedTasks.length > 0 || module.linked_project) && (
            <div className="p-4 bg-accent/30 rounded-xl">
              <div className="flex items-center gap-2 mb-3">
                <Link2 className="w-4 h-4 text-primary" />
                <span className="font-medium text-sm">Linked Work</span>
              </div>
              
              {module.linked_project && (
                <p className="text-sm text-muted-foreground mb-2">
                  Project: <span className="text-foreground font-medium">{module.linked_project}</span>
                </p>
              )}
              
              {linkedTasks.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Related Tasks:</p>
                  {linkedTasks.map(task => (
                    <Link 
                      key={task.id} 
                      to={createPageUrl('Tasks')}
                      className="block p-2 bg-background rounded-lg text-sm hover:bg-accent transition-colors"
                    >
                      {task.title}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="mt-6 gap-2">
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button 
            onClick={onComplete} 
            disabled={completing || isCompleted}
          >
            {completing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isCompleted ? 'Already Completed' : 'Mark Complete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}