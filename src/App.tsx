import { Routes, Route, Navigate, Link, useLocation } from "react-router-dom";
import "./App.css";
import Homepage from "@/pages/homepage";
import LoginPage from "@/pages/loginpage";
import QuizPage from "@/pages/quizpage";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";

function ProtectedRoute({
  children,
  allowedRoles,
}: {
  children: JSX.Element;
  allowedRoles?: Array<"student" | "teacher">;
}) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg font-medium">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <img
              src="/src/assets/quiz_logo.png"
              alt="Quiz App"
              className="h-8 w-8 rounded-md object-cover"
            />
            <span className="text-lg font-semibold">Quiz App</span>
          </Link>
          <nav className="flex items-center gap-3">
            {user ? (
              <>
                <span className="text-sm text-muted-foreground">
                  {user.username} ({user.role})
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={logout}
                  className="text-xs"
                >
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button size="sm">Login / Register</Button>
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
    </div>
  );
}

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Homepage />
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/quiz/:quizId"
          element={
            <ProtectedRoute allowedRoles={["student"]}>
              <QuizPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

