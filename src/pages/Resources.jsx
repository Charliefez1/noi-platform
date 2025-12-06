import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Download, ExternalLink, FileText, Video, Headphones, Layout } from 'lucide-react';

const resourcesData = [
  { id: 1, title: 'Meeting Agenda Template', description: 'Structured template for effective meetings', category: 'Meetings', icon: '📋', color: 'bg-yellow-500' },
  { id: 2, title: 'Task Prioritization Guide', description: 'Learn the Eisenhower matrix for task management', category: 'Productivity', icon: '📝', color: 'bg-green-500' },
  { id: 3, title: 'Effective Communication Workshop', description: 'Video series on workplace communication', category: 'Communication', icon: '🎥', color: 'bg-red-500', duration: '45min' },
  { id: 4, title: 'Mindfulness for Focus', description: 'Audio exercises for better concentration', category: 'Wellness', icon: '🧘', color: 'bg-teal-500', duration: '15min' },
  { id: 5, title: 'Project Brief Template', description: 'Clear project requirements documentation', category: 'Projects', icon: '📄', color: 'bg-orange-500' },
  { id: 6, title: 'Feedback Framework', description: 'How to give and receive constructive feedback', category: 'Communication', icon: '💬', color: 'bg-green-600' },
];

const categories = ['All', 'Meetings', 'Productivity', 'Communication', 'Wellness', 'Projects'];

export default function ResourcesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  const filteredResources = resourcesData.filter(r => {
    const matchesSearch = r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          r.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === 'All' || r.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Resources</h1>
        <p className="text-muted-foreground">Templates, guides, and learning materials</p>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search resources..."
            className="pl-9 bg-card border-border/50"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          {categories.map((cat) => (
            <Button
              key={cat}
              variant={activeCategory === cat ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveCategory(cat)}
              className={activeCategory === cat ? 'bg-primary' : ''}
            >
              {cat}
            </Button>
          ))}
        </div>
      </div>

      {/* Resources Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredResources.map((resource) => (
          <Card key={resource.id} className="group hover:shadow-lg transition-all hover:border-primary/30 bg-card">
            <CardContent className="p-5">
              <div className="flex justify-between items-start mb-4">
                <div className={`w-12 h-12 rounded-xl ${resource.color} flex items-center justify-center text-2xl`}>
                  {resource.icon}
                </div>
                <Badge variant="secondary" className="text-xs">
                  {resource.category}
                </Badge>
              </div>
              
              <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors">
                {resource.title}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {resource.description}
              </p>

              {resource.duration && (
                <p className="text-xs text-muted-foreground mb-4">{resource.duration}</p>
              )}

              <div className="flex gap-2">
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Download className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}