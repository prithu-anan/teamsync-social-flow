import React, { createContext, useContext, useState, ReactNode } from "react";
import { toast } from "@/components/ui/use-toast";
import { getMe, login as loginApi, signup as signupApi } from "@/utils/api-helpers";

interface User {
  id: string;
  name: string;
  email: string;
  profilePicture?: string;
  designation?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Demo user data
const demoUsers = [
  {
    id: "1",
    name: "John Doe",
    email: "john@example.com",
    password: "password123",
    avatar: "https://ui-avatars.com/api/?name=John+Doe&background=0D8ABC&color=fff",
  },
  {
    id: "2",
    name: "Jane Smith",
    email: "jane@example.com",
    password: "password123",
    avatar: "https://ui-avatars.com/api/?name=Jane+Smith&background=0D9488&color=fff",
  },
];

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    const storedUser = localStorage.getItem("teamsync_user");
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const isAuthenticated = user !== null;

  const login = async (email: string, password: string): Promise<boolean> => {
    const res = await loginApi({ email, password });

    if (!res || res.error) {
      // Extract error message from nested structure
      let errorMessage = "Login failed. Please try again.";
      
      if (res?.error) {
        if (typeof res.error === "string") {
          errorMessage = res.error;
        } else if (res.error.message) {
          errorMessage = res.error.message;
        } else if (res.error.details) {
          // Extract from details if available
          const details = res.error.details;
          const badCredentials = details["org.springframework.security.authentication.BadCredentialsException"];
          if (badCredentials) {
            errorMessage = badCredentials;
          }
        }
      }

      toast({
        title: "Login failed",
        description: errorMessage,
        variant: "destructive",
      });
      return false;
    }

    // ✅ Store token
    localStorage.setItem("teamsync_jwt", res.data.token);

    // ✅ Fetch full user profile
    const me = await getMe();
    if (me.error) {
      toast({
        title: "Login failed",
        description: "Unable to fetch profile info",
        variant: "destructive",
      });
      return false;
    }

    setUser(me.data);
    localStorage.setItem("teamsync_user", JSON.stringify(me.data));

    toast({
      title: "Login successful",
      description: `Welcome back, ${me.data.name}!`,
    });

    return true;
  };

  const signup = async (
    name: string,
    email: string,
    password: string
  ): Promise<boolean> => {
    const res = await signupApi({ name, email, password });
    

    // Handle both direct and nested response
    const result = res?.code ? res : res?.data;

    if (result && result.code === 201 && result.data) {
      toast({
        title: "Account created successfully",
        description: "Please log in with your new account.",
      });
      return true;
    }

    let errorMsg = "An error occurred during signup.";
    if (typeof res?.message === "string") {
      errorMsg = res.message;
    } else if (typeof res?.error === "string") {
      errorMsg = res.error;
    }

    toast({
      title: "Signup failed",
      description: errorMsg,
      variant: "destructive",
    });
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("teamsync_user");
    localStorage.removeItem("teamsync_jwt");
    toast({
      title: "Logged out",
      description: "You have been logged out successfully",
    });
  };

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated, login, signup, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
