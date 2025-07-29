import { useState, useEffect, useMemo } from "react";
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
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { getKanbanTasks, getProjectById } from "@/utils/api/projects-api";
import { getUserInvolvedTasks, updateTask, deleteTask } from "@/utils/api/tasks-api";
import { useAuth } from "@/contexts/AuthContext";
import { useSearchParams } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";
import CreateTaskDialog from "@/components/CreateTaskDialog";
import EditTaskDialog from "@/components/EditTaskDialog";
import MoveTaskDialog from "@/components/MoveTaskDialog";

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
  assigned_by?: number;
  dueDate?: string;
  tags?: string[];
  comments?: number;
  attachments?: number;
}

const stickyColors = [
  'sticky-yellow',
  'sticky-green',
  'sticky-blue',
  'sticky-pink',
  'sticky-orange',
  'sticky-purple',
];

const columnOrder = ["todo", "in_progress", "in_review", "completed"];
const columnNames: Record<string, string> = {
  "todo": "To Do",
  "in_progress": "In Progress",
  "in_review": "In Review",
  "completed": "Completed"
};
const columnColors: Record<string, string> = {
  "todo": "bg-gray-400",
  "in_progress": "bg-blue-500",
  "in_review": "bg-amber-500",
  "completed": "bg-green-500"
};

function groupTasksByStatus(tasks: KanbanTask[]) {
  return columnOrder.reduce((acc, col) => {
    acc[col] = tasks.filter(t => t.status === col);
    return acc;
  }, {} as Record<string, KanbanTask[]>);
}

const dueDateOptions = [
  { label: "All", value: "all" },
  { label: "Overdue", value: "overdue" },
  { label: "Today", value: "today" },
  { label: "This Week", value: "week" },
  { label: "Future", value: "future" },
];

