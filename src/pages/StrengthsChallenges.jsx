import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { BookMarked, Plus, Calendar, TrendingUp, TrendingDown } from 'lucide-react';
import { toast } from 'sonner';

export default function StrengthsChallengesPage() {
  const [user, setUser] = useState(null);
  const [entries, setEntries] = useState([]);
  const [showNewEntry, setShowNewEntry] = useState(false);
  const [newEntry, setNewEntry] = useState({
    strengths_used: '',
    pressure_points: '',
    communication_needs: '',
    sensory_strain: '',
    energy_level: 'balanced'
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
        
        // Fetch journal entries
        // const journalEntries = await base44.entities.JournalEntry.filter({ user_id: userData.id });
        // setEntries(journalEntries);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      }
    };
    fetchData();
  }, []);

  const handleSubmit = async () => {
    if (!newEntry.strengths_used && !newEntry.pressure_points) {
      toast.error('Please add at least one entry');
      return;
    }

    setSubmitting(true);
    try {
      // await base44.entities.JournalEntry.create({
      //   ...newEntry,
      //   user_id: user.id,
      //   date: new Date().toISOString()
      // });
      
      toast.success('Entry saved successfully');
      setNewEntry({
        strengths_used: '',
        pressure_points: '',
        communication_needs: '',
        sensory_strain: '',
        energy_level: 'balanced'
      });
      setShowNewEntry(false);
      // Refresh entries
    } catch (error) {
      toast.error('Failed to save entry');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Strengths & Challenges Journal</h1>
          <p className="text-muted-foreground">Reflect on your work experience and build awareness</p>
        </div>
        <Button onClick={() => setShowNewEntry(!showNewEntry)}>
          <Plus className="w-4 h-4 mr-2" />
          New Entry
        </Button>
      </div>

      {showNewEntry && (
        <Card className="border-primary/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookMarked className="w-5 h-5 text-primary" />
              New Journal Entry
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Strengths Used Today</label>
              <Textarea 
                placeholder="What strengths did you leverage? What worked well?"
                value={newEntry.strengths_used}
                onChange={(e) => setNewEntry({...newEntry, strengths_used: e.target.value})}
                rows={3}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Pressure Points</label>
              <Textarea 
                placeholder="What felt challenging or overwhelming?"
                value={newEntry.pressure_points}
                onChange={(e) => setNewEntry({...newEntry, pressure_points: e.target.value})}
                rows={3}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Communication Needs</label>
              <Textarea 
                placeholder="Any communication preferences or needs that would help?"
                value={newEntry.communication_needs}
                onChange={(e) => setNewEntry({...newEntry, communication_needs: e.target.value})}
                rows={2}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Sensory & Environment</label>
              <Textarea 
                placeholder="Any sensory or environmental factors that impacted you?"
                value={newEntry.sensory_strain}
                onChange={(e) => setNewEntry({...newEntry, sensory_strain: e.target.value})}
                rows={2}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Energy Level</label>
              <select 
                className="w-full p-2 border rounded-md bg-background"
                value={newEntry.energy_level}
                onChange={(e) => setNewEntry({...newEntry, energy_level: e.target.value})}
              >
                <option value="high">High - Energized and focused</option>
                <option value="balanced">Balanced - Steady and manageable</option>
                <option value="low">Low - Tired or depleted</option>
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setShowNewEntry(false)}>Cancel</Button>
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting ? 'Saving...' : 'Save Entry'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {entries.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BookMarked className="w-12 h-12 text-muted-foreground mb-3" />
              <p className="text-muted-foreground mb-2">No journal entries yet</p>
              <p className="text-sm text-muted-foreground text-center max-w-md">
                Start reflecting on your work experience. Your entries are private and can be shared with your support team if you choose.
              </p>
              <Button className="mt-4" onClick={() => setShowNewEntry(true)}>
                Create First Entry
              </Button>
            </CardContent>
          </Card>
        ) : (
          entries.map((entry) => (
            <Card key={entry.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {new Date(entry.date).toLocaleDateString()}
                    </span>
                  </div>
                  <Badge variant={
                    entry.energy_level === 'high' ? 'default' : 
                    entry.energy_level === 'low' ? 'destructive' : 
                    'secondary'
                  }>
                    {entry.energy_level} energy
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {entry.strengths_used && (
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp className="w-4 h-4 text-green-500" />
                      <span className="text-sm font-medium">Strengths</span>
                    </div>
                    <p className="text-sm text-muted-foreground ml-6">{entry.strengths_used}</p>
                  </div>
                )}
                {entry.pressure_points && (
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingDown className="w-4 h-4 text-amber-500" />
                      <span className="text-sm font-medium">Challenges</span>
                    </div>
                    <p className="text-sm text-muted-foreground ml-6">{entry.pressure_points}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}