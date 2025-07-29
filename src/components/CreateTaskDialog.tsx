import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getProjects, getProjectMembers, getProjectTasks } from "@/utils/api/projects-api";
import { createTask } from "@/utils/api/tasks-api";
import { getUserById } from "@/utils/api/users-api";
import { get_task_deadline, get_task_deadline_by_parent_task_id } from "@/utils/ai-api/task-estimation";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/components/ui/use-toast";

interface Project {
  id: string;
  title: string;
  description?: string;
}

interface ProjectMember {
  user_id: number;
  role: string;
  joined_at: string;
  user?: {
    id: number;
    name: string;
    email: string;
    profile_picture?: string;
  };
}

interface ProjectTask {
  id: string;
  title: string;
  description?: string;
}

interface CreateTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTaskCreated: () => void;
  preSelectedProject?: string;
}

const CreateTaskDialog = ({ open, onOpenChange, onTaskCreated, preSelectedProject }: CreateTaskDialogProps) => {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [selectedAssignee, setSelectedAssignee] = useState<string>("");
  const [selectedParentTask, setSelectedParentTask] = useState<string>("");
  const [priority, setPriority] = useState<string>("medium");
  const [deadline, setDeadline] = useState("");
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectMembers, setProjectMembers] = useState<ProjectMember[]>([]);
  const [projectTasks, setProjectTasks] = useState<ProjectTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [aiSuggestionOpen, setAiSuggestionOpen] = useState(false);
  const [aiEstimation, setAiEstimation] = useState<any>(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Fetch user's projects
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await getProjects();
        if (response && !response.error) {
          const projectsData = response.data || response;
          if (Array.isArray(projectsData)) {
            // Filter projects to include those where user is a member OR projects created by the user
            const userProjects = projectsData.filter(project => 
              // User is a member of the project
              (Array.isArray(project.members) && project.members.some(m => m.user_id?.toString() === user?.id?.toString())) ||
              // OR user created the project (check created_by field)
              (project.created_by?.toString() === user?.id?.toString()) ||
              // OR user is the creator (check creator_id field)
              (project.creator_id?.toString() === user?.id?.toString())
            );

            
            setProjects(userProjects);
            
            // Set pre-selected project if provided and project exists in user's projects
            if (preSelectedProject && open) {
              const projectExists = userProjects.some(project => 
                project.id.toString() === preSelectedProject || 
                project.id === parseInt(preSelectedProject)
              );
              if (projectExists) {
                setSelectedProject(preSelectedProject);
              } else {
                // If project doesn't exist in user projects, check if it exists in all projects
                const projectInAllProjects = projectsData.some(project => 
                  project.id.toString() === preSelectedProject || 
                  project.id === parseInt(preSelectedProject)
                );
                // If it exists in all projects but not user projects, we might need to add it
                if (projectInAllProjects) {
                  // Find the project in all projects and add it to user projects
                  const projectToAdd = projectsData.find(project => 
                    project.id.toString() === preSelectedProject || 
                    project.id === parseInt(preSelectedProject)
                  );
                  if (projectToAdd) {
                    setProjects([...userProjects, projectToAdd]);
                    setSelectedProject(preSelectedProject);
                  }
                }
              }
            }
          }
        }
      } catch (error) {
        console.error("Error fetching projects:", error);
      }
    };

    if (open) {
      fetchProjects();
    }
  }, [open, user?.id, preSelectedProject]);

  // Set pre-selected project after projects are loaded
  useEffect(() => {
    if (preSelectedProject && projects.length > 0 && open) {
      // Try both string and number comparison
      const projectExists = projects.some(project => 
        project.id.toString() === preSelectedProject || 
        project.id === parseInt(preSelectedProject)
      );
      if (projectExists) {
        setSelectedProject(preSelectedProject);
      }
    }
  }, [preSelectedProject, projects, open, selectedProject]);

  // Fetch project members when project is selected
  useEffect(() => {
    const fetchProjectMembers = async () => {
      if (!selectedProject) {
        setProjectMembers([]);
        return;
      }

      try {
        const response = await getProjectMembers(selectedProject);
        console.log('Project members response:', response);
        if (response && !response.error) {
          const membersData = response.data || response;
          if (Array.isArray(membersData)) {
            // Fetch user details for each member
            const membersWithUserDetails = await Promise.all(
              membersData.map(async (member) => {
                try {
                  const userResponse = await getUserById(member.user_id);
                  if (userResponse && !userResponse.error) {
                    const userData = userResponse.data || userResponse;
                    return {
                      ...member,
                      user: {
                        id: member.user_id,
                        name: userData.name,
                        email: userData.email,
                        profile_picture: userData.profile_picture
                      }
                    };
                  } else {
                    // Fallback if user details can't be fetched
                    return {
                      ...member,
                      user: {
                        id: member.user_id,
                        name: `User ${member.user_id}`,
                        email: `user${member.user_id}@example.com`,
                        profile_picture: undefined
                      }
                    };
                  }
                } catch (error) {
                  console.error(`Error fetching user ${member.user_id}:`, error);
                  // Fallback if user details can't be fetched
                  return {
                    ...member,
                    user: {
                      id: member.user_id,
                      name: `User ${member.user_id}`,
                      email: `user${member.user_id}@example.com`,
                      profile_picture: undefined
                    }
                  };
                }
              })
            );
            console.log('Processed project members with user details:', membersWithUserDetails);
            setProjectMembers(membersWithUserDetails);
          }
        }
      } catch (error) {
        console.error("Error fetching project members:", error);
      }
    };

    fetchProjectMembers();
  }, [selectedProject]);

  // Fetch project tasks when project is selected
  useEffect(() => {
    const fetchProjectTasks = async () => {
      if (!selectedProject) {
        setProjectTasks([]);
        return;
      }

      try {
        const response = await getProjectTasks(selectedProject);
        console.log('Project tasks response:', response);
        if (response && !response.error) {
          const tasksData = response.data || response;
          if (Array.isArray(tasksData)) {
            setProjectTasks(tasksData);
          }
        }
      } catch (error) {
        console.error("Error fetching project tasks:", error);
      }
    };

    fetchProjectTasks();
  }, [selectedProject]);

  const handleCreateTask = async () => {
    // Validate required fields
    if (!title.trim()) {
      toast({
        title: "Title required",
        description: "Please enter a task title.",
        variant: "destructive",
      });
      return;
    }

    if (!description.trim()) {
      toast({
        title: "Description required",
        description: "Please enter a task description.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedProject) {
      toast({
        title: "Project required",
        description: "Please select a project.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedAssignee) {
      toast({
        title: "Assignee required",
        description: "Please select an assignee.",
        variant: "destructive",
      });
      return;
    }

    if (!priority) {
      toast({
        title: "Priority required",
        description: "Please select a priority level.",
        variant: "destructive",
      });
      return;
    }

    if (!deadline) {
      toast({
        title: "Deadline required",
        description: "Please select a deadline.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const taskData = {
        title: title.trim(),
        description: description.trim(),
        status: "todo", // Always "todo" as specified
        priority: priority,
        assigned_to: parseInt(selectedAssignee),
        deadline: new Date(deadline).toISOString(),
        project_id: parseInt(selectedProject),
        parent_task_id: selectedParentTask && selectedParentTask !== "none" ? parseInt(selectedParentTask) : null,
      };

      console.log('Creating task with data:', taskData);
      const response = await createTask(taskData);
      console.log('API response:', response);

      if (response && !response.error) {
        toast({
          title: "Task created successfully",
          description: "Your new task has been created.",
        });
        
        // Reset form
        setTitle("");
        setDescription("");
        setSelectedProject("");
        setSelectedAssignee("");
        setSelectedParentTask("");
        setPriority("medium");
        setDeadline("");
        
        // Close dialog and refresh tasks
        onOpenChange(false);
        onTaskCreated();
      } else {
        let errorMessage = "An error occurred while creating the task.";
        
        if (response?.error) {
          if (typeof response.error === 'string') {
            errorMessage = response.error;
          } else if (response.error.message) {
            errorMessage = response.error.message;
          } else if (response.error.error) {
            errorMessage = response.error.error;
          }
        }
        
        // Check for specific permission error
        if (response?.error?.type === "FORBIDDEN") {
          errorMessage = "You don't have permission to create tasks. Only users with manager designation can perform this action.";
        }
        
        toast({
          title: "Failed to create task",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error creating task:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while creating the task.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Check if AI suggestion button should be shown
  const shouldShowAiSuggestion = () => {
    return title.trim() && description.trim() && selectedProject;
  };

  const handleAiSuggestion = async () => {
    if (!shouldShowAiSuggestion()) {
      return;
    }

    setAiLoading(true);
    setAiSuggestionOpen(true);

    try {
      const requestData = {
        title: title.trim(),
        description: description.trim(),
        project_id: parseInt(selectedProject),
      };

      let response;
      if (selectedParentTask && selectedParentTask !== "none") {
        // Use parent task version
        response = await get_task_deadline_by_parent_task_id({
          ...requestData,
          parent_task_id: parseInt(selectedParentTask),
        });
      } else {
        // Use regular version
        response = await get_task_deadline(requestData);
      }

      if (response && !response.error) {
        setAiEstimation(response);
      } else {
        toast({
          title: "AI Suggestion Failed",
          description: response?.error || "Failed to get AI suggestion",
          variant: "destructive",
        });
        setAiSuggestionOpen(false);
      }
    } catch (error) {
      console.error("Error getting AI suggestion:", error);
      toast({
        title: "AI Suggestion Failed",
        description: "An unexpected error occurred while getting AI suggestion",
        variant: "destructive",
      });
      setAiSuggestionOpen(false);
    } finally {
      setAiLoading(false);
    }
  };

  const handleClose = () => {
    setTitle("");
    setDescription("");
    setSelectedProject("");
    setSelectedAssignee("");
    setSelectedParentTask("");
    setPriority("medium");
    setDeadline("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
          <DialogDescription>
            Create a new task with all required details.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Task Title */}
          <div>
            <Label htmlFor="title">Task Title *</Label>
            <Input
              id="title"
              placeholder="Enter task title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1"
            />
          </div>
          
          {/* Task Description */}
          <div>
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              placeholder="Enter task description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1"
              rows={3}
            />
          </div>

          {/* Project Selection */}
          <div>
            <Label htmlFor="project">Project *</Label>
            <Select value={selectedProject} onValueChange={(value) => {
              setSelectedProject(value);
            }}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select a project" />
              </SelectTrigger>
              <SelectContent>
                {projects.length === 0 ? (
                  <SelectItem value="no-projects" disabled>
                    No projects available
                  </SelectItem>
                ) : (
                  projects.map((project) => (
                    <SelectItem key={project.id} value={project.id.toString()}>
                      {project.title}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Assignee Selection - Only show when project is selected */}
          {selectedProject && (
            <div>
              <Label htmlFor="assignee">Assign To *</Label>
              <Select value={selectedAssignee} onValueChange={(value) => {
                console.log('Selected assignee:', value);
                setSelectedAssignee(value);
              }}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select an assignee" />
                </SelectTrigger>
                <SelectContent>
                  {projectMembers.length === 0 ? (
                    <SelectItem value="no-members" disabled>
                      No members available
                    </SelectItem>
                  ) : (
                    projectMembers.map((member) => (
                      <SelectItem key={member.user_id} value={member.user_id.toString()}>
                        {member.user?.name || `User ${member.user_id}`}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Parent Task Selection - Only show when project is selected */}
          {selectedProject && (
            <div>
              <Label htmlFor="parent-task">Parent Task (Optional)</Label>
              <Select value={selectedParentTask} onValueChange={setSelectedParentTask}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select a parent task (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No parent task</SelectItem>
                  {projectTasks.map((task) => (
                    <SelectItem key={task.id} value={task.id}>
                      {task.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Priority Selection */}
          <div>
            <Label htmlFor="priority">Priority *</Label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Deadline */}
          <div>
            <Label htmlFor="deadline">Deadline *</Label>
            <Input
              id="deadline"
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="mt-1"
            />
          </div>

          {/* AI Suggestion Button */}
          {shouldShowAiSuggestion() && (
            <div className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleAiSuggestion}
                disabled={aiLoading}
                className="w-full"
              >
                {aiLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                    Getting AI Suggestion...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    Get AI Suggestion
                  </>
                )}
              </Button>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleCreateTask} disabled={loading}>
            {loading ? "Creating..." : "Create Task"}
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* AI Suggestion Dialog */}
      <Dialog open={aiSuggestionOpen} onOpenChange={setAiSuggestionOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>AI Task Estimation</DialogTitle>
            <DialogDescription>
              AI-powered suggestions for your task based on the provided details.
            </DialogDescription>
          </DialogHeader>

          {aiEstimation && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Suggested Priority</Label>
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${
                      aiEstimation.priority === 'high' ? 'bg-red-500' :
                      aiEstimation.priority === 'medium' ? 'bg-yellow-500' :
                      'bg-green-500'
                    }`}></div>
                    <span className="capitalize font-medium">{aiEstimation.priority}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Estimated Time</Label>
                  <div className="text-lg font-semibold">{aiEstimation.estimated_time}</div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Apply Suggestion</Label>
                  <Button
                    size="sm"
                    onClick={() => {
                      setPriority(aiEstimation.priority);
                      setAiSuggestionOpen(false);
                      toast({
                        title: "Suggestion Applied",
                        description: "Priority has been updated based on AI suggestion.",
                      });
                    }}
                  >
                    Apply Priority
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">AI Analysis</Label>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm leading-relaxed">{aiEstimation.comment}</p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setAiSuggestionOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
};

export default CreateTaskDialog; 