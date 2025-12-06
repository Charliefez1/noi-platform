import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { 
  Plus, Search, FolderKanban, CheckCircle2, Clock, AlertTriangle, 
  BookOpen, MoreHorizontal, Pencil, Trash2, Link2, Maximize2, Minimize2
} from 'lucide-react';
import { useNoi } from '@/components/core/NoiContext';
import { toast } from 'sonner';
import { format, isPast } from 'date-fns';
import ProjectCard from '@/components/projects/ProjectCard';
import ProjectModal from '@/components/projects/ProjectModal';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function ProjectsPage() {
  const { tasks, learningModules, learningProgress, refreshData, user } = useNoi();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [saving, setSaving] = useState(false);
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [linkType, setLinkType] = useState('task');
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const data = await base44.entities.Project.list();
      setProjects(data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [projects, searchTerm, statusFilter]);

  const handleSaveProject = async (formData) => {
    setSaving(true);
    try {
      if (editingProject) {
        // Check for new team members and notify
        const newMembers = formData.team_members?.filter(id => !editingProject.team_members?.includes(id)) || [];
        
        await base44.entities.Project.update(editingProject.id, formData);
        
        // Notify new team members
        for (const userId of newMembers) {
          await base44.entities.Notification.create({
            user_id: userId,
            type: 'project_assigned',
            title: 'Added to project',
            message: `You've been added to project: ${formData.name}`,
            entity_type: 'project',
            entity_id: editingProject.id,
            is_read: false
          });
        }
        
        toast.success('Project updated');
      } else {
        const newProject = await base44.entities.Project.create({ ...formData, owner_id: user?.id });
        
        // Notify team members
        if (formData.team_members?.length > 0) {
          for (const userId of formData.team_members) {
            await base44.entities.Notification.create({
              user_id: userId,
              type: 'project_assigned',
              title: 'Added to project',
              message: `You've been added to project: ${formData.name}`,
              entity_type: 'project',
              entity_id: newProject.id,
              is_read: false
            });
          }
        }
        
        toast.success('Project created');
      }
      setIsModalOpen(false);
      setEditingProject(null);
      fetchProjects();
    } catch (error) {
      toast.error('Failed to save project');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProject = async (projectId) => {
    if (!confirm('Are you sure you want to delete this project?')) return;
    try {
      await base44.entities.Project.delete(projectId);
      toast.success('Project deleted');
      setSelectedProject(null);
      fetchProjects();
    } catch (error) {
      toast.error('Failed to delete project');
    }
  };

  const handleLinkItem = async (itemId) => {
    if (!selectedProject) return;
    try {
      if (linkType === 'task') {
        await base44.entities.Task.update(itemId, { project_id: selectedProject.id });
      } else {
        await base44.entities.LearningModule.update(itemId, { project_id: selectedProject.id });
      }
      toast.success(`${linkType === 'task' ? 'Task' : 'Module'} linked to project`);
      setLinkModalOpen(false);
      refreshData();
    } catch (error) {
      toast.error('Failed to link item');
    }
  };

  const handleUnlinkItem = async (itemId, type) => {
    try {
      if (type === 'task') {
        await base44.entities.Task.update(itemId, { project_id: null });
      } else {
        await base44.entities.LearningModule.update(itemId, { project_id: null });
      }
      toast.success('Item unlinked');
      refreshData();
    } catch (error) {
      toast.error('Failed to unlink item');
    }
  };

  // Project stats
  const activeProjects = projects.filter(p => p.status === 'active').length;
  const completedProjects = projects.filter(p => p.status === 'completed').length;
  const overdueProjects = projects.filter(p => p.deadline && isPast(new Date(p.deadline)) && p.status !== 'completed').length;

  // Selected project data
  const projectTasks = selectedProject ? tasks.filter(t => t.project_id === selectedProject.id) : [];
  const projectModules = selectedProject ? learningModules.filter(m => m.project_id === selectedProject.id) : [];
  const unlinkedTasks = tasks.filter(t => !t.project_id);
  const unlinkedModules = learningModules.filter(m => !m.project_id);

  return (
    <div className={`${isExpanded ? 'fixed inset-0 z-50 bg-background p-6 overflow-y-auto' : ''} space-y-6 pb-10`}>
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground">Organize work into focused projects</p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" onClick={() => setIsExpanded(!isExpanded)}>
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </Button>
          <Button className="gap-2" onClick={() => { setEditingProject(null); setIsModalOpen(true); }}>
            <Plus className="w-4 h-4" /> New Project
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <FolderKanban className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{projects.length}</p>
                <p className="text-xs text-muted-foreground">Total Projects</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <Clock className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activeProjects}</p>
                <p className="text-xs text-muted-foreground">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{completedProjects}</p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/10">
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{overdueProjects}</p>
                <p className="text-xs text-muted-foreground">Overdue</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search projects..." 
            className="pl-9 rounded-full bg-card border-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="planning">Planning</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="on_hold">On Hold</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="h-48 animate-pulse bg-muted/30" />
          ))}
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="text-center py-16">
          <FolderKanban className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
          <p className="text-muted-foreground">No projects found</p>
          <Button variant="outline" className="mt-4" onClick={() => { setEditingProject(null); setIsModalOpen(true); }}>
            Create your first project
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map(project => (
            <ProjectCard 
              key={project.id}
              project={project}
              tasks={tasks}
              learningModules={learningModules}
              onClick={() => setSelectedProject(project)}
            />
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <ProjectModal
        open={isModalOpen}
        project={editingProject}
        onClose={() => { setIsModalOpen(false); setEditingProject(null); }}
        onSave={handleSaveProject}
        saving={saving}
      />

      {/* Project Detail Drawer */}
      <Dialog open={!!selectedProject} onOpenChange={() => setSelectedProject(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          {selectedProject && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-10 rounded-full" style={{ backgroundColor: selectedProject.color }} />
                    <div>
                      <DialogTitle className="text-2xl">{selectedProject.name}</DialogTitle>
                      <p className="text-sm text-muted-foreground">{selectedProject.description}</p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="w-5 h-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => { setEditingProject(selectedProject); setIsModalOpen(true); setSelectedProject(null); }}>
                        <Pencil className="w-4 h-4 mr-2" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-red-500" onClick={() => handleDeleteProject(selectedProject.id)}>
                        <Trash2 className="w-4 h-4 mr-2" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </DialogHeader>

              <div className="space-y-6 mt-4">
                {/* Progress */}
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Overall Progress</span>
                    <span className="font-medium">
                      {projectTasks.length > 0 
                        ? Math.round((projectTasks.filter(t => t.status === 'done').length / projectTasks.length) * 100)
                        : 0}%
                    </span>
                  </div>
                  <Progress 
                    value={projectTasks.length > 0 
                      ? (projectTasks.filter(t => t.status === 'done').length / projectTasks.length) * 100
                      : 0} 
                    className="h-2" 
                  />
                </div>

                {/* Tasks */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" /> Tasks ({projectTasks.length})
                    </h3>
                    <Button variant="outline" size="sm" onClick={() => { setLinkType('task'); setLinkModalOpen(true); }}>
                      <Link2 className="w-4 h-4 mr-1" /> Link Task
                    </Button>
                  </div>
                  {projectTasks.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">No tasks linked yet</p>
                  ) : (
                    <div className="space-y-2">
                      {projectTasks.map(task => (
                        <div key={task.id} className="flex items-center justify-between p-3 bg-accent/30 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${task.status === 'done' ? 'bg-green-500' : 'bg-blue-500'}`} />
                            <span className={task.status === 'done' ? 'line-through text-muted-foreground' : ''}>
                              {task.title}
                            </span>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => handleUnlinkItem(task.id, 'task')}>
                            Unlink
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Learning Modules */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold flex items-center gap-2">
                      <BookOpen className="w-4 h-4" /> Learning ({projectModules.length})
                    </h3>
                    <Button variant="outline" size="sm" onClick={() => { setLinkType('module'); setLinkModalOpen(true); }}>
                      <Link2 className="w-4 h-4 mr-1" /> Link Module
                    </Button>
                  </div>
                  {projectModules.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">No learning modules linked yet</p>
                  ) : (
                    <div className="space-y-2">
                      {projectModules.map(module => {
                        const prog = learningProgress.find(p => p.module_id === module.id);
                        return (
                          <div key={module.id} className="flex items-center justify-between p-3 bg-accent/30 rounded-lg">
                            <div className="flex items-center gap-3">
                              <BookOpen className="w-4 h-4 text-purple-500" />
                              <span>{module.title}</span>
                              {prog?.status === 'completed' && (
                                <Badge className="bg-green-500/10 text-green-500 text-xs">Done</Badge>
                              )}
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => handleUnlinkItem(module.id, 'module')}>
                              Unlink
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Link Item Modal */}
      <Dialog open={linkModalOpen} onOpenChange={setLinkModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Link {linkType === 'task' ? 'Task' : 'Learning Module'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {(linkType === 'task' ? unlinkedTasks : unlinkedModules).map(item => (
              <div 
                key={item.id}
                className="p-3 rounded-lg bg-accent/30 hover:bg-accent cursor-pointer transition-colors"
                onClick={() => handleLinkItem(item.id)}
              >
                {item.title}
              </div>
            ))}
            {(linkType === 'task' ? unlinkedTasks : unlinkedModules).length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No unlinked {linkType === 'task' ? 'tasks' : 'modules'} available
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLinkModalOpen(false)}>Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}