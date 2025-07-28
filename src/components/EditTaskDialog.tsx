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
import { getProjectMembers } from "@/utils/api/projects-api";
import { updateTask, getTaskById } from "@/utils/api/tasks-api";
import { getUserById } from "@/utils/api/users-api";
import { get_task_deadline, get_task_deadline_by_parent_task_id } from "@/utils/ai-api/task-estimation";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/components/ui/use-toast";

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

interface Task {
  id: number;
  title: string;
  description?: string;
  status: string;
  priority: string;
  assigned_to?: number;
  deadline?: string;
  project_id: number;
  assigned_by?: number;
}

interface EditTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskId: number | null;
  onTaskUpdated: () => void;
}

const EditTaskDialog = ({ open, onOpenChange, taskId, onTaskUpdated }: EditTaskDialogProps) => {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedAssignee, setSelectedAssignee] = useState<string>("");
  const [priority, setPriority] = useState<string>("medium");
  const [deadline, setDeadline] = useState("");
  const [projectId, setProjectId] = useState<number | null>(null);
  
  const [projectMembers, setProjectMembers] = useState<ProjectMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [aiSuggestionOpen, setAiSuggestionOpen] = useState(false);
  const [aiEstimation, setAiEstimation] = useState<any>(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Fetch task details when dialog opens
  useEffect(() => {
    const fetchTaskDetails = async () => {
      if (!open || !taskId) {
        return;
      }

      setLoading(true);
      try {
        const response = await getTaskById(taskId);
        if (response && !response.error) {
          const taskData = response.data || response;
          setTitle(taskData.title || "");
          setDescription(taskData.description || "");
          setSelectedAssignee(taskData.assigned_to?.toString() || "");
          setPriority(taskData.priority || "medium");
          setDeadline(taskData.deadline ? new Date(taskData.deadline).toISOString().split('T')[0] : "");
          setProjectId(taskData.project_id);
        } else {
          toast({
            title: "Error",
            description: "Failed to fetch task details",
            variant: "destructive",
          });
          onOpenChange(false);
        }
      } catch (error) {
        console.error("Error fetching task details:", error);
        toast({
          title: "Error",
          description: "Failed to fetch task details",
          variant: "destructive",
        });
        onOpenChange(false);
      } finally {
        setLoading(false);
      }
    };

    fetchTaskDetails();
  }, [open, taskId, onOpenChange]);

  // Fetch project members when project ID is available
  useEffect(() => {
    const fetchProjectMembers = async () => {
      if (!projectId) {
        setProjectMembers([]);
        return;
      }

      try {
        const response = await getProjectMembers(projectId.toString());
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
            setProjectMembers(membersWithUserDetails);
          }
        }
      } catch (error) {
        console.error("Error fetching project members:", error);
      }
    };

    fetchProjectMembers();
  }, [projectId]);

  // Check if AI suggestion button should be shown
  const shouldShowAiSuggestion = () => {
    return title.trim() && description.trim() && projectId;
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
        project_id: projectId,
      };

      const response = await get_task_deadline(requestData);

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

  const handleUpdateTask = async () => {
    if (!taskId) return;

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
        priority: priority,
        assigned_to: parseInt(selectedAssignee),
        deadline: new Date(deadline).toISOString(),
      };

      const response = await updateTask(taskId, taskData);

      if (response && !response.error) {
        toast({
          title: "Task updated successfully",
          description: "Your task has been updated.",
        });
        
        onOpenChange(false);
        onTaskUpdated();
      } else {
        let errorMessage = "An error occurred while updating the task.";
        
        if (response?.error) {
          if (typeof response.error === 'string') {
            errorMessage = response.error;
          } else if (response.error.message) {
            errorMessage = response.error.message;
          } else if (response.error.error) {
            errorMessage = response.error.error;
          }
        }
        
        toast({
          title: "Failed to update task",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error updating task:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while updating the task.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setTitle("");
    setDescription("");
    setSelectedAssignee("");
    setPriority("medium");
    setDeadline("");
    setProjectId(null);
    setProjectMembers([]);
    setAiEstimation(null);
    onOpenChange(false);
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-current"></div>
            <span className="ml-2">Loading task details...</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
          <DialogDescription>
            Update the task details. Only the task assigner can edit this task.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Task Title */}
          <div>
            <Label htmlFor="edit-title">Task Title *</Label>
            <Input
              id="edit-title"
              placeholder="Enter task title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1"
            />
          </div>
          
          {/* Task Description */}
          <div>
            <Label htmlFor="edit-description">Description *</Label>
            <Textarea
              id="edit-description"
              placeholder="Enter task description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1"
              rows={3}
            />
          </div>

          {/* Assignee Selection */}
          {projectMembers.length > 0 && (
            <div>
              <Label htmlFor="edit-assignee">Assign To *</Label>
              <Select value={selectedAssignee} onValueChange={setSelectedAssignee}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select an assignee" />
                </SelectTrigger>
                <SelectContent>
                  {projectMembers.map((member) => (
                    <SelectItem key={member.user_id} value={member.user_id.toString()}>
                      {member.user?.name || `User ${member.user_id}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Priority Selection */}
          <div>
            <Label htmlFor="edit-priority">Priority *</Label>
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
            <Label htmlFor="edit-deadline">Deadline *</Label>
            <Input
              id="edit-deadline"
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
          <Button onClick={handleUpdateTask} disabled={loading}>
            {loading ? "Updating..." : "Update Task"}
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

export default EditTaskDialog; 