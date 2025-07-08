import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Filter } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getProjects, getProjectTasks } from "@/utils/api/projects-api";
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

interface Project {
  id: string;
  name: string;
  createdBy: string;
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
            // Only include projects where user is a member
            let userProjects = projectsData.filter(project =>
              Array.isArray(project.members) && project.members.some(m => m.user_id?.toString() === user.id?.toString())
            );

            // Fetch user details for all unique member user_ids
            const allMemberIds = Array.from(new Set(userProjects.flatMap(p => (Array.isArray(p.members) ? p.members.map(m => m.user_id) : []))));
            const userCache = {};
            await Promise.all(allMemberIds.map(async (uid) => {
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

              // Find creator (first member or project creator)
              const creator = team.length > 0 ? team[0] : { name: "Unknown", avatar: "" };

              return {
                id: project.id.toString(),
                name: project.title || project.name,
                createdBy: creator.name,
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
              className="hover:shadow-lg transition-shadow cursor-pointer backdrop-blur-sm bg-card/50 border-border/50"
              onClick={() => navigate("/kanban")}
            >
              <CardHeader>
                <CardTitle className="text-xl">{project.name}</CardTitle>
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
    </div>
  );
};

export default MyProjects; 