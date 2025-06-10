import { useState } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, List, Sun, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectContent, SelectItem } from "@/components/ui/select";

interface Event {
  id: string;
  title: string;
  time: string;
  type: 'meeting' | 'task' | 'birthday' | 'event';
  participants?: string[];
}

const CalendarViews = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [addEventOpen, setAddEventOpen] = useState(false);
  const [newEvent, setNewEvent] = useState({ title: '', date: '', time: '', type: 'meeting' });

  // Mock events
  const events: Event[] = [
    { id: '1', title: 'Team Standup', time: '9:00 AM', type: 'meeting', participants: ['John', 'Sarah'] },
    { id: '2', title: 'Design Review', time: '2:00 PM', type: 'meeting', participants: ['Alex', 'Mia'] },
    { id: '3', title: 'Sarah\'s Birthday', time: 'All day', type: 'birthday' },
    { id: '4', title: 'Project Deadline', time: '5:00 PM', type: 'task' },
  ];

  const getEventsByDate = (date: Date) => {
    // In a real app, you'd filter events by the selected date
    return events;
  };

  const formatWeekDays = () => {
    const days = [];
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());

    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const formatDayHours = () => {
    const hours = [];
    for (let i = 0; i < 24; i++) {
      hours.push(i);
    }
    return hours;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + (direction === 'next' ? 1 : -1));
    setCurrentDate(newDate);
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentDate(newDate);
  };

  const navigateDay = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + (direction === 'next' ? 1 : -1));
    setCurrentDate(newDate);
  };

  const getMonthName = (monthIndex: number) => {
    return new Date(2024, monthIndex, 1).toLocaleString('default', { month: 'long' });
  };

  const handleAddEvent = () => {
    // Add event logic here (e.g., update events array)
    setAddEventOpen(false);
    setNewEvent({ title: '', date: '', time: '', type: 'meeting' });
  };

  const upcomingEvents = events.slice(0, 3); // Replace with real logic for next events

  return (
    <div className="space-y-6">
      <Tabs defaultValue="month" className="w-full">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="month" className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              Month
            </TabsTrigger>
            <TabsTrigger value="week" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Week
            </TabsTrigger>
            <TabsTrigger value="day" className="flex items-center gap-2">
              <Sun className="h-4 w-4" />
              Day
            </TabsTrigger>
            <TabsTrigger value="schedule" className="flex items-center gap-2">
              <List className="h-4 w-4" />
              Schedule
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="month" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">
              {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h3>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => navigateMonth('prev')}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigateMonth('next')}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="flex flex-row gap-4 items-start">
            <Card className="backdrop-blur-sm bg-card/50 border-border/50 w-[300px]">
              <CardContent className="p-3">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  month={currentDate}
                  onMonthChange={setCurrentDate}
                  className="rounded-md border-0"
                  classNames={{
                    day_today: 'bg-primary text-primary-foreground font-bold',
                    caption: "hidden",
                  }}
                />
              </CardContent>
            </Card>

            <Card className="backdrop-blur-sm bg-card/50 border-border/50 p-4 space-y-4 flex-1">
              <h4 className="font-semibold">Add New Event</h4>
              <Input
                placeholder="Event Title"
                value={newEvent.title}
                onChange={e => setNewEvent({ ...newEvent, title: e.target.value })}
              />
              <Input
                type="date"
                value={newEvent.date}
                onChange={e => setNewEvent({ ...newEvent, date: e.target.value })}
              />
              <Input
                type="time"
                value={newEvent.time}
                onChange={e => setNewEvent({ ...newEvent, time: e.target.value })}
              />
              <Select value={newEvent.type} onValueChange={val => setNewEvent({ ...newEvent, type: val })}>
                <SelectTrigger>
                  <span className="capitalize">{newEvent.type}</span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="meeting">Meeting</SelectItem>
                  <SelectItem value="task">Task</SelectItem>
                  <SelectItem value="birthday">Birthday</SelectItem>
                  <SelectItem value="event">Event</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleAddEvent} className="w-full">Add Event</Button>
            </Card>

            <div className="flex-1 space-y-4">
              <h4 className="font-semibold mb-2">Upcoming Events</h4>
              <div className="space-y-2">
                {upcomingEvents.map((event) => (
                  <Card key={event.id} className="p-2 flex items-center justify-between backdrop-blur-sm bg-card/50 border-border/50">
                    <span className="font-medium text-sm">{event.title}</span>
                    <Badge variant={event.type === 'birthday' ? 'destructive' : 'outline'}>{event.type}</Badge>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="week" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">
              Week of {formatWeekDays()[0].toLocaleDateString('en-US', { 
                month: 'long', 
                day: 'numeric' 
              })}
            </h3>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => navigateWeek('prev')}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigateWeek('next')}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-7 gap-2">
            {formatWeekDays().map((day) => (
              <Card key={day.toISOString()} className="p-3 min-h-[200px] backdrop-blur-sm bg-card/50 border-border/50">
                <CardHeader className="p-0 pb-2">
                  <CardTitle className="text-sm">
                    {day.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' })}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 space-y-1">
                  {day.getDate() === new Date().getDate() && events.slice(0, 2).map((event) => (
                    <div key={event.id} className="p-1 bg-primary/10 rounded text-xs">
                      <p className="font-medium truncate">{event.title}</p>
                      <p className="text-muted-foreground">{event.time}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="day" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">
              {currentDate.toLocaleDateString('en-US', { 
                weekday: 'long',
                month: 'long', 
                day: 'numeric',
                year: 'numeric'
              })}
            </h3>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => navigateDay('prev')}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigateDay('next')}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2">
            {formatDayHours().map((hour) => (
              <Card key={hour} className="p-3 backdrop-blur-sm bg-card/50 border-border/50">
                <div className="flex gap-4">
                  <div className="w-20 text-sm text-muted-foreground">
                    {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
                  </div>
                  <div className="flex-1">
                    {hour === 9 && events.slice(0, 1).map((event) => (
                      <div key={event.id} className="p-2 bg-primary/10 rounded">
                        <p className="font-medium">{event.title}</p>
                        <p className="text-sm text-muted-foreground">{event.time}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="schedule" className="space-y-4">
          <h3 className="text-lg font-semibold">Schedule View</h3>
          <div className="space-y-3">
            {events.map((event) => (
              <Card key={event.id} className="p-4 backdrop-blur-sm bg-card/50 border-border/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-primary"></div>
                    <div>
                      <h4 className="font-medium">{event.title}</h4>
                      <p className="text-sm text-muted-foreground">{event.time}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={event.type === 'birthday' ? 'destructive' : 'outline'}>
                      {event.type}
                    </Badge>
                    {event.participants && (
                      <div className="flex -space-x-2">
                        {event.participants.slice(0, 3).map((participant, index) => (
                          <div
                            key={index}
                            className="w-6 h-6 rounded-full bg-primary/10 border-2 border-background flex items-center justify-center text-xs"
                          >
                            {participant[0]}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CalendarViews;
