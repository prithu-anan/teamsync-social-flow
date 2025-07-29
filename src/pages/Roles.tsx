import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getUsers, updateDesignation } from "@/utils/api/users-api";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { Search, Users, Crown, User } from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
  designation?: string;
  profilePicture?: string;
}

const Roles = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await getUsers();
        
        if (response.error) {
          toast({
            title: "Error",
            description: response.error,
            variant: "destructive",
          });
        } else {
          const usersData = response.data || response;
          setUsers(usersData);
          setFilteredUsers(usersData);
        }
      } catch (err) {
        toast({
          title: "Error",
          description: "Failed to fetch users",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  useEffect(() => {
    const filtered = users.filter(user =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.designation && user.designation.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredUsers(filtered);
  }, [searchTerm, users]);

  const handleDesignationUpdate = async (userId: string, newDesignation: string) => {
    try {
      setUpdating(true);
      const response = await updateDesignation(userId, newDesignation);
      
      if (response.error) {
        toast({
          title: "Error",
          description: response.error,
          variant: "destructive",
        });
      } else {
        setUsers(prevUsers =>
          prevUsers.map(u =>
            u.id === userId ? { ...u, designation: newDesignation } : u
          )
        );
        setEditingUser(null);
        toast({
          title: "Success",
          description: "Designation updated successfully",
        });
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to update designation",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleUserClick = (userId: string) => {
    navigate(`/profile/${userId}`);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p>Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Users className="h-8 w-8 text-teamsync-400" />
            <div>
              <h1 className="text-3xl font-bold">User Roles</h1>
              <p className="text-muted-foreground">Manage user designations and permissions</p>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <Card className="backdrop-blur-sm bg-card/50 border-border/50">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search users by name, email, or designation..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Users List */}
        <Card className="backdrop-blur-sm bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Users ({filteredUsers.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredUsers.map((userItem) => (
                <div
                  key={userItem.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={userItem.profilePicture} alt={userItem.name} />
                      <AvatarFallback>
                        {userItem.name.split(" ").map((n) => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <button
                        onClick={() => handleUserClick(userItem.id)}
                        className="text-left hover:underline font-medium"
                      >
                        {userItem.name}
                      </button>
                      <p className="text-sm text-muted-foreground">{userItem.email}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    {userItem.designation === "manager" ? (
                      <Badge variant="secondary" className="flex items-center space-x-1">
                        <Crown className="h-3 w-3" />
                        <span>Manager</span>
                      </Badge>
                    ) : editingUser === userItem.id ? (
                      <div className="flex items-center space-x-2">
                        <Select
                          value={userItem.designation || ""}
                          onValueChange={(value) => handleDesignationUpdate(userItem.id, value)}
                          disabled={updating}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="employee">Employee</SelectItem>
                            <SelectItem value="manager">Manager</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingUser(null)}
                          disabled={updating}
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">
                          {userItem.designation || "No designation"}
                        </Badge>
                        {userItem.designation !== "manager" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingUser(userItem.id)}
                          >
                            Edit
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {filteredUsers.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No users found</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Roles; 