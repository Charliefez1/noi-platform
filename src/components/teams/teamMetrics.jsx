/**
 * Team Metrics Utilities
 * 
 * Pure functions for calculating user load and friction based on tasks and meetings.
 * These provide deterministic metrics without randomization.
 */

/**
 * Calculates a user's cognitive load (0-100) based on their tasks and meetings.
 * 
 * Factors:
 * - Pending tasks (weighted by priority)
 * - Meeting hours this week
 * - High/critical priority multipliers
 * 
 * @param {string} userId - The user ID to calculate load for
 * @param {Array} tasks - All tasks in the system
 * @param {Array} meetings - All meetings in the system
 * @returns {number} Load score from 0-100
 */
export function calculateUserLoad(userId, tasks = [], meetings = []) {
  if (!userId || !tasks || !meetings) return 0;

  // Get this week's date range
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  // Filter user's pending tasks
  const userTasks = tasks.filter(t => 
    (t.assignee_id === userId || t.assignee_ids?.includes(userId) || t.created_by === userId) &&
    t.status !== 'done'
  );

  // Calculate task load with priority weights
  let taskLoad = 0;
  const baseWeight = 3;
  userTasks.forEach(task => {
    let weight = baseWeight;
    if (task.priority === 'high') weight *= 1.5;
    if (task.priority === 'critical') weight *= 2;
    taskLoad += weight;
  });

  // Filter user's meetings this week
  const userMeetings = meetings.filter(m => {
    const start = new Date(m.start_time);
    return start >= weekStart && start < weekEnd &&
           (m.created_by === userId || m.attendees?.includes(userId));
  });

  // Calculate meeting hours
  const meetingMinutes = userMeetings.reduce((acc, m) => {
    const start = new Date(m.start_time);
    const end = new Date(m.end_time);
    return acc + (end - start) / (1000 * 60);
  }, 0);
  const meetingHours = meetingMinutes / 60;
  const meetingLoad = meetingHours * 12.5; // 12.5% per hour

  // Combined load, capped at 100
  const totalLoad = Math.min(taskLoad + meetingLoad, 100);
  return Math.round(totalLoad);
}

/**
 * Calculates a user's friction level based on task clarity and scheduling issues.
 * 
 * Factors:
 * - Overdue tasks
 * - Tasks with low clarity scores
 * - Deferred tasks
 * - Back-to-back meetings
 * 
 * @param {string} userId - The user ID to calculate friction for
 * @param {Array} tasks - All tasks in the system
 * @param {Array} meetings - All meetings in the system
 * @returns {string} Friction level: 'low', 'medium', or 'high'
 */
export function calculateUserFriction(userId, tasks = [], meetings = []) {
  if (!userId || !tasks || !meetings) return 'low';

  const userTasks = tasks.filter(t => 
    (t.assignee_id === userId || t.assignee_ids?.includes(userId) || t.created_by === userId) &&
    t.status !== 'done'
  );

  const userMeetings = meetings.filter(m => 
    m.created_by === userId || m.attendees?.includes(userId)
  );

  // If no data, return low
  if (userTasks.length === 0 && userMeetings.length === 0) {
    return 'low';
  }

  let frictionScore = 0;

  // Overdue tasks (+10 each)
  const now = new Date();
  const overdueTasks = userTasks.filter(t => 
    t.due_date && new Date(t.due_date) < now
  );
  frictionScore += overdueTasks.length * 10;

  // Deferred tasks (+5 each)
  const deferredTasks = userTasks.filter(t => 
    t.status === 'deferred' || (t.deferred_count && t.deferred_count > 0)
  );
  frictionScore += deferredTasks.length * 5;

  // Low clarity tasks (+3 each)
  const unclearTasks = userTasks.filter(t => 
    t.clarity_score && t.clarity_score < 50
  );
  frictionScore += unclearTasks.length * 3;

  // Back-to-back meetings (+5 each)
  const sortedMeetings = [...userMeetings].sort((a, b) => 
    new Date(a.start_time) - new Date(b.start_time)
  );
  for (let i = 1; i < sortedMeetings.length; i++) {
    const prevEnd = new Date(sortedMeetings[i - 1].end_time);
    const currStart = new Date(sortedMeetings[i].start_time);
    const gap = (currStart - prevEnd) / (1000 * 60);
    if (gap < 15 && gap >= 0) {
      frictionScore += 5;
    }
  }

  // Map score to levels
  if (frictionScore >= 40) return 'high';
  if (frictionScore >= 20) return 'medium';
  return 'low';
}

/**
 * Checks if a user has sufficient data for meaningful metrics and has consented to team aggregates.
 * 
 * @param {string} userId - The user ID to check
 * @param {Array} tasks - All tasks in the system
 * @param {Array} meetings - All meetings in the system
 * @param {Array} consentRecords - Consent preferences for all users
 * @returns {boolean} True if user has tasks or meetings AND has consented to team aggregates
 */
export function hasUserData(userId, tasks = [], meetings = [], consentRecords = []) {
  if (!userId) return false;
  
  // Check if user has consented to team aggregates
  const userConsent = consentRecords.find(c => c.user_id === userId);
  if (userConsent && !userConsent.allow_team_aggregates) {
    return false; // User opted out of team metrics
  }
  
  const userTasks = tasks.filter(t => 
    t.assignee_id === userId || t.assignee_ids?.includes(userId) || t.created_by === userId
  );
  
  const userMeetings = meetings.filter(m => 
    m.created_by === userId || m.attendees?.includes(userId)
  );
  
  return userTasks.length > 0 || userMeetings.length > 0;
}