const KanbanBoard = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('projectId');
  const [tasks, setTasks] = useState<KanbanTask[]>([]);
  const [columns, setColumns] = useState<Record<string, KanbanTask[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState({
    priority: [] as string[], // ["low", "medium", "high"]
    assignee: [] as string[], // [assignee names]
    dueDate: "all", // "all", "overdue", "today", "week", "future"
    tags: [] as string[], // [tag strings]
  });
  const [createTaskDialogOpen, setCreateTaskDialogOpen] = useState(false);
  const [editTaskDialogOpen, setEditTaskDialogOpen] = useState(false);
  const [moveTaskDialogOpen, setMoveTaskDialogOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [selectedTaskStatus, setSelectedTaskStatus] = useState<string>("");
  const [selectedTaskAssignedBy, setSelectedTaskAssignedBy] = useState<number | undefined>(undefined);
  const [projectDetails, setProjectDetails] = useState<{ name: string; description?: string } | null>(null);

  // Move fetchTasks outside useEffect so it can be reused
  const fetchTasks = async () => {
    setLoading(true);
    try {
      let response;
      
      if (projectId) {
        // Fetch tasks for specific project
        response = await getKanbanTasks(projectId);
      } else {
        // Fetch all user tasks
        let userId = null;
        try {
          const userStr = localStorage.getItem('teamsync_user');
          if (userStr) {
            const userObj = JSON.parse(userStr);
            userId = userObj.id;
          }
        } catch (e) {
          console.error('Failed to parse teamsync_user from localStorage:', e);
        }
        
        if (!userId) {
          setLoading(false);
          setError("You must be logged in to view tasks.");
          return;
        }
        
        response = await getUserInvolvedTasks();
      }
      
      if (response.error) {
        toast({ title: "Error", description: response.error, variant: "destructive" });
        setError("Failed to fetch tasks.");
        setTasks([]);
      } else {
        const tasksData = response.tasks || response.data || response;
        if (Array.isArray(tasksData)) {
          const formattedTasks = tasksData.map((task, index) => {
            if (!task.id) {
              return null;
            }
            return {
              id: task.id.toString(),
              title: task.title,
              description: task.description,
              status: task.status?.toLowerCase().replace(/\s+/g, '-') || 'todo',
              priority: task.priority?.toLowerCase() || 'medium',
              assignee: task.assignee ? {
                name: task.assignee.name,
                avatar: task.assignee.profile_picture || `https://ui-avatars.com/api/?name=${task.assignee.name.replace(/\s+/g, '+')}&background=random`
              } : undefined,
              dueDate: task.due_date,
              assigned_by: task.assigned_by,
              tags: task.tags || [],
              comments: task.comments_count || 0,
              attachments: task.attachments_count || 0,
            };
          }).filter(task => task !== null);
          setTasks(formattedTasks);
          setColumns(groupTasksByStatus(formattedTasks));
        } else {
          setError("Received an invalid format for tasks.");
          setTasks([]);
        }
      }
    } catch (err) {
      setError("An unexpected error occurred.");
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [projectId]);

  // Fetch project details when projectId is available
  useEffect(() => {
    const fetchProjectDetails = async () => {
      if (!projectId) {
        setProjectDetails(null);
        return;
      }

      try {
        const response = await getProjectById(projectId);
        if (response && !response.error) {
          const projectData = response.data || response;
          setProjectDetails({
            name: projectData.title || projectData.name,
            description: projectData.description
          });
        }
      } catch (error) {
        console.error("Error fetching project details:", error);
      }
    };

    fetchProjectDetails();
  }, [projectId]);

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

  // Assign a sticky note color based on task id (for consistency)
  const getStickyColor = (taskId: string) => {
    let hash = 0;
    for (let i = 0; i < taskId.length; i++) {
      hash = taskId.charCodeAt(i) + ((hash << 5) - hash);
    }
    return stickyColors[Math.abs(hash) % stickyColors.length];
  };

  // DnD handler
  const onDragEnd = async (result: DropResult) => {
    const { source, destination } = result;
    
    if (!destination) {
      return;
    }
    
    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      return;
    }
    
    const sourceCol = source.droppableId;
    const destCol = destination.droppableId;
    
    const sourceTasks = Array.from(columns[sourceCol]);
    const destTasks = Array.from(columns[destCol]);
    const [removed] = sourceTasks.splice(source.index, 1);
    
    if (sourceCol === destCol) {
      sourceTasks.splice(destination.index, 0, removed);
      setColumns({ ...columns, [sourceCol]: sourceTasks });
    } else {
      removed.status = destCol as KanbanTask["status"];
      destTasks.splice(destination.index, 0, removed);
      setColumns({
        ...columns,
        [sourceCol]: sourceTasks,
        [destCol]: destTasks,
      });

      // Prepare backend task object
      const backendTask = {
        id: removed.id,
        title: removed.title,
        description: removed.description,
        status: destCol,
        priority: removed.priority,
        due_date: removed.dueDate,
        tags: removed.tags,
        assignee: removed.assignee
          ? {
              name: removed.assignee.name,
              profile_picture: removed.assignee.avatar,
            }
          : undefined,
      };

      const taskId = parseInt(removed.id, 10);

      if (isNaN(taskId) || ['user', 'todo', 'in_progress', 'in_review', 'completed'].includes(removed.id)) {
        toast({ title: "Error", description: "Invalid task ID", variant: "destructive" });
        fetchTasks(); // Refresh board to revert
        return;
      }

      try {
        const response = await updateTask(taskId, backendTask);
        if (response.error) {
          toast({ title: "Error", description: response.error?.message || String(response.error), variant: "destructive" });
          fetchTasks(); // Refresh board to revert
        } else {
          toast({ title: "Task updated", description: `Task moved to ${columnNames[destCol]}` });
          fetchTasks(); // Refresh board to show backend state
        }
      } catch (err) {
        toast({ title: "Error", description: "Failed to update task status", variant: "destructive" });
        fetchTasks(); // Refresh board to revert
      }
    }
  };

  // Handler functions for task actions
  const handleDeleteTask = async (taskId: number, assignedBy?: number) => {
    // Check if user is the assigner
    const userId = typeof user?.id === 'string' ? parseInt(user.id) : user?.id;
    console.log('Permission check:', { userId, assignedBy, user: user?.id });
    if (userId !== assignedBy) {
      toast({
        title: "Permission Denied",
        description: "Only the task assigner can delete this task.",
        variant: "destructive",
      });
      return;
    }

    const confirmed = window.confirm("Are you sure you want to delete this task? This action cannot be undone.");
    if (!confirmed) return;

    try {
      const response = await deleteTask(taskId);
      if (response && !response.error) {
        toast({
          title: "Task deleted successfully",
          description: "The task has been permanently deleted.",
        });
        fetchTasks();
      } else {
        toast({
          title: "Failed to delete task",
          description: response?.error || "An error occurred while deleting the task.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error deleting task:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while deleting the task.",
        variant: "destructive",
      });
    }
  };

  const handleEditTask = (taskId: number, assignedBy?: number) => {
    // Check if user is the assigner
    const userId = typeof user?.id === 'string' ? parseInt(user.id) : user?.id;
    console.log('Edit permission check:', { userId, assignedBy, user: user?.id });
    if (userId !== assignedBy) {
      toast({
        title: "Permission Denied",
        description: "Only the task assigner can edit this task.",
        variant: "destructive",
      });
      return;
    }

    setSelectedTaskId(taskId);
    setEditTaskDialogOpen(true);
  };

  const handleMoveTask = (taskId: number, currentStatus: string, assignedBy?: number) => {
    setSelectedTaskId(taskId);
    setSelectedTaskStatus(currentStatus);
    setSelectedTaskAssignedBy(assignedBy);
    setMoveTaskDialogOpen(true);
  };

  // Get unique assignees and tags from tasks
  const assigneeOptions = useMemo(() => {
    const names = new Set<string>();
    tasks.forEach(t => t.assignee && names.add(t.assignee.name));
    return Array.from(names);
  }, [tasks]);
  const tagOptions = useMemo(() => {
    const tags = new Set<string>();
    tasks.forEach(t => t.tags && t.tags.forEach(tag => tags.add(tag)));
    return Array.from(tags);
  }, [tasks]);

  // Filtering logic
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      // Priority
      if (filter.priority.length && !filter.priority.includes(task.priority)) return false;
      // Assignee
      if (filter.assignee.length && (!task.assignee || !filter.assignee.includes(task.assignee.name))) return false;
      // Tags
      if (filter.tags.length && (!task.tags || !task.tags.some(tag => filter.tags.includes(tag)))) return false;
      // Due Date
      if (filter.dueDate !== "all" && task.dueDate) {
        const today = new Date();
        const due = new Date(task.dueDate);
        if (filter.dueDate === "overdue" && due >= today) return false;
        if (filter.dueDate === "today" && (due.getDate() !== today.getDate() || due.getMonth() !== today.getMonth() || due.getFullYear() !== today.getFullYear())) return false;
        if (filter.dueDate === "week") {
          const weekStart = new Date(today);
          weekStart.setDate(today.getDate() - today.getDay());
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 6);
          if (due < weekStart || due > weekEnd) return false;
        }
        if (filter.dueDate === "future" && due <= today) return false;
      }
      return true;
    });
  }, [tasks, filter]);

  // Group filtered tasks by status
  const filteredColumns = useMemo(() => groupTasksByStatus(filteredTasks), [filteredTasks]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p>Loading tasks...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-red-500">
        <h2 className="text-xl font-semibold">Error</h2>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {projectDetails ? projectDetails.name : "Kanban Board"}
          </h1>
          <p className="text-muted-foreground">
            {projectDetails?.description || "Manage and track your team's tasks"}
          </p>
        </div>
        <div className="flex space-x-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="space-x-2">
                <Filter className="h-4 w-4" />
                <span>Filter</span>
                {(filter.priority.length || filter.assignee.length || filter.tags.length || filter.dueDate !== "all") && (
                  <span className="ml-2 text-xs text-blue-600">●</span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72 p-4 space-y-4">
              <div>
                <div className="font-semibold mb-2">Priority</div>
                <div className="flex gap-2 flex-wrap">
                  {["low", "medium", "high"].map(p => (
                    <label key={p} className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filter.priority.includes(p)}
                        onChange={e => setFilter(f => ({ ...f, priority: e.target.checked ? [...f.priority, p] : f.priority.filter(x => x !== p) }))}
                      />
                      <span className="capitalize">{p}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <div className="font-semibold mb-2">Assignee</div>
                <div className="flex gap-2 flex-wrap">
                  {assigneeOptions.length === 0 && <span className="text-xs text-muted-foreground">No assignees</span>}
                  {assigneeOptions.map(name => (
                    <label key={name} className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filter.assignee.includes(name)}
                        onChange={e => setFilter(f => ({ ...f, assignee: e.target.checked ? [...f.assignee, name] : f.assignee.filter(x => x !== name) }))}
                      />
                      <span>{name}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <div className="font-semibold mb-2">Due Date</div>
                <div className="flex gap-2 flex-wrap">
                  {dueDateOptions.map(opt => (
                    <label key={opt.value} className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="radio"
                        name="dueDate"
                        checked={filter.dueDate === opt.value}
                        onChange={() => setFilter(f => ({ ...f, dueDate: opt.value }))}
                      />
                      <span>{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <div className="font-semibold mb-2">Tags</div>
                <div className="flex gap-2 flex-wrap">
                  {tagOptions.length === 0 && <span className="text-xs text-muted-foreground">No tags</span>}
                  {tagOptions.map(tag => (
                    <label key={tag} className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filter.tags.includes(tag)}
                        onChange={e => setFilter(f => ({ ...f, tags: e.target.checked ? [...f.tags, tag] : f.tags.filter(x => x !== tag) }))}
                      />
                      <span>{tag}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setFilter({ priority: [], assignee: [], dueDate: "all", tags: [] })}
                >
                  Clear Filters
                </Button>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button onClick={() => setCreateTaskDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" /> Add Task
          </Button>
        </div>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="kanban-board grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 min-h-screen">
          {columnOrder.map((col) => (
            <Droppable droppableId={col} key={col}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="flex flex-col bg-white/10 rounded-lg p-2 min-w-0 w-full h-full"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div className={`h-2 w-2 rounded-full ${columnColors[col]}`}></div>
                      <h3 className="font-semibold text-white">{columnNames[col]}</h3>
                      <Badge variant="outline" className="bg-white/10 text-white border-white/20">{filteredColumns[col]?.length || 0}</Badge>
                    </div>
                    <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-col gap-3 flex-1 min-w-0">
                    {filteredColumns[col]?.map((task, idx) => (
                      <Draggable draggableId={task.id} index={idx} key={task.id || idx}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`task-card ${getStickyColor(task.id)} ${snapshot.isDragging ? 'dragging' : ''}`}
                            style={{
                              ...provided.draggableProps.style,
                              minWidth: 0,
                              maxWidth: '100%',
                            }}
                          >
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
                                    <DropdownMenuItem 
                                      onClick={() => handleEditTask(parseInt(task.id), task.assigned_by)}
                                    >
                                      Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem 
                                      onClick={() => handleMoveTask(parseInt(task.id), task.status, task.assigned_by)}
                                    >
                                      Move
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem 
                                      className="text-destructive"
                                      onClick={() => handleDeleteTask(parseInt(task.id), task.assigned_by)}
                                    >
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
                                  {task.tags.map((tag, tagIndex) => (
                                    <Badge key={`${task.id}-${tag}-${tagIndex}`} variant="secondary" className="text-xs">
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
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                </div>
              )}
            </Droppable>
          ))}
        </div>
      </DragDropContext>

      {/* Create Task Dialog */}
      <CreateTaskDialog
        open={createTaskDialogOpen}
        onOpenChange={setCreateTaskDialogOpen}
        onTaskCreated={fetchTasks}
        preSelectedProject={projectId}
      />

      {/* Edit Task Dialog */}
      <EditTaskDialog
        open={editTaskDialogOpen}
        onOpenChange={setEditTaskDialogOpen}
        taskId={selectedTaskId}
        onTaskUpdated={fetchTasks}
      />

      {/* Move Task Dialog */}
      <MoveTaskDialog
        open={moveTaskDialogOpen}
        onOpenChange={setMoveTaskDialogOpen}
        taskId={selectedTaskId}
        currentStatus={selectedTaskStatus}
        assignedBy={selectedTaskAssignedBy}
        onTaskMoved={fetchTasks}
      />
    </div>
  );
};

export default KanbanBoard;
