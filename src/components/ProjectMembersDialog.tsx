import { useState, useEffect } from "react";
import { Search, X, Plus, Users, Crown, Shield, User, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { 
  getProjectMembers, 
  addMemberToProject, 
  removeMemberFromProject, 
  updateMemberRoleInProject 
} from "@/utils/api/projects-api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/components/ui/use-toast";

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface ProjectMember {
  user_id: string;
  role: string;
  user?: User;
}

interface ProjectMembersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  projectName: string;
  isCreator: boolean;
  onMembersUpdated: () => void;
}

const ProjectMembersDialog = ({ 
  open, 
  onOpenChange, 
  projectId, 
  projectName, 
  isCreator,
  onMembersUpdated 
}: ProjectMembersDialogProps) => {
  const { user } = useAuth();
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>("member");
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<ProjectMember | null>(null);

  // Fetch project members
  useEffect(() => {
    const fetchMembers = async () => {
      if (!open || !projectId) return;
      
      try {
        setLoading(true);
        const response = await getProjectMembers(projectId);
        if (response && !response.error) {
          const membersData = response.members || response.data || response;
          if (Array.isArray(membersData)) {
            // Fetch user details for all members
            const memberIds = membersData.map(m => m.user_id);
            const userCache = {};
            
            await Promise.all(memberIds.map(async (uid) => {
              if (!uid) return;
              try {
                const userRes = await getUsers();
                if (userRes && !userRes.error) {
                  const usersData = userRes.data || userRes;
                  if (Array.isArray(usersData)) {
                    const user = usersData.find(u => u.id?.toString() === uid?.toString());
                    if (user) {
                      userCache[uid] = user;
                    }
                  }
                }
              } catch {}
            }));

            const membersWithUsers = membersData.map(member => ({
              ...member,
              user: userCache[member.user_id]
            }));
            
            setMembers(membersWithUsers);
          }
        }
      } catch (error) {
        console.error("Error fetching project members:", error);
        toast({
          title: "Error",
          description: "Failed to load project members.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, [open, projectId]);

  // Fetch all users for adding new members
  useEffect(() => {
    const fetchUsers = async () => {
      if (!open) return;
      
      try {
        const response = await getUsers();
        if (response && !response.error) {
          const usersData = response.data || response;
          if (Array.isArray(usersData)) {
            // Filter out current members and current user
            const memberIds = members.map(m => m.user_id);
            const availableUsers = usersData.filter(u => 
              u.id !== user?.id && !memberIds.includes(u.id?.toString())
            );
            setUsers(availableUsers);
          }
        }
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    fetchUsers();
  }, [open, members, user?.id]);

  const filteredUsers = users.filter((user) =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddMember = async () => {
    if (!selectedUser) return;

    setUpdating(true);
    try {
      const response = await addMemberToProject(projectId, {
        user_id: parseInt(selectedUser.id),
        role: selectedRole
      });

      if (response && !response.error) {
        toast({
          title: "Member added successfully",
          description: `${selectedUser.name} has been added to the project.`,
        });
        
        setSelectedUser(null);
        setSelectedRole("member");
        setSearchQuery("");
        onMembersUpdated();
      } else {
        toast({
          title: "Failed to add member",
          description: response?.error || "An error occurred while adding the member.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error adding member:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while adding the member.",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleRemoveMemberClick = (member: ProjectMember) => {
    setMemberToDelete(member);
    setDeleteDialogOpen(true);
  };

  const handleRemoveMember = async () => {
    if (!memberToDelete) return;

    setUpdating(true);
    try {
      const response = await removeMemberFromProject(projectId, memberToDelete.user_id);

      if (response && !response.error) {
        toast({
          title: "Member removed successfully",
          description: `${memberToDelete.user?.name || 'The member'} has been removed from the project.`,
        });
        onMembersUpdated();
      } else {
        toast({
          title: "Failed to remove member",
          description: response?.error || "An error occurred while removing the member.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error removing member:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while removing the member.",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
      setDeleteDialogOpen(false);
      setMemberToDelete(null);
    }
  };

  const handleRoleChange = async (memberId: string, newRole: string) => {
    setUpdating(true);
    try {
      const response = await updateMemberRoleInProject(projectId, memberId, {
        role: newRole
      });

      if (response && !response.error) {
        toast({
          title: "Role updated successfully",
          description: "The member's role has been updated.",
        });
        onMembersUpdated();
      } else {
        toast({
          title: "Failed to update role",
          description: response?.error || "An error occurred while updating the role.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error updating role:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while updating the role.",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role.toLowerCase()) {
      case 'owner':
        return <Crown className="h-4 w-4" />;
      case 'admin':
        return <Shield className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'owner':
        return "bg-yellow-100 text-yellow-800";
      case 'admin':
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleClose = () => {
    setMembers([]);
    setUsers([]);
    setSearchQuery("");
    setSelectedUser(null);
    setSelectedRole("member");
    setDeleteDialogOpen(false);
    setMemberToDelete(null);
    onOpenChange(false);
  };

  // For non-creators, show a read-only view
  if (!isCreator) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-hidden p-6">
          <DialogHeader className="pb-4">
            <DialogTitle>Project Members</DialogTitle>
            <DialogDescription>
              View team members in "{projectName}".
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 max-h-[60vh] overflow-y-auto px-1 pb-4">
            {/* Current Members - Read Only */}
            <div className="space-y-3">
              <Label>Current Members ({members.length})</Label>
              {loading ? (
                <div className="text-center py-4">Loading members...</div>
              ) : (
                <div className="space-y-2">
                  {members.map((member) => (
                    <div
                      key={member.user_id}
                      className="flex items-center justify-between p-3 border rounded-md bg-muted/30"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={member.user?.avatar} alt={member.user?.name} />
                          <AvatarFallback>
                            {member.user?.name?.split(" ").map((n) => n[0]).join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium text-sm">
                            {member.user?.name || "Unknown User"}
                            {member.user_id === user?.id?.toString() && " (You)"}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {member.user?.email}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        {getRoleIcon(member.role)}
                        <Badge className={getRoleColor(member.role)}>
                          {member.role}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button onClick={handleClose}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

    return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-hidden p-6">
          <DialogHeader className="pb-4">
            <DialogTitle>Manage Team Members</DialogTitle>
            <DialogDescription>
              Add, remove, or update roles for team members in "{projectName}".
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 max-h-[60vh] overflow-y-auto px-1 pb-4">
            {/* Current Members */}
            <div className="space-y-3">
              <Label>Current Members ({members.length})</Label>
              {loading ? (
                <div className="text-center py-4">Loading members...</div>
              ) : (
                <div className="space-y-2">
                  {members.map((member) => (
                    <div
                      key={member.user_id}
                      className="flex items-center justify-between p-3 border rounded-md bg-muted/30"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={member.user?.avatar} alt={member.user?.name} />
                          <AvatarFallback>
                            {member.user?.name?.split(" ").map((n) => n[0]).join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium text-sm">
                            {member.user?.name || "Unknown User"}
                            {member.user_id === user?.id?.toString() && " (You)"}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {member.user?.email}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          {getRoleIcon(member.role)}
                          <Badge className={getRoleColor(member.role)}>
                            {member.role}
                          </Badge>
                        </div>
                        
                        {member.user_id !== user?.id?.toString() && (
                          <Select
                            value={member.role}
                            onValueChange={(value) => handleRoleChange(member.user_id, value)}
                            disabled={updating}
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
                        )}
                        
                        {member.user_id !== user?.id?.toString() && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveMemberClick(member)}
                            disabled={updating}
                            className="h-8 w-8 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add New Member */}
            <div className="space-y-4">
              <Label>Add New Member</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Search Results */}
              {searchQuery && filteredUsers.length > 0 && (
                <ScrollArea className="h-32 border rounded-md p-2 mb-2">
                  <div className="space-y-2">
                    {filteredUsers.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between p-2 hover:bg-muted/50 rounded cursor-pointer"
                        onClick={() => setSelectedUser(user)}
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

              {/* Selected User */}
              {selectedUser && (
                <div className="p-3 border rounded-md bg-primary/5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={selectedUser.avatar} alt={selectedUser.name} />
                        <AvatarFallback>
                          {selectedUser.name?.split(" ").map((n) => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium text-sm">{selectedUser.name}</div>
                        <div className="text-xs text-muted-foreground">{selectedUser.email}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select
                        value={selectedRole}
                        onValueChange={setSelectedRole}
                        disabled={updating}
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
                        onClick={handleAddMember}
                        disabled={updating}
                        size="sm"
                      >
                        {updating ? "Adding..." : "Add Member"}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button onClick={handleClose} disabled={updating}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Member Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove "{memberToDelete?.user?.name || 'this member'}" from the project? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={updating}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveMember}
              disabled={updating}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {updating ? "Removing..." : "Remove Member"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
 };

export default ProjectMembersDialog; 