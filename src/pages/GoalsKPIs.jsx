import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Target, TrendingUp, Plus } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useNoi } from '@/components/core/NoiContext';
import { toast } from 'sonner';
import GoalCard from '@/components/goals/GoalCard';
import GoalModal from '@/components/goals/GoalModal';
import KPIDashboard from '@/components/goals/KPIDashboard';

export default function GoalsKPIsPage() {
  const { user, isManager, tasks, learningProgress } = useNoi();
  const [goals, setGoals] = useState([]);
  const [kpis, setKPIs] = useState([]);
  const [signals, setSignals] = useState([]);
  const [learningModules, setLearningModules] = useState([]);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [savingGoal, setSavingGoal] = useState(false);
  const [loading, setLoading] = useState(true);

  const isHROrLDOrExec = user?.role_type === 'hr' || user?.role_type === 'ld' || user?.role_type === 'exec' || user?.role_type === 'org_admin';
  const canCreateGoals = isHROrLDOrExec;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [goalsData, kpisData, signalsData, modulesData] = await Promise.all([
        base44.entities.Goal.list(),
        base44.entities.KPI.filter({ is_active: true }),
        base44.entities.Signal.list(),
        base44.entities.LearningModule.list()
      ]);
      setGoals(goalsData || []);
      setKPIs(kpisData || []);
      setSignals(signalsData || []);
      setLearningModules(modulesData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveGoal = async (formData) => {
    setSavingGoal(true);
    try {
      if (editingGoal) {
        await base44.entities.Goal.update(editingGoal.id, formData);
        toast.success('Goal updated');
      } else {
        await base44.entities.Goal.create({ ...formData, owner_id: user?.id });
        toast.success('Goal created');
      }
      setIsGoalModalOpen(false);
      setEditingGoal(null);
      fetchData();
    } catch (error) {
      toast.error('Failed to save goal');
    } finally {
      setSavingGoal(false);
    }
  };

  // Filter goals based on role and visibility
  const visibleGoals = goals.filter(goal => {
    if (isHROrLDOrExec) return true;
    if (isManager && (goal.visibility === 'all_employees' || goal.visibility === 'managers_only')) return true;
    if (goal.visibility === 'all_employees') return true;
    return false;
  });

  // Filter active goals only
  const activeGoals = visibleGoals.filter(g => g.status === 'active' || g.status === 'on_track' || g.status === 'at_risk');

  // Filter KPIs based on role
  const visibleKPIs = kpis.filter(kpi => {
    if (!kpi.visible_to_roles) return true;
    if (user?.role_type) {
      return kpi.visible_to_roles.includes(user.role_type);
    }
    return false;
  });

  // Separate goals by type
  const teamGoals = activeGoals.filter(g => g.scope === 'team');
  const orgGoals = activeGoals.filter(g => g.scope === 'org' || g.scope === 'department');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Target className="w-8 h-8 text-primary" />
            Goals & KPIs
          </h1>
          <p className="text-muted-foreground mt-1">
            {isManager && !isHROrLDOrExec && 'Track your team performance and progress'}
            {isHROrLDOrExec && 'Strategic goals and organizational performance metrics'}
            {!isManager && !isHROrLDOrExec && 'Track goals and key performance indicators'}
          </p>
        </div>
        {canCreateGoals && (
          <Button onClick={() => { setEditingGoal(null); setIsGoalModalOpen(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            New Goal
          </Button>
        )}
      </div>

      <Tabs defaultValue={isManager ? "team" : "org"} className="space-y-6">
        <TabsList>
          {(isManager || isHROrLDOrExec) && <TabsTrigger value="team">Team Goals</TabsTrigger>}
          <TabsTrigger value="org">Organization</TabsTrigger>
          <TabsTrigger value="kpis">KPI Dashboard</TabsTrigger>
        </TabsList>

        {/* Team Goals Tab */}
        {(isManager || isHROrLDOrExec) && (
          <TabsContent value="team" className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Team Goals</h3>
                {teamGoals.length > 0 && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <TrendingUp className="w-4 h-4" />
                    {teamGoals.filter(g => g.status === 'on_track').length} on track
                  </div>
                )}
              </div>
              
              {teamGoals.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center text-muted-foreground">
                    <Target className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No team goals yet</p>
                    {canCreateGoals && (
                      <Button 
                        variant="outline" 
                        className="mt-4"
                        onClick={() => { setEditingGoal(null); setIsGoalModalOpen(true); }}
                      >
                        Create a team goal
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {teamGoals.map(goal => (
                    <GoalCard 
                      key={goal.id} 
                      goal={goal}
                      onEdit={() => {
                        if (canCreateGoals) {
                          setEditingGoal(goal);
                          setIsGoalModalOpen(true);
                        }
                      }}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Team KPIs Summary */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Team Performance Snapshot</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground">Average Team Load</p>
                    <p className="text-3xl font-bold mt-2">
                      {Math.round(signals.filter(s => s.signal_type === 'capacity').slice(-7).reduce((acc, s) => acc + s.value, 0) / 7) || 0}%
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground">Team Friction Index</p>
                    <p className="text-3xl font-bold mt-2">
                      {Math.round(signals.filter(s => s.signal_type === 'friction').slice(-7).reduce((acc, s) => acc + s.value, 0) / 7) || 0}%
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground">On-Time Completion</p>
                    <p className="text-3xl font-bold mt-2">
                      {tasks.filter(t => t.status === 'done').length > 0 
                        ? Math.round((tasks.filter(t => t.status === 'done' && (!t.due_date || new Date(t.completed_at) <= new Date(t.due_date))).length / tasks.filter(t => t.status === 'done').length) * 100)
                        : 100}%
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        )}

        {/* Organization Goals Tab */}
        <TabsContent value="org" className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">
              {isHROrLDOrExec ? 'Strategic Goals' : 'Organization Goals'}
            </h3>
            
            {orgGoals.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center text-muted-foreground">
                  <Target className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No organizational goals visible</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {orgGoals.map(goal => (
                  <GoalCard 
                    key={goal.id} 
                    goal={goal}
                    onEdit={() => {
                      if (canCreateGoals) {
                        setEditingGoal(goal);
                        setIsGoalModalOpen(true);
                      }
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Org-wide insights for leadership */}
          {isHROrLDOrExec && (
            <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Progress Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">On Track</p>
                    <p className="text-2xl font-bold text-green-500">
                      {orgGoals.filter(g => g.status === 'on_track').length}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">At Risk</p>
                    <p className="text-2xl font-bold text-orange-500">
                      {orgGoals.filter(g => g.status === 'at_risk').length}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Achieved</p>
                    <p className="text-2xl font-bold text-emerald-500">
                      {goals.filter(g => g.status === 'achieved').length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* KPI Dashboard Tab */}
        <TabsContent value="kpis" className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Key Performance Indicators</h3>
            {visibleKPIs.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center text-muted-foreground">
                  <p>No KPIs configured yet</p>
                  {isHROrLDOrExec && (
                    <p className="text-sm mt-2">Configure KPIs in Admin → Goals & KPIs</p>
                  )}
                </CardContent>
              </Card>
            ) : (
              <KPIDashboard 
                kpis={visibleKPIs}
                signals={signals}
                tasks={tasks}
                learningProgress={learningProgress}
              />
            )}
          </div>

          {/* KPI Categories */}
          {visibleKPIs.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">People KPIs</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">
                    {visibleKPIs.filter(k => k.category === 'people').length}
                  </p>
                  <p className="text-xs text-muted-foreground">Active metrics</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Workload KPIs</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">
                    {visibleKPIs.filter(k => k.category === 'workload').length}
                  </p>
                  <p className="text-xs text-muted-foreground">Active metrics</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Learning KPIs</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">
                    {visibleKPIs.filter(k => k.category === 'learning').length}
                  </p>
                  <p className="text-xs text-muted-foreground">Active metrics</p>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Goal Modal */}
      {canCreateGoals && (
        <GoalModal
          open={isGoalModalOpen}
          goal={editingGoal}
          onClose={() => { setIsGoalModalOpen(false); setEditingGoal(null); }}
          onSave={handleSaveGoal}
          saving={savingGoal}
          learningModules={learningModules}
        />
      )}
    </div>
  );
}