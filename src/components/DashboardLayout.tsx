import { Outlet, Link, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
} from "@/components/ui/sidebar";

import {
  LayoutDashboard,
  BookOpen,
  Calendar,
  Users,
  BarChart3,
  PanelLeft,
} from "lucide-react";

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <Sidebar>
          <SidebarHeader className="px-4 py-4">
            <Link to="/" className="flex items-center gap-3">
              <img
                src="/src/assets/quiz_logo.png"
                alt="Quiz App"
                className="h-9 w-9 rounded-md"
              />
              <span className="font-semibold text-lg">Quiz App</span>
            </Link>
          </SidebarHeader>
          <SidebarContent className="px-2">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/")}>
                  <Link to="/" className="flex items-center gap-3">
                    <LayoutDashboard size={18} />
                    Dashboard
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/courses")}>
                  <Link to="/courses" className="flex items-center gap-3">
                    <BookOpen size={18} />
                    Courses
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/calendar")}>
                  <Link to="/calendar" className="flex items-center gap-3">
                    <Calendar size={18} />
                    Calendar
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {user?.role === "teacher" && (
                <>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={isActive("/students")}>
                      <Link to="/students" className="flex items-center gap-3">
                        <Users size={18} />
                        Students
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={isActive("/scores")}>
                      <Link to="/scores" className="flex items-center gap-3">
                        <BarChart3 size={18} />
                        Quiz Scores
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </>
              )}
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter className="px-4 py-4 space-y-2">
            <div className="text-sm text-muted-foreground">
              {user?.username} ({user?.role})
            </div>
            <button
              onClick={logout}
              className="w-full rounded-md border px-3 py-2 text-sm hover:bg-muted transition"
            >
              Logout
            </button>
          </SidebarFooter>
        </Sidebar>
        <div className="flex flex-col flex-1">
          <div className="h-14 flex items-center border-b px-4 mb-4">
            <SidebarTrigger>
              <PanelLeft size={20} />
            </SidebarTrigger>
          </div>
          <main className="flex-1 px-6 pb-6">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}