import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import MainLayout from "./layouts/MainLayout";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import KanbanBoard from "./pages/KanbanBoard";
import SocialFeed from "./pages/SocialFeed";
import Calendar from "./pages/Calendar";
import Messages from "./pages/Messages";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import NotFound from "./pages/NotFound";
import Whiteboard from "./pages/Whiteboard";
import MyProjects from "./pages/MyProjects";
import ForgotPassword from "./pages/ForgotPassword";
import CheckEmail from "./pages/CheckEmail";
import ResetPassword from "./pages/ResetPassword";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import Roles from "./pages/Roles";
import ProtectedRoute from "./components/ProtectedRoute";
import ManagerRoute from "./components/ManagerRoute";
// import Profile from "./pages/Profile";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/check-email" element={<CheckEmail />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            
            {/* Protected Routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }>
              <Route index element={<Dashboard />} />
            </Route>
            
            <Route path="/projects" element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }>
              <Route index element={<MyProjects />} />
            </Route>
            
            <Route path="/kanban" element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }>
              <Route index element={<KanbanBoard />} />
            </Route>
            
            <Route path="/social" element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }>
              <Route index element={<SocialFeed />} />
            </Route>
            
            <Route path="/calendar" element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }>
              <Route index element={<Calendar />} />
            </Route>
            
            <Route path="/messages" element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }>
              <Route index element={<Messages />} />
            </Route>
            
            <Route path="/whiteboard" element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }>
              <Route index element={<Whiteboard />} />
            </Route>
            
            <Route path="/settings" element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }>
              <Route index element={<Settings />} />
            </Route>
            
            <Route path="/roles" element={
              <ManagerRoute>
                <MainLayout />
              </ManagerRoute>
            }>
              <Route index element={<Roles />} />
            </Route>
            
            <Route path="/profile/:userId" element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }>
              <Route index element={<Profile />} />
            </Route>
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
