import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Filter, Plus, Trash2, Users, Edit } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getProjects, getProjectTasks, deleteProject, updateProject } from "@/utils/api/projects-api";
import { getUserById } from "@/utils/api/users-api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import CreateProjectDialog from "@/components/CreateProjectDialog";
import ProjectMembersDialog from "@/components/ProjectMembersDialog";
import EditProjectDialog from "@/components/EditProjectDialog";
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

const MyProjects = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [isAuthorizedToDelete, setIsAuthorizedToDelete] = useState(false);
  const [membersDialogOpen, setMembersDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);
  const [editing, setEditing] = useState(false);

  // Fetch projects where user is a member
  useEffect(() => {
    const fetchProjects = async () => {
      if (!user?.id) {
        setProjects([]);
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const response = await getProjects();
        if (response && !response.error) {
          const projectsData = response.projects || response.data || response;
          if (Array.isArray(projectsData)) {
            // Include projects where user is a member OR projects created by the user
            let userProjects = projectsData.filter(project =>
              // User is a member of the project
              (Array.isArray(project.members) && project.members.some(m => m.user_id?.toString() === user.id?.toString())) ||
              // OR user created the project (check created_by field)
              (project.created_by?.toString() === user.id?.toString()) ||
              // OR user is the creator (check creator_id field)
              (project.creator_id?.toString() === user.id?.toString())
            );

            // Fetch user details for all unique member user_ids and creator IDs
            const allUserIds = new Set([
              ...userProjects.flatMap(p => (Array.isArray(p.members) ? p.members.map(m => m.user_id) : [])),
              ...userProjects.map(p => p.created_by).filter(Boolean)
            ]);
            const userCache = {};
            await Promise.all(Array.from(allUserIds).map(async (uid) => {
              if (!uid) return;
              try {
                const userRes = await getUserById(uid);
                if (userRes && userRes.data) {
                  userCache[uid] = userRes.data;
                }
              } catch {}
            }));

            // Map projects to include team with correct name/avatar and fetch tasks
            userProjects = await Promise.all(userProjects.map(async (project) => {
              // Fetch tasks for each project
              let total = 0, completed = 0, progress = 0;
              try {
                const taskRes = await getProjectTasks(project.id);
                const tasksArr = taskRes.tasks || taskRes.data || [];
                if (Array.isArray(tasksArr)) {
                  total = tasksArr.length;
                  completed = tasksArr.filter(t => (t.status?.toLowerCase() === 'done' || t.status?.toLowerCase() === 'completed')).length;
                  progress = total > 0 ? Math.round((completed / total) * 100) : 0;
                }
              } catch {}

              // Map team
              const team = Array.isArray(project.members) ? project.members.map(m => {
                const u = userCache[m.user_id];
                return {
                  name: u?.name || "Member",
                  avatar: u?.profile_picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(u?.name || "M")}`
                };
              }) : [];

              // Find creator using created_by field
              let creatorName = "Unknown";
              let creatorId = project.created_by?.toString();
              
              if (creatorId) {
                const creatorUser = userCache[creatorId];
                creatorName = creatorUser?.name || "Unknown";
              } else if (team.length > 0) {
                // Fallback to first member if no created_by
                creatorName = team[0].name;
              }

              return {
                id: project.id.toString(),
                name: project.title || project.name,
                description: project.description,
                createdBy: creatorName,
                createdById: creatorId,
                creationDate: project.created_at || project.creation_date || new Date().toISOString(),
                deadline: project.deadline || project.due_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                progress,
                members: team,
              };
            }));
            setProjects(userProjects);
          } else {
            setProjects([]);
          }
        } else {
          setProjects([]);
        }
      } catch (err) {
        setProjects([]);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, [user]);

  const filteredProjects = projects.filter((project) => {
    const matchesSearch = project.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesFilter =
      filterStatus === "all" ||
      (filterStatus === "completed" && project.progress === 100) ||
      (filterStatus === "in-progress" && project.progress < 100);
    return matchesSearch && matchesFilter;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleProjectCreated = () => {
    // Refresh the projects list
    const fetchProjects = async () => {
      if (!user?.id) {
        setProjects([]);
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const response = await getProjects();
        if (response && !response.error) {
          const projectsData = response.projects || response.data || response;
          if (Array.isArray(projectsData)) {
            // Include projects where user is a member OR projects created by the user
            let userProjects = projectsData.filter(project =>
              // User is a member of the project
              (Array.isArray(project.members) && project.members.some(m => m.user_id?.toString() === user.id?.toString())) ||
              // OR user created the project (check created_by field)
              (project.created_by?.toString() === user.id?.toString()) ||
              // OR user is the creator (check creator_id field)
              (project.creator_id?.toString() === user.id?.toString())
            );

            // Fetch user details for all unique member user_ids and creator IDs
            const allUserIds = new Set([
              ...userProjects.flatMap(p => (Array.isArray(p.members) ? p.members.map(m => m.user_id) : [])),
              ...userProjects.map(p => p.created_by).filter(Boolean)
            ]);
            const userCache = {};
            await Promise.all(Array.from(allUserIds).map(async (uid) => {
              if (!uid) return;
              try {
                const userRes = await getUserById(uid);
                if (userRes && userRes.data) {
                  userCache[uid] = userRes.data;
                }
              } catch {}
            }));

            // Map projects to include team with correct name/avatar and fetch tasks
            userProjects = await Promise.all(userProjects.map(async (project) => {
              // Fetch tasks for each project
              let total = 0, completed = 0, progress = 0;
              try {
                const taskRes = await getProjectTasks(project.id);
                const tasksArr = taskRes.tasks || taskRes.data || [];
                if (Array.isArray(tasksArr)) {
                  total = tasksArr.length;
                  completed = tasksArr.filter(t => (t.status?.toLowerCase() === 'done' || t.status?.toLowerCase() === 'completed')).length;
                  progress = total > 0 ? Math.round((completed / total) * 100) : 0;
                }
              } catch {}

              // Map team
              const team = Array.isArray(project.members) ? project.members.map(m => {
                const u = userCache[m.user_id];
                return {
                  name: u?.name || "Member",
                  avatar: u?.profile_picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(u?.name || "M")}`
                };
              }) : [];

              // Find creator using created_by field
              let creatorName = "Unknown";
              let creatorId = project.created_by?.toString();
              
              if (creatorId) {
                const creatorUser = userCache[creatorId];
                creatorName = creatorUser?.name || "Unknown";
              } else if (team.length > 0) {
                // Fallback to first member if no created_by
                creatorName = team[0].name;
              }

              return {
                id: project.id.toString(),
                name: project.title || project.name,
                description: project.description,
                createdBy: creatorName,
                createdById: creatorId,
                creationDate: project.created_at || project.creation_date || new Date().toISOString(),
                deadline: project.deadline || project.due_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                progress,
                members: team,
              };
            }));
            setProjects(userProjects);
          } else {
            setProjects([]);
          }
        } else {
          setProjects([]);
        }
      } catch (err) {
        setProjects([]);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  };

  const handleDeleteClick = (e: React.MouseEvent, project: Project) => {
    e.stopPropagation();
    
    // Check if user is authorized to delete this project
    const isAuthorized = project.createdById === user?.id?.toString();
    
    setProjectToDelete(project);
    setIsAuthorizedToDelete(isAuthorized);
    setDeleteDialogOpen(true);
  };

  const handleManageMembersClick = (e: React.MouseEvent, project: Project) => {
    e.stopPropagation();
    setSelectedProject(project);
    setMembersDialogOpen(true);
  };

  const handleEditClick = (e: React.MouseEvent, project: Project) => {
    e.stopPropagation();
    setProjectToEdit(project);
    setEditDialogOpen(true);
  };

  const handleDeleteProject = async () => {
    if (!projectToDelete) return;

    setDeleting(true);
    try {
      const response = await deleteProject(projectToDelete.id);
      
      if (response && !response.error) {
        toast({
          title: "Project deleted successfully",
          description: "The project has been permanently deleted.",
        });
        
        // Remove the project from the list
        setProjects(prev => prev.filter(p => p.id !== projectToDelete.id));
      } else {
        toast({
          title: "Failed to delete project",
          description: response?.error || "An error occurred while deleting the project.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error deleting project:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while deleting the project.",
        variant: "destructive",
      });
         } finally {
       setDeleting(false);
       setDeleteDialogOpen(false);
       setProjectToDelete(null);
       setIsAuthorizedToDelete(false);
     }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">My Projects</h1>
        </div>
        <div className="text-center py-8">
          <p>Loading projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">My Projects</h1>
        <div className="flex gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search projects..."
              className="pl-9 w-[200px] backdrop-blur-sm bg-background/50"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[180px] backdrop-blur-sm bg-background/50">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            onClick={() => setCreateDialogOpen(true)}
            size="sm"
            className="hidden md:flex"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Project
          </Button>
        </div>
      </div>

      {filteredProjects.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            {searchQuery || filterStatus !== "all" 
              ? "No projects match your search criteria." 
              : "You are not a member of any projects yet."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <Card
              key={project.id}
              className="hover:shadow-lg transition-shadow cursor-pointer backdrop-blur-sm bg-card/50 border-border/50 relative group"
              onClick={() => navigate(`/kanban?projectId=${project.id}`)}
            >
              {/* Action Buttons */}
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="bg-background/80 hover:bg-primary hover:text-primary-foreground"
                  onClick={(e) => handleManageMembersClick(e, project)}
                  title="Manage Members"
                >
                  <Users className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="bg-background/80 hover:bg-blue-600 hover:text-blue-foreground"
                  onClick={(e) => handleEditClick(e, project)}
                  title="Edit Project"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="bg-background/80 hover:bg-destructive hover:text-destructive-foreground"
                  onClick={(e) => handleDeleteClick(e, project)}
                  title="Delete Project"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <CardHeader>
                        <CardTitle className="text-xl pr-28">{project.name}</CardTitle>
        {project.description && (
          <div className="text-sm text-muted-foreground line-clamp-2">
            {project.description}
          </div>
        )}
        <div className="text-sm text-muted-foreground">
          Created by {project.createdBy}
        </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <div>Created: {formatDate(project.creationDate)}</div>
                  <div>Deadline: {formatDate(project.deadline)}</div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span>{project.progress}%</span>
                  </div>
                  <Progress value={project.progress} className="h-2" />
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-sm text-muted-foreground">Team:</div>
                  <div className="flex -space-x-2">
                    {project.members.map((member, index) => (
                      <Avatar key={index} className="border-2 border-background">
                        {member.avatar ? (
                          <AvatarImage src={member.avatar} alt={member.name || 'M'} />
                        ) : null}
                        <AvatarFallback>
                          {member.name
                            ? member.name.split(" ").map((n) => n[0]).join("")
                            : "M"}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Project Dialog */}
      <CreateProjectDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onProjectCreated={handleProjectCreated}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isAuthorizedToDelete ? "Delete Project" : "Not Authorized"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isAuthorizedToDelete ? (
                `Are you sure you want to delete "${projectToDelete?.name}"? This action cannot be undone and will permanently remove the project and all its data.`
              ) : (
                `You are not authorized to delete "${projectToDelete?.name}". Only the project creator can delete this project.`
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            {isAuthorizedToDelete ? (
              <>
                <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteProject}
                  disabled={deleting}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {deleting ? "Deleting..." : "Delete Project"}
                </AlertDialogAction>
              </>
            ) : (
              <AlertDialogAction onClick={() => setDeleteDialogOpen(false)}>
                OK
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Project Members Dialog */}
      {selectedProject && (
        <ProjectMembersDialog
          open={membersDialogOpen}
          onOpenChange={setMembersDialogOpen}
          projectId={selectedProject.id}
          projectName={selectedProject.name}
          isCreator={selectedProject.createdById === user?.id?.toString()}
          onMembersUpdated={handleProjectCreated}
        />
      )}

      {/* Edit Project Dialog */}
      <EditProjectDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        project={projectToEdit}
        onProjectUpdated={handleProjectCreated}
      />
    </div>
  );
};

export default MyProjects; 