import { useState } from "react";
import { Calendar as CalendarIcon, Plus, Users, Filter } from "lucide-react";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { DayContentProps } from "react-day-picker";

interface CalendarEvent {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  date: Date;
  type: "meeting" | "deadline" | "event" | "birthday";
  description?: string;
  attendees?: {
    name: string;
    avatar: string;
  }[];
}

const events: CalendarEvent[] = [
  {
    id: "1",
    title: "Team Meeting",
    startTime: "10:00",
    endTime: "11:00",
    date: new Date(2025, 4, 15), // May 15, 2025
    type: "meeting",
    description: "Weekly team sync to discuss project progress",
    attendees: [
      {
        name: "John Doe",
        avatar: "https://ui-avatars.com/api/?name=John+Doe&background=0D8ABC&color=fff",
      },
      {
        name: "Jane Smith",
        avatar: "https://ui-avatars.com/api/?name=Jane+Smith&background=0D9488&color=fff",
      },
      {
        name: "Mike Johnson",
        avatar: "https://ui-avatars.com/api/?name=Mike+Johnson&background=8B5CF6&color=fff",
      },
    ],
  },
  {
    id: "2",
    title: "Project Deadline",
    startTime: "00:00",
    endTime: "23:59",
    date: new Date(2025, 4, 20), // May 20, 2025
    type: "deadline",
    description: "Final deadline for the website redesign project",
  },
  {
    id: "3",
    title: "Sarah's Birthday",
    startTime: "00:00",
    endTime: "23:59",
    date: new Date(2025, 4, 25), // May 25, 2025
    type: "birthday",
  },
  {
    id: "4",
    title: "Team Building",
    startTime: "14:00",
    endTime: "17:00",
    date: new Date(2025, 4, 28), // May 28, 2025
    type: "event",
    description: "Escape room challenge followed by dinner",
    attendees: [
      {
        name: "John Doe",
        avatar: "https://ui-avatars.com/api/?name=John+Doe&background=0D8ABC&color=fff",
      },
      {
        name: "Jane Smith",
        avatar: "https://ui-avatars.com/api/?name=Jane+Smith&background=0D9488&color=fff",
      },
      {
        name: "Mike Johnson",
        avatar: "https://ui-avatars.com/api/?name=Mike+Johnson&background=8B5CF6&color=fff",
      },
    ],
  },
  {
    id: "5",
    title: "Client Meeting",
    startTime: "13:30",
    endTime: "14:30",
    date: new Date(2025, 4, 16), // May 16, 2025
    type: "meeting",
    description: "Review design concepts with the client",
    attendees: [
      {
        name: "Jane Smith",
        avatar: "https://ui-avatars.com/api/?name=Jane+Smith&background=0D9488&color=fff",
      },
      {
        name: "John Doe",
        avatar: "https://ui-avatars.com/api/?name=John+Doe&background=0D8ABC&color=fff",
      },
    ],
  },
];

