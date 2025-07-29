import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Check, Calendar, Users, Clock, ArrowRight } from "lucide-react";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { getUserInvolvedTasks } from "@/utils/api/tasks-api";
import { getProjects, getProjectTasks } from "@/utils/api/projects-api";
import { getUserById } from "@/utils/api/users-api";
import { getEvents } from "@/utils/api/events-api";

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
  const [activeTasks, setActiveTasks] = useState<Task[]>([]);
  const [completedTasks, setCompletedTasks] = useState<Task[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [events, setEvents] = useState<Event[]>([]);

  useEffect(() => {
    // Animation effect for progress bars
    const timeout = setTimeout(() => {
      setProgress(75);
    }, 100);
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    const fetchAndProcessTasks = async () => {
      setLoadingTasks(true);
      if (!user?.id) {
        setActiveTasks([]);
        setCompletedTasks([]);
        setLoadingTasks(false);
        return;
      }
      try {
        const response = await getUserInvolvedTasks();
        if (response && !response.error) {
          const tasksData = response.tasks || response.data || response;
          if (Array.isArray(tasksData)) {
            const allTasks = tasksData.map(task => ({
              id: task.id.toString(),
              title: task.title,
              status: (task.status?.toLowerCase().replace(/_/g, '-') || 'todo') as Task["status"],
              priority: (task.priority?.toLowerCase() || "low") as Task["priority"],
              assignee: {
                name: task.assignee?.name || "Unknown",
                avatar: task.assignee?.profile_picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(task.assignee?.name || "U")}`,
              },
              dueDate: task.due_date || new Date().toISOString(),
            }));
            const active = allTasks.filter(t => t.status === 'todo' || t.status === 'in-progress');
            const completed = allTasks.filter(t => t.status === 'done');
            setActiveTasks(active);
            setCompletedTasks(completed);
          } else {
            setActiveTasks([]);
            setCompletedTasks([]);
          }
        } else {
          setActiveTasks([]);
          setCompletedTasks([]);
        }
      } catch (err) {
        setActiveTasks([]);
        setCompletedTasks([]);
      } finally {
        setLoadingTasks(false);
      }
    };

    fetchAndProcessTasks();
  }, [user]);

  // Fetch projects where user is a member
  useEffect(() => {
    const fetchProjects = async () => {
      if (!user?.id) {
        setProjects([]);
        return;
      }
      try {
        const response = await getProjects();
        if (response && !response.error) {
          const projectsData = response.projects || response.data || response;
          if (Array.isArray(projectsData)) {
            // Only include projects where user is a member
            let userProjects = projectsData.filter(project =>
              Array.isArray(project.members) && project.members.some(m => m.user_id?.toString() === user.id?.toString())
            );

            // Fetch user details for all unique member user_ids
            const allMemberIds = Array.from(new Set(userProjects.flatMap(p => (Array.isArray(p.members) ? p.members.map(m => m.user_id) : []))));
            const userCache = {};
            await Promise.all(allMemberIds.map(async (uid) => {
              if (!uid) return;
              try {
                const userRes = await getUserById(uid);
                if (userRes && userRes.data) {
                  userCache[uid] = userRes.data;
                }
              } catch {}
            }));

            // Map projects to include team with correct name/avatar
            userProjects = await Promise.all(userProjects.map(async (project) => {
              // Fetch tasks for each project
              let total = 0, completed = 0, progress = 0;
              try {
                const taskRes = await getProjectTasks(project.id);
                const tasksArr = taskRes.tasks || taskRes.data || [];
                if (Array.isArray(tasksArr)) {
                  total = tasksArr.length;
                  completed = tasksArr.filter(t => (t.status?.toLowerCase() === 'done' || t.status?.toLowerCase() === 'completed')).length;
                  progress = total > 0 ? Math.round((completed / total) * 100) : 0;
                }
              } catch {}
              // Map team
              const team = Array.isArray(project.members) ? project.members.map(m => {
                const u = userCache[m.user_id];
                return {
                  name: u?.name || "Member",
                  avatar: u?.profile_picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(u?.name || "M")}`
                };
              }) : [];
              return {
                id: project.id.toString(),
                name: project.title || project.name,
                progress,
                tasks: { total, completed },
                team,
              };
            }));
            setProjects(userProjects);
          } else {
            setProjects([]);
          }
        } else {
          setProjects([]);
        }
      } catch (err) {
        setProjects([]);
      }
    };
    fetchProjects();
  }, [user]);

  // Fetch events
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await getEvents();
        if (response && !response.error) {
          const eventsData = response.events || response.data || response;
          if (Array.isArray(eventsData)) {
            setEvents(eventsData.map(event => ({
              id: event.id.toString(),
              title: event.title,
              date: event.date || event.start_time || event.datetime,
              type: event.type || 'event',
            })));
          } else {
            setEvents([]);
          }
        } else {
          setEvents([]);
        }
      } catch (err) {
        setEvents([]);
      }
    };
    fetchEvents();
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
        <Card className="backdrop-blur-sm bg-card/50 border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeTasks.length + completedTasks.length}</div>
            <p className="text-xs text-muted-foreground">
              {completedTasks.length} completed
            </p>
            <Progress className="mt-2" value={(activeTasks.length + completedTasks.length) > 0 ? (completedTasks.length / (activeTasks.length + completedTasks.length)) * 100 : 0} />
          </CardContent>
        </Card>
        <Card className="backdrop-blur-sm bg-card/50 border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projects.length}</div>
            <p className="text-xs text-muted-foreground">{projects.length} in progress</p>
            <div className="mt-2 flex -space-x-2 overflow-hidden">
              {projects.flatMap((p) => p.team).slice(0, 4).map((member, i) => (
                <Avatar key={i} className="border-2 border-background h-8 w-8">
                  {member.avatar ? (
                    <AvatarImage src={member.avatar} alt={member.name || 'M'} />
                  ) : null}
                  <AvatarFallback>
                    {member.name
                      ? member.name.split(" ").map((n) => n[0]).join("")
                      : "M"}
                  </AvatarFallback>
                </Avatar>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card className="backdrop-blur-sm bg-card/50 border-border/50">
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
        <Card className="backdrop-blur-sm bg-card/50 border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{
              Array.from(new Set(projects.flatMap(p => (p.team && Array.isArray(p.team) ? p.team.map(m => m.name) : [])))).length
            }</div>
            <p className="text-xs text-muted-foreground">
              across {projects.length} departments
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
        <Card className="col-span-1 lg:col-span-2 backdrop-blur-sm bg-card/50 border-border/50">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>My Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="active">
              <TabsList>
                <TabsTrigger value="active">Active</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
              </TabsList>
              <TabsContent value="active" className="space-y-4 pt-4">
                {loadingTasks ? (
                  <p>Loading...</p>
                ) : activeTasks.length > 0 ? (
                  activeTasks.slice(0, 2).map(task => (
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
                  ))
                ) : (
                  <p className="text-muted-foreground text-sm">No active tasks.</p>
                )}
              </TabsContent>
              <TabsContent value="completed" className="space-y-4 pt-4">
                {loadingTasks ? (
                  <p>Loading...</p>
                ) : completedTasks.length > 0 ? (
                  completedTasks.slice(0, 2).map(task => (
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
                  ))
                ) : (
                  <p className="text-muted-foreground text-sm">No completed tasks yet.</p>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter>
            <Button asChild variant="outline" className="w-full">
              <Link to="/kanban">
                View all <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </CardFooter>
        </Card>

        {/* Events section */}
        <Card className="backdrop-blur-sm bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle>Upcoming Events</CardTitle>
            <CardDescription>Schedule for the next 30 days</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {events.slice(0, 3).map((event) => (
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
            <Card key={project.id} className="backdrop-blur-sm bg-card/50 border-border/50">
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
                        {member.avatar ? (
                          <AvatarImage src={member.avatar} alt={member.name || 'M'} />
                        ) : null}
                        <AvatarFallback>
                          {member.name
                            ? member.name.split(" ").map((n) => n[0]).join("")
                            : "M"}
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
