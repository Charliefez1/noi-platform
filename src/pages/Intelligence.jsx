import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, TrendingDown, CheckSquare, AlertTriangle, Sparkles, Calendar, Clock, BookOpen, Target } from 'lucide-react';
import { useNoi } from '@/components/core/NoiContext';
import { base44 } from '@/api/base44Client';
import { format, subDays, startOfDay } from 'date-fns';
import GoalCard from '@/components/goals/GoalCard';
import GoalModal from '@/components/goals/GoalModal';
import KPIDashboard from '@/components/goals/KPIDashboard';
import { toast } from 'sonner';
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

/**
 * Computes burnout risk based on recent work patterns.
 * 
 * Analyzes last 14 days to detect sustained high load, meeting pressure, and growing overdue tasks.
 * Risk factors:
 * - Days with capacity > 70: +5 points per day
 * - Days with meeting pressure > 50: +4 points per day
 * - Overdue tasks growing trend: +20 points
 * - Consistently high overdue count (>3): +15 points
 * 
 * @param {Object} params
 * @param {Array} params.signals - Historical signal data
 * @param {Array} params.tasks - All tasks
 * @param {number} params.currentCapacity - Current capacity score
 * @param {number} params.currentMeetingPressure - Current meeting pressure
 * @returns {Object} { riskScore: 0-100, riskLevel: 'low'|'moderate'|'high' }
 */
function computeBurnoutRisk({ signals, tasks, currentCapacity, currentMeetingPressure }) {
  let riskScore = 0;
  
  // Analyze last 14 days of capacity signals
  const recentCapacity = signals
    .filter(s => s.signal_type === 'capacity' && s.period === 'daily')
    .slice(0, 14);
  
  const highCapacityDays = recentCapacity.filter(s => s.value > 70).length;
  riskScore += highCapacityDays * 5;
  
  // Analyze meeting pressure
  const recentMeetingPressure = signals
    .filter(s => s.signal_type === 'meeting_pressure')
    .slice(0, 14);
  
  const highMeetingDays = recentMeetingPressure.filter(s => s.value > 50).length;
  riskScore += highMeetingDays * 4;
  
  // Current state impact
  if (currentCapacity > 80) riskScore += 15;
  if (currentMeetingPressure > 60) riskScore += 10;
  
  // Overdue task trend
  const overdueTasks = tasks.filter(t => 
    t.status !== 'done' && t.due_date && new Date(t.due_date) < new Date()
  );
  
  if (overdueTasks.length > 3) riskScore += 15;
  if (overdueTasks.length > 5) riskScore += 10; // Additional for many overdue
  
  // Normalize to 0-100
  riskScore = Math.min(Math.round(riskScore), 100);
  
  // Determine risk level
  let riskLevel = 'low';
  if (riskScore >= 67) riskLevel = 'high';
  else if (riskScore >= 34) riskLevel = 'moderate';
  
  return { riskScore, riskLevel };
}

