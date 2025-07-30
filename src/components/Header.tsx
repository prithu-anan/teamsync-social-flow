import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, Plus, Users, FolderOpen } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { searchUsers, searchProjects } from "@/utils/api/search-api";
import { filterAndSortResults, quickFilter } from "@/utils/search-utils";
import CreateTaskDialog from "@/components/CreateTaskDialog";
import CreateProjectDialog from "@/components/CreateProjectDialog";
import { getMe } from "@/utils/api/auth-api";

interface SearchUser {
  id: string;
  name: string;
  email: string;
  profilePicture?: string;
}

interface SearchProject {
  id: string;
  title: string;
  description?: string;
}

const Header = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [allUsers, setAllUsers] = useState<SearchUser[]>([]);
  const [allProjects, setAllProjects] = useState<SearchProject[]>([]);
  const [searchResults, setSearchResults] = useState<{
    users: SearchUser[];
    projects: SearchProject[];
  }>({ users: [], projects: [] });
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [hasLoadedData, setHasLoadedData] = useState(false);
  const [createTaskDialogOpen, setCreateTaskDialogOpen] = useState(false);
  const [createProjectDialogOpen, setCreateProjectDialogOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Fetch current user
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await getMe();
        if (response.error) {
          console.error("Failed to fetch current user:", response.error);
        } else {
          setCurrentUser(response.data);
        }
      } catch (error) {
        console.error("Error fetching current user:", error);
      }
    };

    fetchCurrentUser();
  }, []);

  // Load all users and projects once for client-side filtering
  useEffect(() => {
    const loadAllData = async () => {
      if (hasLoadedData) return;
      
      try {
        const [usersResponse, projectsResponse] = await Promise.all([
          searchUsers(""), // Empty query to get all users
          searchProjects("") // Empty query to get all projects
        ]);

        const users = usersResponse?.data || [];
        const projects = projectsResponse?.data || [];

        setAllUsers(users);
        setAllProjects(projects);
        setHasLoadedData(true);
      } catch (error) {
        console.error("Failed to load search data:", error);
      }
    };

    loadAllData();
  }, [hasLoadedData]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const performSearch = async () => {
      if (searchQuery.trim().length < 2) {
        setSearchResults({ users: [], projects: [] });
        setShowResults(false);
        return;
      }

      setIsSearching(true);
      
      try {
        let filteredUsers: SearchUser[] = [];
        let filteredProjects: SearchProject[] = [];

        if (hasLoadedData) {
          // Use client-side filtering for better performance
          filteredUsers = filterAndSortResults(
            allUsers,
            searchQuery,
            (user) => `${user.name} ${user.email}`,
            0.3
          ).slice(0, 5); // Limit to top 5 results

          filteredProjects = filterAndSortResults(
            allProjects,
            searchQuery,
            (project) => `${project.title} ${project.description || ''}`,
            0.3
          ).slice(0, 5); // Limit to top 5 results
        } else {
          // Fallback to server-side search if data not loaded
          const [usersResponse, projectsResponse] = await Promise.all([
            searchUsers(searchQuery),
            searchProjects(searchQuery)
          ]);

          filteredUsers = usersResponse?.data || [];
          filteredProjects = projectsResponse?.data || [];
        }

        setSearchResults({ users: filteredUsers, projects: filteredProjects });
        setShowResults(true);
      } catch (error) {
        console.error("Search error:", error);
        setSearchResults({ users: [], projects: [] });
      } finally {
        setIsSearching(false);
      }
    };

    const debounceTimer = setTimeout(performSearch, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery, allUsers, allProjects, hasLoadedData]);

  const handleUserClick = (userId: string) => {
    navigate(`/profile/${userId}`);
    setShowResults(false);
    setSearchQuery("");
  };

  const handleProjectClick = (projectId: string) => {
    navigate(`/kanban?projectId=${projectId}`);
    setShowResults(false);
    setSearchQuery("");
  };

  const handleTaskCreated = () => {
    // Refresh the current page or navigate to kanban board
    navigate('/kanban');
  };

  const handleProjectCreated = () => {
    // Refresh the current page or navigate to projects
    navigate('/projects');
  };

  return (
    <header className="h-16 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex items-center px-4 sticky top-0 z-10">
      <div className="md:hidden">
        <SidebarTrigger />
      </div>

      <div className="flex items-center justify-between w-full">
        <div className="relative flex-1 max-w-md hidden md:flex" ref={searchRef}>
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search users and projects..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => {
              if (searchQuery.trim().length >= 2) {
                setShowResults(true);
              }
            }}
          />
          
          {/* Search Results Dropdown */}
          {showResults && (searchResults.users.length > 0 || searchResults.projects.length > 0) && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-md shadow-lg max-h-96 overflow-y-auto z-50">
              {isSearching ? (
                <div className="p-4 text-center text-muted-foreground">
                  Searching...
                </div>
              ) : (
                <div className="p-2">
                  {/* Users Section */}
                  {searchResults.users.length > 0 && (
                    <div className="mb-4">
                      <div className="flex items-center space-x-2 px-2 py-1 text-sm font-medium text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>Users ({searchResults.users.length})</span>
                      </div>
                      {searchResults.users.map((user) => (
                        <button
                          key={user.id}
                          onClick={() => handleUserClick(user.id)}
                          className="w-full flex items-center space-x-3 p-2 hover:bg-accent rounded-md transition-colors"
                        >
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={user.profilePicture} alt={user.name} />
                            <AvatarFallback>
                              {user.name.split(" ").map((n) => n[0]).join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 text-left">
                            <div className="font-medium">{user.name}</div>
                            <div className="text-sm text-muted-foreground">{user.email}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Projects Section */}
                  {searchResults.projects.length > 0 && (
                    <div>
                      <div className="flex items-center space-x-2 px-2 py-1 text-sm font-medium text-muted-foreground">
                        <FolderOpen className="h-4 w-4" />
                        <span>Projects ({searchResults.projects.length})</span>
                      </div>
                      {searchResults.projects.map((project) => (
                        <button
                          key={project.id}
                          onClick={() => handleProjectClick(project.id)}
                          className="w-full flex items-center space-x-3 p-2 hover:bg-accent rounded-md transition-colors"
                        >
                          <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center">
                            <FolderOpen className="h-4 w-4 text-primary" />
                          </div>
                          <div className="flex-1 text-left">
                            <div className="font-medium">{project.title}</div>
                            {project.description && (
                              <div className="text-sm text-muted-foreground truncate">
                                {project.description}
                              </div>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* No Results */}
          {showResults && !isSearching && searchResults.users.length === 0 && searchResults.projects.length === 0 && searchQuery.trim().length >= 2 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-md shadow-lg z-50">
              <div className="p-4 text-center text-muted-foreground">
                No results found for "{searchQuery}"
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          <Button size="sm" className="hidden md:flex" onClick={() => setCreateProjectDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Button>

          <Button size="sm" className="hidden md:flex" onClick={() => setCreateTaskDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Task
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-8 w-8 rounded-full"
              >
                                 <Avatar className="h-8 w-8">
                   <AvatarImage src={currentUser?.profilePicture} alt={currentUser ? currentUser?.name : 'SD'} />
                   <AvatarFallback>
                     {currentUser?.name
                       ? currentUser.name.split(" ").map((n) => n[0]).join("")
                       : "S"}
                   </AvatarFallback>
                 </Avatar>
              </Button>
            </DropdownMenuTrigger>
                         <DropdownMenuContent className="w-56" align="end" forceMount>
               <DropdownMenuLabel className="font-normal">
                 <div className="flex flex-col space-y-1">
                   <p className="text-sm font-medium leading-none">{currentUser?.name}</p>
                   <p className="text-xs leading-none text-muted-foreground">
                     {currentUser?.email}
                   </p>
                 </div>
               </DropdownMenuLabel>
               <DropdownMenuSeparator />
               <DropdownMenuItem asChild>
                 <Link to={`/profile/${currentUser?.id}`}>Profile</Link>
               </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/settings">Settings</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={logout}
                className="text-destructive focus:text-destructive"
              >
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Create Task Dialog */}
      <CreateTaskDialog
        open={createTaskDialogOpen}
        onOpenChange={setCreateTaskDialogOpen}
        onTaskCreated={handleTaskCreated}
      />

      {/* Create Project Dialog */}
      <CreateProjectDialog
        open={createProjectDialogOpen}
        onOpenChange={setCreateProjectDialogOpen}
        onProjectCreated={handleProjectCreated}
      />
    </header>
  );
};

export default Header;
