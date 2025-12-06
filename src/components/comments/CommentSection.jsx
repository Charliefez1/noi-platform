import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

export default function CommentSection({ entityType, entityId, currentUser, users = [] }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (entityId) {
      fetchComments();
      const interval = setInterval(fetchComments, 10000); // Poll every 10s
      return () => clearInterval(interval);
    }
  }, [entityId]);

  const fetchComments = async () => {
    try {
      const data = await base44.entities.Comment.filter(
        { entity_type: entityType, entity_id: entityId },
        'created_date'
      );
      setComments(data || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendComment = async () => {
    if (!newComment.trim()) return;
    
    setSending(true);
    try {
      // Extract mentions from comment (e.g., @userId)
      const mentionRegex = /@(\w+)/g;
      const mentions = [];
      let match;
      while ((match = mentionRegex.exec(newComment)) !== null) {
        const mentionedUser = users.find(u => 
          u.full_name?.toLowerCase().includes(match[1].toLowerCase()) ||
          u.email?.toLowerCase().includes(match[1].toLowerCase())
        );
        if (mentionedUser && !mentions.includes(mentionedUser.id)) {
          mentions.push(mentionedUser.id);
        }
      }

      await base44.entities.Comment.create({
        entity_type: entityType,
        entity_id: entityId,
        content: newComment,
        mentions
      });

      // Create notifications for mentions
      for (const userId of mentions) {
        if (userId !== currentUser?.id) {
          await base44.entities.Notification.create({
            user_id: userId,
            type: 'comment_mention',
            title: 'You were mentioned',
            message: `${currentUser?.full_name || 'Someone'} mentioned you in a comment`,
            entity_type: entityType,
            entity_id: entityId,
            is_read: false
          });
        }
      }

      setNewComment('');
      fetchComments();
      toast.success('Comment posted');
    } catch (error) {
      toast.error('Failed to post comment');
    } finally {
      setSending(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!confirm('Delete this comment?')) return;
    try {
      await base44.entities.Comment.delete(commentId);
      fetchComments();
      toast.success('Comment deleted');
    } catch (error) {
      toast.error('Failed to delete comment');
    }
  };

  const getUserName = (userId) => {
    const user = users.find(u => u.id === userId);
    return user?.full_name || user?.email || 'Unknown';
  };

  const getUserInitials = (userId) => {
    const name = getUserName(userId);
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="space-y-4">
      {/* Comments List */}
      <ScrollArea className="h-64 border rounded-lg p-4">
        {loading ? (
          <div className="text-center text-sm text-muted-foreground py-8">Loading comments...</div>
        ) : comments.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground py-8">
            No comments yet. Be the first to comment!
          </div>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => (
              <div key={comment.id} className="flex gap-3">
                <Avatar className="w-8 h-8 flex-shrink-0">
                  <AvatarFallback className="text-xs">
                    {getUserInitials(comment.created_by)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{getUserName(comment.created_by)}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(comment.created_date), { addSuffix: true })}
                      </span>
                    </div>
                    {comment.created_by === currentUser?.id && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleDeleteComment(comment.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                  <p className="text-sm mt-1 whitespace-pre-wrap break-words">{comment.content}</p>
                  {comment.mentions?.length > 0 && (
                    <div className="flex items-center gap-1 mt-2 text-xs text-primary">
                      Mentioned: {comment.mentions.map(id => getUserName(id)).join(', ')}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* New Comment Input */}
      <div className="space-y-2">
        <Textarea
          placeholder="Write a comment... Use @name to mention someone"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="min-h-[80px] resize-none"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              handleSendComment();
            }
          }}
        />
        <div className="flex justify-between items-center">
          <p className="text-xs text-muted-foreground">
            Press Cmd/Ctrl + Enter to send
          </p>
          <Button onClick={handleSendComment} disabled={sending || !newComment.trim()}>
            <Send className="w-4 h-4 mr-2" />
            {sending ? 'Sending...' : 'Send'}
          </Button>
        </div>
      </div>
    </div>
  );
}