
import React, { createContext, useContext, useState, ReactNode } from "react";
import { toast } from "@/components/ui/use-toast";
import { getMe, login as loginApi, signup as signupApi } from "@/util/api-helpers";

interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
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
      toast({
        title: "Login failed",
        description: res.error,
        variant: "destructive",
      });
      return false;
    }

    // ✅ Store token
    localStorage.setItem("teamsync_jwt", res.jwt);

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

    setUser(me);
    localStorage.setItem("teamsync_user", JSON.stringify(me));

    toast({
      title: "Login successful",
      description: `Welcome back, ${me.name}!`,
    });

    return true;
  };

  const signup = async (
    name: string,
    email: string,
    password: string
  ): Promise<boolean> => {
    const res = await signupApi({ name, email, password });

    if (res.error) {
      toast({
        title: "Signup failed",
        description: res.error,
        variant: "destructive",
      });
      return false;
    }

    const newUser = {
      id: res.id,
      name,
      email,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0D8ABC&color=fff`,
    };

    setUser(newUser);
    localStorage.setItem("teamsync_user", JSON.stringify(newUser));

    toast({
      title: "Account created",
      description: `Welcome to TeamSync, ${name}!`,
    });

    return true;
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
