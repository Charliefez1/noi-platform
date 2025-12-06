import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { HeartHandshake, Calendar, FileText, AlertCircle, ArrowRight, BookMarked } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function MySupportPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cases, setCases] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [guidanceRequests, setGuidanceRequests] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
        
        // Fetch relevant data based on role
        // Cases, sessions, guidance requests would be fetched here
        
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch data:', error);
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const isManager = user?.role_type === 'manager' || user?.role_type === 'exec';
  const isNDG = user?.role_type === 'ndg' || user?.role_type === 'sap';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Employee View
  if (!isManager && !isNDG) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Support</h1>
          <p className="text-muted-foreground">Your personalized support dashboard</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-500" />
                Current Case
              </CardTitle>
            </CardHeader>
            <CardContent>
              {cases.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-sm font-medium">{cases[0]?.title || 'Open Case'}</p>
                  <Badge variant="outline">Active</Badge>
                  <Link to={createPageUrl('Cases')}>
                    <Button variant="link" className="p-0 h-auto">
                      View Details <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">
                  <p>No active cases</p>
                  <Link to={createPageUrl('IntakeReferrals')}>
                    <Button variant="link" className="p-0 h-auto mt-2">
                      Request Support <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="w-4 h-4 text-green-500" />
                Upcoming Sessions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {sessions.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-sm font-medium">{sessions[0]?.date || 'Next Session'}</p>
                  <p className="text-xs text-muted-foreground">{sessions[0]?.time || 'Time TBD'}</p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No upcoming sessions</p>
              )}
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <BookMarked className="w-4 h-4 text-purple-500" />
                My Journal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-2">Reflect on your work experience</p>
              <Link to={createPageUrl('StrengthsChallenges')}>
                <Button variant="outline" size="sm" className="w-full">
                  Open Journal
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Link to={createPageUrl('IntakeReferrals')}>
              <Button variant="outline" className="w-full justify-start">
                <HeartHandshake className="w-4 h-4 mr-2" />
                Request New Support
              </Button>
            </Link>
            <Link to={createPageUrl('AlignmentPlans')}>
              <Button variant="outline" className="w-full justify-start">
                <FileText className="w-4 h-4 mr-2" />
                View My Alignment Plan
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Manager View
  if (isManager && !isNDG) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Support</h1>
          <p className="text-muted-foreground">Manager guidance and support dashboard</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                Open Guidance Requests
              </CardTitle>
            </CardHeader>
            <CardContent>
              {guidanceRequests.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-2xl font-bold">{guidanceRequests.length}</p>
                  <Link to={createPageUrl('ManagerGuidance')}>
                    <Button variant="link" className="p-0 h-auto">
                      View All <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  </Link>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No pending requests</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-500" />
                Next Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">No immediate actions required</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Link to={createPageUrl('ManagerGuidance')}>
              <Button variant="outline" className="w-full justify-start">
                <MessageCircleQuestion className="w-4 h-4 mr-2" />
                Request Guidance
              </Button>
            </Link>
            <Link to={createPageUrl('AlignmentPlans')}>
              <Button variant="outline" className="w-full justify-start">
                <FileText className="w-4 h-4 mr-2" />
                View Alignment Plans
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // NDG View
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Support</h1>
        <p className="text-muted-foreground">NDG dashboard - Today's sessions and open cases</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="w-4 h-4 text-green-500" />
              Today's Sessions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{sessions.length}</p>
            <p className="text-xs text-muted-foreground mt-1">Scheduled for today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-500" />
              Open Cases
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{cases.length}</p>
            <Link to={createPageUrl('Cases')}>
              <Button variant="link" className="p-0 h-auto mt-1">
                View All <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              Pending Guidance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{guidanceRequests.length}</p>
            <Link to={createPageUrl('ManagerGuidance')}>
              <Button variant="link" className="p-0 h-auto mt-1">
                View Requests <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Link to={createPageUrl('Cases')}>
            <Button variant="outline" className="w-full justify-start">
              <FileText className="w-4 h-4 mr-2" />
              View All Cases
            </Button>
          </Link>
          <Link to={createPageUrl('SupportInsights')}>
            <Button variant="outline" className="w-full justify-start">
              <PieChart className="w-4 h-4 mr-2" />
              Support Insights
            </Button>
          </Link>
          <Link to={createPageUrl('SupportAdmin')}>
            <Button variant="outline" className="w-full justify-start">
              <Shield className="w-4 h-4 mr-2" />
              Admin Settings
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}