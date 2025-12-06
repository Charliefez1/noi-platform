import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Shield, Settings, Users, FileText, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function SupportAdminPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState({
    intake_categories: [],
    escalation_rules: {},
    visibility_settings: {},
    case_owners: []
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

        // Fetch admin configuration
        
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
          <Shield className="w-12 h-12 text-muted-foreground mb-3" />
          <p className="text-muted-foreground">Support Admin is only available to NDG team members</p>
        </CardContent>
      </Card>
    );
  }

  const handleSave = async () => {
    try {
      // Save configuration
      toast.success('Configuration saved');
    } catch (error) {
      toast.error('Failed to save configuration');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Support Admin</h1>
        <p className="text-muted-foreground">Configure intake forms, escalation rules, and visibility settings</p>
      </div>

      <Tabs defaultValue="intake" className="w-full">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="intake">
            <FileText className="w-4 h-4 mr-2" />
            Intake Forms
          </TabsTrigger>
          <TabsTrigger value="escalation">
            <AlertCircle className="w-4 h-4 mr-2" />
            Escalation Rules
          </TabsTrigger>
          <TabsTrigger value="visibility">
            <Settings className="w-4 h-4 mr-2" />
            Visibility
          </TabsTrigger>
          <TabsTrigger value="team">
            <Users className="w-4 h-4 mr-2" />
            Team
          </TabsTrigger>
        </TabsList>

        <TabsContent value="intake" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Intake Categories</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Available Categories</Label>
                <div className="mt-2 space-y-2">
                  {['Communication Support', 'Workload Management', 'Sensory Accommodations', 'Role Clarity', 'Team Dynamics'].map((cat, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                      <span className="text-sm">{cat}</span>
                      <Button variant="ghost" size="sm">Edit</Button>
                    </div>
                  ))}
                </div>
              </div>
              <Button>Add Category</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Required Fields</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input type="checkbox" defaultChecked />
                  <span className="text-sm">Reason for support</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" defaultChecked />
                  <span className="text-sm">Specific concerns</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" />
                  <span className="text-sm">Previous support experience</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" />
                  <span className="text-sm">Manager details</span>
                </label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="escalation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Escalation Rules</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Urgent Cases</Label>
                <Input 
                  placeholder="Notify within X hours"
                  defaultValue="2"
                  type="number"
                  className="mt-2"
                />
              </div>
              <div>
                <Label>Priority Cases</Label>
                <Input 
                  placeholder="Notify within X hours"
                  defaultValue="24"
                  type="number"
                  className="mt-2"
                />
              </div>
              <div>
                <Label>Routine Cases</Label>
                <Input 
                  placeholder="Notify within X days"
                  defaultValue="3"
                  type="number"
                  className="mt-2"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Auto-Assignment</CardTitle>
            </CardHeader>
            <CardContent>
              <label className="flex items-center gap-2">
                <input type="checkbox" />
                <span className="text-sm">Enable automatic case assignment based on NDG availability</span>
              </label>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="visibility" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Manager Visibility</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <label className="flex items-center gap-2">
                <input type="checkbox" defaultChecked />
                <span className="text-sm">Managers can see support case status (summary only)</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" />
                <span className="text-sm">Managers can see journal entries (with employee consent)</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" defaultChecked />
                <span className="text-sm">Managers can view alignment plans</span>
              </label>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Employee Privacy</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <label className="flex items-center gap-2">
                <input type="checkbox" defaultChecked />
                <span className="text-sm">Employees control journal sharing</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" defaultChecked />
                <span className="text-sm">Case details are private (NDG only)</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" />
                <span className="text-sm">Allow anonymous support requests</span>
              </label>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>NDG Team Members</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                {['Sarah Johnson', 'Michael Chen', 'Emma Williams'].map((name, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-xs font-medium">{name.split(' ').map(n => n[0]).join('')}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium">{name}</p>
                        <p className="text-xs text-muted-foreground">NDG Specialist</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">Manage</Button>
                  </div>
                ))}
              </div>
              <Button>Add Team Member</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Case Load Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Sarah Johnson</span>
                  <span className="font-medium">12 cases</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Michael Chen</span>
                  <span className="font-medium">8 cases</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Emma Williams</span>
                  <span className="font-medium">10 cases</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button onClick={handleSave}>
          Save Configuration
        </Button>
      </div>
    </div>
  );
}