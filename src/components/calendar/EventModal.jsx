import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from 'date-fns';

export default function EventModal({ open, onClose, onSave, selectedDate }) {
  const [eventData, setEventData] = useState({
    title: '',
    type: 'meeting',
    start_time: selectedDate ? format(selectedDate, "yyyy-MM-dd'T'09:00") : '',
    end_time: selectedDate ? format(selectedDate, "yyyy-MM-dd'T'10:00") : '',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!eventData.title) return;
    setSaving(true);
    await onSave({
      ...eventData,
      start_time: new Date(eventData.start_time).toISOString(),
      end_time: new Date(eventData.end_time).toISOString(),
    });
    setSaving(false);
    setEventData({ title: '', type: 'meeting', start_time: '', end_time: '' });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Event</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input
              placeholder="Event title"
              value={eventData.title}
              onChange={(e) => setEventData({ ...eventData, title: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Type</Label>
            <Select value={eventData.type} onValueChange={(v) => setEventData({ ...eventData, type: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="meeting">Meeting</SelectItem>
                <SelectItem value="deep_work">Deep Work</SelectItem>
                <SelectItem value="break">Break</SelectItem>
                <SelectItem value="learning_block">Learning Block</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start</Label>
              <Input
                type="datetime-local"
                value={eventData.start_time}
                onChange={(e) => setEventData({ ...eventData, start_time: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>End</Label>
              <Input
                type="datetime-local"
                value={eventData.end_time}
                onChange={(e) => setEventData({ ...eventData, end_time: e.target.value })}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || !eventData.title}>
            {saving ? 'Saving...' : 'Save Event'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}