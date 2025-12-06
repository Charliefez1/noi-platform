import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Settings, Shield, Users, Bell, Database, Eye, Save, Loader2, Target, Plus } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useNoi } from '@/components/core/NoiContext';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import ConsentSettings from '@/components/settings/ConsentSettings';

export default function AdminPage() {
  const { user, isAdmin, refreshData } = useNoi();
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    allowManagerView: true,
    anonymizeData: false,
    enableNudges: true,
    enableOverloadAlerts: true,
    dataRetention: '90',
  });
  const [kpis, setKPIs] = useState([]);
  const [newKPI, setNewKPI] = useState({
    name: '',
    category: 'workload',
    metric_type: 'friction_index',
    visible_to_roles: ['manager', 'hr', 'exec'],
    is_active: true
  });

  // User preferences that affect their experience
  const [preferences, setPreferences] = useState({
    interface_mode: 'standard',
    working_hours_start: 9,
    working_hours_end: 17,
    notification_level: 'all',
    consent_analytics: true,
    consent_ai_suggestions: true,
  });

  useEffect(() => {
    if (user?.preferences) {
      setPreferences({
        interface_mode: user.preferences.interface_mode || 'standard',
        working_hours_start: user.preferences.working_hours_start || 9,
        working_hours_end: user.preferences.working_hours_end || 17,
        notification_level: user.preferences.notification_level || 'all',
        consent_analytics: user.preferences.consent_analytics !== false,
        consent_ai_suggestions: user.preferences.consent_ai_suggestions !== false,
      });
    }
    if (isAdmin) {
      fetchKPIs();
    }
  }, [user, isAdmin]);

  const fetchKPIs = async () => {
    try {
      const data = await base44.entities.KPI.list();
      setKPIs(data || []);
    } catch (error) {
      console.error('Error fetching KPIs:', error);
    }
  };

  const handleCreateKPI = async () => {
    if (!newKPI.name) {
      toast.error('Please enter a KPI name');
      return;
    }
    try {
      await base44.entities.KPI.create(newKPI);
      toast.success('KPI created');
      setNewKPI({
        name: '',
        category: 'workload',
        metric_type: 'friction_index',
        visible_to_roles: ['manager', 'hr', 'exec'],
        is_active: true
      });
      fetchKPIs();
    } catch (error) {
      toast.error('Failed to create KPI');
    }
  };

  const handleToggleKPI = async (kpiId, isActive) => {
    try {
      await base44.entities.KPI.update(kpiId, { is_active: !isActive });
      toast.success(isActive ? 'KPI disabled' : 'KPI enabled');
      fetchKPIs();
    } catch (error) {
      toast.error('Failed to update KPI');
    }
  };

  const handleSavePreferences = async () => {
    setSaving(true);
    try {
      await base44.auth.updateMe({
        preferences: preferences
      });
      toast.success('Preferences saved');
      refreshData();
    } catch (error) {
      toast.error('Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Personal preferences and platform configuration</p>
      </div>

      <Tabs defaultValue="preferences" className="w-full">
        <TabsList className="bg-muted/50 p-1 rounded-full mb-6">
          <TabsTrigger value="preferences" className="rounded-full px-6 gap-2">
            <Settings className="w-4 h-4" /> My Preferences
          </TabsTrigger>
          <TabsTrigger value="privacy" className="rounded-full px-6 gap-2">
            <Shield className="w-4 h-4" /> Privacy & Consent
          </TabsTrigger>
          {isAdmin && (
            <>
              <TabsTrigger value="admin" className="rounded-full px-6 gap-2">
                <Users className="w-4 h-4" /> Admin
              </TabsTrigger>
              <TabsTrigger value="goals-config" className="rounded-full px-6 gap-2">
                <Target className="w-4 h-4" /> Goals & KPIs
              </TabsTrigger>
            </>
          )}
        </TabsList>

        {/* Personal Preferences */}
        <TabsContent value="preferences" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" /> Interface Preferences
              </CardTitle>
              <CardDescription>Customize how Noi works for you</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label className="font-medium">Interface Mode</Label>
                <p className="text-sm text-muted-foreground mb-2">Choose your preferred interface complexity</p>
                <div className="flex gap-2">
                  {['standard', 'focus', 'minimal'].map((mode) => (
                    <Button
                      key={mode}
                      variant={preferences.interface_mode === mode ? 'default' : 'outline'}
                      onClick={() => setPreferences({ ...preferences, interface_mode: mode })}
                      className="capitalize"
                    >
                      {mode}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="font-medium">Working Hours Start</Label>
                  <select 
                    className="w-full bg-input border border-border rounded-lg px-3 py-2"
                    value={preferences.working_hours_start}
                    onChange={(e) => setPreferences({ ...preferences, working_hours_start: parseInt(e.target.value) })}
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 6).map(hour => (
                      <option key={hour} value={hour}>{hour}:00 {hour < 12 ? 'AM' : 'PM'}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="font-medium">Working Hours End</Label>
                  <select 
                    className="w-full bg-input border border-border rounded-lg px-3 py-2"
                    value={preferences.working_hours_end}
                    onChange={(e) => setPreferences({ ...preferences, working_hours_end: parseInt(e.target.value) })}
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 12).map(hour => (
                      <option key={hour} value={hour}>{hour > 12 ? hour - 12 : hour}:00 PM</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="font-medium">Notification Level</Label>
                <select 
                  className="w-full bg-input border border-border rounded-lg px-3 py-2"
                  value={preferences.notification_level}
                  onChange={(e) => setPreferences({ ...preferences, notification_level: e.target.value })}
                >
                  <option value="all">All notifications</option>
                  <option value="important">Important only</option>
                  <option value="minimal">Minimal</option>
                  <option value="off">Off</option>
                </select>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleSavePreferences} disabled={saving} className="gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Preferences
            </Button>
          </div>
        </TabsContent>

        {/* Privacy & Consent */}
        <TabsContent value="privacy" className="space-y-6">
          <ConsentSettings />
        </TabsContent>

        {/* Admin Settings (only for admins) */}
        {isAdmin && (
          <TabsContent value="admin" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5" /> Organization Settings
                </CardTitle>
                <CardDescription>Configure platform-wide settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-medium">Enable AI Nudges</Label>
                    <p className="text-sm text-muted-foreground">Allow system to send proactive suggestions to all users</p>
                  </div>
                  <Switch 
                    checked={settings.enableNudges} 
                    onCheckedChange={(v) => setSettings({ ...settings, enableNudges: v })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-medium">Overload Alerts</Label>
                    <p className="text-sm text-muted-foreground">Notify when team members exceed load thresholds</p>
                  </div>
                  <Switch 
                    checked={settings.enableOverloadAlerts}
                    onCheckedChange={(v) => setSettings({ ...settings, enableOverloadAlerts: v })}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5" /> Visibility Rules
                </CardTitle>
                <CardDescription>Control what data managers and admins can see</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-medium">Manager Dashboard Access</Label>
                    <p className="text-sm text-muted-foreground">Allow managers to view team aggregate data</p>
                  </div>
                  <Switch 
                    checked={settings.allowManagerView}
                    onCheckedChange={(v) => setSettings({ ...settings, allowManagerView: v })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-medium">Anonymize Individual Data</Label>
                    <p className="text-sm text-muted-foreground">Show only aggregated, non-identifiable metrics</p>
                  </div>
                  <Switch 
                    checked={settings.anonymizeData}
                    onCheckedChange={(v) => setSettings({ ...settings, anonymizeData: v })}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5" /> Data Retention
                </CardTitle>
                <CardDescription>Configure how long data is stored</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <Label>Retention Period:</Label>
                  <select 
                    className="bg-input border border-border rounded-lg px-3 py-2"
                    value={settings.dataRetention}
                    onChange={(e) => setSettings({ ...settings, dataRetention: e.target.value })}
                  >
                    <option value="30">30 days</option>
                    <option value="90">90 days</option>
                    <option value="180">180 days</option>
                    <option value="365">1 year</option>
                  </select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>Invite and manage users in your organization</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="bg-primary">Invite Users</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" /> Goal & KPI Configuration
                </CardTitle>
                <CardDescription>Manage organizational goals and KPIs (Available in Goals & KPIs tab)</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Configure goals and KPIs in the dedicated "Goals & KPIs" tab to track organizational progress.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Goals & KPI Configuration */}
        {isAdmin && (
          <TabsContent value="goals-config" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" /> KPI Configuration
                </CardTitle>
                <CardDescription>
                  Define which KPIs are tracked and visible to different roles
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Create New KPI */}
                <div className="p-4 border border-dashed border-border rounded-xl space-y-4">
                  <h4 className="font-medium">Create New KPI</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>KPI Name</Label>
                      <Input
                        placeholder="e.g., Team Friction Index"
                        value={newKPI.name}
                        onChange={(e) => setNewKPI({ ...newKPI, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Category</Label>
                      <Select 
                        value={newKPI.category} 
                        onValueChange={(v) => setNewKPI({ ...newKPI, category: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="people">People</SelectItem>
                          <SelectItem value="workload">Workload</SelectItem>
                          <SelectItem value="learning">Learning</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Metric Type</Label>
                      <Select 
                        value={newKPI.metric_type} 
                        onValueChange={(v) => setNewKPI({ ...newKPI, metric_type: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="friction_index">Friction Index</SelectItem>
                          <SelectItem value="capacity_score">Capacity Score</SelectItem>
                          <SelectItem value="meeting_pressure">Meeting Pressure</SelectItem>
                          <SelectItem value="on_time_completion">On-Time Completion</SelectItem>
                          <SelectItem value="learning_completion">Learning Completion</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Visible To</Label>
                      <div className="flex gap-2 flex-wrap">
                        {['manager', 'hr', 'ld', 'exec'].map(role => (
                          <Badge
                            key={role}
                            variant={newKPI.visible_to_roles.includes(role) ? 'default' : 'outline'}
                            className="cursor-pointer capitalize"
                            onClick={() => {
                              const roles = newKPI.visible_to_roles.includes(role)
                                ? newKPI.visible_to_roles.filter(r => r !== role)
                                : [...newKPI.visible_to_roles, role];
                              setNewKPI({ ...newKPI, visible_to_roles: roles });
                            }}
                          >
                            {role}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  <Button onClick={handleCreateKPI} className="w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Create KPI
                  </Button>
                </div>

                {/* Existing KPIs */}
                <div className="space-y-2">
                  <h4 className="font-medium">Existing KPIs</h4>
                  {kpis.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">
                      No KPIs configured yet
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {kpis.map(kpi => (
                        <div key={kpi.id} className="flex items-center justify-between p-3 bg-accent/30 rounded-lg">
                          <div>
                            <p className="font-medium">{kpi.name}</p>
                            <div className="flex gap-2 mt-1">
                              <Badge variant="outline" className="text-xs capitalize">
                                {kpi.category}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {kpi.visible_to_roles?.join(', ')}
                              </Badge>
                            </div>
                          </div>
                          <Switch
                            checked={kpi.is_active}
                            onCheckedChange={() => handleToggleKPI(kpi.id, kpi.is_active)}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Goals Management</CardTitle>
                <CardDescription>
                  Goals are created and managed in Intelligence → Goals & KPIs tab
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Navigate to the Intelligence page to create and track organizational goals mapped to Noi signals and learning pathways.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}