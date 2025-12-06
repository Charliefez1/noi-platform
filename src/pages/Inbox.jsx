import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Mail, 
  Calendar, 
  CheckSquare, 
  Bell, 
  Archive, 
  Trash2, 
  Star,
  Search,
  Sparkles,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { useNoi } from '@/components/core/NoiContext';
import InboxItemCard from '@/components/inbox/InboxItemCard';
import LoadingState from '@/components/shared/LoadingState';
import ErrorBanner from '@/components/shared/ErrorBanner';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ShieldOff } from 'lucide-react';

export default function InboxPage() {
  const { inboxItems, refreshData, loading, error, consent, currentState } = useNoi();
  const [filter, setFilter] = useState('all');
  const [effortFilter, setEffortFilter] = useState(
    currentState?.label === 'overloaded' || currentState?.label === 'critical' ? 'light' : 'all'
  );
  const [search, setSearch] = useState('');
  const [processingAll, setProcessingAll] = useState(false);

  const filteredItems = inboxItems.filter(item => {
    if (filter === 'unread' && item.is_read) return false;
    if (filter === 'starred' && !item.is_starred) return false;
    if (filter === 'meetings' && item.item_type !== 'meeting_invite') return false;
    if (filter === 'tasks' && item.item_type !== 'task_assignment') return false;
    if (search && !item.subject.toLowerCase().includes(search.toLowerCase())) return false;
    
    // Effort filtering
    if (effortFilter !== 'all') {
      const effortLevel = item.ai_summary?.effort_level || (item.ai_summary ? 'pending' : null);
      if (effortFilter === 'light' && effortLevel !== 'light') return false;
      if (effortFilter === 'medium' && effortLevel !== 'medium') return false;
      if (effortFilter === 'heavy' && effortLevel !== 'heavy') return false;
    }
    
    return true;
  });

  const unreadCount = inboxItems.filter(i => !i.is_read).length;

  const handleProcessAll = async () => {
    if (!consent?.allow_inbox_ai) {
      toast.error('AI processing is disabled in your privacy settings');
      return;
    }
    
    setProcessingAll(true);
    try {
      const unprocessed = inboxItems.filter(i => !i.ai_summary).slice(0, 5);
      
      for (const item of unprocessed) {
        const result = await base44.integrations.Core.InvokeLLM({
          prompt: `Summarize this message concisely and classify its effort level:\n\nFrom: ${item.from_name}\nSubject: ${item.subject}\nContent: ${item.content || item.preview}\n\nEffort classification:\n- light: Quick actions under 2 minutes (simple replies, quick reads, acknowledgments)\n- medium: Actions requiring 2-15 minutes of thoughtful work (reviews, simple decisions, scheduling)\n- heavy: Actions requiring significant time, coordination, or decision-making (complex decisions, contract reviews, planning)`,
          response_json_schema: {
            type: 'object',
            properties: {
              summary: { type: 'string' },
              priority: { type: 'string', enum: ['low', 'medium', 'high'] },
              suggested_action: { type: 'string' },
              effort_level: { type: 'string', enum: ['light', 'medium', 'heavy'] }
            }
          }
        });

        await base44.entities.InboxItem.update(item.id, { 
          ai_summary: JSON.stringify(result),
          priority: result.priority,
          extracted_actions: result.suggested_action ? [result.suggested_action] : []
        });
      }
      
      toast.success(`Processed ${unprocessed.length} items`);
      refreshData();
    } catch (error) {
      toast.error('Failed to process items');
    } finally {
      setProcessingAll(false);
    }
  };

  if (loading && inboxItems.length === 0) {
    return <LoadingState message="Loading inbox..." />;
  }

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-140px)] gap-4 md:gap-6">
      {error && (
        <div className="absolute top-4 left-0 right-0 mx-4 md:mx-6 z-10">
          <ErrorBanner error={error} onRetry={refreshData} />
        </div>
      )}
      
      {/* Sidebar Filter */}
      <div className="w-full lg:w-64 flex-shrink-0 space-y-1 lg:overflow-y-auto">
        <h1 className="text-2xl font-bold mb-4 lg:mb-6 px-2">Inbox</h1>
        
        <Button 
          variant={filter === 'all' ? 'secondary' : 'ghost'} 
          className="w-full justify-start" 
          onClick={() => setFilter('all')}
        >
          <Mail className="w-4 h-4 mr-2" /> All
          {inboxItems.length > 0 && (
            <span className="ml-auto text-xs bg-muted rounded-full px-2 py-0.5">
              {inboxItems.length}
            </span>
          )}
        </Button>
        
        <Button 
          variant={filter === 'unread' ? 'secondary' : 'ghost'} 
          className="w-full justify-start" 
          onClick={() => setFilter('unread')}
        >
          <Star className="w-4 h-4 mr-2" /> Unread
          {unreadCount > 0 && (
            <span className="ml-auto text-xs bg-primary text-primary-foreground rounded-full px-2 py-0.5">
              {unreadCount}
            </span>
          )}
        </Button>

        <div className="pt-4 pb-2 px-2 text-xs font-semibold text-muted-foreground uppercase hidden lg:block">
          Categories
        </div>
        
        <div className="flex lg:flex-col gap-2 lg:gap-0">
          <Button 
            variant={filter === 'meetings' ? 'secondary' : 'ghost'} 
            className="flex-1 lg:w-full justify-start text-muted-foreground"
            onClick={() => setFilter('meetings')}
          >
            <Calendar className="w-4 h-4 mr-2" /> <span className="hidden sm:inline">Meetings</span>
          </Button>
          
          <Button 
            variant={filter === 'tasks' ? 'secondary' : 'ghost'} 
            className="flex-1 lg:w-full justify-start text-muted-foreground"
            onClick={() => setFilter('tasks')}
          >
            <CheckSquare className="w-4 h-4 mr-2" /> <span className="hidden sm:inline">Tasks</span>
          </Button>
          
          <Button 
            variant={filter === 'alerts' ? 'secondary' : 'ghost'} 
            className="flex-1 lg:w-full justify-start text-muted-foreground"
            onClick={() => setFilter('alerts')}
          >
            <Bell className="w-4 h-4 mr-2" /> <span className="hidden sm:inline">Alerts</span>
          </Button>
        </div>

        <div className="pt-4 pb-2 px-2 text-xs font-semibold text-muted-foreground uppercase hidden lg:block">
          Effort Level
        </div>
        
        <div className="hidden lg:flex lg:flex-col gap-1">
          <Button 
            variant={effortFilter === 'all' ? 'secondary' : 'ghost'} 
            className="w-full justify-start text-sm"
            onClick={() => setEffortFilter('all')}
          >
            All Items
          </Button>
          
          <Button 
            variant={effortFilter === 'light' ? 'secondary' : 'ghost'} 
            className="w-full justify-start text-sm text-muted-foreground"
            onClick={() => setEffortFilter('light')}
          >
            ⚡ Light (Under 2 min)
          </Button>
          
          <Button 
            variant={effortFilter === 'medium' ? 'secondary' : 'ghost'} 
            className="w-full justify-start text-sm text-muted-foreground"
            onClick={() => setEffortFilter('medium')}
          >
            🎯 Medium (2-15 min)
          </Button>
          
          <Button 
            variant={effortFilter === 'heavy' ? 'secondary' : 'ghost'} 
            className="w-full justify-start text-sm text-muted-foreground"
            onClick={() => setEffortFilter('heavy')}
          >
            🔥 Heavy (Complex)
          </Button>
        </div>

        <div className="pt-4 lg:pt-6 space-y-2">
          {!consent?.allow_inbox_ai && (
            <Alert className="border-muted bg-muted/20 hidden lg:block">
              <ShieldOff className="w-4 h-4" />
              <AlertDescription className="text-xs">
                AI processing is currently disabled in your privacy settings.
              </AlertDescription>
            </Alert>
          )}
          <Button 
            variant="outline" 
            className="w-full gap-2"
            onClick={handleProcessAll}
            disabled={processingAll || !consent?.allow_inbox_ai}
          >
            {processingAll ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            {processingAll ? 'Processing...' : 'AI Process All'}
          </Button>
        </div>
      </div>

      {/* Main List */}
      <Card className="flex-1 border border-border/50 overflow-hidden flex flex-col shadow-sm min-h-0">
        {(currentState?.label === 'overloaded' || currentState?.label === 'critical') && effortFilter === 'light' && (
          <Alert className="m-2 md:m-4 mb-0 border-blue-500/50 bg-blue-500/10">
            <AlertDescription className="text-sm">
              You look close to capacity, so we're showing lighter items first. 
              <Button 
                variant="link" 
                size="sm" 
                className="h-auto p-0 ml-1 text-blue-400"
                onClick={() => setEffortFilter('all')}
              >
                Show all items
              </Button>
            </AlertDescription>
          </Alert>
        )}
        
        {/* Toolbar */}
        <div className="p-2 md:p-4 border-b border-border/50 flex justify-between items-center bg-muted/10 gap-2">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" onClick={refreshData}>
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0 hidden md:flex">
              <Archive className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0 hidden md:flex">
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto">
          {filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <Mail className="w-12 h-12 mb-4 opacity-50" />
              <p className="font-medium">No items</p>
              <p className="text-sm">Your inbox is empty</p>
            </div>
          ) : (
            filteredItems.map((item) => (
              <InboxItemCard 
                key={item.id} 
                item={item} 
                onUpdate={refreshData}
              />
            ))
          )}
        </div>
      </Card>
    </div>
  );
}