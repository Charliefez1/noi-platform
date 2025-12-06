import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';

const NoiContext = createContext(null);

// Capacity calculation weights
const CAPACITY_WEIGHTS = {
  meetingHourWeight: 12.5, // 12.5% capacity per meeting hour
  taskWeight: 3, // 3% per pending task
  highPriorityMultiplier: 1.5,
  criticalPriorityMultiplier: 2,
};

/**
 * Infers the user's current cognitive/operational state based on metrics.
 * 
 * Thresholds:
 * - clear: capacityScore <= 40 AND frictionIndex <= 30 AND meetingPressure <= 30
 * - stretched: capacityScore 40-65 OR frictionIndex 30-55
 * - overloaded: capacityScore 65-85 OR frictionIndex 55-80 OR meetingPressure > 50
 * - critical: capacityScore > 85 OR frictionIndex > 80
 * 
 * @param {Object} metrics - The metrics object
 * @param {number} metrics.capacityScore - Cognitive load percentage (0-100)
 * @param {number} metrics.frictionIndex - Friction level (0-100)
 * @param {number} metrics.meetingPressure - Meeting pressure percentage (0-100)
 * @returns {Object} State object with label and metrics
 */
function inferState({ capacityScore = 0, frictionIndex = 0, meetingPressure = 0 }) {
  let label = 'clear';
  
  // Critical: highest priority
  if (capacityScore > 85 || frictionIndex > 80) {
    label = 'critical';
  }
  // Overloaded
  else if (capacityScore > 65 || frictionIndex > 55 || meetingPressure > 50) {
    label = 'overloaded';
  }
  // Stretched
  else if (capacityScore > 40 || frictionIndex > 30) {
    label = 'stretched';
  }
  // Clear: all metrics are low
  else if (capacityScore <= 40 && frictionIndex <= 30 && meetingPressure <= 30) {
    label = 'clear';
  }
  
  return {
    label,
    capacityScore,
    frictionIndex,
    meetingPressure,
  };
}

