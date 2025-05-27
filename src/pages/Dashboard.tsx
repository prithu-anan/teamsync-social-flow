import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Check, Calendar, Users, Clock } from "lucide-react";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

interface Task {
  id: string;
  title: string;
  status: "todo" | "in-progress" | "done";
  priority: "low" | "medium" | "high";
  assignee: {
    name: string;
    avatar: string;
  };
  dueDate: string;
}

interface Project {
  id: string;
  name: string;
  progress: number;
  tasks: {
    total: number;
    completed: number;
  };
  team: {
    name: string;
    avatar: string;
  }[];
}

interface Event {
  id: string;
  title: string;
  date: string;
  type: "meeting" | "deadline" | "event";
}

const mockTasks: Task[] = [
  {
    id: "1",
    title: "Design new dashboard layout",
    status: "in-progress",
    priority: "high",
    assignee: {
      name: "John Doe",
      avatar: "https://ui-avatars.com/api/?name=John+Doe&background=0D8ABC&color=fff",
    },
    dueDate: "2025-05-15",
  },
  {
    id: "2",
    title: "Fix sidebar responsiveness issue",
    status: "todo",
    priority: "medium",
    assignee: {
      name: "Jane Smith",
      avatar: "https://ui-avatars.com/api/?name=Jane+Smith&background=0D9488&color=fff",
    },
    dueDate: "2025-05-18",
  },
  {
    id: "3",
    title: "Update API documentation",
    status: "done",
    priority: "low",
    assignee: {
      name: "John Doe",
      avatar: "https://ui-avatars.com/api/?name=John+Doe&background=0D8ABC&color=fff",
    },
    dueDate: "2025-05-10",
  },
  {
    id: "4",
    title: "Prepare quarterly report",
    status: "todo",
    priority: "high",
    assignee: {
      name: "Jane Smith",
      avatar: "https://ui-avatars.com/api/?name=Jane+Smith&background=0D9488&color=fff",
    },
    dueDate: "2025-05-25",
  },
];

const mockProjects: Project[] = [
  {
    id: "1",
    name: "Website Redesign",
    progress: 68,
    tasks: {
      total: 24,
      completed: 16,
    },
    team: [
      { name: "John Doe", avatar: "https://ui-avatars.com/api/?name=John+Doe&background=0D8ABC&color=fff" },
      { name: "Jane Smith", avatar: "https://ui-avatars.com/api/?name=Jane+Smith&background=0D9488&color=fff" },
      { name: "Mike Johnson", avatar: "https://ui-avatars.com/api/?name=Mike+Johnson&background=8B5CF6&color=fff" },
    ],
  },
  {
    id: "2",
    name: "Mobile App Development",
    progress: 42,
    tasks: {
      total: 32,
      completed: 14,
    },
    team: [
      { name: "Jane Smith", avatar: "https://ui-avatars.com/api/?name=Jane+Smith&background=0D9488&color=fff" },
      { name: "John Doe", avatar: "https://ui-avatars.com/api/?name=John+Doe&background=0D8ABC&color=fff" },
    ],
  },
];

const mockEvents: Event[] = [
  {
    id: "1",
    title: "Team Sprint Planning",
    date: "2025-05-13T10:00:00",
    type: "meeting",
  },
  {
    id: "2",
    title: "Website Launch",
    date: "2025-05-20T00:00:00",
    type: "deadline",
  },
  {
    id: "3",
    title: "Company Anniversary",
    date: "2025-05-25T12:00:00",
    type: "event",
  },
];

