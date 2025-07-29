import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  Calendar, 
  MessageSquare, 
  Kanban, 
  FileText, 
  Zap,
  ArrowRight,
  CheckCircle,
  Star
} from "lucide-react";
import TeamSyncLogo from "@/components/TeamSyncLogo";

const Landing = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const handleGetStarted = () => {
    if (isAuthenticated) {
      navigate("/dashboard");
    } else {
      navigate("/login");
    }
  };

  const features = [
    {
      icon: <Users className="h-6 w-6" />,
      title: "Team Collaboration",
      description: "Work together seamlessly with real-time updates and shared workspaces."
    },
    {
      icon: <Kanban className="h-6 w-6" />,
      title: "Project Management",
      description: "Organize tasks with Kanban boards and track progress efficiently."
    },
    {
      icon: <Calendar className="h-6 w-6" />,
      title: "Smart Scheduling",
      description: "Plan meetings and events with integrated calendar functionality."
    },
    {
      icon: <MessageSquare className="h-6 w-6" />,
      title: "Team Communication",
      description: "Stay connected with built-in messaging and file sharing."
    },
    {
      icon: <FileText className="h-6 w-6" />,
      title: "Document Management",
      description: "Store and organize all your project documents in one place."
    },
    {
      icon: <Zap className="h-6 w-6" />,
      title: "AI-Powered Insights",
      description: "Get intelligent suggestions and automated task management."
    }
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Project Manager",
      company: "TechCorp",
      content: "TeamSync has transformed how our team collaborates. The real-time updates and intuitive interface make project management a breeze.",
      rating: 5
    },
    {
      name: "Michael Chen",
      role: "Team Lead",
      company: "InnovateLab",
      content: "The AI-powered features and seamless integration have significantly improved our productivity and team coordination.",
      rating: 5
    },
    {
      name: "Emily Rodriguez",
      role: "Product Owner",
      company: "StartupXYZ",
      content: "Finally, a platform that combines all the tools we need in one place. The user experience is outstanding.",
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-teamsync-800 via-teamsync-700 to-teamsync-900">
      {/* Navigation */}
      <nav className="container mx-auto px-4 py-6 flex justify-end items-center">
        <div className="flex items-center space-x-4">
          {!isAuthenticated && (
            <>
              <Button 
                onClick={() => navigate("/login")}
                className="bg-gradient-to-r from-teamsync-400 to-teamsync-300 hover:from-teamsync-300 hover:to-teamsync-200"
              >
                Sign In
              </Button>
              <Button variant="outline" onClick={() => navigate("/signup")}>
                Sign Up
              </Button>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="flex items-center justify-center mb-6">
          <TeamSyncLogo className="h-6 w-6 mr-2" />
          <span className="text-white font-semibold text-lg">TeamSync</span>
        </div>
        <Badge variant="secondary" className="mb-6">
          ✨ Now with AI-powered features
        </Badge>
        <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
          Transform Your
          <span className="block bg-gradient-to-r from-teamsync-400 to-teamsync-300 bg-clip-text text-transparent">
            Team Workflow
          </span>
        </h1>
        <p className="text-xl md:text-2xl text-teamsync-200 mb-8 max-w-3xl mx-auto">
          The all-in-one platform for modern teams. Collaborate, manage projects, and stay connected with AI-powered insights.
        </p>
        <div className="flex justify-center items-center">
          <Button 
            size="lg" 
            onClick={handleGetStarted}
            className="text-lg px-8 py-6 bg-gradient-to-r from-teamsync-400 to-teamsync-300 hover:from-teamsync-300 hover:to-teamsync-200"
          >
            Get Started Free
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white mb-4">
            Everything Your Team Needs
          </h2>
          <p className="text-xl text-teamsync-200 max-w-2xl mx-auto">
            Powerful features designed to streamline your workflow and boost productivity.
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="bg-teamsync-700/50 border-teamsync-600 hover:bg-teamsync-700/70 transition-all duration-300">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-r from-teamsync-400 to-teamsync-300 rounded-lg flex items-center justify-center mb-4">
                  {feature.icon}
                </div>
                <CardTitle className="text-white">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-teamsync-200">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white mb-4">
            Loved by Teams Worldwide
          </h2>
          <p className="text-xl text-teamsync-200">
            See what our users have to say about TeamSync.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="bg-teamsync-700/50 border-teamsync-600">
              <CardHeader>
                <div className="flex items-center space-x-1 mb-2">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <CardDescription className="text-teamsync-200">
                  "{testimonial.content}"
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-teamsync-400 to-teamsync-300 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold">
                      {testimonial.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-white">{testimonial.name}</p>
                    <p className="text-sm text-teamsync-300">
                      {testimonial.role} at {testimonial.company}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="bg-gradient-to-r from-teamsync-600 to-teamsync-700 rounded-3xl p-12 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Ready to Transform Your Team?
          </h2>
          <p className="text-xl text-teamsync-200 mb-8 max-w-2xl mx-auto">
            Join thousands of teams already using TeamSync to boost productivity and collaboration.
          </p>
          <Button 
            size="lg" 
            onClick={handleGetStarted}
            className="text-lg px-8 py-6 bg-gradient-to-r from-teamsync-400 to-teamsync-300 hover:from-teamsync-300 hover:to-teamsync-200"
          >
            Start Your Free Trial
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-12 border-t border-teamsync-600">
        <div className="text-center">
          <p className="text-teamsync-300">
            © 2025 TeamSync. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing; 