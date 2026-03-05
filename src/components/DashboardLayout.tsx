import { Link, useLocation, Outlet } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";

const nav = [
  { to: "/", label: "Dashboard" },
  { to: "/courses", label: "Courses" },
  { to: "/calendar", label: "Calendar" },
];

const instructorNav = [
  { to: "/students", label: "Students" },
  { to: "/scores", label: "Quiz scores" },
];

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <aside className="w-56 shrink-0 border-r border-border bg-card/50 flex flex-col">
        <div className="p-4 border-b border-border">
          <Link to="/" className="flex items-center gap-2 font-semibold">
            <img
              src="/src/assets/quiz_logo.png"
              alt="Quiz App"
              className="h-8 w-8 rounded-md object-cover"
            />
            <span>Quiz App</span>
          </Link>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {nav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`block rounded-lg px-3 py-2 text-sm font-medium transition ${
                isActive(item.to)
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {item.label}
            </Link>
          ))}
          {user?.role === "teacher" &&
            instructorNav.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={`block rounded-lg px-3 py-2 text-sm font-medium transition ${
                  isActive(item.to)
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {item.label}
              </Link>
            ))}
        </nav>
        <div className="p-3 border-t border-border">
          <div className="text-xs text-muted-foreground truncate px-2 py-1">
            {user?.username} ({user?.role})
          </div>
          <Button
            size="sm"
            variant="outline"
            className="w-full mt-2"
            onClick={logout}
          >
            Logout
          </Button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <div className="p-6 max-w-5xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
