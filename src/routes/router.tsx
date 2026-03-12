import { Routes, Route, Navigate } from "react-router-dom";

import LoginPage from "@/pages/auths/loginpage";
import QuizPage from "@/pages/quiz/quizpage";
import DashboardPage from "@/pages/dashboard/DashboardPage";
import CoursesPage from "../pages/courses/CoursesPage";
import CourseDetailPage from "@/pages/courses/CourseDetailPage";
import AddQuestionsPage from "@/pages/questions/AddQuestionsPage";
import CalendarPage from "@/pages/calendar/CalendarPage";
import StudentsPage from "@/pages/students/StudentsPage";
import ScoresPage from "@/pages/scores/ScoresPage";
import ProtectedRoute from "./ProtectedRoute";
import DashboardLayout from "@/components/DashboardLayout";

export default function AppRouter() {
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