
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import MainLayout from "./layouts/MainLayout";
import Dashboard from "./pages/Dashboard";
import KanbanBoard from "./pages/KanbanBoard";
import SocialFeed from "./pages/SocialFeed";
import Calendar from "./pages/Calendar";
import Messages from "./pages/Messages";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/" element={<MainLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="kanban" element={<KanbanBoard />} />
              <Route path="social" element={<SocialFeed />} />
              <Route path="calendar" element={<Calendar />} />
              <Route path="messages" element={<Messages />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