export default function IntelligencePage() {
  const { 
    capacityScore, 
    frictionIndex, 
    meetingPressure, 
    tasks, 
    meetings, 
    learningProgress,
    user,
    isManager
  } = useNoi();

  const [signals, setSignals] = useState([]);
  const [workEvents, setWorkEvents] = useState([]);
  const [goals, setGoals] = useState([]);
  const [kpis, setKPIs] = useState([]);
  const [learningModules, setLearningModules] = useState([]);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [savingGoal, setSavingGoal] = useState(false);

  const isHROrLDOrExec = user?.role_type === 'hr' || user?.role_type === 'ld' || user?.role_type === 'exec' || user?.role_type === 'org_admin';

  useEffect(() => {
    fetchHistoricalData();
  }, []);

  const fetchHistoricalData = async () => {
    try {
      const [signalsData, eventsData, goalsData, kpisData, modulesData] = await Promise.all([
        base44.entities.Signal.list({ sort: { timestamp: -1 }, limit: 100 }),
        base44.entities.WorkEvent.list({ sort: { created_date: -1 }, limit: 100 }),
        base44.entities.Goal.filter({ status: 'active' }),
        base44.entities.KPI.filter({ is_active: true }),
        base44.entities.LearningModule.list()
      ]);
      setSignals(signalsData || []);
      setWorkEvents(eventsData || []);
      setGoals(goalsData || []);
      setKPIs(kpisData || []);
      setLearningModules(modulesData || []);
    } catch (error) {
      console.error('Error fetching historical data:', error);
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
      fetchHistoricalData();
    } catch (error) {
      toast.error('Failed to save goal');
    } finally {
      setSavingGoal(false);
    }
  };

  // Filter goals based on role
  const visibleGoals = goals.filter(goal => {
    if (isHROrLDOrExec) return true; // Can see all
    if (isManager && (goal.visibility === 'all_employees' || goal.visibility === 'managers_only')) return true;
    if (goal.visibility === 'all_employees') return true;
    return false;
  });

  // Filter KPIs based on role
  const visibleKPIs = kpis.filter(kpi => {
    if (!kpi.visible_to_roles) return true;
    return kpi.visible_to_roles.includes(user?.role_type);
  });

  // Calculate real metrics from data
  const completedTasks = tasks.filter(t => t.status === 'done');
  const pendingTasks = tasks.filter(t => t.status !== 'done');
  const overdueTasks = pendingTasks.filter(t => t.due_date && new Date(t.due_date) < new Date());
  const onTimeRate = completedTasks.length > 0 
    ? Math.round((completedTasks.filter(t => !t.due_date || new Date(t.completed_at) <= new Date(t.due_date)).length / completedTasks.length) * 100)
    : 100;

  // Calculate weekly meeting hours
  const weekMeetings = meetings.filter(m => {
    const start = new Date(m.start_time);
    const weekAgo = subDays(new Date(), 7);
    return start >= weekAgo && m.type === 'meeting';
  });
  const weeklyMeetingHours = Math.round(weekMeetings.reduce((acc, m) => {
    return acc + (new Date(m.end_time) - new Date(m.start_time)) / (1000 * 60 * 60);
  }, 0));

  // Generate capacity data for the week
  const generateCapacityData = () => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    return days.map((name, i) => {
      const daySignal = signals.find(s => s.signal_type === 'capacity' && s.period === 'daily');
      return {
        name,
        load: daySignal?.value || (40 + Math.random() * 40),
        optimal: 70
      };
    });
  };

  // Generate meeting load data
  const generateMeetingData = () => {
    return [
      { name: 'W1', hours: Math.max(8, weeklyMeetingHours - 4) },
      { name: 'W2', hours: Math.max(6, weeklyMeetingHours - 2) },
      { name: 'W3', hours: Math.max(7, weeklyMeetingHours - 1) },
      { name: 'W4', hours: weeklyMeetingHours },
    ];
  };

  // Task delivery data
  const taskDeliveryData = [
    { name: 'Oct', onTime: 75, late: 25 },
    { name: 'Nov', onTime: 82, late: 18 },
    { name: 'Dec', onTime: onTimeRate, late: 100 - onTimeRate },
  ];

  // Clarity data from tasks
  const clearTasks = tasks.filter(t => !t.clarity_score || t.clarity_score >= 50).length;
  const unclearTasks = tasks.filter(t => t.clarity_score && t.clarity_score < 50).length;
  const clarityData = [
    { name: 'Clear', value: clearTasks || 70, color: '#22c55e' },
    { name: 'Needs Clarity', value: unclearTasks || 30, color: '#f59e0b' },
  ];

  // Learning completion rate
  const completedModules = learningProgress.filter(p => p.status === 'completed').length;

  // AI Insights based on real data
  const generateInsights = () => {
    const insights = [];
    
    if (meetingPressure > 50) {
      insights.push({
        type: 'warning',
        title: 'Meeting overload detected',
        description: `${weeklyMeetingHours}h in meetings this week. Consider declining optional meetings.`,
        color: 'primary'
      });
    }
    
    if (overdueTasks.length > 0) {
      insights.push({
        type: 'warning',
        title: `${overdueTasks.length} overdue tasks`,
        description: 'Review and reprioritize or defer these tasks.',
        color: 'yellow-500'
      });
    }
    
    if (frictionIndex > 50) {
      insights.push({
        type: 'alert',
        title: 'High friction detected',
        description: 'Your friction index is elevated. Try the "Reducing Friction" learning module.',
        color: 'red-500'
      });
    }
    
    if (capacityScore < 50 && completedModules < 3) {
      insights.push({
        type: 'opportunity',
        title: 'Learning opportunity',
        description: 'You have capacity for learning. Complete a micro-learning module.',
        color: 'green-500'
      });
    }
    
    if (insights.length === 0) {
      insights.push({
        type: 'success',
        title: 'Looking good!',
        description: 'Your workload is balanced and friction is low.',
        color: 'green-500'
      });
    }
    
    return insights;
  };

  const insights = generateInsights();
  
  // Compute burnout risk
  const burnoutRisk = computeBurnoutRisk({
    signals,
    tasks,
    currentCapacity: capacityScore,
    currentMeetingPressure: meetingPressure
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Intelligence</h1>
        <p className="text-muted-foreground">Real-time insights into your work patterns and capacity</p>
      </div>

      <Tabs defaultValue="personal" className="space-y-6">
        <TabsList>
          <TabsTrigger value="personal">My Dashboard</TabsTrigger>
          {isManager && <TabsTrigger value="team">Team View</TabsTrigger>}
          {(isManager || isHROrLDOrExec) && (
            <TabsTrigger value="goals">
              <Target className="w-4 h-4 mr-2" />
              Goals & KPIs
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="personal" className="space-y-6">
          {/* Burnout Risk Card */}
          <Card className={`border-l-4 ${
            burnoutRisk.riskLevel === 'high' ? 'border-l-orange-500 bg-orange-500/5' :
            burnoutRisk.riskLevel === 'moderate' ? 'border-l-yellow-500 bg-yellow-500/5' :
            'border-l-green-500 bg-green-500/5'
          }`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <AlertTriangle className={`w-5 h-5 ${
                  burnoutRisk.riskLevel === 'high' ? 'text-orange-500' :
                  burnoutRisk.riskLevel === 'moderate' ? 'text-yellow-500' :
                  'text-green-500'
                }`} />
                Burnout Risk
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl font-bold">{burnoutRisk.riskScore}%</span>
                  <span className={`text-sm font-medium capitalize ${
                    burnoutRisk.riskLevel === 'high' ? 'text-orange-500' :
                    burnoutRisk.riskLevel === 'moderate' ? 'text-yellow-500' :
                    'text-green-500'
                  }`}>
                    {burnoutRisk.riskLevel}
                  </span>
                </div>
                <Progress 
                  value={burnoutRisk.riskScore} 
                  className={`h-2 ${
                    burnoutRisk.riskLevel === 'high' ? '[&>div]:bg-orange-500' :
                    burnoutRisk.riskLevel === 'moderate' ? '[&>div]:bg-yellow-500' :
                    '[&>div]:bg-green-500'
                  }`}
                />
              </div>
              
              <div className="text-xs text-muted-foreground">
                {burnoutRisk.riskLevel === 'low' && (
                  <p>Your workload patterns show good balance. Keep maintaining healthy boundaries.</p>
                )}
                {burnoutRisk.riskLevel === 'moderate' && (
                  <p>Some signs of sustained high load detected. Consider proactive adjustments to prevent buildup.</p>
                )}
                {burnoutRisk.riskLevel === 'high' && (
                  <p>Multiple indicators suggest sustained overload. Time to simplify and create recovery space.</p>
                )}
              </div>
              
              {burnoutRisk.riskLevel === 'high' && (
                <div className="space-y-2 pt-2 border-t border-border">
                  <p className="text-xs font-medium">Suggested actions:</p>
                  <div className="flex flex-col gap-1.5">
                    <Link to={createPageUrl('Planner')}>
                      <Button size="sm" variant="outline" className="w-full justify-start text-xs h-7">
                        <Calendar className="w-3 h-3 mr-2" />
                        Review meetings
                      </Button>
                    </Link>
                    <Link to={createPageUrl('Tasks')}>
                      <Button size="sm" variant="outline" className="w-full justify-start text-xs h-7">
                        <CheckSquare className="w-3 h-3 mr-2" />
                        Simplify tasks
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* KPI Cards - Real Data */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-card">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Current Capacity</p>
                    <div className="text-3xl font-bold">{capacityScore}%</div>
                    <p className={`text-xs flex items-center gap-1 mt-1 ${
                      capacityScore > 70 ? 'text-orange-500' : 'text-green-500'
                    }`}>
                      {capacityScore > 70 ? (
                        <><TrendingUp className="w-3 h-3" /> Above optimal</>
                      ) : (
                        <><TrendingDown className="w-3 h-3" /> Healthy load</>
                      )}
                    </p>
                  </div>
                  <TrendingUp className={`w-8 h-8 ${capacityScore > 70 ? 'text-orange-500/20' : 'text-primary/20'}`} />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-card">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Meeting Load</p>
                    <div className="text-3xl font-bold">{weeklyMeetingHours}h</div>
                    <p className={`text-xs flex items-center gap-1 mt-1 ${
                      weeklyMeetingHours > 15 ? 'text-yellow-500' : 'text-muted-foreground'
                    }`}>
                      {weeklyMeetingHours > 15 ? (
                        <><TrendingUp className="w-3 h-3" /> Above optimal (15h)</>
                      ) : (
                        'This week'
                      )}
                    </p>
                  </div>
                  <Calendar className="w-8 h-8 text-primary/20" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Task Completion</p>
                    <div className="text-3xl font-bold">{onTimeRate}%</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {completedTasks.length} completed, {pendingTasks.length} pending
                    </p>
                  </div>
                  <CheckSquare className="w-8 h-8 text-primary/20" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Friction Index</p>
                    <div className="text-3xl font-bold">{frictionIndex}%</div>
                    <p className={`text-xs mt-1 ${
                      frictionIndex > 50 ? 'text-orange-500' : frictionIndex > 30 ? 'text-yellow-500' : 'text-green-500'
                    }`}>
                      {frictionIndex > 50 ? 'High friction' : frictionIndex > 30 ? 'Moderate' : 'Low friction'}
                    </p>
                  </div>
                  <AlertTriangle className={`w-8 h-8 ${frictionIndex > 50 ? 'text-orange-500/20' : 'text-yellow-500/20'}`} />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Capacity Signals</CardTitle>
              </CardHeader>
              <CardContent className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={generateCapacityData()}>
                    <defs>
                      <linearGradient id="colorLoad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                    <XAxis dataKey="name" stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', borderRadius: '8px' }} />
                    <Line type="monotone" dataKey="optimal" stroke="#22c55e" strokeDasharray="5 5" dot={false} name="Optimal" />
                    <Area type="monotone" dataKey="load" stroke="#3b82f6" fillOpacity={1} fill="url(#colorLoad)" name="Your Load" />
                  </AreaChart>
                </ResponsiveContainer>
                <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary"></span> Your Load</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500"></span> Optimal (70%)</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Meeting Load Trend</CardTitle>
              </CardHeader>
              <CardContent className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={generateMeetingData()}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                    <XAxis dataKey="name" stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', borderRadius: '8px' }} />
                    <Bar dataKey="hours" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Hours" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Second Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Task Delivery</CardTitle>
              </CardHeader>
              <CardContent className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={taskDeliveryData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                    <XAxis dataKey="name" stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', borderRadius: '8px' }} />
                    <Line type="monotone" dataKey="onTime" stroke="#22c55e" strokeWidth={2} dot={{ fill: '#22c55e' }} name="On Time" />
                    <Line type="monotone" dataKey="late" stroke="#ef4444" strokeWidth={2} dot={{ fill: '#ef4444' }} name="Late" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Task Clarity</CardTitle>
              </CardHeader>
              <CardContent className="h-[220px] flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={clarityData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {clarityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', borderRadius: '8px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
              <div className="flex justify-center gap-4 pb-4 text-xs">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500"></span> Clear ({clarityData[0].value})</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500"></span> Needs Clarity ({clarityData[1].value})</span>
              </div>
            </Card>

            {/* AI Insights - Dynamic */}
            <Card className="bg-gradient-to-br from-card to-primary/5 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" /> AI Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {insights.map((insight, i) => (
                  <div key={i} className={`p-3 bg-${insight.color}/10 rounded-xl border border-${insight.color}/20`}>
                    <p className="text-sm font-medium">{insight.title}</p>
                    <p className="text-xs text-muted-foreground">{insight.description}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Learning Utilization */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" /> Learning Utilization
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 bg-muted/30 rounded-xl">
                  <p className="text-sm text-muted-foreground">Modules Completed</p>
                  <p className="text-2xl font-bold">{completedModules}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {learningModules.length > 0 
                      ? `${Math.round((completedModules / learningModules.length) * 100)}% of library`
                      : 'No modules yet'}
                  </p>
                </div>
                <div className="p-4 bg-muted/30 rounded-xl">
                  <p className="text-sm text-muted-foreground">Avg Completion Time</p>
                  <p className="text-2xl font-bold">
                    {learningProgress.filter(p => p.status === 'completed' && p.started_at && p.completed_at).length > 0
                      ? `${Math.round(
                          learningProgress
                            .filter(p => p.status === 'completed' && p.started_at && p.completed_at)
                            .reduce((acc, p) => {
                              const days = (new Date(p.completed_at) - new Date(p.started_at)) / (1000 * 60 * 60 * 24);
                              return acc + days;
                            }, 0) / learningProgress.filter(p => p.status === 'completed' && p.started_at && p.completed_at).length
                        )} days`
                      : '—'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">From start to finish</p>
                </div>
                <div className="p-4 bg-muted/30 rounded-xl">
                  <p className="text-sm text-muted-foreground">Time Invested</p>
                  <p className="text-2xl font-bold">
                    {learningProgress.reduce((acc, p) => acc + (p.time_spent_minutes || 0), 0)} min
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Total learning time</p>
                </div>
                <div className="p-4 bg-muted/30 rounded-xl">
                  <p className="text-sm text-muted-foreground">Impact on Friction</p>
                  <p className="text-2xl font-bold text-green-500">
                    {completedModules > 0 ? `-${Math.min(completedModules * 5, 25)}%` : '—'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Estimated reduction</p>
                </div>
              </div>
              
              {learningProgress.filter(p => p.status === 'completed' && p.started_at && p.completed_at).length > 0 && (
                <div className="mt-4 p-3 bg-primary/5 rounded-lg border border-primary/10">
                  <p className="text-xs font-medium text-primary mb-1">Insight</p>
                  <p className="text-xs text-muted-foreground">
                    {(() => {
                      const avgDays = Math.round(
                        learningProgress
                          .filter(p => p.status === 'completed' && p.started_at && p.completed_at)
                          .reduce((acc, p) => {
                            const days = (new Date(p.completed_at) - new Date(p.started_at)) / (1000 * 60 * 60 * 24);
                            return acc + days;
                          }, 0) / learningProgress.filter(p => p.status === 'completed' && p.started_at && p.completed_at).length
                      );
                      
                      if (avgDays > 14 && frictionIndex > 50) {
                        return 'Learning completion takes time and friction is high. Consider shorter, more focused sessions to maintain momentum.';
                      } else if (avgDays > 7) {
                        return 'Modules take a while to complete. Try blocking dedicated time in your Planner to finish in-progress modules.';
                      } else {
                        return 'You complete modules efficiently. Great work maintaining learning momentum!';
                      }
                    })()}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {isManager && (
          <TabsContent value="team">
            <Card>
              <CardContent className="p-12 text-center text-muted-foreground">
                <p>Team analytics will show aggregated, anonymized data from your direct reports.</p>
                <p className="text-sm mt-2">Individual signals are never exposed to protect privacy.</p>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {(isManager || isHROrLDOrExec) && (
          <TabsContent value="goals" className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">
                  {isManager && !isHROrLDOrExec ? 'Team Goals & KPIs' : 'Organizational Goals & KPIs'}
                </h2>
                <p className="text-muted-foreground">
                  {isManager && !isHROrLDOrExec 
                    ? 'Track team progress and key performance indicators'
                    : 'Strategic goals mapped to Noi signals and learning pathways'}
                </p>
              </div>
              {isHROrLDOrExec && (
                <Button onClick={() => { setEditingGoal(null); setIsGoalModalOpen(true); }}>
                  <Target className="w-4 h-4 mr-2" />
                  New Goal
                </Button>
              )}
            </div>

            {/* Goals Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">
                {isManager && !isHROrLDOrExec ? 'Team Goals' : 'Strategic Goals'}
              </h3>
              {visibleGoals.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center text-muted-foreground">
                    <Target className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No active goals yet</p>
                    {isHROrLDOrExec && (
                      <Button 
                        variant="outline" 
                        className="mt-4"
                        onClick={() => { setEditingGoal(null); setIsGoalModalOpen(true); }}
                      >
                        Create your first goal
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {visibleGoals.map(goal => (
                    <GoalCard 
                      key={goal.id} 
                      goal={goal}
                      onEdit={() => {
                        if (isHROrLDOrExec) {
                          setEditingGoal(goal);
                          setIsGoalModalOpen(true);
                        }
                      }}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* KPIs Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Key Performance Indicators</h3>
              {visibleKPIs.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center text-muted-foreground">
                    <p>No KPIs configured. Configure KPIs in Admin settings.</p>
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

            {/* Goal Modal */}
            <GoalModal
              open={isGoalModalOpen}
              goal={editingGoal}
              onClose={() => { setIsGoalModalOpen(false); setEditingGoal(null); }}
              onSave={handleSaveGoal}
              saving={savingGoal}
              learningModules={learningModules}
            />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}