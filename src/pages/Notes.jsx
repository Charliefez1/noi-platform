import React, { useState, useEffect } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Save, Sparkles, Trash2, CheckSquare, Calendar, Loader2 } from 'lucide-react';
import { toast } from "sonner";
import { Card } from '@/components/ui/card';
import { useNoi } from '@/components/core/NoiContext';

export default function NotesPage() {
  const { createTask, logEvent, refreshData } = useNoi();
  const [notes, setNotes] = useState([]);
  const [selectedNote, setSelectedNote] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [extracting, setExtracting] = useState(false);
  const [extractedActions, setExtractedActions] = useState([]);

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    const data = await base44.entities.Note.list({ sort: { created_date: -1 } });
    setNotes(data || []);
    if (data && data.length > 0 && !selectedNote) {
      selectNote(data[0]);
    }
  };

  const selectNote = (note) => {
    setSelectedNote(note);
    setTitle(note.title);
    setContent(note.content || '');
    setExtractedActions(note.extracted_actions || []);
  };

  const handleCreateNew = () => {
    const newNote = { id: 'new', title: '', content: '' };
    setSelectedNote(newNote);
    setTitle('');
    setContent('');
    setExtractedActions([]);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("Please enter a title");
      return;
    }

    try {
      if (selectedNote.id === 'new') {
        const created = await base44.entities.Note.create({
          title,
          content,
          type: 'personal',
          tags: [],
          extracted_actions: extractedActions,
          ai_processed: extractedActions.length > 0
        });
        setNotes([created, ...notes]);
        setSelectedNote(created);
        await logEvent('note_created', 'note', created.id);
        toast.success("Note created");
      } else {
        await base44.entities.Note.update(selectedNote.id, {
          title,
          content,
          extracted_actions: extractedActions
        });
        setNotes(notes.map(n => n.id === selectedNote.id ? { ...n, title, content, extracted_actions: extractedActions } : n));
        toast.success("Note saved");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to save note");
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (confirm("Are you sure?")) {
      await base44.entities.Note.delete(id);
      setNotes(notes.filter(n => n.id !== id));
      if (selectedNote?.id === id) {
        setSelectedNote(null);
        setTitle('');
        setContent('');
        setExtractedActions([]);
      }
      toast.success("Note deleted");
    }
  };

  const handleExtractActions = async () => {
    if (!content || content.replace(/<[^>]*>?/gm, '').trim().length < 20) {
      toast.error("Not enough content to extract actions");
      return;
    }

    setExtracting(true);
    try {
      const plainContent = content.replace(/<[^>]*>?/gm, '');
      
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze these meeting notes and extract:
1. Action items (tasks to be done)
2. Key decisions made

Notes:
${plainContent}

Be specific and actionable.`,
        response_json_schema: {
          type: 'object',
          properties: {
            actions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  action: { type: 'string' },
                  assignee: { type: 'string' },
                  due_date: { type: 'string' }
                }
              }
            },
            key_decisions: {
              type: 'array',
              items: { type: 'string' }
            }
          }
        }
      });

      const actions = result.actions || [];
      const decisions = result.key_decisions || [];
      
      setExtractedActions(actions);
      
      // Update the note with extracted data
      if (selectedNote.id !== 'new') {
        await base44.entities.Note.update(selectedNote.id, {
          extracted_actions: actions,
          key_decisions: decisions,
          ai_processed: true
        });
        await logEvent('action_extracted', 'note', selectedNote.id, { action_count: actions.length });
      }
      
      toast.success(`Extracted ${actions.length} actions and ${decisions.length} decisions`);
    } catch (error) {
      console.error(error);
      toast.error("Failed to extract actions");
    } finally {
      setExtracting(false);
    }
  };

  const handleConvertToTask = async (action) => {
    try {
      await createTask({
        title: action.action,
        description: `Extracted from note: ${title}`,
        source: 'note_extraction',
        linked_note_id: selectedNote.id,
        priority: 'medium',
        status: 'todo',
        due_date: action.due_date || undefined
      });
      
      // Mark as converted
      const updatedActions = extractedActions.map(a => 
        a.action === action.action ? { ...a, converted_to_task: true } : a
      );
      setExtractedActions(updatedActions);
      
      if (selectedNote.id !== 'new') {
        await base44.entities.Note.update(selectedNote.id, {
          extracted_actions: updatedActions
        });
      }
      
      toast.success("Task created from action");
      refreshData();
    } catch (error) {
      toast.error("Failed to create task");
    }
  };

  const filteredNotes = notes.filter(n => 
    n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    n.content?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-[calc(100vh-140px)] flex gap-6">
      {/* Sidebar List */}
      <div className="w-80 flex flex-col gap-4 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search notes..." 
              className="pl-9" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button size="icon" onClick={handleCreateNew}>
            <Plus className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {filteredNotes.map(note => (
            <Card 
              key={note.id}
              className={`
                p-4 cursor-pointer hover:bg-accent/50 transition-colors border-l-4 group
                ${selectedNote?.id === note.id ? 'bg-accent border-l-primary' : 'border-l-transparent'}
              `}
              onClick={() => selectNote(note)}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm line-clamp-1">{note.title || 'Untitled Note'}</h4>
                  {note.ai_processed && (
                    <Badge variant="secondary" className="mt-1 text-[10px] h-4">
                      <Sparkles className="w-2 h-2 mr-1" /> AI Processed
                    </Badge>
                  )}
                </div>
                {note.id !== 'new' && (
                  <button 
                    onClick={(e) => handleDelete(e, note.id)}
                    className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {note.content?.replace(/<[^>]*>?/gm, '') || 'No content'}
              </p>
            </Card>
          ))}
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 bg-card rounded-2xl border border-border/50 flex flex-col shadow-sm overflow-hidden">
        {selectedNote ? (
          <>
            <div className="p-6 border-b border-border/50 flex items-center justify-between">
              <Input 
                className="text-2xl font-bold border-none shadow-none px-0 focus-visible:ring-0 bg-transparent flex-1" 
                placeholder="Note Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <div className="flex gap-2 flex-shrink-0">
                <Button 
                  variant="outline" 
                  className="gap-2 text-indigo-500 border-indigo-200 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:border-indigo-800 dark:hover:bg-indigo-900/30"
                  onClick={handleExtractActions}
                  disabled={extracting}
                >
                  {extracting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  {extracting ? 'Extracting...' : 'Extract Actions'}
                </Button>
                <Button onClick={handleSave} className="gap-2">
                  <Save className="w-4 h-4" /> Save
                </Button>
              </div>
            </div>

            {/* Extracted Actions Panel */}
            {extractedActions.length > 0 && (
              <div className="p-4 border-b border-border/50 bg-muted/30">
                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-500" />
                  Extracted Actions ({extractedActions.length})
                </h4>
                <div className="space-y-2">
                  {extractedActions.map((action, idx) => (
                    <div 
                      key={idx} 
                      className={`flex items-center justify-between p-3 rounded-lg border ${
                        action.converted_to_task ? 'bg-green-500/10 border-green-500/20' : 'bg-background border-border/50'
                      }`}
                    >
                      <div className="flex-1">
                        <p className={`text-sm ${action.converted_to_task ? 'line-through text-muted-foreground' : ''}`}>
                          {action.action}
                        </p>
                        {action.assignee && (
                          <p className="text-xs text-muted-foreground">Assignee: {action.assignee}</p>
                        )}
                      </div>
                      {!action.converted_to_task && (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="gap-1 ml-2"
                          onClick={() => handleConvertToTask(action)}
                        >
                          <CheckSquare className="w-3 h-3" />
                          Create Task
                        </Button>
                      )}
                      {action.converted_to_task && (
                        <Badge variant="secondary" className="text-green-600">
                          <CheckSquare className="w-3 h-3 mr-1" /> Converted
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex-1 overflow-hidden relative">
              <ReactQuill 
                theme="snow" 
                value={content} 
                onChange={setContent} 
                className="h-full"
                modules={{
                  toolbar: [
                    [{ 'header': [1, 2, false] }],
                    ['bold', 'italic', 'underline', 'strike', 'blockquote'],
                    [{'list': 'ordered'}, {'list': 'bullet'}],
                    ['link', 'clean']
                  ],
                }}
              />
              <style>{`
                .ql-container { border: none !important; font-size: 1rem; height: 100%; }
                .ql-toolbar { border: none !important; border-bottom: 1px solid var(--border) !important; }
                .ql-editor { padding: 1.5rem; height: calc(100% - 42px); overflow-y: auto; }
              `}</style>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <Sparkles className="w-8 h-8 text-muted-foreground" />
            </div>
            <p>Select a note or create a new one to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
}