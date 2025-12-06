import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  CheckCircle2, 
  ArrowRight, 
  Zap,
  MoreHorizontal,
  BookOpen,
  AlertTriangle,
  TrendingUp,
  Loader2
} from 'lucide-react';
import { format, isToday } from 'date-fns';
import CapacityRing from '@/components/dashboard/CapacityRing';
import NudgeCard from '@/components/nudges/NudgeCard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useNoi } from '@/components/core/NoiContext';
import LoadingState from '@/components/shared/LoadingState';
import ErrorBanner from '@/components/shared/ErrorBanner';
import { toast } from 'sonner';

export default function Home() {
  const { 
    user, 
    loading,
    error,
    refreshData,
    capacityScore, 
    frictionIndex,
    meetingPressure,
    todaysTasks, 
    todaysMeetings,
    pendingNudges,
    learningModules,
    learningProgress,
    currentState,
    tasks,
    meetings,
    updateTask
  } = useNoi();

  const [deferring, setDeferring] = useState(false);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const getLowPriorityCount = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return tasks.filter(t => 
      t.priority === 'low' && 
      t.status !== 'done' && 
      t.due_date && 
      new Date(t.due_date).setHours(0, 0, 0, 0) === today.getTime()
    ).length;
  };

  const deferLowPriorityTasks = async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const lowPriorityToday = tasks.filter(t => 
      t.priority === 'low' && 
      t.status !== 'done' && 
      t.due_date && 
      new Date(t.due_date).setHours(0, 0, 0, 0) === today.getTime()
    );

    if (lowPriorityToday.length === 0) return;

    setDeferring(true);
    try {
      await Promise.all(
        lowPriorityToday.map(task => 
          updateTask(task.id, { 
            status: 'deferred', 
            due_date: tomorrowStr,
            deferred_count: (task.deferred_count || 0) + 1
          })
        )
      );
      toast.success(`Deferred ${lowPriorityToday.length} low priority task${lowPriorityToday.length > 1 ? 's' : ''} to tomorrow`);
    } catch (error) {
      toast.error('Failed to defer tasks');
    } finally {
      setDeferring(false);
    }
  };

  // Find next deep work block or suggest one
  const nextDeepWork = todaysMeetings.find(m => m.type === 'deep_work');
  const nextMeeting = todaysMeetings.find(m => new Date(m.start_time) > new Date());

  // Get recommended learning based on friction
  const recommendedLearning = learningModules.find(m => 
    m.friction_triggers?.includes(frictionIndex > 50 ? 'high_friction' : 'moderate_friction')
  ) || learningModules[0];

  if (loading && tasks.length === 0) {
    return <LoadingState message="Loading your workspace..." />;
  }

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6 md:space-y-8 overflow-x-hidden w-full"
    >
      {error && <ErrorBanner error={error} onRetry={refreshData} />}
      
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4 w-full overflow-x-hidden">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight mb-2 break-words">
            {getGreeting()}, {user?.full_name?.split(' ')[0] || 'there'}
          </h1>
          <p className="text-muted-foreground text-sm md:text-base lg:text-lg break-words">
            {format(new Date(), 'EEEE, MMMM d')} • Here's your workspace overview.
          </p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <Button variant="outline" className="rounded-full text-sm px-3 md:px-4">
            <span className="hidden sm:inline">Customize</span>
            <span className="sm:hidden">Edit</span>
          </Button>
          <Button className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 text-sm px-3 md:px-4">
            <span className="hidden sm:inline">Daily Check-in</span>
            <span className="sm:hidden">Check-in</span>
          </Button>
        </div>
      </div>

      {/* Adaptive State Banner */}
      {currentState?.label && currentState.label !== 'clear' && (
        <motion.div variants={item} className="w-full overflow-x-hidden">
          <Card className={`border-l-4 ${
            currentState.label === 'critical' ? 'border-l-orange-500 bg-orange-500/5' :
            currentState.label === 'overloaded' ? 'border-l-yellow-500 bg-yellow-500/5' :
            'border-l-blue-500 bg-blue-500/5'
          } w-full`}>
            <CardContent className="p-3 md:p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 md:gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-xs md:text-sm font-medium break-words">
                  {currentState.label === 'critical' 
                    ? 'You are at capacity. This is a good time to simplify what today asks of you.'
                    : 'Today feels a bit heavy'}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 w-full md:w-auto">
                {getLowPriorityCount() > 0 ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={deferLowPriorityTasks}
                    disabled={deferring}
                    className="text-xs w-full md:w-auto"
                  >
                    {deferring ? (
                      <>
                        <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                        <span className="hidden sm:inline">Deferring...</span>
                        <span className="sm:hidden">...</span>
                      </>
                    ) : (
                      <>
                        <span className="hidden sm:inline">Defer {getLowPriorityCount()} low priority task{getLowPriorityCount() > 1 ? 's' : ''} today</span>
                        <span className="sm:hidden">Defer {getLowPriorityCount()} task{getLowPriorityCount() > 1 ? 's' : ''}</span>
                      </>
                    )}
                  </Button>
                ) : (
                  <span className="text-xs text-muted-foreground break-words">Nothing low priority due today</span>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Pending Nudges (if any high priority) */}
      {pendingNudges.filter(n => n.priority === 'high').length > 0 && (
        <motion.div variants={item}>
          <div className="space-y-3">
            {pendingNudges.filter(n => n.priority === 'high').slice(0, 2).map(nudge => (
              <NudgeCard key={nudge.id} nudge={nudge} />
            ))}
          </div>
        </motion.div>
      )}

      {/* Top Row: Capacity + Focus + Up Next */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6 w-full">
        {/* Capacity Card */}
        <motion.div variants={item} className="lg:col-span-4">
          <Card className="h-full border-none shadow-lg bg-card/50 backdrop-blur-sm relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-500" />
                Cognitive Load
              </CardTitle>
              <CardDescription>Real-time capacity from your tasks & meetings</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center pt-0">
              <CapacityRing value={capacityScore} />
              <div className="mt-4 grid grid-cols-2 gap-4 w-full text-center">
                <div className="p-2 rounded-lg bg-muted/30">
                  <p className="text-xs text-muted-foreground">Friction</p>
                  <p className={`font-bold ${frictionIndex > 50 ? 'text-orange-500' : 'text-green-500'}`}>
                    {frictionIndex}%
                  </p>
                </div>
                <div className="p-2 rounded-lg bg-muted/30">
                  <p className="text-xs text-muted-foreground">Meeting Load</p>
                  <p className={`font-bold ${meetingPressure > 50 ? 'text-orange-500' : 'text-green-500'}`}>
                    {meetingPressure}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Focus Card */}
        <motion.div variants={item} className="lg:col-span-5">
          <Card className="h-full border-none shadow-lg bg-gradient-to-br from-slate-900 to-slate-800 text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=800')] bg-cover bg-center opacity-40 mix-blend-overlay" />
            <div className="relative z-10 p-4 md:p-6 lg:p-8 flex flex-col justify-between h-full">
              <div>
                <Badge className="bg-white/20 hover:bg-white/30 text-white border-none mb-4">
                  {nextDeepWork ? 'Deep Work Scheduled' : 'Daily Focus'}
                </Badge>
                {nextDeepWork ? (
                  <>
                    <h2 className="text-xl md:text-2xl lg:text-3xl font-bold mb-2 break-words">{nextDeepWork.title}</h2>
                    <h3 className="text-base md:text-lg lg:text-xl break-words">
                      at <span className="text-primary">{format(new Date(nextDeepWork.start_time), 'h:mm a')}</span>
                    </h3>
                  </>
                ) : nextMeeting ? (
                  <>
                    <h2 className="text-lg md:text-xl lg:text-2xl font-bold mb-2 break-words">Next: {nextMeeting.title}</h2>
                    <h3 className="text-base md:text-lg lg:text-xl break-words">
                      at <span className="text-primary">{format(new Date(nextMeeting.start_time), 'h:mm a')}</span>
                    </h3>
                  </>
                ) : (
                  <>
                    <h2 className="text-xl md:text-2xl lg:text-3xl font-bold mb-2">Your day is clear</h2>
                    <h3 className="text-base md:text-lg lg:text-xl">Perfect for <span className="text-primary">deep work</span></h3>
                  </>
                )}
                <p className="mt-3 md:mt-4 text-white/70 max-w-sm leading-relaxed text-sm md:text-base break-words">
                  {capacityScore > 70 
                    ? "You're running high on load. Consider deferring non-critical tasks."
                    : todaysTasks.length > 0 
                      ? `You have ${todaysTasks.length} tasks to tackle today.`
                      : "Great time to focus on important work."}
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mt-4 md:mt-6 lg:mt-8 gap-3">
                <div className="flex items-center gap-2 text-xs md:text-sm text-white/60">
                  <TrendingUp className="w-3 h-3 md:w-4 md:h-4" />
                  {todaysMeetings.length} meetings today
                </div>
                <Link to={createPageUrl('Calendar')}>
                  <Button variant="secondary" className="rounded-full bg-white text-slate-900 hover:bg-white/90 text-xs md:text-sm">
                    <span className="hidden sm:inline">View Calendar</span>
                    <span className="sm:hidden">Calendar</span>
                    <ArrowRight className="w-3 h-3 md:w-4 md:h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Up Next List */}
        <motion.div variants={item} className="lg:col-span-3 space-y-3 md:space-y-4">
          <h3 className="font-semibold text-base md:text-lg flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 md:w-5 md:h-5 text-primary" /> 
            Up Next
          </h3>
          {todaysMeetings.length === 0 ? (
            <Card className="border-none shadow-md bg-card">
              <CardContent className="p-4 text-center text-muted-foreground">
                <CalendarIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No meetings today</p>
              </CardContent>
            </Card>
          ) : (
            todaysMeetings.slice(0, 3).map((meeting, i) => {
              const linkedTasks = tasks.filter(t => meeting.linked_task_ids?.includes(t.id));
              return (
                <Card key={meeting.id || i} className="border-none shadow-md bg-card hover:bg-accent/50 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className={`flex flex-col items-center justify-center w-12 h-12 rounded-xl flex-shrink-0 ${
                        meeting.type === 'deep_work' ? 'bg-green-500/10 text-green-500' :
                        meeting.type === 'break' ? 'bg-orange-500/10 text-orange-500' :
                        'bg-primary/10 text-primary'
                      }`}>
                        <span className="text-xs font-bold uppercase">{format(new Date(meeting.start_time), 'MMM')}</span>
                        <span className="text-lg font-bold">{format(new Date(meeting.start_time), 'd')}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold truncate">{meeting.title}</h4>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {format(new Date(meeting.start_time), 'h:mm a')} - {format(new Date(meeting.end_time), 'h:mm a')}
                        </p>
                        {linkedTasks.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {linkedTasks.slice(0, 2).map(task => (
                              <div key={task.id} className="flex items-center gap-1 text-xs text-muted-foreground">
                                <CheckCircle2 className="w-3 h-3" />
                                <span className="truncate">{task.title}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
          <Link to={createPageUrl('Calendar')}>
            <Button variant="ghost" className="w-full text-muted-foreground hover:text-primary">
              View All Meetings
            </Button>
          </Link>
        </motion.div>
      </div>

      {/* Priority Tasks */}
      <motion.div variants={item} className="w-full overflow-x-hidden">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg md:text-xl font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-green-500" /> 
            Today's Priorities
          </h3>
          <Link to={createPageUrl('Tasks')}>
            <Button variant="ghost" size="sm" className="text-xs md:text-sm">
              <span className="hidden sm:inline">See All Tasks</span>
              <span className="sm:hidden">All</span>
            </Button>
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {todaysTasks.slice(0, 3).map((task) => (
            <Card key={task.id} className={`border-l-4 shadow-sm hover:shadow-md transition-all ${
              task.priority === 'critical' ? 'border-l-red-500' :
              task.priority === 'high' ? 'border-l-orange-500' :
              task.priority === 'medium' ? 'border-l-yellow-500' :
              'border-l-blue-500'
            }`}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <Badge variant="outline" className={
                    task.priority === 'critical' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                    task.priority === 'high' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' : 
                    task.priority === 'medium' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' : 
                    'bg-blue-500/10 text-blue-500 border-blue-500/20'
                  }>
                    {task.priority}
                  </Badge>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </div>
                <CardTitle className="text-lg mt-2">{task.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                  {task.description || "No description provided."}
                </p>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Due {task.due_date ? format(new Date(task.due_date), 'MMM d') : 'No date'}</span>
                  <span className="flex items-center gap-1">
                    {task.estimated_minutes || 30}m est.
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
          {todaysTasks.length === 0 && (
            <div className="col-span-3 text-center py-12 bg-muted/20 rounded-2xl border border-dashed border-muted">
              <CheckCircle2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">All caught up!</h3>
              <p className="text-muted-foreground">No pending tasks for today.</p>
            </div>
          )}
        </div>
      </motion.div>
      
      {/* Continue Learning Tile */}
      {(() => {
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const staleLearning = learningModules.find(m => {
          const prog = learningProgress.find(p => p.module_id === m.id);
          return prog && 
                 prog.status !== 'completed' && 
                 prog.started_at && 
                 new Date(prog.started_at) < sevenDaysAgo;
        });
        
        const shouldShowLearning = staleLearning && 
                                    (currentState?.label === 'clear' || currentState?.label === 'stretched');
        
        return shouldShowLearning ? (
          <motion.div variants={item}>
            <Card className="bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border-purple-500/20">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-lg bg-purple-500/20 flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">Continue Learning</p>
                    <p className="text-xs text-muted-foreground">
                      You have an unfinished module from over a week ago
                    </p>
                  </div>
                  <Link to={createPageUrl('Learning')}>
                    <Button variant="outline" size="sm" className="border-purple-500/30">
                      Resume <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ) : null;
      })()}

      {/* AI Insights & Learning */}
      <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 w-full">
        {/* AI Insight based on real data */}
        {(capacityScore > 70 || frictionIndex > 50 || meetingPressure > 50) ? (
          <Card className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border-indigo-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-indigo-500">
                <Zap className="w-5 h-5" /> AI Insight
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed">
                {capacityScore > 70 && `Your cognitive load is at ${capacityScore}%. `}
                {meetingPressure > 50 && `${meetingPressure}% of your week is in meetings. `}
                {frictionIndex > 50 && `Friction index is elevated at ${frictionIndex}%. `}
                Consider rescheduling or delegating to optimize your workflow.
              </p>
              <div className="mt-4 flex gap-3">
                <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white">
                  View Suggestions
                </Button>
                <Button size="sm" variant="outline">Dismiss</Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-500">
                <CheckCircle2 className="w-5 h-5" /> Looking Good
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed">
                Your workload is balanced. Capacity at {capacityScore}%, friction at {frictionIndex}%. 
                Great time to tackle deep work or learning.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Learning Nudge */}
        <Card className="bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" /> Learning Nudge
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="h-16 w-16 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                <div className="text-2xl">🎓</div>
              </div>
              <div>
                <h4 className="font-semibold">
                  {recommendedLearning?.title || 'Explore Learning'}
                </h4>
                <p className="text-sm text-muted-foreground mb-3">
                  {recommendedLearning?.duration_minutes || 5} min • 
                  {frictionIndex > 50 ? ' High Relevance' : ' Recommended'}
                </p>
                <Link to={createPageUrl('Learning')}>
                  <Button size="sm" variant="secondary" className="w-full">Start Module</Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}