import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import AppSidebar from "@/components/AppSidebar";
import Header from "@/components/Header";
import { SidebarProvider } from "@/components/ui/sidebar";
import WaterBackground from '@/components/WaterBackground';
import FloatingChatbot from '@/components/FloatingChatbot';

const MainLayout = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);

    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  return (
    <SidebarProvider
      defaultOpen={!isMobile}
      open={isMobile ? false : undefined}
    >
      <div className="flex min-h-screen w-full">
        <WaterBackground />
        <AppSidebar />
        <div className="flex flex-col flex-1">
          <Header />
          <main className="flex-1 overflow-auto p-4 md:p-8">
            <Outlet />
          </main>
        </div>
        <FloatingChatbot />
      </div>
    </SidebarProvider>
  );
};

export default MainLayout;
