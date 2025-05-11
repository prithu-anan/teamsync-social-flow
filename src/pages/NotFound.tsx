
import { useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import TeamSyncLogo from "@/components/TeamSyncLogo";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-teamsync-800 to-teamsync-700 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md text-center">
        <TeamSyncLogo className="h-16 w-16 text-teamsync-100 mx-auto mb-4" />
        <h1 className="text-4xl font-bold text-white mb-2">404</h1>
        <p className="text-xl text-teamsync-100 mb-6">Oops! Page not found</p>
        <p className="text-teamsync-100 mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Button asChild size="lg">
          <Link to="/">Return to Dashboard</Link>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
