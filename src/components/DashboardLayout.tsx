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
import { NotebookPen } from 'lucide-react';

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
      <div className="flex min-h-screen w-full bg-[#F8FAFC]">
        <Sidebar className="bg-[#6366F1] backdrop-blur-xl">
          <SidebarHeader className="px-5 py-5 bg-[#F8FAFC] border-b-3">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-9 h-9 bg-[#6366F1] rounded-xl flex items-center justify-center">
                <NotebookPen className="text-white"/>
              </div>
              <span className="font-black text-2xl bg-[#6366F1] bg-clip-text text-black/0">
                QuizApp
              </span>
            </Link>
          </SidebarHeader>

          <SidebarContent className="px-3 py-5 bg-[#F8FAFC]">
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
                      <Link to="/courses" className="flex items-center gap-3 text-sm text-[#1E293B]">
                        <BookOpen size={18} />
                        Courses
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={isActive("/calendar")}>
                      <Link to="/calendar" className="flex items-center gap-3 text-sm text-[#1E293B]">
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
                      <Link to="/students" className="flex items-center gap-3 text-sm text-[#1E293B]">
                        <Users size={18} />
                        Students
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={isActive("/scores")}>
                      <Link to="/scores" className="flex items-center gap-3 text-sm text-[#1E293B]">
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
                    <Link to="/admin" className="flex items-center gap-3 text-sm text-[#1E293B]">
                      <Shield size={18} />
                      Admin Panel
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarContent>

          <SidebarFooter className="p-5 bg-[#6366F1] mt-auto">
            <Link
<<<<<<< HEAD
              to="/profileview"
=======
              to="/profile"
>>>>>>> 7bc9cec5c481f7ef859c04d0e7edd54e453aed52
              className="mb-4 flex items-center gap-3 rounded-2xl bg-[#F8FAFC] px-3 py-3 transition hover:bg-[#e4e5ed]"
            >
              <div className="w-11 h-11 overflow-hidden rounded-full flex items-center justify-center text-white font-medium text-sm">
                {user?.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={`${user.username}'s profile`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  user?.username?.[0]?.toUpperCase() || "U"
                )}
              </div>
              <div className="min-w-0 ">
                <p className="font-medium text-[#1E293B] text-sm truncate">
                  {user?.full_name || user?.username}
                </p>
                <p className="text-xs text-slate-400 truncate">@{user?.username}</p>
                <p className="text-xs text-slate-400 capitalize">{user?.role}</p>
              </div>
            </Link>

            <button
              onClick={logout}
              className="w-full rounded-xl bg-[#F8FAFC] hover:bg-[#FB7185]  transition py-2.5 text-sm font-medium text-[#1E293B] hover:text-white"
            >
              Logout
            </button>
          </SidebarFooter>
        </Sidebar>

<<<<<<< HEAD
        <div className="flex-1 flex flex-col min-w-0 min-h-0">
          <header className="sticky top-0 z-20 h-14 bg-[#1E293B] backdrop-blur-xl flex items-center px-4 md:px-6 flex-shrink-0">
=======
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 bg-[#1E293B] backdrop-blur-xl flex items-center px-4 md:px-6 z-10">
>>>>>>> 7bc9cec5c481f7ef859c04d0e7edd54e453aed52
            <SidebarTrigger className="mr-3 text-slate-400 hover:text-white">
              <PanelLeft size={20} />
            </SidebarTrigger>
            <div className="flex-1" />
          </header>

          <main className="flex-1 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
