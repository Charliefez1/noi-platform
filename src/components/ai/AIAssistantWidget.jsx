import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Loader2, Minimize2, Maximize2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import { cn } from "@/lib/utils";

export default function AIAssistantWidget({ currentPage }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (isOpen && !conversationId) {
      initializeConversation();
    }
  }, [isOpen]);

  useEffect(() => {
    if (conversationId) {
      const unsubscribe = base44.agents.subscribeToConversation(conversationId, (data) => {
        setMessages(data.messages || []);
      });
      return () => unsubscribe();
    }
  }, [conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const initializeConversation = async () => {
    try {
      const conversation = await base44.agents.createConversation({
        agent_name: 'noi_assistant',
        metadata: {
          name: 'Noi Assistant Chat',
          current_page: currentPage
        }
      });
      setConversationId(conversation.id);
      
      // Send initial greeting with context
      setTimeout(() => {
        handleSendMessage(`Hi! I'm on the ${currentPage} page. What can you help me with?`, true);
      }, 500);
    } catch (error) {
      console.error('Error initializing conversation:', error);
      toast.error('Failed to start conversation');
    }
  };

  const handleSendMessage = async (messageText = input, skipClear = false) => {
    if (!messageText.trim() || isSending) return;
    
    setIsSending(true);
    if (!skipClear) setInput('');

    try {
      const conversation = await base44.agents.getConversation(conversationId);
      await base44.agents.addMessage(conversation, {
        role: 'user',
        content: messageText
      });
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90 z-50"
        size="icon"
      >
        <MessageSquare className="w-6 h-6" />
      </Button>
    );
  }

  return (
    <div 
      className={cn(
        "fixed z-50 bg-background border border-border shadow-2xl rounded-2xl flex flex-col transition-all duration-300",
        isExpanded 
          ? "inset-4" 
          : "bottom-6 right-6 w-96 h-[600px]"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-primary/5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
            <MessageSquare className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Noi Assistant</h3>
            <p className="text-xs text-muted-foreground">Your AI work companion</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-8 w-8"
          >
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(false)}
            className="h-8 w-8"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, idx) => (
          <div
            key={idx}
            className={cn(
              "flex gap-3",
              message.role === 'user' ? "justify-end" : "justify-start"
            )}
          >
            {message.role !== 'user' && (
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                <MessageSquare className="w-4 h-4 text-primary" />
              </div>
            )}
            <div className={cn(
              "max-w-[80%] rounded-2xl px-4 py-2.5",
              message.role === 'user' 
                ? "bg-primary text-primary-foreground" 
                : "bg-muted"
            )}>
              {message.role === 'user' ? (
                <p className="text-sm leading-relaxed">{message.content}</p>
              ) : (
                <ReactMarkdown 
                  className="text-sm prose prose-sm prose-slate dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
                  components={{
                    p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                    ul: ({ children }) => <ul className="ml-4 mb-2 list-disc">{children}</ul>,
                    ol: ({ children }) => <ol className="ml-4 mb-2 list-decimal">{children}</ol>,
                    li: ({ children }) => <li className="mb-1">{children}</li>,
                    code: ({ inline, children }) => 
                      inline ? (
                        <code className="px-1 py-0.5 rounded bg-background text-xs">{children}</code>
                      ) : (
                        <code className="block p-2 rounded bg-background text-xs my-2">{children}</code>
                      )
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              )}
              
              {/* Tool calls */}
              {message.tool_calls?.map((tool, i) => (
                <div key={i} className="mt-2 text-xs bg-background/50 rounded-lg p-2">
                  <span className="font-medium">🔧 {tool.name?.split('.').pop()}</span>
                  {tool.status === 'running' && <Loader2 className="inline w-3 h-3 ml-2 animate-spin" />}
                </div>
              ))}
            </div>
          </div>
        ))}
        {isSending && (
          <div className="flex gap-3 justify-start">
            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
              <Loader2 className="w-4 h-4 text-primary animate-spin" />
            </div>
            <div className="bg-muted rounded-2xl px-4 py-2.5">
              <p className="text-sm text-muted-foreground">Thinking...</p>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border bg-background">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me anything about your work..."
            className="resize-none min-h-[44px] max-h-32"
            rows={1}
          />
          <Button
            onClick={() => handleSendMessage()}
            disabled={!input.trim() || isSending}
            size="icon"
            className="h-11 w-11 flex-shrink-0"
          >
            {isSending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Ask about tasks, schedule, learning, or insights • Press Enter to send
        </p>
      </div>
    </div>
  );
}