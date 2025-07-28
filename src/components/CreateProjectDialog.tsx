import { useState, useEffect } from "react";
import { Search, X, Plus, User } from "lucide-react";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getUsers } from "@/utils/api/users-api";
import { createProject } from "@/utils/api/projects-api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/components/ui/use-toast";

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface SelectedMember {
  user: User;
  role: "member" | "owner" | "admin";
}

interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProjectCreated: () => void;
}

const CreateProjectDialog = ({ open, onOpenChange, onProjectCreated }: CreateProjectDialogProps) => {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<SelectedMember[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch users for member selection
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await getUsers();
        if (response && !response.error) {
          const usersData = response.data || response;
          if (Array.isArray(usersData)) {
            // Filter out the current user
            setUsers(usersData.filter(u => u.id !== user?.id));
          }
        }
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    if (open) {
      fetchUsers();
    }
  }, [open, user?.id]);

  const filteredUsers = users.filter((user) =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddMember = (selectedUser: User) => {
    // Check if user is already selected
    if (selectedMembers.some(member => member.user.id === selectedUser.id)) {
      toast({
        title: "Member already added",
        description: "This user is already a member of the project.",
        variant: "destructive",
      });
      return;
    }

    setSelectedMembers(prev => [...prev, { user: selectedUser, role: "member" }]);
    setSearchQuery("");
  };

  const handleRemoveMember = (userId: string) => {
    setSelectedMembers(prev => prev.filter(member => member.user.id !== userId));
  };

  const handleRoleChange = (userId: string, role: "member" | "owner" | "admin") => {
    setSelectedMembers(prev =>
      prev.map(member =>
        member.user.id === userId ? { ...member, role } : member
      )
    );
  };

  const handleCreateProject = async () => {
    if (!title.trim()) {
      toast({
        title: "Title required",
        description: "Please enter a project title.",
        variant: "destructive",
      });
      return;
    }

    if (!description.trim()) {
      toast({
        title: "Description required",
        description: "Please enter a project description.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Prepare initial members array (backend will add the authenticated user automatically)
      const initialMembers = selectedMembers.map(member => ({
        user_id: parseInt(member.user.id),
        role: member.role
      }));

      const projectData = {
        title: title.trim(),
        description: description.trim(),
        initial_members: initialMembers
      };

      console.log('Creating project with data:', projectData);
      const response = await createProject(projectData);
      console.log('API response:', response);

      if (response && !response.error) {
        toast({
          title: "Project created successfully",
          description: "Your new project has been created.",
        });
        
        // Reset form
        setTitle("");
        setDescription("");
        setSelectedMembers([]);
        setSearchQuery("");
        
        // Close dialog and refresh projects
        onOpenChange(false);
        onProjectCreated();
      } else {
        let errorMessage = "An error occurred while creating the project.";
        
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
          title: "Failed to create project",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error creating project:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while creating the project.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setTitle("");
    setDescription("");
    setSelectedMembers([]);
    setSearchQuery("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-hidden p-6">
        <DialogHeader className="pb-4">
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>
            Create a new project and add team members with specific roles.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 max-h-[60vh] overflow-y-auto px-1 pb-4">
          {/* Project Details */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Project Title *</Label>
              <Input
                id="title"
                placeholder="Enter project title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Enter project description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1"
                rows={3}
              />
            </div>
          </div>

          {/* Member Selection */}
          <div className="space-y-4">
            <div>
              <Label>Add Team Members</Label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Search Results */}
            {searchQuery && filteredUsers.length > 0 && (
              <ScrollArea className="h-32 border rounded-md p-2 mb-2">
                <div className="space-y-2">
                  {filteredUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-2 hover:bg-muted/50 rounded cursor-pointer"
                      onClick={() => handleAddMember(user)}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.avatar} alt={user.name} />
                          <AvatarFallback>
                            {user.name?.split(" ").map((n) => n[0]).join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium text-sm">{user.name}</div>
                          <div className="text-xs text-muted-foreground">{user.email}</div>
                        </div>
                      </div>
                      <Plus className="h-4 w-4 text-muted-foreground" />
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}

            {/* Selected Members */}
            {selectedMembers.length > 0 && (
              <div className="space-y-3">
                <Label>Selected Members</Label>
                <div className="space-y-2">
                  {selectedMembers.map((member) => (
                    <div
                      key={member.user.id}
                      className="flex items-center justify-between p-3 border rounded-md bg-muted/30"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={member.user.avatar} alt={member.user.name} />
                          <AvatarFallback>
                            {member.user.name?.split(" ").map((n) => n[0]).join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium text-sm">{member.user.name}</div>
                          <div className="text-xs text-muted-foreground">{member.user.email}</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Select
                          value={member.role}
                          onValueChange={(value: "member" | "owner" | "admin") =>
                            handleRoleChange(member.user.id, value)
                          }
                        >
                          <SelectTrigger className="w-24 h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="member">Member</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="owner">Owner</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveMember(member.user.id)}
                          className="h-8 w-8"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="pt-4">
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleCreateProject} disabled={loading}>
            {loading ? "Creating..." : "Create Project"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateProjectDialog; 