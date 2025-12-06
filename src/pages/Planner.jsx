import React, { useState } from 'react';
import { useNoi } from '@/components/core/NoiContext';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Sparkles, Plus, ChevronLeft, ChevronRight, Clock, AlertTriangle, Loader2, Maximize2, Minimize2 } from 'lucide-react';
import { format, addDays, startOfWeek, isSameDay } from 'date-fns';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const timeSlots = Array.from({ length: 12 }, (_, i) => i + 7); // 7am to 6pm

export default function PlannerPage() {
  const { tasks, meetings, capacityScore, createMeeting, refreshData } = useNoi();
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [generating, setGenerating] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const weekDays = Array.from({ length: 5 }, (_, i) => addDays(currentWeekStart, i));
  const unscheduledTasks = tasks.filter(t => t.status === 'todo' && !t.scheduled_date);

  const getBlocksForDay = (day) => {
    return meetings.filter(m => {
      const meetingDate = new Date(m.start_time);
      return isSameDay(meetingDate, day);
    });
  };

  const handleAISuggest = async () => {
    setGenerating(true);
    try {
      const unscheduled = unscheduledTasks.slice(0, 5);
      const existingMeetings = meetings.filter(m => {
        const start = new Date(m.start_time);
        return start >= currentWeekStart && start < addDays(currentWeekStart, 5);
      });

      const prompt = `I have the following unscheduled tasks:
${unscheduled.map(t => `- ${t.title} (${t.estimated_minutes || 30}min, priority: ${t.priority})`).join('\n')}

And these existing meetings this week:
${existingMeetings.map(m => `- ${m.title}: ${format(new Date(m.start_time), 'EEE h:mm a')} - ${format(new Date(m.end_time), 'h:mm a')}`).join('\n')}

Current cognitive load: ${capacityScore}%

Suggest optimal time slots for the unscheduled tasks, avoiding back-to-back scheduling and respecting existing meetings. Consider deep work in mornings when possible.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: 'object',
          properties: {
            suggestions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  task_title: { type: 'string' },
                  suggested_day: { type: 'string' },
                  suggested_time: { type: 'string' },
                  reasoning: { type: 'string' }
                }
              }
            },
            capacity_warning: { type: 'string' }
          }
        }
      });

      setAiSuggestions(result);
      toast.success('AI schedule suggestions generated');
    } catch (error) {
      toast.error('Failed to generate suggestions');
    } finally {
      setGenerating(false);
    }
  };

  const handleAcceptSuggestion = async (suggestion) => {
    try {
      // Find the matching task
      const matchingTask = unscheduledTasks.find(t => t.title === suggestion.task_title);
      
      // Create a time block for the task
      const dayMap = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4 };
      const dayOffset = dayMap[suggestion.suggested_day.slice(0, 3)] || 0;
      const targetDay = addDays(currentWeekStart, dayOffset);
      
      // Parse time (e.g., "9:00 AM")
      const [time, period] = suggestion.suggested_time.split(' ');
      const [hours, minutes] = time.split(':').map(Number);
      let hour = hours;
      if (period === 'PM' && hour !== 12) hour += 12;
      if (period === 'AM' && hour === 12) hour = 0;

      const startTime = new Date(targetDay);
      startTime.setHours(hour, minutes || 0, 0, 0);
      
      const endTime = new Date(startTime);
      endTime.setMinutes(endTime.getMinutes() + (matchingTask?.estimated_minutes || 30));

      await createMeeting({
        title: suggestion.task_title,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        type: 'deep_work',
        source: 'ai_suggestion',
        linked_task_ids: matchingTask ? [matchingTask.id] : []
      });

      // Remove from suggestions
      setAiSuggestions({
        ...aiSuggestions,
        suggestions: aiSuggestions.suggestions.filter(s => s.task_title !== suggestion.task_title)
      });

      toast.success(`Scheduled: ${suggestion.task_title}`);
    } catch (error) {
      toast.error('Failed to schedule task');
    }
  };

  return (
    <div className={`${isExpanded ? 'fixed inset-0 z-50 bg-background p-6' : 'h-[calc(100vh-140px)]'} flex flex-col space-y-4 overflow-hidden`}>
      <div className="flex justify-between items-center flex-shrink-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Planner</h1>
          <p className="text-muted-foreground">Time blocking and schedule optimization</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            className="gap-2 text-primary border-primary/30 bg-primary/5 hover:bg-primary/10"
            onClick={handleAISuggest}
            disabled={generating || unscheduledTasks.length === 0}
          >
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {generating ? 'Generating...' : 'AI Suggest Schedule'}
          </Button>
          <Button className="gap-2 bg-primary">
            <Plus className="w-4 h-4" /> Add Block
          </Button>
        </div>
      </div>

      {/* Capacity Warning */}
      {capacityScore > 80 && (
        <Alert className="border-orange-500/50 bg-orange-500/10 flex-shrink-0">
          <AlertTriangle className="h-4 w-4 text-orange-500" />
          <AlertDescription className="text-orange-200">
            Your capacity is at {capacityScore}%. Consider rescheduling or declining some commitments.
          </AlertDescription>
        </Alert>
      )}

      {/* AI Suggestions Panel */}
      {aiSuggestions && aiSuggestions.suggestions?.length > 0 && (
        <Card className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border-indigo-500/20 flex-shrink-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-indigo-400">
              <Sparkles className="w-5 h-5" /> AI Schedule Suggestions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {aiSuggestions.capacity_warning && (
              <p className="text-sm text-yellow-400 mb-4">{aiSuggestions.capacity_warning}</p>
            )}
            <div className="space-y-3">
              {aiSuggestions.suggestions.map((suggestion, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
                  <div>
                    <p className="font-medium">{suggestion.task_title}</p>
                    <p className="text-sm text-muted-foreground">
                      {suggestion.suggested_day} at {suggestion.suggested_time}
                    </p>
                    {suggestion.reasoning && (
                      <p className="text-xs text-muted-foreground mt-1">{suggestion.reasoning}</p>
                    )}
                  </div>
                  <Button size="sm" onClick={() => handleAcceptSuggestion(suggestion)}>
                    Accept
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Week Navigation */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => setCurrentWeekStart(addDays(currentWeekStart, -7))}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="font-medium">
            {format(currentWeekStart, 'MMM d')} - {format(addDays(currentWeekStart, 4), 'MMM d, yyyy')}
          </span>
          <Button variant="ghost" size="icon" onClick={() => setCurrentWeekStart(addDays(currentWeekStart, 7))}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex gap-2">
          <Badge variant="secondary" className="gap-1"><span className="w-2 h-2 rounded-full bg-green-500"></span> Deep Work</Badge>
          <Badge variant="secondary" className="gap-1"><span className="w-2 h-2 rounded-full bg-primary"></span> Meeting</Badge>
          <Badge variant="secondary" className="gap-1"><span className="w-2 h-2 rounded-full bg-orange-500"></span> Break</Badge>
          <Badge variant="secondary" className="gap-1"><span className="w-2 h-2 rounded-full bg-purple-500"></span> Learning</Badge>
        </div>
      </div>

      {/* Calendar Grid */}
      <Card className="overflow-hidden flex-1 flex flex-col min-h-0">
        <div className="grid grid-cols-6 border-b border-border flex-shrink-0">
          <div className="p-3 text-xs text-muted-foreground flex items-center justify-center">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>
          </div>
          {weekDays.map((day, i) => (
            <div key={i} className="p-3 text-center border-l border-border">
              <div className="text-xs text-muted-foreground">{format(day, 'EEE')}</div>
              <div className={`text-lg font-semibold ${isSameDay(day, new Date()) ? 'text-primary' : ''}`}>
                {format(day, 'd')}
              </div>
            </div>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto min-h-0">
          {timeSlots.map((hour) => (
            <div key={hour} className="grid grid-cols-6 border-b border-border/50">
              <div className="p-2 text-xs text-muted-foreground text-right pr-4">
                {hour}:00
              </div>
              {weekDays.map((day, dayIndex) => {
                const blocks = getBlocksForDay(day).filter(m => {
                  const startHour = new Date(m.start_time).getHours();
                  return startHour === hour;
                });

                return (
                  <div key={dayIndex} className="border-l border-border/50 min-h-[60px] p-1 hover:bg-accent/30 transition-colors">
                    {blocks.map((block, blockIndex) => (
                      <div
                        key={blockIndex}
                        className={`
                          p-2 rounded-lg text-xs font-medium mb-1
                          ${block.type === 'deep_work' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : ''}
                          ${block.type === 'meeting' ? 'bg-primary/20 text-primary border border-primary/30' : ''}
                          ${block.type === 'break' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : ''}
                          ${block.type === 'learning_block' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : ''}
                          ${!['deep_work', 'meeting', 'break', 'learning_block'].includes(block.type) ? 'bg-primary/20 text-primary border border-primary/30' : ''}
                        `}
                      >
                        {block.title}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </Card>

      {/* Unscheduled Tasks */}
      <Card className="flex-shrink-0">
        <CardHeader className="py-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            Unscheduled Tasks ({unscheduledTasks.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="py-2">
          {unscheduledTasks.length === 0 ? (
            <p className="text-sm text-muted-foreground">All tasks are scheduled!</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {unscheduledTasks.slice(0, 6).map((task) => (
                <Badge 
                  key={task.id} 
                  variant="outline" 
                  className={`py-1.5 px-2.5 cursor-grab text-xs ${
                    task.priority === 'critical' ? 'border-red-500/50 text-red-400' :
                    task.priority === 'high' ? 'border-orange-500/50 text-orange-400' :
                    ''
                  }`}
                >
                  {task.title}
                  <span className="ml-2 text-muted-foreground">{task.estimated_minutes || 30}m</span>
                </Badge>
              ))}
              {unscheduledTasks.length > 6 && (
                <Badge variant="secondary" className="text-xs">+{unscheduledTasks.length - 6} more</Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}