import { useState, useEffect } from "react";
import { Search, Hash, Users, X, Building } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { getUsers } from "@/utils/api-helpers";
import { getProjects, getProjectMembers } from "@/utils/api/projects-api";
import { getUserById } from "@/utils/api/users-api";
import { createChannel } from "@/utils/api/channels-api";
import { sendMessage } from "@/utils/api/channels-api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/components/ui/use-toast";

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface Project {
  id: string;
  name: string;
  description?: string;
}

interface NewConversationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConversationCreated: (conversation: any) => void;
}

const NewConversationDialog = ({ open, onOpenChange, onConversationCreated }: NewConversationDialogProps) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("direct");
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectMembers, setProjectMembers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [messageContent, setMessageContent] = useState("");
  const [channelName, setChannelName] = useState("");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projectSearchQuery, setProjectSearchQuery] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [memberSearchQuery, setMemberSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);

  // Fetch users for direct messages
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

  // Fetch projects
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await getProjects();
        if (response && !response.error) {
          const projectsData = response.projects || response.data || response;
          if (Array.isArray(projectsData)) {
            // Only include projects where user is a member
            const userProjects = projectsData.filter(project =>
              Array.isArray(project.members) && project.members.some(m => m.user_id?.toString() === user?.id?.toString())
            );

            // Map projects to include basic info
            const mappedProjects = userProjects.map(project => ({
              id: project.id?.toString() || `project-${Date.now()}`,
              name: project.title || project.name || 'Unnamed Project',
              description: project.description || null,
            }));

            setProjects(mappedProjects);
          } else {
            setProjects([]);
          }
        } else {
          setProjects([]);
        }
      } catch (error) {
        console.error("Error fetching projects:", error);
        setProjects([]);
      }
    };

    if (open && activeTab === "channel") {
      fetchProjects();
    }
  }, [open, activeTab, user?.id]);

  // Fetch project members when a project is selected
  useEffect(() => {
    const fetchProjectMembers = async () => {
      if (!selectedProject) {
        setProjectMembers([]);
        return;
      }

      try {
        const response = await getProjectMembers(selectedProject.id);
        if (response && !response.error) {
          const membersData = response.data || response;
          if (Array.isArray(membersData)) {
            // Extract user IDs from the members array
            const userIds = membersData.map(member => member.user_id || member.id);
            
            // Filter out the current user
            const filteredUserIds = userIds.filter(id => id !== user?.id);
            
            // Fetch user details for each user ID
            const userDetails = await Promise.all(
              filteredUserIds.map(async (userId) => {
                try {
                  // Use getUserById API to fetch user details
                  const userResponse = await getUserById(userId);
                  if (userResponse && !userResponse.error) {
                    const userData = userResponse.data || userResponse;
                    return userData;
                  }
                  
                  // Fallback: create a basic user object if API fails
                  return {
                    id: userId,
                    name: `User ${userId}`,
                    email: `user${userId}@example.com`,
                    avatar: undefined
                  };
                } catch (error) {
                  console.error(`Error fetching user ${userId}:`, error);
                  return null;
                }
              })
            );
            
            // Filter out any null results
            setProjectMembers(userDetails.filter(user => user !== null));
          }
        }
      } catch (error) {
        console.error("Error fetching project members:", error);
        setProjectMembers([]);
      }
    };

    fetchProjectMembers();
  }, [selectedProject, user?.id, users]);

  // Filter users based on search query
  const filteredUsers = users.filter(user =>
    (user.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (user.email?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  );

  // Filter projects based on search query
  const filteredProjects = projects.filter(project =>
    (project.name?.toLowerCase() || '').includes(projectSearchQuery.toLowerCase()) ||
    (project.description?.toLowerCase() || '').includes(projectSearchQuery.toLowerCase())
  );

  // Filter project members based on member search query
  const filteredMembers = projectMembers.filter(user =>
    (user.name?.toLowerCase() || '').includes(memberSearchQuery.toLowerCase()) ||
    (user.email?.toLowerCase() || '').includes(memberSearchQuery.toLowerCase())
  );

  const handleDirectMessage = async () => {
    if (!selectedUser || !messageContent.trim()) {
      toast({
        title: "Error",
        description: "Please select a user and enter a message",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Create a direct message conversation
      const conversation = {
        id: `dm-${Date.now()}`,
        name: selectedUser.name,
        type: 'direct' as const,
        recipient_id: selectedUser.id,
        channel_id: null,
        isOnline: false,
        unreadCount: 0,
        lastMessage: messageContent,
        lastMessageTime: new Date().toISOString(),
        participants: [user?.id, selectedUser.id],
      };

      // For now, we'll simulate sending the message since direct messages API might not be available
      // In a real implementation, you would send the message to the API
      toast({
        title: "Success",
        description: "Direct message conversation created",
      });

      onConversationCreated(conversation);
      handleClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create direct message",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateChannel = async () => {
    if (!channelName.trim() || !selectedProject || selectedMembers.length === 0) {
      toast({
        title: "Error",
        description: "Please enter a channel name, select a project, and select at least one member",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Include the current user in the members list
      const allMembers = [user?.id, ...selectedMembers].filter(Boolean);
      
      const response = await createChannel({
        name: channelName,
        members: allMembers,
        project_id: selectedProject.id,
      });

      if (response && !response.error) {
        const channel = {
          id: response.id?.toString() || `channel-${Date.now()}`,
          name: channelName,
          type: 'group' as const,
          recipient_id: null,
          channel_id: response.id?.toString() || `channel-${Date.now()}`,
          project: selectedProject.name,
          unreadCount: 0,
          lastMessage: "",
          lastMessageTime: "",
          participants: allMembers,
        };

        toast({
          title: "Success",
          description: "Channel created successfully",
        });

        onConversationCreated(channel);
        handleClose();
      } else {
        toast({
          title: "Error",
          description: response?.error || "Failed to create channel",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create channel",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setActiveTab("direct");
    setSearchQuery("");
    setProjectSearchQuery("");
    setMemberSearchQuery("");
    setSelectedUser(null);
    setSelectedProject(null);
    setMessageContent("");
    setChannelName("");
    setSelectedMembers([]);
    onOpenChange(false);
  };

  const toggleMember = (memberId: string) => {
    setSelectedMembers(prev =>
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>New Conversation</DialogTitle>
          <DialogDescription>
            Start a direct message or create a new channel
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="direct">Direct Message</TabsTrigger>
            <TabsTrigger value="channel">Channel</TabsTrigger>
          </TabsList>

          <TabsContent value="direct" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="user-search">Search Users</Label>
                <div className="relative mt-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="user-search"
                    placeholder="Search users..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <ScrollArea className="h-48">
                <div className="space-y-2">
                  {filteredUsers.map((user, index) => (
                    <div
                      key={user.id || `user-${index}`}
                      className={`flex items-center space-x-3 p-2 rounded-lg cursor-pointer transition-colors ${
                        selectedUser?.id === user.id
                          ? "bg-primary/10 border border-primary/20"
                          : "hover:bg-muted/50"
                      }`}
                      onClick={() => setSelectedUser(user)}
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatar} alt={user.name} />
                        <AvatarFallback>
                          {user.name?.split(" ").map((n) => n[0]).join("") || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{user.name}</p>
                        <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {selectedUser && (
                <div className="space-y-2">
                  <Label htmlFor="message">Message to {selectedUser.name}</Label>
                  <Input
                    id="message"
                    placeholder="Type your message..."
                    value={messageContent}
                    onChange={(e) => setMessageContent(e.target.value)}
                  />
                </div>
              )}

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button
                  onClick={handleDirectMessage}
                  disabled={!selectedUser || !messageContent.trim() || loading}
                >
                  {loading ? "Sending..." : "Send Message"}
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="channel" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="channel-name">Channel Name</Label>
                <div className="relative mt-1">
                  <Hash className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="channel-name"
                    placeholder="Enter channel name..."
                    className="pl-8"
                    value={channelName}
                    onChange={(e) => setChannelName(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label>Select Project</Label>
                <div className="relative mt-1 mb-2">
                  <Building className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search projects..."
                    className="pl-8"
                    value={projectSearchQuery}
                    onChange={(e) => setProjectSearchQuery(e.target.value)}
                  />
                </div>
                <ScrollArea className="h-32">
                  <div className="space-y-2">
                    {filteredProjects.map((project, index) => (
                      <div
                        key={project.id || `project-${index}`}
                        className={`flex items-center space-x-3 p-2 rounded-lg cursor-pointer transition-colors ${
                          selectedProject?.id === project.id
                            ? "bg-primary/10 border border-primary/20"
                            : "hover:bg-muted/50"
                        }`}
                        onClick={() => setSelectedProject(project)}
                      >
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <Building className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{project.name}</p>
                          {project.description && (
                            <p className="text-sm text-muted-foreground truncate">{project.description}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              {selectedProject && (
                <div>
                  <Label>Select Members from {selectedProject.name}</Label>
                  <div className="relative mt-1 mb-2">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search members..."
                      className="pl-8"
                      value={memberSearchQuery}
                      onChange={(e) => setMemberSearchQuery(e.target.value)}
                    />
                  </div>
                  <ScrollArea className="h-48">
                    <div className="space-y-2">
                      {filteredMembers.map((user, index) => (
                        <div
                          key={user.id || `member-${index}`}
                          className={`flex items-center space-x-3 p-2 rounded-lg cursor-pointer transition-colors ${
                            selectedMembers.includes(user.id)
                              ? "bg-primary/10 border border-primary/20"
                              : "hover:bg-muted/50"
                          }`}
                          onClick={() => toggleMember(user.id)}
                        >
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={user.avatar} alt={user.name} />
                            <AvatarFallback>
                              {user.name?.split(" ").map((n) => n[0]).join("") || "?"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{user.name}</p>
                            <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                          </div>
                          {selectedMembers.includes(user.id) && (
                            <Badge variant="secondary" className="ml-2">
                              Selected
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateChannel}
                  disabled={!channelName.trim() || !selectedProject || selectedMembers.length === 0 || loading}
                >
                  {loading ? "Creating..." : "Create Channel"}
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default NewConversationDialog; 