const Dashboard = () => {
  const { user } = useAuth();
  const [progress, setProgress] = useState(0);
  const [tasks, setTasks] = useState<Task[]>(mockTasks);
  const [projects, setProjects] = useState<Project[]>(mockProjects);
  const [events, setEvents] = useState<Event[]>(mockEvents);

  useEffect(() => {
    // Animation effect for progress bars
    setTimeout(() => {
      setProgress(75);
    }, 100);
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
    }).format(date);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-500";
      case "medium":
        return "bg-amber-500";
      case "low":
        return "bg-green-500";
      default:
        return "bg-blue-500";
    }
  };

  return (
    <div className="space-y-8">
      {/* Welcome section */}
      <section className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back, {(user?.name?.split(" ")[0]) ?? "Sadat"}!
          </h1>
          <p className="text-muted-foreground">
            Here's what's happening with your projects today.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link to="/calendar">
              <Calendar className="h-4 w-4 mr-2" /> Schedule
            </Link>
          </Button>
          <Button asChild>
            <Link to="/kanban">
              <Check className="h-4 w-4 mr-2" /> My Tasks
            </Link>
          </Button>
        </div>
      </section>

      {/* Stats cards */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tasks.length}</div>
            <p className="text-xs text-muted-foreground">
              {tasks.filter((t) => t.status === "done").length} completed
            </p>
            <Progress className="mt-2" value={progress} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projects.length}</div>
            <p className="text-xs text-muted-foreground">2 in progress</p>
            <div className="mt-2 flex -space-x-2 overflow-hidden">
              {projects.flatMap((p) => p.team).slice(0, 4).map((member, i) => (
                <Avatar key={i} className="border-2 border-background h-8 w-8">
                  <AvatarImage src={member.avatar} alt={member.name} />
                  <AvatarFallback>
                    {member.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {events.filter((e) => new Date(e.date) > new Date()).length}
            </div>
            <p className="text-xs text-muted-foreground">
              events in the next 30 days
            </p>
            <div className="mt-2 flex items-center">
              <Calendar className="h-4 w-4 mr-2 text-teamsync-500" />
              <span className="text-sm">
                Next: {events[0]?.title || "No events"}{" "}
                {events[0] ? `(${formatDate(events[0].date)})` : ""}
              </span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">
              across 3 departments
            </p>
            <div className="mt-2 flex items-center">
              <Users className="h-4 w-4 mr-2 text-teamsync-500" />
              <span className="text-sm">2 online now</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main content */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        {/* Tasks section */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>My Tasks</CardTitle>
            <CardDescription>Manage your upcoming tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="active">
              <TabsList>
                <TabsTrigger value="active">Active</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
              </TabsList>
              <TabsContent value="active" className="space-y-4 mt-4">
                {tasks
                  .filter((task) => task.status !== "done")
                  .map((task) => (
                    <div
                      key={task.id}
                      className="task-card flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-4">
                        <div
                          className={`h-2 w-2 rounded-full ${getPriorityColor(
                            task.priority
                          )}`}
                        />
                        <div>
                          <p className="font-medium line-clamp-1">{task.title}</p>
                          <p className="text-xs text-muted-foreground">
                            Due {formatDate(task.dueDate)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge
                          variant={
                            task.status === "in-progress"
                              ? "secondary"
                              : "outline"
                          }
                        >
                          {task.status === "in-progress"
                            ? "In Progress"
                            : "To Do"}
                        </Badge>
                        <Avatar className="h-6 w-6">
                          <AvatarImage
                            src={task.assignee.avatar}
                            alt={task.assignee.name}
                          />
                          <AvatarFallback>
                            {task.assignee.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                    </div>
                  ))}
              </TabsContent>
              <TabsContent value="completed" className="space-y-4 mt-4">
                {tasks
                  .filter((task) => task.status === "done")
                  .map((task) => (
                    <div
                      key={task.id}
                      className="task-card flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="h-2 w-2 rounded-full bg-green-500" />
                        <div>
                          <p className="font-medium line-clamp-1">{task.title}</p>
                          <p className="text-xs text-muted-foreground">
                            Completed {formatDate(task.dueDate)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          Completed
                        </Badge>
                        <Avatar className="h-6 w-6">
                          <AvatarImage
                            src={task.assignee.avatar}
                            alt={task.assignee.name}
                          />
                          <AvatarFallback>
                            {task.assignee.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                    </div>
                  ))}
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter>
            <Button variant="outline" asChild className="w-full">
              <Link to="/kanban">View All Tasks</Link>
            </Button>
          </CardFooter>
        </Card>

        {/* Events section */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Events</CardTitle>
            <CardDescription>Schedule for the next 30 days</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {events.map((event) => (
              <div key={event.id} className="flex items-start space-x-4">
                <div className="bg-muted p-2 rounded-md">
                  {event.type === "meeting" ? (
                    <Users className="h-4 w-4 text-teamsync-500" />
                  ) : event.type === "deadline" ? (
                    <Clock className="h-4 w-4 text-red-500" />
                  ) : (
                    <Calendar className="h-4 w-4 text-teamsync-teal" />
                  )}
                </div>
                <div className="space-y-1">
                  <p className="font-medium">{event.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(event.date).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
          <CardFooter>
            <Button variant="outline" asChild className="w-full">
              <Link to="/calendar">View Calendar</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Projects section */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Active Projects</h2>
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
          {projects.map((project) => (
            <Card key={project.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle>{project.name}</CardTitle>
                  <Badge>{project.tasks.completed}/{project.tasks.total} Tasks</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span>{project.progress}%</span>
                  </div>
                  <Progress value={project.progress} className="animate-progress" />
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex -space-x-2 overflow-hidden">
                    {project.team.map((member, i) => (
                      <Avatar key={i} className="border-2 border-background">
                        <AvatarImage src={member.avatar} alt={member.name} />
                        <AvatarFallback>
                          {member.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                  </div>
                  <Button variant="ghost" size="sm">Details</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
