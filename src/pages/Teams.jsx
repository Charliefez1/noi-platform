import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, Mail, MoreHorizontal, AlertTriangle, Eye, EyeOff, Loader2, BarChart3 } from 'lucide-react';
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { base44 } from '@/api/base44Client';
import { useNoi } from '@/components/core/NoiContext';
import TeamWorkloadView from '@/components/teams/TeamWorkloadView';
import { calculateUserLoad, calculateUserFriction, hasUserData } from '@/components/teams/teamMetrics';

export default function TeamsPage() {
  const { user, isManager, tasks, meetings, learningModules } = useNoi();
  const [teams, setTeams] = useState([]);
  const [projects, setProjects] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showIndividualData, setShowIndividualData] = useState(false);

  useEffect(() => {
    fetchTeamData();
  }, []);

  const fetchTeamData = async () => {
    try {
      const [teamsData, usersData, projectsData, consentData] = await Promise.all([
        base44.entities.Team.list(),
        base44.entities.User.list(),
        base44.entities.Project.list(),
        base44.entities.ConsentPreference.list()
      ]);
      setTeams(teamsData || []);
      setProjects(projectsData || []);
      
      // For demo, show all users as team members
      // In production, filter by team_id matching current user's team
      const members = (usersData || []).map(u => ({
        ...u,
        // Calculate real load and friction from their data (respecting consent)
        load: calculateUserLoad(u.id, tasks, meetings),
        friction: calculateUserFriction(u.id, tasks, meetings),
        hasData: hasUserData(u.id, tasks, meetings, consentData),
        status: Math.random() > 0.3 ? 'online' : Math.random() > 0.5 ? 'away' : 'offline'
      }));
      
      setTeamMembers(members);
    } catch (error) {
      console.error('Error fetching team data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate aggregated team stats (what managers can see)
  const avgLoad = teamMembers.length > 0 
    ? Math.round(teamMembers.reduce((acc, m) => acc + (m.load || 50), 0) / teamMembers.length)
    : 0;
  const highFrictionCount = teamMembers.filter(m => m.friction === 'high').length;
  const completedTasks = tasks.filter(t => t.status === 'done').length;

  const { isAdmin } = useNoi();
  const canAccessTeams = isManager || isAdmin;

  if (!canAccessTeams) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Teams</h1>
          <p className="text-muted-foreground">Team collaboration overview</p>
        </div>
        
        <Alert>
          <AlertDescription>
            Team analytics are available to managers and admins. Contact your manager or HR for team insights.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle>Your Team</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              You're part of the team. Individual work data is kept private - only you can see your detailed metrics.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Teams</h1>
          <p className="text-sm md:text-base text-muted-foreground">Aggregated team workload and collaboration overview</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Button 
            variant="outline" 
            className="gap-2"
            onClick={() => setShowIndividualData(!showIndividualData)}
          >
            {showIndividualData ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {showIndividualData ? 'Hide Details' : 'Show Details'}
          </Button>
          <Button className="gap-2 bg-primary">
            <Users className="w-4 h-4" /> Manage Team
          </Button>
        </div>
      </div>

      {/* Privacy Notice */}
      <Alert className="border-blue-500/50 bg-blue-500/10">
        <AlertDescription className="text-blue-200">
          <strong>Privacy Protected:</strong> You're viewing aggregated team metrics. Individual task details, 
          notes, and personal signals are never visible to managers.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="workload">
            <BarChart3 className="w-4 h-4 mr-2" />
            Workload Distribution
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">

      {/* Aggregated Team Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{teamMembers.length}</div>
            <p className="text-sm text-muted-foreground">Team Members</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className={`text-2xl font-bold ${avgLoad > 70 ? 'text-orange-500' : avgLoad > 50 ? 'text-yellow-500' : 'text-green-500'}`}>
              {avgLoad}%
            </div>
            <p className="text-sm text-muted-foreground">Avg. Team Load</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className={`text-2xl font-bold ${highFrictionCount > 0 ? 'text-red-500' : 'text-green-500'}`}>
              {highFrictionCount}
            </div>
            <p className="text-sm text-muted-foreground">High Friction Alerts</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-500">{completedTasks}</div>
            <p className="text-sm text-muted-foreground">Tasks Completed (Team)</p>
          </CardContent>
        </Card>
      </div>

      {/* Team Members - Aggregated View */}
      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : teamMembers.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No team members found</p>
          ) : (
            <div className="space-y-4">
              {teamMembers.map((member) => (
                <div key={member.id} className="flex items-center gap-4 p-4 rounded-xl bg-accent/20 hover:bg-accent/40 transition-colors">
                  <div className="relative">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={member.avatar_url} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {(member.full_name || member.email || 'U').split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-card ${
                      member.status === 'online' ? 'bg-green-500' :
                      member.status === 'away' ? 'bg-yellow-500' : 'bg-gray-500'
                    }`}></span>
                  </div>

                  <div className="flex-1">
                    <h4 className="font-semibold">{member.full_name || member.email}</h4>
                    <p className="text-sm text-muted-foreground capitalize">{member.role_type || 'Employee'}</p>
                  </div>

                  {showIndividualData && (
                   <>
                     {member.hasData ? (
                       <>
                         <div className="w-32">
                           <div className="flex justify-between text-xs mb-1">
                             <span>Load</span>
                             <span className={member.load > 80 ? 'text-red-500' : member.load > 60 ? 'text-yellow-500' : 'text-green-500'}>
                               {member.load}%
                             </span>
                           </div>
                           <Progress 
                             value={member.load} 
                             className={`h-2 ${member.load > 80 ? '[&>div]:bg-red-500' : member.load > 60 ? '[&>div]:bg-yellow-500' : '[&>div]:bg-green-500'}`}
                           />
                         </div>

                         <Badge 
                           variant="outline" 
                           className={`
                             ${member.friction === 'high' ? 'border-red-500/50 text-red-500 bg-red-500/10' : ''}
                             ${member.friction === 'medium' ? 'border-yellow-500/50 text-yellow-500 bg-yellow-500/10' : ''}
                             ${member.friction === 'low' ? 'border-green-500/50 text-green-500 bg-green-500/10' : ''}
                           `}
                         >
                           {member.friction === 'high' && <AlertTriangle className="w-3 h-3 mr-1" />}
                           {member.friction} friction
                         </Badge>
                       </>
                     ) : (
                       <Badge variant="outline" className="border-muted text-muted-foreground">
                         Data limited
                       </Badge>
                     )}
                   </>
                  )}

                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Mail className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Team Insights */}
      {highFrictionCount > 0 && (
        <Card className="border-orange-500/30 bg-orange-500/5">
          <CardHeader>
            <CardTitle className="text-orange-400 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" /> Team Attention Needed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              {highFrictionCount} team member(s) showing high friction signals. Consider:
            </p>
            <ul className="list-disc list-inside text-sm space-y-1 text-muted-foreground">
              <li>Review workload distribution</li>
              <li>Check for blocked tasks or unclear requirements</li>
              <li>Schedule 1:1 check-ins with affected team members</li>
            </ul>
          </CardContent>
        </Card>
      )}
        </TabsContent>

        <TabsContent value="workload">
          <TeamWorkloadView 
            tasks={tasks}
            projects={projects}
            users={teamMembers}
            meetings={meetings}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}