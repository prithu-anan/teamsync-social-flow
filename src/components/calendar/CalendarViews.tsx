
import { useState } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                month={currentDate}
                onMonthChange={setCurrentDate}
                className="rounded-md border"
              />
            </div>
            
            <div className="space-y-4">
              <h4 className="font-medium">
                Events for {selectedDate?.toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </h4>
              <div className="space-y-2">
                {getEventsByDate(selectedDate || new Date()).map((event) => (
                  <Card key={event.id} className="p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{event.title}</p>
                        <p className="text-xs text-muted-foreground">{event.time}</p>
                      </div>
                      <Badge variant={event.type === 'birthday' ? 'destructive' : 'outline'}>
                        {event.type}
                      </Badge>
                    </div>
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
              <Card key={day.toISOString()} className="p-3 min-h-[200px]">
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

        <TabsContent value="schedule" className="space-y-4">
          <h3 className="text-lg font-semibold">Schedule View</h3>
          <div className="space-y-3">
            {events.map((event) => (
              <Card key={event.id} className="p-4">
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
