import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PieChart, TrendingUp, Users, AlertCircle, BookOpen } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function SupportInsightsPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState({
    total_cases: 0,
    active_cases: 0,
    common_themes: [],
    friction_signals: [],
    training_gaps: []
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
        
        const isNDG = userData.role_type === 'ndg' || userData.role_type === 'sap';
        const isAdmin = userData.role === 'admin';
        
        if (!isNDG && !isAdmin) {
          setLoading(false);
          return;
        }

        // Fetch aggregated, anonymized insights
        
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch data:', error);
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const isNDG = user?.role_type === 'ndg' || user?.role_type === 'sap';
  const isAdmin = user?.role === 'admin';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isNDG && !isAdmin) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="w-12 h-12 text-muted-foreground mb-3" />
          <p className="text-muted-foreground">Support Insights is only available to NDG and SAP team members</p>
        </CardContent>
      </Card>
    );
  }

  // Mock data for visualization
  const themeData = [
    { name: 'Communication', value: 45 },
    { name: 'Workload', value: 38 },
    { name: 'Sensory', value: 27 },
    { name: 'Role Clarity', value: 22 },
  ];

  const trendData = [
    { month: 'Jan', cases: 12 },
    { month: 'Feb', cases: 15 },
    { month: 'Mar', cases: 18 },
    { month: 'Apr', cases: 14 },
    { month: 'May', cases: 20 },
    { month: 'Jun', cases: 17 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Support Insights</h1>
        <p className="text-muted-foreground">Aggregated, anonymized patterns from support activities</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Users className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{insights.total_cases}</p>
                <p className="text-xs text-muted-foreground">Total Cases</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{insights.active_cases}</p>
                <p className="text-xs text-muted-foreground">Active Cases</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <AlertCircle className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{insights.friction_signals.length}</p>
                <p className="text-xs text-muted-foreground">Friction Signals</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <BookOpen className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{insights.training_gaps.length}</p>
                <p className="text-xs text-muted-foreground">Training Gaps</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Common Themes</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={themeData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis dataKey="name" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Bar dataKey="value" fill="#1c9cf0" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Case Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis dataKey="month" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Line type="monotone" dataKey="cases" stroke="#1c9cf0" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Identified Friction Signals</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {insights.friction_signals.length === 0 ? (
              <p className="text-sm text-muted-foreground">No friction signals identified</p>
            ) : (
              insights.friction_signals.map((signal, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                  <span className="text-sm">{signal}</span>
                  <Badge variant="outline">Pattern</Badge>
                </div>
              ))
            )}
            {/* Mock data */}
            <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
              <span className="text-sm">High cognitive load during sprint planning</span>
              <Badge variant="outline">Pattern</Badge>
            </div>
            <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
              <span className="text-sm">Sensory challenges in open office environments</span>
              <Badge variant="outline">Pattern</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Training & Learning Gaps</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {insights.training_gaps.length === 0 ? (
              <p className="text-sm text-muted-foreground">No training gaps identified</p>
            ) : (
              insights.training_gaps.map((gap, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                  <span className="text-sm">{gap}</span>
                  <Badge variant="outline">Gap</Badge>
                </div>
              ))
            )}
            {/* Mock data */}
            <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
              <span className="text-sm">Manager training on communication preferences</span>
              <Badge variant="outline">Gap</Badge>
            </div>
            <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
              <span className="text-sm">Executive awareness of cognitive load factors</span>
              <Badge variant="outline">Gap</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-amber-500/50 bg-amber-500/5">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm mb-1">Privacy Notice</p>
              <p className="text-xs text-muted-foreground">
                All data shown is aggregated and anonymized. Individual employee information is never displayed in this view. 
                These insights are intended to identify systemic patterns and inform organization-wide improvements.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}