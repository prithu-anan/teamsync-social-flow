import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Filter } from "lucide-react";
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

// Dummy data for projects
const dummyProjects = [
  {
    id: 1,
    name: "Website Redesign",
    createdBy: "John Doe",
    creationDate: "2024-03-15",
    deadline: "2024-04-15",
    progress: 75,
    members: [
      { name: "John Doe", avatar: "JD" },
      { name: "Jane Smith", avatar: "JS" },
      { name: "Mike Johnson", avatar: "MJ" },
    ],
  },
  {
    id: 2,
    name: "Mobile App Development",
    createdBy: "Jane Smith",
    creationDate: "2024-03-10",
    deadline: "2024-05-01",
    progress: 45,
    members: [
      { name: "Jane Smith", avatar: "JS" },
      { name: "Sarah Wilson", avatar: "SW" },
    ],
  },
  {
    id: 3,
    name: "Database Migration",
    createdBy: "Mike Johnson",
    creationDate: "2024-03-01",
    deadline: "2024-03-31",
    progress: 90,
    members: [
      { name: "Mike Johnson", avatar: "MJ" },
      { name: "John Doe", avatar: "JD" },
      { name: "Sarah Wilson", avatar: "SW" },
    ],
  },
];

const MyProjects = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const filteredProjects = dummyProjects.filter((project) => {
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
                      <AvatarFallback>{member.avatar}</AvatarFallback>
                    </Avatar>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default MyProjects; 