import { NavLink, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Kanban, 
  Users, 
  Calendar, 
  Settings,
  MessageCircle,
  Bell,
  PenTool,
  FolderKanban
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

import { cn } from "@/lib/utils";
import TeamSyncLogo from "@/components/TeamSyncLogo";

const AppSidebar = () => {
  const location = useLocation();
  const sidebar = useSidebar();
  const isCollapsed = sidebar.state === "collapsed";

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    {
      label: "Main",
      items: [
        {
          title: "Dashboard",
          icon: LayoutDashboard,
          path: "/",
        },
        {
          title: "My Projects",
          icon: FolderKanban,
          path: "/projects",
        },
        {
          title: "Kanban Board",
          icon: Kanban,
          path: "/kanban",
        },
      ],
    },
    {
      label: "Social",
      items: [
        {
          title: "Social Feed",
          icon: Users,
          path: "/social",
        },
        {
          title: "Calendar",
          icon: Calendar,
          path: "/calendar",
        },
      ],
    },
  ];

  const getLinkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      "flex items-center gap-2 px-3 py-2 rounded-md w-full transition-all",
      isActive
        ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
        : "text-sidebar-foreground hover:bg-sidebar-accent/80 hover:text-sidebar-accent-foreground"
    );

  return (
    <Sidebar
      className={cn(
        "border-r border-sidebar-border bg-sidebar",
        isCollapsed ? "w-20" : "w-64"
      )}
      collapsible="icon"
    >
      <div className="flex items-center h-16 px-4 border-b border-sidebar-border">
        {!isCollapsed ? (
          <div className="flex items-center">
            <TeamSyncLogo className="h-6 w-6 text-teamsync-400" />
            <span className="ml-2 text-xl font-bold text-sidebar-foreground">
              TeamSync
            </span>
          </div>
        ) : (
          <TeamSyncLogo className="h-8 w-8 mx-auto text-teamsync-400" />
        )}
        <SidebarTrigger
          className={cn(
            "ml-auto h-8 w-8 text-sidebar-foreground hover:text-sidebar-foreground/80",
            isCollapsed && "justify-center"
          )}
        />
      </div>

      <SidebarContent className="p-2">
        {navItems.map((section) => (
          <SidebarGroup key={section.label}>
            {!isCollapsed && (
              <SidebarGroupLabel className="text-xs font-medium text-sidebar-foreground/70 px-3 py-2">
                {section.label}
              </SidebarGroupLabel>
            )}

            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton asChild>
                      <NavLink to={item.path} className={getLinkClass}>
                        <item.icon
                          className={cn(
                            "h-5 w-5",
                            isCollapsed && "h-6 w-6 mx-auto"
                          )}
                        />
                        {!isCollapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      
      {/* Bottom items */}
      <div className="mt-auto p-2 border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <NavLink to="/messages" className={getLinkClass}>
                <MessageCircle className={cn("h-5 w-5", isCollapsed && "h-6 w-6 mx-auto")} />
                {!isCollapsed && <span>Messages</span>}
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <NavLink to="/notifications" className={getLinkClass}>
                <Bell className={cn("h-5 w-5", isCollapsed && "h-6 w-6 mx-auto")} />
                {!isCollapsed && <span>Notifications</span>}
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <NavLink to="/whiteboard" className={getLinkClass}>
                <PenTool className={cn("h-5 w-5", isCollapsed && "h-6 w-6 mx-auto")} />
                {!isCollapsed && <span>Whiteboard</span>}
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <NavLink to="/settings" className={getLinkClass}>
                <Settings className={cn("h-5 w-5", isCollapsed && "h-6 w-6 mx-auto")} />
                {!isCollapsed && <span>Settings</span>}
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </div>
    </Sidebar>
  );
};

export default AppSidebar;
