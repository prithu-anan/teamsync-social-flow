import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface ManagerRouteProps {
  children: React.ReactNode;
}

const ManagerRoute = ({ children }: ManagerRouteProps) => {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    // Redirect to login with the current location as the return URL
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if user is a manager
  if (user?.designation !== "manager") {
    // Redirect to dashboard if not a manager
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default ManagerRoute; 