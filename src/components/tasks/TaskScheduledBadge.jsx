import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function TaskScheduledBadge({ task, meetings }) {
  const linkedMeeting = meetings.find(m => m.linked_task_ids?.includes(task.id));
  
  if (!linkedMeeting) return null;
  
  const meetingStart = new Date(linkedMeeting.start_time);
  const isUpcoming = meetingStart > new Date();
  
  return (
    <div className="flex items-center gap-2 mt-2">
      <Badge variant="outline" className="gap-1 bg-green-500/10 text-green-500 border-green-500/30">
        <Calendar className="w-3 h-3" />
        Scheduled
      </Badge>
      <span className="text-xs text-muted-foreground">
        {format(meetingStart, 'MMM d, h:mm a')}
      </span>
      {isUpcoming && (
        <Link to={createPageUrl('Planner')}>
          <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
            View <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
        </Link>
      )}
    </div>
  );
}