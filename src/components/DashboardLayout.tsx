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
  Shield,
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
      <div className="flex min-h-screen w-full bg-gradient-to-br from-slate-950 via-purple-950/30 to-slate-950">
        {/* Sidebar */}
        <Sidebar className="border-r border-slate-700 bg-slate-900/95 backdrop-blur-xl">
          <SidebarHeader className="px-5 py-5 border-b border-slate-700">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-red-500 via-yellow-400 to-orange-500 rounded-xl flex items-center justify-center">
                <span className="text-white text-xl font-bold">Q</span>
              </div>
              <span className="font-black text-2xl bg-gradient-to-r from-red-400 via-yellow-400 to-orange-400 bg-clip-text text-black/0">   
                QuizApp
              </span>
            </Link>
          </SidebarHeader>

          <SidebarContent className="px-3 py-5">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/")}>
                  <Link to="/" className="flex items-center gap-3 text-sm">
                    <LayoutDashboard size={18} />
                    Dashboard
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {user?.role !== "admin" && (
                <>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={isActive("/courses")}>
                      <Link to="/courses" className="flex items-center gap-3 text-sm">
                        <BookOpen size={18} />
                        Courses
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={isActive("/calendar")}>
                      <Link to="/calendar" className="flex items-center gap-3 text-sm">
                        <Calendar size={18} />
                        Calendar
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </>
              )}

              {user?.role === "teacher" && (
                <>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={isActive("/students")}>
                      <Link to="/students" className="flex items-center gap-3 text-sm">
                        <Users size={18} />
                        Students
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={isActive("/scores")}>
                      <Link to="/scores" className="flex items-center gap-3 text-sm">
                        <BarChart3 size={18} />
                        Quiz Scores
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </>
              )}

              {user?.role === "admin" && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive("/admin")}>
                    <Link to="/admin" className="flex items-center gap-3 text-sm">
                      <Shield size={18} />
                      Admin Panel
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarContent>

          <SidebarFooter className="p-5 border-t border-slate-700 mt-auto">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center text-white font-medium text-sm">
                {user?.username?.[0]?.toUpperCase() || "U"}
              </div>
              <div className="min-w-0">
                <p className="font-medium text-white text-sm truncate">{user?.username}</p>
                <p className="text-xs text-slate-400 capitalize">{user?.role}</p>
              </div>
            </div>

            <button
              onClick={logout}
              className="w-full rounded-xl border border-slate-600 hover:bg-slate-800 hover:border-slate-500 transition py-2.5 text-sm font-medium text-slate-300 hover:text-white"
            >
              Logout
            </button>
          </SidebarFooter>
        </Sidebar>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 border-b border-slate-700 bg-slate-900/80 backdrop-blur-xl flex items-center px-4 md:px-6 z-10">
            <SidebarTrigger className="mr-3 text-slate-400 hover:text-white">
              <PanelLeft size={20} />
            </SidebarTrigger>
            <div className="flex-1" />
          </header>

          <main className="flex-1 overflow-auto p-4 md:p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}