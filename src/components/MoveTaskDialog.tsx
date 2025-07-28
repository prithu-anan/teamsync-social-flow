import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
import { updateTask } from "@/utils/api/tasks-api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/components/ui/use-toast";

interface MoveTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskId: number | null;
  currentStatus: string;
  assignedBy?: number;
  onTaskMoved: () => void;
}

const statusOptions = [
  { value: "todo", label: "To Do" },
  { value: "in_progress", label: "In Progress" },
  { value: "in_review", label: "In Review" },
  { value: "completed", label: "Completed" },
];

const MoveTaskDialog = ({ open, onOpenChange, taskId, currentStatus, assignedBy, onTaskMoved }: MoveTaskDialogProps) => {
  const { user } = useAuth();
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [loading, setLoading] = useState(false);

  // Check if user can move to completed status
  const canMoveToCompleted = () => {
    const userId = typeof user?.id === 'string' ? parseInt(user.id) : user?.id;
    console.log('Move permission check:', { userId, assignedBy, user: user?.id });
    return userId === assignedBy;
  };

  // Get available status options based on user permissions
  const getAvailableStatusOptions = () => {
    return statusOptions.filter(option => {
      if (option.value === "completed") {
        return canMoveToCompleted();
      }
      return true;
    });
  };

  const handleMoveTask = async () => {
    if (!taskId || !selectedStatus) {
      return;
    }

    setLoading(true);

    try {
      const response = await updateTask(taskId, {
        status: selectedStatus,
      });

      if (response && !response.error) {
        toast({
          title: "Task moved successfully",
          description: `Task moved to ${statusOptions.find(s => s.value === selectedStatus)?.label}`,
        });
        
        onOpenChange(false);
        onTaskMoved();
      } else {
        let errorMessage = "An error occurred while moving the task.";
        
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
          title: "Failed to move task",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error moving task:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while moving the task.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedStatus("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Move Task</DialogTitle>
          <DialogDescription>
            Select the new status for this task. {!canMoveToCompleted() && "Only the task assigner can move tasks to completed status."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="status">New Status</Label>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select a status" />
              </SelectTrigger>
              <SelectContent>
                {getAvailableStatusOptions().map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedStatus === "completed" && !canMoveToCompleted() && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm text-yellow-800">
                Only the task assigner can move tasks to completed status.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button 
            onClick={handleMoveTask} 
            disabled={loading || !selectedStatus || (selectedStatus === "completed" && !canMoveToCompleted())}
          >
            {loading ? "Moving..." : "Move Task"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MoveTaskDialog; 