export function NoiProvider({ children }) {
  const [user, setUser] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [notes, setNotes] = useState([]);
  const [nudges, setNudges] = useState([]);
  const [signals, setSignals] = useState([]);
  const [inboxItems, setInboxItems] = useState([]);
  const [learningModules, setLearningModules] = useState([]);
  const [learningProgress, setLearningProgress] = useState([]);
  const [learningPathways, setLearningPathways] = useState([]);
  const [learningPreference, setLearningPreference] = useState(null);
  const [consent, setConsentState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(Date.now());

  // Computed metrics
  const [capacityScore, setCapacityScore] = useState(0);
  const [frictionIndex, setFrictionIndex] = useState(0);
  const [meetingPressure, setMeetingPressure] = useState(0);
  
  /**
   * Current inferred state of the user's cognitive/operational condition.
   * Automatically updated when capacityScore, frictionIndex, or meetingPressure change.
   * States: 'clear', 'stretched', 'overloaded', 'critical'
   */
  const [currentState, setCurrentState] = useState(() => 
    inferState({ capacityScore: 0, frictionIndex: 0, meetingPressure: 0 })
  );

  // Fetch all data
  const refreshData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const userData = await base44.auth.me().catch(() => ({ first_name: 'Guest', role_type: 'employee' }));
      setUser(userData);
      
      // Fetch each entity separately with error handling
      try {
        const tasksData = await base44.entities.Task.list();
        setTasks(tasksData || []);
      } catch (err) {
        console.error('Error loading tasks:', err);
        setError('Could not load tasks. Please try again.');
      }
      
      try {
        const meetingsData = await base44.entities.Meeting.list();
        setMeetings(meetingsData || []);
      } catch (err) {
        console.error('Error loading meetings:', err);
        if (!error) setError('Could not load meetings. Please try again.');
      }
      
      try {
        const notesData = await base44.entities.Note.list();
        setNotes(notesData || []);
      } catch (err) {
        console.error('Error loading notes:', err);
      }
      
      try {
        const nudgesData = await base44.entities.Nudge.filter({ status: 'pending' });
        setNudges(nudgesData || []);
      } catch (err) {
        console.error('Error loading nudges:', err);
      }
      
      try {
        const inboxData = await base44.entities.InboxItem.filter({ is_archived: false });
        setInboxItems(inboxData || []);
      } catch (err) {
        console.error('Error loading inbox:', err);
      }
      
      try {
        const modulesData = await base44.entities.LearningModule.list();
        setLearningModules(modulesData || []);
      } catch (err) {
        console.error('Error loading learning modules:', err);
      }
      
      try {
        const progressData = await base44.entities.LearningProgress.list();
        setLearningProgress(progressData || []);
      } catch (err) {
        console.error('Error loading learning progress:', err);
      }

      try {
        const pathwaysData = await base44.entities.LearningPathway.list();
        setLearningPathways(pathwaysData || []);
      } catch (err) {
        console.error('Error loading learning pathways:', err);
      }

      // Load or create learning preferences
      if (userData?.id) {
        try {
          const prefData = await base44.entities.LearningPreference.filter({ user_id: userData.id });
          if (prefData && prefData.length > 0) {
            setLearningPreference(prefData[0]);
          } else {
            // Create default preferences
            const defaultPref = await base44.entities.LearningPreference.create({
              user_id: userData.id,
              mode_preference: 'mixed',
              chunk_size: 'standard',
              motion_sensitivity: false,
              caption_required: false
            });
            setLearningPreference(defaultPref);
          }
        } catch (err) {
          console.error('Error loading learning preferences:', err);
        }
      }
      
      // Load consent preferences
      if (userData?.id) {
        try {
          const consentData = await base44.entities.ConsentPreference.filter({ user_id: userData.id });
          if (consentData && consentData.length > 0) {
            setConsentState(consentData[0]);
          } else {
            const defaultConsent = await base44.entities.ConsentPreference.create({
              user_id: userData.id,
              allow_work_event_tracking: false,
              allow_inbox_ai: false,
              allow_learning_recommendations: false,
              allow_team_aggregates: false
            });
            setConsentState(defaultConsent);
          }
        } catch (err) {
          console.error('Error loading consent:', err);
        }
      }
      
      setLastRefresh(Date.now());
    } catch (error) {
      console.error('Error refreshing Noi data:', error);
      setError('Unable to load data. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Calculate capacity score from real data
  const calculateCapacity = useCallback(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Today's meetings
    const todayMeetings = meetings.filter(m => {
      const start = new Date(m.start_time);
      return start >= today && start < tomorrow;
    });

    const meetingMinutes = todayMeetings.reduce((acc, m) => {
      const start = new Date(m.start_time);
      const end = new Date(m.end_time);
      return acc + (end - start) / (1000 * 60);
    }, 0);
    const meetingHours = meetingMinutes / 60;

    // Pending tasks
    const pendingTasks = tasks.filter(t => t.status !== 'done');
    let taskLoad = 0;
    pendingTasks.forEach(task => {
      let weight = CAPACITY_WEIGHTS.taskWeight;
      if (task.priority === 'high') weight *= CAPACITY_WEIGHTS.highPriorityMultiplier;
      if (task.priority === 'critical') weight *= CAPACITY_WEIGHTS.criticalPriorityMultiplier;
      taskLoad += weight;
    });

    const capacity = Math.min(
      meetingHours * CAPACITY_WEIGHTS.meetingHourWeight + taskLoad,
      100
    );

    setCapacityScore(Math.round(capacity));
    return capacity;
  }, [meetings, tasks]);

  // Calculate friction index
  const calculateFriction = useCallback(() => {
    let friction = 0;

    // Deferred tasks increase friction
    const deferredTasks = tasks.filter(t => t.status === 'deferred' || (t.deferred_count && t.deferred_count > 0));
    friction += deferredTasks.length * 5;

    // Overdue tasks increase friction
    const today = new Date();
    const overdueTasks = tasks.filter(t => {
      if (t.status === 'done') return false;
      if (!t.due_date) return false;
      return new Date(t.due_date) < today;
    });
    friction += overdueTasks.length * 10;

    // Low clarity tasks
    const unclearTasks = tasks.filter(t => t.clarity_score && t.clarity_score < 50);
    friction += unclearTasks.length * 3;

    // Back-to-back meetings
    const sortedMeetings = [...meetings].sort((a, b) => 
      new Date(a.start_time) - new Date(b.start_time)
    );
    for (let i = 1; i < sortedMeetings.length; i++) {
      const prevEnd = new Date(sortedMeetings[i - 1].end_time);
      const currStart = new Date(sortedMeetings[i].start_time);
      const gap = (currStart - prevEnd) / (1000 * 60);
      if (gap < 15 && gap >= 0) friction += 5; // Back-to-back
    }

    setFrictionIndex(Math.min(Math.round(friction), 100));
    return friction;
  }, [tasks, meetings]);

  // Calculate meeting pressure
  const calculateMeetingPressure = useCallback(() => {
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const weekMeetings = meetings.filter(m => {
      const start = new Date(m.start_time);
      return start >= weekStart && start < weekEnd && m.type === 'meeting';
    });

    const totalMinutes = weekMeetings.reduce((acc, m) => {
      const start = new Date(m.start_time);
      const end = new Date(m.end_time);
      return acc + (end - start) / (1000 * 60);
    }, 0);

    // Pressure as % of a 40-hour week spent in meetings
    const pressure = (totalMinutes / (40 * 60)) * 100;
    setMeetingPressure(Math.min(Math.round(pressure), 100));
    return pressure;
  }, [meetings]);

  // Log work event (gated by consent)
  const logEvent = useCallback(async (eventType, entityType, entityId, metadata = {}) => {
    // Only log if user has consented to work event tracking
    if (!consent?.allow_work_event_tracking) {
      return;
    }
    
    try {
      await base44.entities.WorkEvent.create({
        event_type: eventType,
        entity_type: entityType,
        entity_id: entityId,
        user_id: user?.id,
        team_id: user?.team_id,
        metadata,
        capacity_impact: metadata.capacity_impact || 0,
        friction_impact: metadata.friction_impact || 0
      });
      
      // Refresh data after event
      setTimeout(refreshData, 500);
    } catch (error) {
      console.error('Error logging event:', error);
    }
  }, [user, consent, refreshData]);

  // Task operations with event logging
  const createTask = useCallback(async (taskData) => {
    const task = await base44.entities.Task.create(taskData);
    await logEvent('task_created', 'task', task.id, {
      priority: taskData.priority,
      source: taskData.source || 'manual'
    });
    await refreshData();
    return task;
  }, [logEvent, refreshData]);

  const updateTask = useCallback(async (taskId, updates) => {
    const oldTask = tasks.find(t => t.id === taskId);
    const task = await base44.entities.Task.update(taskId, updates);
    
    if (updates.status === 'done' && oldTask?.status !== 'done') {
      await logEvent('task_completed', 'task', taskId, {
        was_on_time: oldTask?.due_date ? new Date() <= new Date(oldTask.due_date) : true
      });
    } else if (updates.status === 'deferred') {
      await logEvent('task_deferred', 'task', taskId, {
        deferred_count: (oldTask?.deferred_count || 0) + 1
      });
    } else {
      await logEvent('task_updated', 'task', taskId, updates);
    }
    
    await refreshData();
    return task;
  }, [tasks, logEvent, refreshData]);

  // Meeting operations with event logging
  const createMeeting = useCallback(async (meetingData) => {
    const meeting = await base44.entities.Meeting.create(meetingData);
    await logEvent('meeting_scheduled', 'meeting', meeting.id, {
      type: meetingData.type,
      duration_minutes: (new Date(meetingData.end_time) - new Date(meetingData.start_time)) / (1000 * 60)
    });
    await refreshData();
    return meeting;
  }, [logEvent, refreshData]);

  // Nudge operations
  const acceptNudge = useCallback(async (nudgeId) => {
    await base44.entities.Nudge.update(nudgeId, {
      status: 'accepted',
      resolved_at: new Date().toISOString()
    });
    await logEvent('nudge_accepted', 'nudge', nudgeId);
    await refreshData();
  }, [logEvent, refreshData]);

  const dismissNudge = useCallback(async (nudgeId) => {
    await base44.entities.Nudge.update(nudgeId, {
      status: 'dismissed',
      resolved_at: new Date().toISOString()
    });
    await logEvent('nudge_dismissed', 'nudge', nudgeId);
    await refreshData();
  }, [logEvent, refreshData]);

  // Generate AI nudges based on signals
  const checkForNudges = useCallback(async () => {
    if (!user?.id || !consent) return;
    
    // Only generate AI nudges if user has consented
    if (!consent.allow_learning_recommendations && !consent.allow_inbox_ai) return;
    
    // Prevent duplicate nudges (check if any pending nudge exists recently)
    const recentNudge = nudges.find(n => 
      n.status === 'pending' && 
      new Date(n.created_date) > new Date(Date.now() - 3600000) // Within last hour
    );
    if (recentNudge) return;

    try {
      // Prepare context for AI analysis
      const context = {
        capacityScore,
        frictionIndex,
        meetingPressure,
        currentState: currentState.label,
        taskStats: {
          total: tasks.length,
          overdue: tasks.filter(t => t.status !== 'done' && t.due_date && new Date(t.due_date) < new Date()).length,
          deferred: tasks.filter(t => t.status === 'deferred').length,
          unclear: tasks.filter(t => t.clarity_score && t.clarity_score < 50).length,
          highPriority: tasks.filter(t => t.priority === 'high' || t.priority === 'critical').length
        },
        meetingStats: {
          todayCount: meetings.filter(m => {
            const start = new Date(m.start_time);
            const today = new Date();
            return start.toDateString() === today.toDateString();
          }).length,
          weeklyHours: Math.round(meetings.filter(m => {
            const start = new Date(m.start_time);
            const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            return start > weekAgo;
          }).reduce((acc, m) => acc + (new Date(m.end_time) - new Date(m.start_time)) / (1000 * 60 * 60), 0))
        },
        learningStats: {
          inProgress: learningProgress.filter(p => p.status === 'in_progress').length,
          staleModules: learningProgress.filter(p => 
            p.status === 'in_progress' && 
            p.started_at && 
            new Date(p.started_at) < new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          ).length
        }
      };

      // Use AI to generate personalized coaching nudge
      const aiResponse = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a proactive work coach analyzing a user's productivity state. Based on the following data, determine if a coaching nudge is needed and if so, generate ONE specific, actionable nudge.

Current State: ${context.currentState}
Capacity Score: ${context.capacityScore}% (0-100, higher = more loaded)
Friction Index: ${context.frictionIndex}% (0-100, higher = more friction)
Meeting Pressure: ${context.meetingPressure}% (0-100, higher = more meetings)

Tasks:
- Total pending: ${context.taskStats.total}
- Overdue: ${context.taskStats.overdue}
- Deferred: ${context.taskStats.deferred}
- Unclear (low clarity): ${context.taskStats.unclear}
- High/Critical priority: ${context.taskStats.highPriority}

Meetings:
- Today: ${context.meetingStats.todayCount}
- This week: ${context.meetingStats.weeklyHours} hours

Learning:
- In progress: ${context.learningStats.inProgress}
- Stale (started >7 days ago): ${context.learningStats.staleModules}

Rules:
1. Only suggest ONE nudge for the MOST pressing issue
2. Be specific and actionable
3. If state is "clear" or "stretched" with low friction, suggest proactive learning or planning
4. If state is "overloaded" or "critical", focus on relief: defer tasks, decline meetings, or simplify
5. If many overdue/deferred tasks, suggest clarity or prioritization help
6. If high meeting pressure, suggest meeting optimization
7. If stale learning modules, suggest completion when capacity allows
8. Keep message under 100 words
9. Should the nudge be created? Only if there's a meaningful coaching opportunity. Return should_create: false if everything looks fine.

Return JSON with nudge details.`,
        response_json_schema: {
          type: "object",
          properties: {
            should_create: { type: "boolean" },
            nudge_type: { 
              type: "string", 
              enum: ["overload_warning", "schedule_suggestion", "learning_recommendation", "deadline_negotiation", "clarity_prompt", "meeting_prep", "break_reminder", "friction_reduction"]
            },
            title: { type: "string" },
            message: { type: "string" },
            priority: { type: "string", enum: ["low", "medium", "high"] },
            action_type: { type: "string", enum: ["reschedule", "defer", "delegate", "learn", "clarify", "acknowledge"] },
            action_data: { 
              type: "object",
              properties: {
                suggested_task_ids: { type: "array", items: { type: "string" } },
                suggested_learning_module_ids: { type: "array", items: { type: "string" } }
              }
            }
          },
          required: ["should_create", "nudge_type", "title", "message", "priority", "action_type"]
        }
      });

      // Create nudge if AI determined it's needed
      if (aiResponse.should_create) {
        await base44.entities.Nudge.create({
          user_id: user.id,
          nudge_type: aiResponse.nudge_type,
          title: aiResponse.title,
          message: aiResponse.message,
          priority: aiResponse.priority,
          action_type: aiResponse.action_type,
          action_data: aiResponse.action_data || {},
          status: 'pending'
        });
        
        // Refresh nudges to show the new one
        await refreshData();
      }
    } catch (error) {
      console.error('Error generating AI coaching nudge:', error);
    }
  }, [capacityScore, frictionIndex, meetingPressure, currentState, tasks, meetings, learningProgress, nudges, user, consent, refreshData]);

  // Initial load
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Recalculate metrics when data changes
  useEffect(() => {
    if (!loading) {
      calculateCapacity();
      calculateFriction();
      calculateMeetingPressure();
    }
  }, [loading, tasks, meetings, calculateCapacity, calculateFriction, calculateMeetingPressure]);
  
  // Update currentState when metrics change
  useEffect(() => {
    setCurrentState(inferState({ capacityScore, frictionIndex, meetingPressure }));
  }, [capacityScore, frictionIndex, meetingPressure]);

  // Check for nudges when metrics change (with debouncing)
  useEffect(() => {
    if (!loading && user && consent) {
      const timer = setTimeout(() => {
        checkForNudges();
      }, 2000); // Debounce to avoid too many AI calls
      return () => clearTimeout(timer);
    }
  }, [capacityScore, meetingPressure, frictionIndex, loading, user, consent, checkForNudges]);

  // Polling for real-time updates (every 30 seconds)
  useEffect(() => {
    const interval = setInterval(refreshData, 30000);
    return () => clearInterval(interval);
  }, [refreshData]);

  // Get today's items
  const getTodaysTasks = useCallback(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return tasks.filter(t => {
      if (t.status === 'done') return false;
      if (!t.due_date && !t.scheduled_date) return t.priority === 'high' || t.priority === 'critical';
      const taskDate = new Date(t.scheduled_date || t.due_date);
      taskDate.setHours(0, 0, 0, 0);
      return taskDate <= today;
    }).sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }, [tasks]);

  const getTodaysMeetings = useCallback(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return meetings.filter(m => {
      const start = new Date(m.start_time);
      return start >= today && start < tomorrow;
    }).sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
  }, [meetings]);
  
  // Update consent preferences
  const setConsent = useCallback(async (updates) => {
    if (!consent?.id) return;
    
    try {
      const updated = await base44.entities.ConsentPreference.update(consent.id, updates);
      setConsentState(updated);
    } catch (error) {
      console.error('Error updating consent:', error);
      throw error;
    }
  }, [consent]);

  const value = {
    // User & Role
    user,
    isManager: user?.role === 'admin' || user?.role_type === 'manager' || user?.role_type === 'exec' || user?.role_type === 'org_admin',
    isHR: user?.role_type === 'hr' || user?.role_type === 'ld',
    isAdmin: user?.role === 'admin' || user?.role_type === 'org_admin' || user?.role_type === 'platform_admin',
    
    // Raw data
    tasks,
    meetings,
    notes,
    nudges,
    signals,
    inboxItems,
    learningModules,
    learningProgress,
    learningPathways,
    learningPreference,
    
    // Computed metrics
    capacityScore,
    frictionIndex,
    meetingPressure,
    currentState,
    
    // Derived data
    todaysTasks: getTodaysTasks(),
    todaysMeetings: getTodaysMeetings(),
    pendingNudges: nudges.filter(n => n.status === 'pending'),
    unreadInbox: inboxItems.filter(i => !i.is_read).length,
    
    // State
    loading,
    error,
    lastRefresh,
    consent,
    
    // Actions
    refreshData,
    createTask,
    updateTask,
    createMeeting,
    acceptNudge,
    dismissNudge,
    logEvent,
    setConsent,
  };

  return (
    <NoiContext.Provider value={value}>
      {children}
    </NoiContext.Provider>
  );
}

export function useNoi() {
  const context = useContext(NoiContext);
  if (!context) {
    throw new Error('useNoi must be used within a NoiProvider');
  }
  return context;
}

export default NoiContext;