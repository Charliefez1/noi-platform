import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Search, Award, Filter, BookOpen, TrendingUp, CheckCircle2, Users, Clock, Target } from 'lucide-react';
import { useNoi } from '@/components/core/NoiContext';
import { toast } from 'sonner';
import LearningCard from '@/components/learning/LearningCard';
import ModuleViewer from '@/components/learning/ModuleViewer';
import AILearningRecommendations from '@/components/learning/AILearningRecommendations';
import LoadingState from '@/components/shared/LoadingState';
import ErrorBanner from '@/components/shared/ErrorBanner';

const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'productivity', label: 'Productivity' },
  { id: 'communication', label: 'Communication' },
  { id: 'leadership', label: 'Leadership' },
  { id: 'technical', label: 'Technical' },
  { id: 'wellbeing', label: 'Wellbeing' },
  { id: 'collaboration', label: 'Collaboration' },
];

const LEVELS = [
  { id: 'all', label: 'All Levels' },
  { id: 'aware', label: 'Aware' },
  { id: 'advocate', label: 'Advocate' },
  { id: 'manager', label: 'Manager' },
  { id: 'leader', label: 'Leader' },
  { id: 'hr', label: 'HR' },
  { id: 'exec', label: 'Exec' },
  { id: 'champion', label: 'Champion' },
];

