
import { useState } from "react";
import { Check, Clock, Plus, Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

interface KanbanTask {
  id: string;
  title: string;
  description?: string;
  status: "todo" | "in-progress" | "review" | "done";
  priority: "low" | "medium" | "high";
  assignee?: {
    name: string;
    avatar: string;
  };
  dueDate?: string;
  tags?: string[];
  comments?: number;
  attachments?: number;
}

// Sample tasks data
const initialTasks: KanbanTask[] = [
  {
    id: "task1",
    title: "Design new dashboard wireframes",
    description: "Create wireframes for the new dashboard layout",
    status: "todo",
    priority: "high",
    assignee: {
      name: "John Doe",
      avatar: "https://ui-avatars.com/api/?name=John+Doe&background=0D8ABC&color=fff",
    },
    dueDate: "2025-05-20",
    tags: ["design", "ui/ux"],
    comments: 3,
    attachments: 2,
  },
  {
    id: "task2",
    title: "Fix navigation responsiveness on mobile",
    description: "Address issues with the navigation menu on small screens",
    status: "in-progress",
    priority: "medium",
    assignee: {
      name: "Jane Smith",
      avatar: "https://ui-avatars.com/api/?name=Jane+Smith&background=0D9488&color=fff",
    },
    dueDate: "2025-05-15",
    tags: ["bug", "mobile"],
    comments: 5,
  },
  {
    id: "task3",
    title: "Implement authentication flow",
    description: "Add login, registration and forgot password functionality",
    status: "in-progress",
    priority: "high",
    assignee: {
      name: "Mike Johnson",
      avatar: "https://ui-avatars.com/api/?name=Mike+Johnson&background=8B5CF6&color=fff",
    },
    dueDate: "2025-05-18",
    tags: ["feature", "backend"],
  },
  {
    id: "task4",
    title: "Write API documentation",
    description: "Document all endpoints for the new API",
    status: "review",
    priority: "medium",
    assignee: {
      name: "John Doe",
      avatar: "https://ui-avatars.com/api/?name=John+Doe&background=0D8ABC&color=fff",
    },
    dueDate: "2025-05-16",
    tags: ["documentation"],
    comments: 2,
  },
  {
    id: "task5",
    title: "Design system improvements",
    description: "Update color scheme and component library",
    status: "done",
    priority: "low",
    assignee: {
      name: "Jane Smith",
      avatar: "https://ui-avatars.com/api/?name=Jane+Smith&background=0D9488&color=fff",
    },
    tags: ["design", "ui/ux"],
    comments: 8,
    attachments: 3,
  },
  {
    id: "task6",
    title: "Database optimization",
    description: "Improve query performance for user dashboard",
    status: "todo",
    priority: "high",
    assignee: {
      name: "Mike Johnson",
      avatar: "https://ui-avatars.com/api/?name=Mike+Johnson&background=8B5CF6&color=fff",
    },
    dueDate: "2025-05-25",
    tags: ["backend", "performance"],
  },
  {
    id: "task7",
    title: "User testing session",
    description: "Conduct user testing for new features",
    status: "todo",
    priority: "medium",
    assignee: {
      name: "Jane Smith",
      avatar: "https://ui-avatars.com/api/?name=Jane+Smith&background=0D9488&color=fff",
    },
    dueDate: "2025-05-22",
    tags: ["research", "ux"],
    comments: 1,
  },
  {
    id: "task8",
    title: "Cloud infrastructure setup",
    description: "Set up new cloud server architecture",
    status: "done",
    priority: "high",
    assignee: {
      name: "Mike Johnson",
      avatar: "https://ui-avatars.com/api/?name=Mike+Johnson&background=8B5CF6&color=fff",
    },
    tags: ["devops", "infrastructure"],
    comments: 4,
    attachments: 1,
  },
];

const KanbanBoard = () => {
  const [tasks, setTasks] = useState<KanbanTask[]>(initialTasks);

  // Get tasks by status
  const getTasks = (status: KanbanTask["status"]) => {
    return tasks.filter((task) => task.status === status);
  };

  // Get color based on priority
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

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
    }).format(date);
  };

  // Custom drag and drop handlers would go here in a real application
  
  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Kanban Board</h1>
          <p className="text-muted-foreground">Manage and track your team's tasks</p>
        </div>
        <div className="flex space-x-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="space-x-2">
                <Filter className="h-4 w-4" />
                <span>Filter</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Filter by</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Priority</DropdownMenuItem>
              <DropdownMenuItem>Assignee</DropdownMenuItem>
              <DropdownMenuItem>Due Date</DropdownMenuItem>
              <DropdownMenuItem>Tags</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button>
            <Plus className="h-4 w-4 mr-2" /> Add Task
          </Button>
        </div>
      </div>

      {/* Kanban board */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Todo column */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="h-2 w-2 rounded-full bg-gray-400"></div>
              <h3 className="font-semibold">To Do</h3>
              <Badge variant="outline">{getTasks("todo").length}</Badge>
            </div>
            <Button variant="ghost" size="icon">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="space-y-3 min-h-[200px]">
            {getTasks("todo").map((task) => (
              <Card key={task.id} className="task-card">
                <CardContent className="p-3">
                  <div className="flex justify-between">
                    <div className={`h-2 w-2 mt-1 rounded-full ${getPriorityColor(task.priority)}`} />
                    <DropdownMenu>
                      <DropdownMenuTrigger className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-muted">
                        <span className="sr-only">Open menu</span>
                        <svg
                          width="15"
                          height="3"
                          viewBox="0 0 15 3"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                          className="text-muted-foreground"
                        >
                          <path
                            d="M1.5 1.5C1.5 1.89782 1.65804 2.27936 1.93934 2.56066C2.22064 2.84196 2.60218 3 3 3C3.39782 3 3.77936 2.84196 4.06066 2.56066C4.34196 2.27936 4.5 1.89782 4.5 1.5C4.5 1.10218 4.34196 0.720644 4.06066 0.43934C3.77936 0.158035 3.39782 0 3 0C2.60218 0 2.22064 0.158035 1.93934 0.43934C1.65804 0.720644 1.5 1.10218 1.5 1.5ZM6 1.5C6 1.89782 6.15804 2.27936 6.43934 2.56066C6.72064 2.84196 7.10218 3 7.5 3C7.89782 3 8.27936 2.84196 8.56066 2.56066C8.84196 2.27936 9 1.89782 9 1.5C9 1.10218 8.84196 0.720644 8.56066 0.43934C8.27936 0.158035 7.89782 0 7.5 0C7.10218 0 6.72064 0.158035 6.43934 0.43934C6.15804 0.720644 6 1.10218 6 1.5ZM10.5 1.5C10.5 1.89782 10.658 2.27936 10.9393 2.56066C11.2206 2.84196 11.6022 3 12 3C12.3978 3 12.7794 2.84196 13.0607 2.56066C13.342 2.27936 13.5 1.89782 13.5 1.5C13.5 1.10218 13.342 0.720644 13.0607 0.43934C12.7794 0.158035 12.3978 0 12 0C11.6022 0 11.2206 0.158035 10.9393 0.43934C10.658 0.720644 10.5 1.10218 10.5 1.5Z"
                            fill="currentColor"
                          />
                        </svg>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>Edit</DropdownMenuItem>
                        <DropdownMenuItem>Move</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive">
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <h4 className="font-medium mt-2">{task.title}</h4>
                  {task.description && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {task.description}
                    </p>
                  )}
                  {task.tags && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {task.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                  <div className="flex justify-between items-center mt-4">
                    {task.assignee ? (
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
                    ) : (
                      <div className="h-6 w-6"></div>
                    )}
                    {task.dueDate && (
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Clock className="h-3 w-3 mr-1" />
                        {formatDate(task.dueDate)}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* In Progress column */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="h-2 w-2 rounded-full bg-blue-500"></div>
              <h3 className="font-semibold">In Progress</h3>
              <Badge variant="outline">{getTasks("in-progress").length}</Badge>
            </div>
            <Button variant="ghost" size="icon">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="space-y-3 min-h-[200px]">
            {getTasks("in-progress").map((task) => (
              <Card key={task.id} className="task-card">
                <CardContent className="p-3">
                  <div className="flex justify-between">
                    <div className={`h-2 w-2 mt-1 rounded-full ${getPriorityColor(task.priority)}`} />
                    <DropdownMenu>
                      <DropdownMenuTrigger className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-muted">
                        <span className="sr-only">Open menu</span>
                        <svg
                          width="15"
                          height="3"
                          viewBox="0 0 15 3"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                          className="text-muted-foreground"
                        >
                          <path
                            d="M1.5 1.5C1.5 1.89782 1.65804 2.27936 1.93934 2.56066C2.22064 2.84196 2.60218 3 3 3C3.39782 3 3.77936 2.84196 4.06066 2.56066C4.34196 2.27936 4.5 1.89782 4.5 1.5C4.5 1.10218 4.34196 0.720644 4.06066 0.43934C3.77936 0.158035 3.39782 0 3 0C2.60218 0 2.22064 0.158035 1.93934 0.43934C1.65804 0.720644 1.5 1.10218 1.5 1.5ZM6 1.5C6 1.89782 6.15804 2.27936 6.43934 2.56066C6.72064 2.84196 7.10218 3 7.5 3C7.89782 3 8.27936 2.84196 8.56066 2.56066C8.84196 2.27936 9 1.89782 9 1.5C9 1.10218 8.84196 0.720644 8.56066 0.43934C8.27936 0.158035 7.89782 0 7.5 0C7.10218 0 6.72064 0.158035 6.43934 0.43934C6.15804 0.720644 6 1.10218 6 1.5ZM10.5 1.5C10.5 1.89782 10.658 2.27936 10.9393 2.56066C11.2206 2.84196 11.6022 3 12 3C12.3978 3 12.7794 2.84196 13.0607 2.56066C13.342 2.27936 13.5 1.89782 13.5 1.5C13.5 1.10218 13.342 0.720644 13.0607 0.43934C12.7794 0.158035 12.3978 0 12 0C11.6022 0 11.2206 0.158035 10.9393 0.43934C10.658 0.720644 10.5 1.10218 10.5 1.5Z"
                            fill="currentColor"
                          />
                        </svg>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>Edit</DropdownMenuItem>
                        <DropdownMenuItem>Move</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive">
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <h4 className="font-medium mt-2">{task.title}</h4>
                  {task.description && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {task.description}
                    </p>
                  )}
                  {task.tags && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {task.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                  <div className="flex justify-between items-center mt-4">
                    {task.assignee ? (
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
                    ) : (
                      <div className="h-6 w-6"></div>
                    )}
                    {task.dueDate && (
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Clock className="h-3 w-3 mr-1" />
                        {formatDate(task.dueDate)}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Review column */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="h-2 w-2 rounded-full bg-amber-500"></div>
              <h3 className="font-semibold">Review</h3>
              <Badge variant="outline">{getTasks("review").length}</Badge>
            </div>
            <Button variant="ghost" size="icon">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="space-y-3 min-h-[200px]">
            {getTasks("review").map((task) => (
              <Card key={task.id} className="task-card">
                <CardContent className="p-3">
                  <div className="flex justify-between">
                    <div className={`h-2 w-2 mt-1 rounded-full ${getPriorityColor(task.priority)}`} />
                    <DropdownMenu>
                      <DropdownMenuTrigger className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-muted">
                        <span className="sr-only">Open menu</span>
                        <svg
                          width="15"
                          height="3"
                          viewBox="0 0 15 3"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                          className="text-muted-foreground"
                        >
                          <path
                            d="M1.5 1.5C1.5 1.89782 1.65804 2.27936 1.93934 2.56066C2.22064 2.84196 2.60218 3 3 3C3.39782 3 3.77936 2.84196 4.06066 2.56066C4.34196 2.27936 4.5 1.89782 4.5 1.5C4.5 1.10218 4.34196 0.720644 4.06066 0.43934C3.77936 0.158035 3.39782 0 3 0C2.60218 0 2.22064 0.158035 1.93934 0.43934C1.65804 0.720644 1.5 1.10218 1.5 1.5ZM6 1.5C6 1.89782 6.15804 2.27936 6.43934 2.56066C6.72064 2.84196 7.10218 3 7.5 3C7.89782 3 8.27936 2.84196 8.56066 2.56066C8.84196 2.27936 9 1.89782 9 1.5C9 1.10218 8.84196 0.720644 8.56066 0.43934C8.27936 0.158035 7.89782 0 7.5 0C7.10218 0 6.72064 0.158035 6.43934 0.43934C6.15804 0.720644 6 1.10218 6 1.5ZM10.5 1.5C10.5 1.89782 10.658 2.27936 10.9393 2.56066C11.2206 2.84196 11.6022 3 12 3C12.3978 3 12.7794 2.84196 13.0607 2.56066C13.342 2.27936 13.5 1.89782 13.5 1.5C13.5 1.10218 13.342 0.720644 13.0607 0.43934C12.7794 0.158035 12.3978 0 12 0C11.6022 0 11.2206 0.158035 10.9393 0.43934C10.658 0.720644 10.5 1.10218 10.5 1.5Z"
                            fill="currentColor"
                          />
                        </svg>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>Edit</DropdownMenuItem>
                        <DropdownMenuItem>Move</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive">
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <h4 className="font-medium mt-2">{task.title}</h4>
                  {task.description && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {task.description}
                    </p>
                  )}
                  {task.tags && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {task.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                  <div className="flex justify-between items-center mt-4">
                    {task.assignee ? (
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
                    ) : (
                      <div className="h-6 w-6"></div>
                    )}
                    {task.dueDate && (
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Clock className="h-3 w-3 mr-1" />
                        {formatDate(task.dueDate)}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Done column */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="h-2 w-2 rounded-full bg-green-500"></div>
              <h3 className="font-semibold">Done</h3>
              <Badge variant="outline">{getTasks("done").length}</Badge>
            </div>
            <Button variant="ghost" size="icon">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="space-y-3 min-h-[200px]">
            {getTasks("done").map((task) => (
              <Card key={task.id} className="task-card">
                <CardContent className="p-3">
                  <div className="flex justify-between">
                    <div className="flex items-center">
                      <Check className="h-4 w-4 text-green-500 mr-1" />
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-muted">
                        <span className="sr-only">Open menu</span>
                        <svg
                          width="15"
                          height="3"
                          viewBox="0 0 15 3"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                          className="text-muted-foreground"
                        >
                          <path
                            d="M1.5 1.5C1.5 1.89782 1.65804 2.27936 1.93934 2.56066C2.22064 2.84196 2.60218 3 3 3C3.39782 3 3.77936 2.84196 4.06066 2.56066C4.34196 2.27936 4.5 1.89782 4.5 1.5C4.5 1.10218 4.34196 0.720644 4.06066 0.43934C3.77936 0.158035 3.39782 0 3 0C2.60218 0 2.22064 0.158035 1.93934 0.43934C1.65804 0.720644 1.5 1.10218 1.5 1.5ZM6 1.5C6 1.89782 6.15804 2.27936 6.43934 2.56066C6.72064 2.84196 7.10218 3 7.5 3C7.89782 3 8.27936 2.84196 8.56066 2.56066C8.84196 2.27936 9 1.89782 9 1.5C9 1.10218 8.84196 0.720644 8.56066 0.43934C8.27936 0.158035 7.89782 0 7.5 0C7.10218 0 6.72064 0.158035 6.43934 0.43934C6.15804 0.720644 6 1.10218 6 1.5ZM10.5 1.5C10.5 1.89782 10.658 2.27936 10.9393 2.56066C11.2206 2.84196 11.6022 3 12 3C12.3978 3 12.7794 2.84196 13.0607 2.56066C13.342 2.27936 13.5 1.89782 13.5 1.5C13.5 1.10218 13.342 0.720644 13.0607 0.43934C12.7794 0.158035 12.3978 0 12 0C11.6022 0 11.2206 0.158035 10.9393 0.43934C10.658 0.720644 10.5 1.10218 10.5 1.5Z"
                            fill="currentColor"
                          />
                        </svg>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>Edit</DropdownMenuItem>
                        <DropdownMenuItem>Move</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive">
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <h4 className="font-medium mt-2">{task.title}</h4>
                  {task.tags && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {task.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                  <div className="flex justify-between items-center mt-4">
                    {task.assignee ? (
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
                    ) : (
                      <div className="h-6 w-6"></div>
                    )}
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Check className="h-3 w-3 mr-1" />
                      Completed
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default KanbanBoard;
