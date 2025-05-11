
import React, { createContext, useContext, useState, ReactNode } from "react";
import { toast } from "@/components/ui/use-toast";

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
    // Simulate API call
    return new Promise((resolve) => {
      setTimeout(() => {
        const foundUser = demoUsers.find(
          (u) => u.email === email && u.password === password
        );

        if (foundUser) {
          const { password: _, ...userWithoutPassword } = foundUser;
          setUser(userWithoutPassword);
          localStorage.setItem(
            "teamsync_user",
            JSON.stringify(userWithoutPassword)
          );
          toast({
            title: "Login successful",
            description: `Welcome back, ${foundUser.name}!`,
          });
          resolve(true);
        } else {
          toast({
            title: "Login failed",
            description: "Invalid email or password",
            variant: "destructive",
          });
          resolve(false);
        }
      }, 1000);
    });
  };

  const signup = async (
    name: string,
    email: string,
    password: string
  ): Promise<boolean> => {
    // Simulate API call
    return new Promise((resolve) => {
      setTimeout(() => {
        if (demoUsers.some((u) => u.email === email)) {
          toast({
            title: "Signup failed",
            description: "Email already in use",
            variant: "destructive",
          });
          resolve(false);
        } else {
          // In a real app, we would create a new user in the database
          const newUser = {
            id: (demoUsers.length + 1).toString(),
            name,
            email,
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(
              name
            )}&background=0D8ABC&color=fff`,
          };
          setUser(newUser);
          localStorage.setItem("teamsync_user", JSON.stringify(newUser));
          toast({
            title: "Account created",
            description: `Welcome to TeamSync, ${name}!`,
          });
          resolve(true);
        }
      }, 1000);
    });
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("teamsync_user");
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