export default function LearningPage() {
  const { 
    learningModules, 
    learningProgress, 
    learningPathways,
    learningPreference,
    tasks, 
    frictionIndex, 
    capacityScore, 
    logEvent, 
    refreshData, 
    user, 
    consent, 
    loading, 
    error, 
    currentState 
  } = useNoi();
  
  const [selectedModule, setSelectedModule] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeLevel, setActiveLevel] = useState('all');
  const [activeTab, setActiveTab] = useState('my-learning');
  const [completing, setCompleting] = useState(false);

  // Get progress for a module
  const getProgress = (moduleId) => {
    return learningProgress.find(p => p.module_id === moduleId);
  };

  // Calculate pathway completion
  const getPathwayCompletion = (pathway) => {
    if (!pathway.required_module_ids?.length) return 0;
    const completed = pathway.required_module_ids.filter(modId => {
      const prog = learningProgress.find(p => p.module_id === modId);
      return prog?.status === 'completed';
    });
    return Math.round((completed.length / pathway.required_module_ids.length) * 100);
  };

  // My Learning: In progress + mandatory + incomplete pathway modules
  const myLearningModules = useMemo(() => {
    const inProgress = learningModules.filter(m => {
      const prog = getProgress(m.id);
      return prog?.status === 'in_progress';
    });

    const mandatory = learningModules.filter(m => {
      const prog = getProgress(m.id);
      return m.is_mandatory && prog?.status !== 'completed';
    });

    const pathwayIncomplete = learningModules.filter(m => {
      if (!m.pathway_id) return false;
      const pathway = learningPathways.find(p => p.id === m.pathway_id);
      if (!pathway?.required_module_ids?.includes(m.id)) return false;
      const prog = getProgress(m.id);
      return prog?.status !== 'completed';
    });

    // Deduplicate and sort: in-progress first
    const allModules = [...new Set([...inProgress, ...mandatory, ...pathwayIncomplete])];
    return allModules.sort((a, b) => {
      const progA = getProgress(a.id);
      const progB = getProgress(b.id);
      if (progA?.status === 'in_progress' && progB?.status !== 'in_progress') return -1;
      if (progA?.status !== 'in_progress' && progB?.status === 'in_progress') return 1;
      return 0;
    });
  }, [learningModules, learningProgress, learningPathways]);

  // Filter modules for Library
  const filteredModules = useMemo(() => {
    return learningModules.filter(m => {
      const matchesSearch = m.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
        m.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = activeCategory === 'all' || m.category === activeCategory;
      const matchesLevel = activeLevel === 'all' || m.level === activeLevel;
      return matchesSearch && matchesCategory && matchesLevel;
    });
  }, [learningModules, searchTerm, activeCategory, activeLevel]);

  // Recommended modules
  const recommendedModules = useMemo(() => {
    return learningModules.filter(m => {
      const prog = getProgress(m.id);
      if (prog?.status === 'completed') return false;
      
      if (m.friction_triggers?.length > 0) {
        if (frictionIndex > 50 && m.friction_triggers.includes('high_friction')) return true;
        if (frictionIndex > 30 && m.friction_triggers.includes('moderate_friction')) return true;
      }
      if (m.role_tags?.includes(user?.role_type)) return true;
      return false;
    }).slice(0, 4);
  }, [learningModules, frictionIndex, user, learningProgress]);

  // Today's Focus based on currentState
  const todaysFocus = useMemo(() => {
    const isOverloaded = currentState?.label === 'overloaded' || currentState?.label === 'critical';
    const isClear = currentState?.label === 'clear' || currentState?.label === 'stretched';
    
    if (isOverloaded) {
      const lightModule = learningModules.find(m => {
        const prog = getProgress(m.id);
        return prog?.status !== 'completed' && m.duration_minutes && m.duration_minutes <= 10;
      });
      return lightModule ? [lightModule] : [];
    }
    
    if (isClear) {
      return learningModules
        .filter(m => {
          const prog = getProgress(m.id);
          return prog?.status === 'in_progress';
        })
        .slice(0, 2);
    }
    
    return [];
  }, [learningModules, learningProgress, currentState]);

  // Get linked tasks for a module
  const getLinkedTasks = (module) => {
    if (!module?.linked_task_ids?.length) return [];
    return tasks.filter(t => module.linked_task_ids.includes(t.id));
  };

  const handleStartModule = async (module) => {
    const existing = getProgress(module.id);
    if (!existing) {
      await base44.entities.LearningProgress.create({
        module_id: module.id,
        status: 'in_progress',
        progress_percent: 0,
        started_at: new Date().toISOString()
      });
      await logEvent('module_started', 'learning_module', module.id);
      refreshData();
    }
    setSelectedModule(module);
  };

  const handleUpdateProgress = async (percent) => {
    if (!selectedModule) return;
    const existing = getProgress(selectedModule.id);
    
    if (existing) {
      await base44.entities.LearningProgress.update(existing.id, {
        progress_percent: percent,
        status: percent === 100 ? 'completed' : 'in_progress',
        ...(percent === 100 && { completed_at: new Date().toISOString() })
      });
      refreshData();
    }
  };

  const handleCompleteModule = async () => {
    if (!selectedModule) return;
    setCompleting(true);
    
    try {
      const existing = getProgress(selectedModule.id);
      
      if (existing) {
        await base44.entities.LearningProgress.update(existing.id, {
          status: 'completed',
          progress_percent: 100,
          completed_at: new Date().toISOString(),
          time_spent_minutes: selectedModule.duration_minutes || 5
        });
      } else {
        await base44.entities.LearningProgress.create({
          module_id: selectedModule.id,
          status: 'completed',
          progress_percent: 100,
          started_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
          time_spent_minutes: selectedModule.duration_minutes || 5
        });
      }
      
      await logEvent('module_completed', 'learning_module', selectedModule.id);
      toast.success("Module completed!");
      setSelectedModule(null);
      refreshData();
    } catch (error) {
      toast.error("Failed to mark as complete");
    } finally {
      setCompleting(false);
    }
  };

  // Stats
  const completedCount = learningProgress.filter(p => p.status === 'completed').length;
  const inProgressCount = learningProgress.filter(p => p.status === 'in_progress').length;
  const mandatoryCount = learningModules.filter(m => m.is_mandatory).length;
  const mandatoryCompleted = learningModules.filter(m => {
    if (!m.is_mandatory) return false;
    const prog = getProgress(m.id);
    return prog?.status === 'completed';
  }).length;

  if (loading && learningModules.length === 0) {
    return <LoadingState message="Loading learning..." />;
  }

  return (
    <div className="space-y-6 pb-10">
      {error && <ErrorBanner error={error} onRetry={refreshData} />}
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Learning & Growth</h1>
          <p className="text-muted-foreground">Learn your way, at your pace.</p>
        </div>
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search..." 
            className="pl-9 rounded-full bg-card border-none shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Today's Focus */}
      {todaysFocus.length > 0 && (
        <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Today's Focus
              {currentState?.label === 'overloaded' || currentState?.label === 'critical' ? (
                <Badge variant="outline" className="ml-auto">Keep it light</Badge>
              ) : (
                <Badge variant="outline" className="ml-auto">Worth continuing</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              {currentState?.label === 'overloaded' || currentState?.label === 'critical' 
                ? "If you have a small bit of space, this might help. Ignore for now if you need."
                : "You have bandwidth. Consider one of these when ready."}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {todaysFocus.map((module) => (
                <LearningCard
                  key={module.id}
                  module={module}
                  progress={getProgress(module.id)}
                  onClick={() => handleStartModule(module)}
                  variant="compact"
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{completedCount}</p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <BookOpen className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{inProgressCount}</p>
                <p className="text-xs text-muted-foreground">In Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <Target className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{mandatoryCompleted}/{mandatoryCount}</p>
                <p className="text-xs text-muted-foreground">Mandatory</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <Users className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{learningPathways.length}</p>
                <p className="text-xs text-muted-foreground">Pathways</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-muted/50 p-1 rounded-full mb-4">
          <TabsTrigger value="my-learning" className="rounded-full px-6">
            My Learning
          </TabsTrigger>
          <TabsTrigger value="pathways" className="rounded-full px-6">
            Pathways
          </TabsTrigger>
          <TabsTrigger value="library" className="rounded-full px-6">
            Library
          </TabsTrigger>
          <TabsTrigger value="recommended" className="rounded-full px-6">
            Recommended
          </TabsTrigger>
        </TabsList>

        {/* My Learning Tab */}
        <TabsContent value="my-learning" className="space-y-4">
          {myLearningModules.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No modules in your learning queue.</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => setActiveTab('library')}
              >
                Browse Library
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {myLearningModules.map((module) => (
                <LearningCard
                  key={module.id}
                  module={module}
                  progress={getProgress(module.id)}
                  onClick={() => handleStartModule(module)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Pathways Tab */}
        <TabsContent value="pathways" className="space-y-4">
          {learningPathways.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No pathways available yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {learningPathways.map((pathway) => {
                const completion = getPathwayCompletion(pathway);
                const pathwayModules = learningModules.filter(m => pathway.module_ids?.includes(m.id));
                return (
                  <Card key={pathway.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex justify-between items-start mb-2">
                        <Badge variant="outline" className="capitalize">{pathway.audience}</Badge>
                        <Badge variant="secondary">{completion}% Complete</Badge>
                      </div>
                      <CardTitle className="text-lg">{pathway.name}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-2">{pathway.description}</p>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {pathway.estimated_minutes || pathwayModules.reduce((acc, m) => acc + (m.duration_minutes || 5), 0)} min
                          </span>
                          <span className="text-muted-foreground">
                            {pathway.module_ids?.length || 0} modules
                          </span>
                        </div>
                        <Progress value={completion} className="h-2" />
                        <Button 
                          className="w-full" 
                          variant={completion === 100 ? "outline" : "default"}
                          onClick={() => {
                            // Open first incomplete module
                            const nextModule = pathwayModules.find(m => {
                              const prog = getProgress(m.id);
                              return prog?.status !== 'completed';
                            });
                            if (nextModule) handleStartModule(nextModule);
                          }}
                        >
                          {completion === 100 ? 'Review' : 'Continue'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Library Tab */}
        <TabsContent value="library" className="space-y-6">
          {/* Filters */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Category:</span>
              {CATEGORIES.map(cat => (
                <Button
                  key={cat.id}
                  variant={activeCategory === cat.id ? 'default' : 'outline'}
                  size="sm"
                  className="rounded-full"
                  onClick={() => setActiveCategory(cat.id)}
                >
                  {cat.label}
                </Button>
              ))}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Level:</span>
              {LEVELS.map(level => (
                <Button
                  key={level.id}
                  variant={activeLevel === level.id ? 'default' : 'outline'}
                  size="sm"
                  className="rounded-full"
                  onClick={() => setActiveLevel(level.id)}
                >
                  {level.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Module Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredModules.map((module) => (
              <LearningCard
                key={module.id}
                module={module}
                progress={getProgress(module.id)}
                onClick={() => handleStartModule(module)}
              />
            ))}
          </div>

          {filteredModules.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No modules found.</p>
            </div>
          )}
        </TabsContent>

        {/* Recommended Tab */}
        <TabsContent value="recommended" className="space-y-6">
          {consent?.allow_learning_recommendations ? (
            <>
              <AILearningRecommendations />
              
              {recommendedModules.length > 0 && (
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Award className="w-5 h-5 text-primary" />
                    Based on Your Work
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {recommendedModules.map((module) => (
                      <LearningCard
                        key={module.id}
                        module={module}
                        progress={getProgress(module.id)}
                        onClick={() => handleStartModule(module)}
                        variant="featured"
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <Card className="border-muted bg-muted/20">
              <CardContent className="p-6 text-center">
                <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-50 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  AI recommendations are disabled in your privacy settings.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Module Viewer */}
      <ModuleViewer
        module={selectedModule}
        progress={selectedModule ? getProgress(selectedModule.id) : null}
        linkedTasks={selectedModule ? getLinkedTasks(selectedModule) : []}
        onClose={() => setSelectedModule(null)}
        onComplete={handleCompleteModule}
        onUpdateProgress={handleUpdateProgress}
        completing={completing}
      />
    </div>
  );
}