const CalendarPage = () => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  
  // Get events for the selected date
  const selectedDateEvents = events.filter(
    (event) =>
      date &&
      event.date.getDate() === date.getDate() &&
      event.date.getMonth() === date.getMonth() &&
      event.date.getFullYear() === date.getFullYear()
  );

  // Function to highlight dates with events
  const isDayWithEvent = (day: Date) => {
    return events.some(
      (event) =>
        event.date.getDate() === day.getDate() &&
        event.date.getMonth() === day.getMonth() &&
        event.date.getFullYear() === day.getFullYear()
    );
  };

  // Get event type color
  const getEventTypeColor = (type: CalendarEvent["type"]) => {
    switch (type) {
      case "meeting":
        return "bg-blue-100 text-blue-700 border-blue-300 hover:bg-blue-200";
      case "deadline":
        return "bg-red-100 text-red-700 border-red-300 hover:bg-red-200";
      case "event":
        return "bg-green-100 text-green-700 border-green-300 hover:bg-green-200";
      case "birthday":
        return "bg-pink-100 text-pink-700 border-pink-300 hover:bg-pink-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200";
    }
  };

  // Format date for display
  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  // Custom day content component
  const CustomDayContent = (props: DayContentProps) => {
    const { date, activeModifiers } = props;
    return (
      <div className="relative h-9 w-9 p-0 flex items-center justify-center">
        <span>{date.getDate()}</span>
        {isDayWithEvent(date) && (
          <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-teamsync-500 rounded-full" />
        )}
      </div>
    );
  };

  return (
    <div>
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Calendar</h1>
          <p className="text-muted-foreground">
            Plan and track upcoming meetings, events and deadlines
          </p>
        </div>
        <div className="flex space-x-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="space-x-2">
                <Filter className="h-4 w-4" />
                <span>Filter</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Filter by</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>All Events</DropdownMenuItem>
              <DropdownMenuItem>Meetings</DropdownMenuItem>
              <DropdownMenuItem>Deadlines</DropdownMenuItem>
              <DropdownMenuItem>Birthdays</DropdownMenuItem>
              <DropdownMenuItem>Team Events</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button>
            <Plus className="h-4 w-4 mr-2" /> Add Event
          </Button>
        </div>
      </div>
      
      {/* Calendar layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Calendar widget */}
        <Card className="lg:col-span-3 overflow-hidden">
          <CardHeader>
            <CardTitle>Team Calendar</CardTitle>
            <CardDescription>
              {date ? formatDate(date) : "Select a date"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CalendarComponent
              mode="single"
              selected={date}
              onSelect={setDate}
              className="rounded-md border w-full"
              modifiers={{
                withEvents: (date) => isDayWithEvent(date),
              }}
              modifiersClassNames={{
                withEvents: "!bg-teamsync-50 font-semibold",
              }}
              components={{
                DayContent: CustomDayContent
              }}
            />
          </CardContent>
        </Card>

        {/* Events list */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Events for {date ? formatDate(date) : "today"}</CardTitle>
            <CardDescription>
              {selectedDateEvents.length === 0
                ? "No events scheduled"
                : `${selectedDateEvents.length} events scheduled`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedDateEvents.length === 0 ? (
              <div className="text-center py-12">
                <CalendarIcon className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-medium">No events</h3>
                <p className="text-muted-foreground mt-2">
                  There are no events scheduled for this day.
                </p>
                <Button className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Event
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {selectedDateEvents
                  .sort((a, b) => a.startTime.localeCompare(b.startTime))
                  .map((event) => (
                    <div
                      key={event.id}
                      className="flex gap-3 border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex flex-col items-center justify-center min-w-[60px] text-center">
                        <span className="text-sm font-medium">{event.startTime}</span>
                        {event.startTime !== event.endTime && (
                          <span className="text-xs text-muted-foreground">
                            to {event.endTime}
                          </span>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium">{event.title}</h3>
                          <Badge
                            variant="outline"
                            className={cn(getEventTypeColor(event.type))}
                          >
                            {event.type}
                          </Badge>
                        </div>
                        {event.description && (
                          <p className="text-sm text-muted-foreground mb-2">
                            {event.description}
                          </p>
                        )}
                        {event.attendees && event.attendees.length > 0 && (
                          <div className="flex items-center gap-2">
                            <div className="flex -space-x-2">
                              {event.attendees.slice(0, 3).map((attendee, i) => (
                                <Avatar
                                  key={i}
                                  className="border-2 border-background h-6 w-6"
                                >
                                  <AvatarImage
                                    src={attendee.avatar}
                                    alt={attendee.name}
                                  />
                                  <AvatarFallback className="text-xs">
                                    {attendee.name
                                      .split(" ")
                                      .map((n) => n[0])
                                      .join("")}
                                  </AvatarFallback>
                                </Avatar>
                              ))}
                              {event.attendees.length > 3 && (
                                <Avatar className="border-2 border-background h-6 w-6 bg-muted">
                                  <AvatarFallback className="text-xs">
                                    +{event.attendees.length - 3}
                                  </AvatarFallback>
                                </Avatar>
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {event.attendees.length} attendees
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Upcoming events section */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Upcoming Events</h2>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {events
            .filter((event) => event.date >= new Date())
            .sort((a, b) => a.date.getTime() - b.date.getTime())
            .slice(0, 3)
            .map((event) => (
              <Card key={event.id}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between">
                    <Badge
                      variant="outline"
                      className={cn(getEventTypeColor(event.type))}
                    >
                      {event.type}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {event.date.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                  <CardTitle className="text-lg mt-2">{event.title}</CardTitle>
                  <CardDescription>
                    {event.startTime} - {event.endTime}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {event.description && (
                    <p className="text-sm text-muted-foreground mb-3">
                      {event.description}
                    </p>
                  )}
                  {event.attendees && (
                    <div className="flex items-center justify-between">
                      <div className="flex -space-x-2 overflow-hidden">
                        {event.attendees.slice(0, 3).map((attendee, i) => (
                          <Avatar
                            key={i}
                            className="border-2 border-background"
                          >
                            <AvatarImage
                              src={attendee.avatar}
                              alt={attendee.name}
                            />
                            <AvatarFallback>
                              {attendee.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                        {event.attendees.length > 3 && (
                          <Avatar className="border-2 border-background bg-muted">
                            <AvatarFallback>
                              +{event.attendees.length - 3}
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                      <Button size="sm" variant="outline">
                        <Users className="h-4 w-4 mr-2" />
                        Join
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
        </div>
      </div>
    </div>
  );
};

export default CalendarPage;
