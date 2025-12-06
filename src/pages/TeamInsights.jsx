import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle2, 
  Users, 
  Loader2,
  Sparkles,
  Target,
  Zap,
  Calendar,
  BarChart3
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  AreaChart,
  Area,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { base44 } from '@/api/base44Client';
import { useNoi } from '@/components/core/NoiContext';
import { calculateUserLoad, calculateUserFriction, hasUserData } from '@/components/teams/teamMetrics';

export default function TeamInsightsPage() {
  const { user, isManager, isAdmin, tasks, meetings, consent } = useNoi();
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [teamData, setTeamData] = useState(null);
  const [aiInsights, setAIInsights] = useState(null);
  const [historicalData, setHistoricalData] = useState([]);
  const [workEvents, setWorkEvents] = useState([]);

  const canAccess = isManager || isAdmin;

  useEffect(() => {
    if (canAccess) {
      fetchTeamData();
    }
  }, [canAccess]);

  const fetchTeamData = async () => {
    setLoading(true);
    try {
      const [usersData, signalsData, eventsData, nudgesData, consentData] = await Promise.all([
        base44.entities.User.list(),
        base44.entities.Signal.list({ sort: { timestamp: -1 }, limit: 200 }),
        base44.entities.WorkEvent.list({ sort: { created_date: -1 }, limit: 200 }),
        base44.entities.Nudge.list({ sort: { created_date: -1 }, limit: 100 }),
        base44.entities.ConsentPreference.list()
      ]);

      // Calculate team metrics
      const members = (usersData || []).map(u => ({
        ...u,
        load: calculateUserLoad(u.id, tasks, meetings),
        friction: calculateUserFriction(u.id, tasks, meetings),
        hasData: hasUserData(u.id, tasks, meetings, consentData)
      })).filter(m => m.hasData);

      setTeamData({
        members,
        avgLoad: members.length > 0 ? Math.round(members.reduce((acc, m) => acc + m.load, 0) / members.length) : 0,
        highFrictionCount: members.filter(m => m.friction === 'high').length,
        overloadedCount: members.filter(m => m.load > 80).length
      });

      setWorkEvents(eventsData || []);
      
      // Generate historical trend data (last 14 days)
      const days = 14;
      const trends = [];
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        
        const daySignals = (signalsData || []).filter(s => {
          const sigDate = new Date(s.timestamp);
          return sigDate.toDateString() === date.toDateString();
        });

        const dayEvents = (eventsData || []).filter(e => {
          const eDate = new Date(e.created_date);
          return eDate.toDateString() === date.toDateString();
        });

        trends.push({
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          avgCapacity: daySignals.filter(s => s.signal_type === 'capacity').reduce((acc, s) => acc + s.value, 0) / Math.max(daySignals.filter(s => s.signal_type === 'capacity').length, 1) || 0,
          avgFriction: daySignals.filter(s => s.signal_type === 'friction').reduce((acc, s) => acc + s.value, 0) / Math.max(daySignals.filter(s => s.signal_type === 'friction').length, 1) || 0,
          tasksCompleted: dayEvents.filter(e => e.event_type === 'task_completed').length,
          tasksDeferred: dayEvents.filter(e => e.event_type === 'task_deferred').length,
          meetingHours: dayEvents.filter(e => e.event_type === 'meeting_completed').reduce((acc, e) => acc + (e.metadata?.duration_minutes || 0), 0) / 60
        });
      }

      setHistoricalData(trends);

    } catch (error) {
      console.error('Error fetching team data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateAIInsights = async () => {
    setAnalyzing(true);
    try {
      // Prepare comprehensive team context for AI
      const context = {
        teamSize: teamData.members.length,
        avgLoad: teamData.avgLoad,
        highFrictionCount: teamData.highFrictionCount,
        overloadedCount: teamData.overloadedCount,
        trends: {
          capacityTrend: historicalData.slice(-7).map(d => d.avgCapacity),
          frictionTrend: historicalData.slice(-7).map(d => d.avgFriction),
          completionRate: historicalData.slice(-7).reduce((acc, d) => acc + d.tasksCompleted, 0),
          deferralRate: historicalData.slice(-7).reduce((acc, d) => acc + d.tasksDeferred, 0),
          meetingLoad: historicalData.slice(-7).reduce((acc, d) => acc + d.meetingHours, 0)
        },
        recentEvents: {
          totalTasksCompleted: workEvents.filter(e => e.event_type === 'task_completed').length,
          totalTasksDeferred: workEvents.filter(e => e.event_type === 'task_deferred').length,
          nudgesAccepted: workEvents.filter(e => e.event_type === 'nudge_accepted').length,
          nudgesDismissed: workEvents.filter(e => e.event_type === 'nudge_dismissed').length
        }
      };

      const aiResponse = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an expert organizational psychologist and data analyst. Analyze this team's performance data and provide actionable insights.

Team Overview:
- Team size: ${context.teamSize} members (with data consent)
- Average cognitive load: ${context.avgLoad}%
- High friction members: ${context.highFrictionCount}
- Overloaded members: ${context.overloadedCount}

7-Day Trends:
- Capacity trend: ${context.trends.capacityTrend.join(', ')}
- Friction trend: ${context.trends.frictionTrend.join(', ')}
- Tasks completed: ${context.trends.completionRate}
- Tasks deferred: ${context.trends.deferralRate}
- Meeting hours: ${Math.round(context.trends.meetingLoad)}h

Recent Activity:
- Tasks completed: ${context.recentEvents.totalTasksCompleted}
- Tasks deferred: ${context.recentEvents.totalTasksDeferred}
- Nudges accepted: ${context.recentEvents.nudgesAccepted}
- Nudges dismissed: ${context.recentEvents.nudgesDismissed}

Provide:
1. Overall team health assessment (healthy, strained, critical)
2. 3 key trends (improving/declining patterns)
3. 2-3 predicted bottlenecks in the next 7 days
4. 2 high-performing areas to celebrate
5. 3 specific team-level interventions with expected impact

Be data-driven, specific, and actionable. Focus on what the manager can actually do.`,
        response_json_schema: {
          type: "object",
          properties: {
            health_status: {
              type: "string",
              enum: ["healthy", "strained", "critical"]
            },
            health_summary: { type: "string" },
            trends: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  metric: { type: "string" },
                  direction: { type: "string", enum: ["improving", "declining", "stable"] },
                  insight: { type: "string" }
                }
              }
            },
            predicted_bottlenecks: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  area: { type: "string" },
                  likelihood: { type: "string", enum: ["high", "medium", "low"] },
                  impact: { type: "string" },
                  prevention: { type: "string" }
                }
              }
            },
            high_performers: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  area: { type: "string" },
                  evidence: { type: "string" }
                }
              }
            },
            interventions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  action: { type: "string" },
                  rationale: { type: "string" },
                  expected_impact: { type: "string" },
                  timeframe: { type: "string" }
                }
              }
            }
          }
        }
      });

      setAIInsights(aiResponse);
    } catch (error) {
      console.error('Error generating AI insights:', error);
    } finally {
      setAnalyzing(false);
    }
  };

  if (!canAccess) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Team Insights</h1>
        <Alert>
          <AlertDescription>
            Team insights are available to managers and admins only.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const healthColors = {
    healthy: 'text-green-500 bg-green-500/10 border-green-500/20',
    strained: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20',
    critical: 'text-red-500 bg-red-500/10 border-red-500/20'
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Team Insights</h1>
          <p className="text-sm md:text-base text-muted-foreground">AI-driven performance analysis and predictions</p>
        </div>
        <Button 
          onClick={generateAIInsights} 
          disabled={analyzing}
          className="gap-2 bg-primary"
        >
          {analyzing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          {analyzing ? 'Analyzing...' : 'Generate AI Insights'}
        </Button>
      </div>

      {/* Privacy Notice */}
      <Alert className="border-blue-500/50 bg-blue-500/10">
        <AlertDescription className="text-blue-200">
          Insights are based on aggregated, anonymized data from team members who have consented to share team metrics.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trends">Performance Trends</TabsTrigger>
          <TabsTrigger value="predictions">Predictions & Risks</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* AI Health Assessment */}
          {aiInsights && (
            <Card className={`border-2 ${healthColors[aiInsights.health_status]}`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Team Health Assessment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Badge className={`text-lg px-4 py-1 capitalize ${healthColors[aiInsights.health_status]}`}>
                    {aiInsights.health_status}
                  </Badge>
                  <p className="text-sm text-muted-foreground">{aiInsights.health_summary}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Key Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Team Members</p>
                    <div className="text-3xl font-bold">{teamData.members.length}</div>
                  </div>
                  <Users className="w-8 h-8 text-primary/20" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Avg Load</p>
                    <div className={`text-3xl font-bold ${
                      teamData.avgLoad > 70 ? 'text-orange-500' : 
                      teamData.avgLoad > 50 ? 'text-yellow-500' : 'text-green-500'
                    }`}>
                      {teamData.avgLoad}%
                    </div>
                  </div>
                  <BarChart3 className="w-8 h-8 text-primary/20" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">High Friction</p>
                    <div className={`text-3xl font-bold ${
                      teamData.highFrictionCount > 0 ? 'text-red-500' : 'text-green-500'
                    }`}>
                      {teamData.highFrictionCount}
                    </div>
                  </div>
                  <Zap className="w-8 h-8 text-primary/20" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Overloaded</p>
                    <div className={`text-3xl font-bold ${
                      teamData.overloadedCount > 0 ? 'text-red-500' : 'text-green-500'
                    }`}>
                      {teamData.overloadedCount}
                    </div>
                  </div>
                  <AlertTriangle className="w-8 h-8 text-primary/20" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* High Performers */}
          {aiInsights?.high_performers && (
            <Card className="bg-green-500/5 border-green-500/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-500">
                  <CheckCircle2 className="w-5 h-5" />
                  High-Performing Areas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {aiInsights.high_performers.map((performer, idx) => (
                  <div key={idx} className="p-3 bg-background/50 rounded-lg">
                    <p className="font-medium">{performer.area}</p>
                    <p className="text-sm text-muted-foreground mt-1">{performer.evidence}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Suggested Interventions */}
          {aiInsights?.interventions && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Recommended Team Interventions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {aiInsights.interventions.map((intervention, idx) => (
                  <div key={idx} className="p-4 bg-accent/30 rounded-xl space-y-2">
                    <div className="flex items-start justify-between">
                      <h4 className="font-semibold">{intervention.action}</h4>
                      <Badge variant="outline">{intervention.timeframe}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{intervention.rationale}</p>
                    <p className="text-sm text-primary font-medium">Expected: {intervention.expected_impact}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          {/* Key Trends */}
          {aiInsights?.trends && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {aiInsights.trends.map((trend, idx) => (
                <Card key={idx}>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      {trend.direction === 'improving' ? (
                        <TrendingUp className="w-4 h-4 text-green-500" />
                      ) : trend.direction === 'declining' ? (
                        <TrendingDown className="w-4 h-4 text-red-500" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border-2 border-yellow-500" />
                      )}
                      {trend.metric}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{trend.insight}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Capacity & Friction Trend */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base md:text-lg">14-Day Team Load & Friction Trend</CardTitle>
            </CardHeader>
            <CardContent className="h-64 md:h-80 overflow-x-auto">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={historicalData}>
                  <defs>
                    <linearGradient id="colorCapacity" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorFriction" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                  <XAxis dataKey="date" stroke="#666" fontSize={12} />
                  <YAxis stroke="#666" fontSize={12} />
                  <Tooltip contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', borderRadius: '8px' }} />
                  <Legend />
                  <Area type="monotone" dataKey="avgCapacity" stroke="#3b82f6" fillOpacity={1} fill="url(#colorCapacity)" name="Avg Capacity" />
                  <Area type="monotone" dataKey="avgFriction" stroke="#f59e0b" fillOpacity={1} fill="url(#colorFriction)" name="Avg Friction" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Task Completion vs Deferral */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base md:text-lg">Task Completion vs Deferral</CardTitle>
            </CardHeader>
            <CardContent className="h-64 md:h-80 overflow-x-auto">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={historicalData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                  <XAxis dataKey="date" stroke="#666" fontSize={12} />
                  <YAxis stroke="#666" fontSize={12} />
                  <Tooltip contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', borderRadius: '8px' }} />
                  <Legend />
                  <Bar dataKey="tasksCompleted" fill="#22c55e" name="Completed" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="tasksDeferred" fill="#ef4444" name="Deferred" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Meeting Hours */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base md:text-lg">Daily Meeting Hours</CardTitle>
            </CardHeader>
            <CardContent className="h-56 md:h-64 overflow-x-auto">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={historicalData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                  <XAxis dataKey="date" stroke="#666" fontSize={12} />
                  <YAxis stroke="#666" fontSize={12} />
                  <Tooltip contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', borderRadius: '8px' }} />
                  <Line type="monotone" dataKey="meetingHours" stroke="#8b5cf6" strokeWidth={2} dot={{ fill: '#8b5cf6' }} name="Meeting Hours" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="predictions" className="space-y-6">
          {aiInsights?.predicted_bottlenecks ? (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Predicted Bottlenecks (Next 7 Days)</h3>
              {aiInsights.predicted_bottlenecks.map((bottleneck, idx) => (
                <Card key={idx} className={`border-l-4 ${
                  bottleneck.likelihood === 'high' ? 'border-l-red-500 bg-red-500/5' :
                  bottleneck.likelihood === 'medium' ? 'border-l-yellow-500 bg-yellow-500/5' :
                  'border-l-blue-500 bg-blue-500/5'
                }`}>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <AlertTriangle className={`w-5 h-5 ${
                        bottleneck.likelihood === 'high' ? 'text-red-500' :
                        bottleneck.likelihood === 'medium' ? 'text-yellow-500' :
                        'text-blue-500'
                      }`} />
                      {bottleneck.area}
                      <Badge variant="outline" className="ml-auto capitalize">{bottleneck.likelihood} likelihood</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div>
                      <p className="text-sm font-medium">Impact:</p>
                      <p className="text-sm text-muted-foreground">{bottleneck.impact}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-green-500">Prevention:</p>
                      <p className="text-sm text-muted-foreground">{bottleneck.prevention}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Alert>
              <AlertDescription>
                Generate AI insights to see predicted bottlenecks and risk areas.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}