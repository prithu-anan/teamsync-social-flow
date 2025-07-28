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
import { updateProject } from "@/utils/api/projects-api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/components/ui/use-toast";

interface Project {
  id: string;
  name: string;
  description?: string;
  createdBy: string;
  createdById?: string;
  creationDate: string;
  deadline: string;
  progress: number;
  members: {
    name: string;
    avatar: string;
  }[];
}

interface EditProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project | null;
  onProjectUpdated: () => void;
}

const EditProjectDialog = ({ open, onOpenChange, project, onProjectUpdated }: EditProjectDialogProps) => {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  // Initialize form with project data
  useEffect(() => {
    if (project) {
      setTitle(project.name);
      setDescription(project.description || "");
    }
  }, [project]);

  const handleUpdateProject = async () => {
    if (!project) return;

    if (!title.trim()) {
      toast({
        title: "Title required",
        description: "Please enter a project title.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const projectData = {
        title: title.trim(),
        description: description.trim(),
      };

      const response = await updateProject(project.id, projectData);

      if (response && !response.error) {
        toast({
          title: "Project updated successfully",
          description: "Your project has been updated.",
        });
        
        onProjectUpdated();
        onOpenChange(false);
      } else {
        toast({
          title: "Failed to update project",
          description: response?.error || "An error occurred while updating the project.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error updating project:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while updating the project.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setTitle("");
    setDescription("");
    onOpenChange(false);
  };

  // Check if user is authorized to edit this project
  const isAuthorized = project?.createdById === user?.id?.toString();

  if (!isAuthorized) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Not Authorized</DialogTitle>
            <DialogDescription>
              Only the project creator can edit this project.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={handleClose}>OK</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Project</DialogTitle>
          <DialogDescription>
            Update the project title and description.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="edit-title">Project Title *</Label>
            <Input
              id="edit-title"
              placeholder="Enter project title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="edit-description">Description</Label>
            <Textarea
              id="edit-description"
              placeholder="Enter project description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1"
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleUpdateProject} disabled={loading}>
            {loading ? "Updating..." : "Update Project"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditProjectDialog; 