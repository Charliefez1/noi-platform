import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { 
  Mail, 
  Calendar, 
  CheckSquare, 
  Bell, 
  BookOpen,
  Sparkles,
  FileText,
  MoreVertical,
  Loader2
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useNoi } from '@/components/core/NoiContext';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const typeIcons = {
  email: Mail,
  meeting_invite: Calendar,
  task_assignment: CheckSquare,
  notification: Bell,
  alert: Bell,
  learning: BookOpen,
};

const typeColors = {
  email: 'text-blue-500',
  meeting_invite: 'text-purple-500',
  task_assignment: 'text-green-500',
  notification: 'text-yellow-500',
  alert: 'text-red-500',
  learning: 'text-indigo-500',
};

export default function InboxItemCard({ item, onUpdate }) {
  const { createTask, createMeeting, refreshData, consent } = useNoi();
  const [summarizing, setSummarizing] = useState(false);
  
  // Parse ai_summary - might be a JSON string or a simple string
  const parseSummary = (data) => {
    if (!data) return null;
    if (typeof data === 'object') return data;
    try {
      return JSON.parse(data);
    } catch {
      return { summary: data };
    }
  };
  
  const [summary, setSummary] = useState(parseSummary(item.ai_summary));

  const Icon = typeIcons[item.item_type] || Mail;
  const iconColor = typeColors[item.item_type] || 'text-muted-foreground';

  const handleSummarize = async () => {
    if (!consent?.allow_inbox_ai) {
      toast.error('AI processing is disabled in your privacy settings');
      return;
    }
    
    setSummarizing(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Summarize this message concisely and classify its effort level:\n\nFrom: ${item.from_name}\nSubject: ${item.subject}\nContent: ${item.content || item.preview}\n\nEffort classification:\n- light: Quick actions under 2 minutes (simple replies, quick reads, acknowledgments)\n- medium: Actions requiring 2-15 minutes of thoughtful work (reviews, simple decisions, scheduling)\n- heavy: Actions requiring significant time, coordination, or decision-making (complex decisions, contract reviews, planning)`,
        response_json_schema: {
          type: 'object',
          properties: {
            summary: { type: 'string' },
            suggested_action: { type: 'string' },
            effort_level: { type: 'string', enum: ['light', 'medium', 'heavy'] }
          }
        }
      });
      
      setSummary(result);
      await base44.entities.InboxItem.update(item.id, { 
        ai_summary: JSON.stringify(result),
        extracted_actions: result.suggested_action ? [result.suggested_action] : []
      });
      toast.success('Summary generated');
    } catch (error) {
      toast.error('Failed to summarize');
    } finally {
      setSummarizing(false);
    }
  };

  const handleConvertToTask = async () => {
    try {
      await createTask({
        title: item.subject,
        description: item.preview || item.content,
        source: 'inbox',
        priority: item.priority || 'medium',
        status: 'todo'
      });
      
      await base44.entities.InboxItem.update(item.id, { 
        linked_task_id: 'linked',
        is_archived: true 
      });
      
      toast.success('Task created from inbox item');
      refreshData();
    } catch (error) {
      toast.error('Failed to create task');
    }
  };

  const handleAddToCalendar = async () => {
    if (item.item_type !== 'meeting_invite') {
      toast.error('Only meeting invites can be added to calendar');
      return;
    }
    
    try {
      // Parse meeting details from preview or use defaults
      const now = new Date();
      const startTime = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Tomorrow
      startTime.setHours(10, 0, 0, 0);
      const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // 1 hour

      await createMeeting({
        title: item.subject,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        type: 'meeting'
      });
      
      await base44.entities.InboxItem.update(item.id, { 
        linked_meeting_id: 'linked',
        is_archived: true 
      });
      
      toast.success('Meeting added to calendar');
      refreshData();
    } catch (error) {
      toast.error('Failed to add to calendar');
    }
  };

  const handleSaveToNotes = async () => {
    try {
      await base44.entities.Note.create({
        title: item.subject,
        content: item.content || item.preview,
        type: 'personal',
        tags: ['inbox']
      });
      
      await base44.entities.InboxItem.update(item.id, { 
        linked_note_id: 'linked' 
      });
      
      toast.success('Saved to notes');
      refreshData();
    } catch (error) {
      toast.error('Failed to save to notes');
    }
  };

  const handleMarkRead = async () => {
    await base44.entities.InboxItem.update(item.id, { is_read: true });
    if (onUpdate) onUpdate();
  };

  return (
    <div 
      className={`
        flex items-start gap-4 p-4 border-b border-border/50 hover:bg-accent/30 cursor-pointer transition-colors
        ${!item.is_read ? 'bg-primary/5' : ''}
      `}
      onClick={handleMarkRead}
    >
      <div className={`mt-1 ${iconColor}`}>
        <Icon className="w-5 h-5" />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-baseline mb-1">
          <h4 className={`text-sm truncate ${!item.is_read ? 'font-bold' : 'font-medium text-muted-foreground'}`}>
            {item.from_name}
          </h4>
          <span className="text-xs text-muted-foreground flex-shrink-0 flex items-center gap-1">
            {!item.is_read && <span className="w-2 h-2 rounded-full bg-primary" />}
            {item.created_date ? new Date(item.created_date).toLocaleDateString() : 'Now'}
          </span>
        </div>
        
        <h5 className={`text-sm mb-1 ${!item.is_read ? 'font-semibold' : ''}`}>
          {item.subject}
        </h5>
        
        <p className="text-xs text-muted-foreground line-clamp-1">
          {summary?.summary || summary || item.preview}
        </p>

        {summary && (
          <div className="mt-2 p-2 rounded-lg bg-primary/5 border border-primary/10">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-primary flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> AI Summary
              </p>
              {summary.effort_level && (
                <span className="text-xs px-1.5 py-0.5 rounded bg-muted/50">
                  {summary.effort_level === 'light' && '⚡ Light'}
                  {summary.effort_level === 'medium' && '🎯 Medium'}
                  {summary.effort_level === 'heavy' && '🔥 Heavy'}
                </span>
              )}
            </div>
            <p className="text-xs mt-1">{summary.summary || summary}</p>
          </div>
        )}
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
            <MoreVertical className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleSummarize} disabled={summarizing || !consent?.allow_inbox_ai}>
            {summarizing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
            {summarizing ? 'Summarizing...' : !consent?.allow_inbox_ai ? 'AI Disabled' : 'Summarize'}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleConvertToTask}>
            <CheckSquare className="w-4 h-4 mr-2" />
            Turn into Task
          </DropdownMenuItem>
          {item.item_type === 'meeting_invite' && (
            <DropdownMenuItem onClick={handleAddToCalendar}>
              <Calendar className="w-4 h-4 mr-2" />
              Add to Calendar
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={handleSaveToNotes}>
            <FileText className="w-4 h-4 mr-2" />
            Save to Notes
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}