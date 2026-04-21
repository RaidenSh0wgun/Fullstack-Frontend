import { Routes, Route, Navigate } from "react-router-dom";

import LoginPage from "@/pages/auths/loginpage";
import ForgotPasswordPage from "@/pages/auths/ForgotPasswordPage";
import ResetPasswordPage from "@/pages/auths/ResetPasswordPage";
import VerifyEmailPage from "@/pages/auths/VerifyEmailPage";
import QuizPage from "@/pages/quiz/quizpage";
import QuizViewPage from "@/pages/quiz/viewquizpage";
import DashboardPage from "@/pages/dashboard/DashboardPage";
import CoursesPage from "../pages/courses/CoursesPage";
import CourseDetailPage from "@/pages/courses/CourseDetailPage";
import AddQuestionsPage from "@/pages/questions/AddQuestionsPage";
import CalendarPage from "@/pages/calendar/CalendarPage";
import StudentsPage from "@/pages/students/StudentsPage";
import ScoresPage from "@/pages/scores/ScoresPage";
import AdminPage from "@/pages/admin/AdminPage";

import ProfilePage from "@/pages/profile/ProfilePage";
import ProfileViewPage from "@/pages/profile/ProfileViewPage";
import UserProfilePage from "@/pages/profile/UserProfilePage";

import ProtectedRoute from "./ProtectedRoute";
import DashboardLayout from "@/components/DashboardLayout";
import EditQuizLayout from "@/pages/editTabs/EditQuizLayout";
import EditQuizQuestionsTab from "@/pages/editTabs/EditQuizQuestionsTab";
import EditQuizSubmissionsTab from "@/pages/editTabs/EditQuizSubmissionsTab";
import EditQuizSettingsTab from "@/pages/editTabs/EditQuizSettingsTab";
import EditQuizReviewAttemptPage from "@/pages/editTabs/EditQuizReviewAttemptPage";

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password/:uid/:token" element={<ResetPasswordPage />} />
      <Route path="/verify-email/:uid/:token" element={<VerifyEmailPage />} />

      <Route
        path="/quizview/:quizId"
        element={
          <ProtectedRoute>
            <QuizViewPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/quiz/:quizId"
        element={
          <ProtectedRoute allowedRoles={["student", "teacher"]}>
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

        {/* PROFILE ROUTES */}
        <Route path="profile" element={<ProfilePage />} />
        <Route
          path="profileview"
          element={
            <ProtectedRoute>
              <ProfileViewPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="users/:username"
          element={
            <ProtectedRoute>
              <UserProfilePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="courses/:courseId/quizzes/:quizId/edit"
          element={
            <ProtectedRoute allowedRoles={["teacher"]}>
              <EditQuizLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<EditQuizQuestionsTab />} />
          <Route path="questions" element={<EditQuizQuestionsTab />} />
          <Route path="submissions" element={<EditQuizSubmissionsTab />} />
          <Route path="settings" element={<EditQuizSettingsTab />} />
          <Route path="review/:attemptId" element={<EditQuizReviewAttemptPage />} />
        </Route>

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

        <Route
          path="admin"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminPage />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}