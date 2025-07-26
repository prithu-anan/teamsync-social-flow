import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { getUserById } from "@/utils/api/users-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Mail, MapPin, Building, Clock } from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
  profilePicture?: string;
  designation?: string;
  birthdate?: string;
  joinDate?: string;
  predictedBurnoutRisk?: string;
}

const Profile = () => {
  const { userId } = useParams<{ userId: string }>();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      if (!userId) {
        setError("No user ID provided");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await getUserById(userId);
        
        if (response.error) {
          setError(response.error);
        } else {
          const userData = response.data || response;
          setUser(userData);
        }
      } catch (err) {
        setError("Failed to fetch user profile");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [userId]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Not specified";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-red-500">{error || "User not found"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header Card */}
        <Card className="backdrop-blur-sm bg-card/50 border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center space-x-6">
              <Avatar className="h-24 w-24 ring-4 ring-border/50">
                <AvatarImage src={user.profilePicture} alt={user.name} />
                <AvatarFallback className="text-2xl bg-muted/50 backdrop-blur-sm">
                  {user.name.split(" ").map((n) => n[0]).join("")}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h1 className="text-3xl font-bold">{user.name}</h1>
                {user.designation && (
                  <p className="text-xl text-muted-foreground mt-1">{user.designation}</p>
                )}
                <div className="flex items-center space-x-4 mt-3">
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{user.email}</span>
                  </div>
                  {user.predictedBurnoutRisk && (
                    <Badge variant={user.predictedBurnoutRisk === 'high' ? 'destructive' : 'secondary'}>
                      Burnout Risk: {user.predictedBurnoutRisk}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Personal Information */}
          <Card className="backdrop-blur-sm bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Building className="h-5 w-5" />
                <span>Personal Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Birth Date</p>
                  <p className="text-sm text-muted-foreground">{formatDate(user.birthdate)}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Join Date</p>
                  <p className="text-sm text-muted-foreground">{formatDate(user.joinDate)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card className="backdrop-blur-sm bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Mail className="h-5 w-5" />
                <span>Contact Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <Card className="backdrop-blur-sm bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-4">
              <Button variant="outline">
                <Mail className="h-4 w-4 mr-2" />
                Send Message
              </Button>
              <Button variant="outline">
                <Calendar className="h-4 w-4 mr-2" />
                Schedule Meeting
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile; 