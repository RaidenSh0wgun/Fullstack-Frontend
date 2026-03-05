import type { ReactElement } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import "./App.css";
import LoginPage from "@/pages/loginpage";
import QuizPage from "@/pages/quizpage";
import { useAuth } from "@/context/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import DashboardPage from "@/pages/DashboardPage";
import CoursesPage from "@/pages/CoursesPage";
import CourseDetailPage from "@/pages/CourseDetailPage";
import AddQuestionsPage from "@/pages/AddQuestionsPage";
import CalendarPage from "@/pages/CalendarPage";
import StudentsPage from "@/pages/StudentsPage";
import ScoresPage from "@/pages/ScoresPage";

function ProtectedRoute({
  children,
  allowedRoles,
}: {
  children: ReactElement;
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

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/quiz/:quizId"
        element={
          <ProtectedRoute allowedRoles={["student"]}>
            <QuizPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="courses" element={<CoursesPage />} />
        <Route path="courses/:courseId" element={<CourseDetailPage />} />
        <Route
          path="courses/:courseId/quizzes/:quizId/questions"
          element={<AddQuestionsPage />}
        />
        <Route path="calendar" element={<CalendarPage />} />
        <Route
          path="students"
          element={
            <ProtectedRoute allowedRoles={["teacher"]}>
              <StudentsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="scores"
          element={
            <ProtectedRoute allowedRoles={["teacher"]}>
              <ScoresPage />
            </ProtectedRoute>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
