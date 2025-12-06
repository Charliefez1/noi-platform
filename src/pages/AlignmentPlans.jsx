import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileCheck, Users, Calendar, Edit } from 'lucide-react';

export default function AlignmentPlansPage() {
  const [user, setUser] = useState(null);
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
        
        // Fetch alignment plans
        // Employee: their plan
        // Manager: plans for their direct reports
        // NDG: plans they're involved in
        
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch data:', error);
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const isNDG = user?.role_type === 'ndg' || user?.role_type === 'sap';
  const isManager = user?.role_type === 'manager' || user?.role_type === 'exec';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Alignment Plans</h1>
          <p className="text-muted-foreground">
            Three-way agreements for clear expectations and support
          </p>
        </div>
        {(isManager || isNDG) && (
          <Button>
            <FileCheck className="w-4 h-4 mr-2" />
            Create New Plan
          </Button>
        )}
      </div>

      {plans.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileCheck className="w-12 h-12 text-muted-foreground mb-3" />
            <p className="text-muted-foreground mb-2">No alignment plans yet</p>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              Alignment plans bring together employees, managers, and the NDG team to agree on 
              expectations, adjustments, and ways of working.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Plans List */}
          <div className="lg:col-span-1 space-y-3">
            {plans.map((plan) => (
              <Card 
                key={plan.id}
                className={`cursor-pointer hover:shadow-md transition-shadow ${
                  selectedPlan?.id === plan.id ? 'border-primary' : ''
                }`}
                onClick={() => setSelectedPlan(plan)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-sm">{plan.employee_name || 'Alignment Plan'}</CardTitle>
                    <Badge variant={plan.status === 'active' ? 'default' : 'secondary'}>
                      {plan.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Users className="w-3 h-3" />
                    <span>3 participants</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Plan Detail */}
          {selectedPlan && (
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Alignment Plan</CardTitle>
                    <Button size="sm" variant="outline">
                      <Edit className="w-3 h-3 mr-2" />
                      Edit
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Participants</h4>
                    <div className="flex gap-3">
                      <Badge variant="outline">Employee</Badge>
                      <Badge variant="outline">Manager</Badge>
                      <Badge variant="outline">NDG</Badge>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold mb-2">Agreed Expectations</h4>
                    <div className="bg-muted/50 rounded-lg p-3">
                      <p className="text-sm text-muted-foreground">
                        Expectations and role clarity would be listed here
                      </p>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold mb-2">Adjustments & Support</h4>
                    <div className="bg-muted/50 rounded-lg p-3">
                      <p className="text-sm text-muted-foreground">
                        Agreed adjustments and accommodations would be listed here
                      </p>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold mb-2">Communication Preferences</h4>
                    <div className="bg-muted/50 rounded-lg p-3">
                      <p className="text-sm text-muted-foreground">
                        Preferred communication methods and frequency would be listed here
                      </p>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold mb-2">Meeting Cadence</h4>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <p className="text-sm">Weekly check-ins</p>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <p className="text-xs text-muted-foreground">
                      Last updated: {new Date(selectedPlan.updated_date).toLocaleDateString()}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  );
}