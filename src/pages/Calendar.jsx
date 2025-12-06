import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Plus, Clock, Calendar as CalIcon, LayoutGrid, List } from 'lucide-react';
import { format, addMonths, addWeeks, addDays, isSameDay } from 'date-fns';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MonthView from '@/components/calendar/MonthView';
import WeekView from '@/components/calendar/WeekView';
import DayView from '@/components/calendar/DayView';
import EventModal from '@/components/calendar/EventModal';
import { useNoi } from '@/components/core/NoiContext';

export default function CalendarPage() {
  const { meetings, tasks, createMeeting, refreshData } = useNoi();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [view, setView] = useState('month');
  const [showEventModal, setShowEventModal] = useState(false);
  const [modalDate, setModalDate] = useState(null);

  const handleSaveEvent = async (eventData) => {
    await createMeeting(eventData);
  };

  const navigatePrev = () => {
    if (view === 'month') setCurrentDate(addMonths(currentDate, -1));
    else if (view === 'week') setCurrentDate(addWeeks(currentDate, -1));
    else setSelectedDate(addDays(selectedDate, -1));
  };

  const navigateNext = () => {
    if (view === 'month') setCurrentDate(addMonths(currentDate, 1));
    else if (view === 'week') setCurrentDate(addWeeks(currentDate, 1));
    else setSelectedDate(addDays(selectedDate, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  const handleDayClick = (day) => {
    setSelectedDate(day);
    if (view === 'month') setView('day');
  };

  const handleTimeClick = (day, hour) => {
    const date = new Date(day);
    date.setHours(hour, 0, 0, 0);
    setModalDate(date);
    setShowEventModal(true);
  };

  const openNewEvent = () => {
    setModalDate(selectedDate);
    setShowEventModal(true);
  };

  const selectedDayMeetings = meetings.filter(m => isSameDay(new Date(m.start_time), selectedDate));
  const selectedDayTasks = tasks.filter(t => t.due_date && isSameDay(new Date(t.due_date), selectedDate));

  const getViewTitle = () => {
    if (view === 'day') return format(selectedDate, 'MMMM d, yyyy');
    if (view === 'week') return `Week of ${format(currentDate, 'MMM d, yyyy')}`;
    return format(currentDate, 'MMMM yyyy');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Calendar</h1>
          <p className="text-muted-foreground">Manage meetings, events, and schedule</p>
        </div>
        <Button className="gap-2 bg-primary" onClick={openNewEvent}>
          <Plus className="w-4 h-4" /> New Event
        </Button>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={navigatePrev}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <h2 className="text-xl font-semibold min-w-[200px] text-center">{getViewTitle()}</h2>
          <Button variant="ghost" size="icon" onClick={navigateNext}>
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToToday} className="ml-2">
            Today
          </Button>
        </div>

        <Tabs value={view} onValueChange={setView}>
          <TabsList>
            <TabsTrigger value="day" className="gap-1">
              <List className="w-4 h-4" /> Day
            </TabsTrigger>
            <TabsTrigger value="week" className="gap-1">
              <CalIcon className="w-4 h-4" /> Week
            </TabsTrigger>
            <TabsTrigger value="month" className="gap-1">
              <LayoutGrid className="w-4 h-4" /> Month
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Calendar View */}
        <Card className={view === 'month' ? 'lg:col-span-3' : 'lg:col-span-4'}>
          <CardContent className="pt-4">
            {view === 'month' && (
              <MonthView
                currentMonth={currentDate}
                selectedDate={selectedDate}
                meetings={meetings}
                onDayClick={handleDayClick}
              />
            )}
            {view === 'week' && (
              <WeekView
                selectedDate={currentDate}
                meetings={meetings}
                onTimeClick={handleTimeClick}
                onDayClick={handleDayClick}
              />
            )}
            {view === 'day' && (
              <DayView
                selectedDate={selectedDate}
                meetings={meetings}
                onTimeClick={handleTimeClick}
              />
            )}
          </CardContent>
        </Card>

        {/* Sidebar - only on month view */}
        {view === 'month' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {format(selectedDate, 'EEEE, MMM d')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Meetings */}
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Events</h4>
                {selectedDayMeetings.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No events</p>
                ) : (
                  <div className="space-y-2">
                    {selectedDayMeetings.map((meeting, i) => (
                      <div key={i} className="p-2 rounded-lg bg-accent/30 border border-border/50">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm">{meeting.title}</span>
                          <Badge variant="secondary" className="text-xs">
                            {meeting.type?.replace('_', ' ')}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                          <Clock className="w-3 h-3" />
                          {format(new Date(meeting.start_time), 'h:mm a')}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Tasks */}
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Tasks Due</h4>
                {selectedDayTasks.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No tasks due</p>
                ) : (
                  <div className="space-y-2">
                    {selectedDayTasks.map((task, i) => (
                      <div key={i} className="p-2 rounded-lg bg-accent/30 border border-border/50">
                        <span className="font-medium text-sm">{task.title}</span>
                        <Badge variant="outline" className="ml-2 text-xs">
                          {task.priority}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Button variant="outline" className="w-full" onClick={openNewEvent}>
                <Plus className="w-4 h-4 mr-2" /> Add Event
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Event Modal */}
      <EventModal
        open={showEventModal}
        onClose={() => setShowEventModal(false)}
        onSave={handleSaveEvent}
        selectedDate={modalDate || selectedDate}
      />
    </div>
  );
}