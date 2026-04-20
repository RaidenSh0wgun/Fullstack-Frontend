import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { fetchEnrolledCourses, fetchMyCourses, type Course } from "@/services/api";

export default function ProfileViewPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const isTeacher = user?.role === "teacher";
  const { data: courseList, isLoading: coursesLoading } = useQuery<Course[]>({
    queryKey: ["profile-courses", user?.role],
    queryFn: isTeacher ? fetchMyCourses : fetchEnrolledCourses,
    enabled: Boolean(user),
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/30 to-slate-950 p-8 text-white">
        <p className="text-slate-400">Loading profile...</p>
      </div>
    );
  }

  const profileTitle = user.role === "teacher" ? "Teacher Profile" :
                      user.role === "admin" ? "Admin Profile" : "Student Profile";

  const profileSubtitle = user.role === "teacher"
    ? "View your teacher profile and account details."
    : user.role === "admin"
    ? "View your admin profile and account details."
    : "View your student profile and account details.";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/30 to-slate-950 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto space-y-10">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-black bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            {profileTitle}
          </h1>
          <p className="text-slate-300 mt-4 text-lg max-w-2xl">{profileSubtitle}</p>
        </div>

        {/* Profile Info Card */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 shadow-2xl shadow-black/50">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Avatar */}
            <div className="flex-shrink-0">
              <div className="w-32 h-32 rounded-2xl overflow-hidden border-4 border-slate-700/50">
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={`${user.username}'s avatar`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center">
                    <span className="text-4xl text-slate-400">
                      {user.full_name?.charAt(0)?.toUpperCase() || user.username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Profile Details */}
            <div className="flex-1 space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-white">{user.full_name || user.username}</h2>
                <p className="text-slate-400">@{user.username}</p>
                <p className="text-slate-400 capitalize">{user.role}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs uppercase tracking-widest text-slate-400">Email</p>
                  <p className="text-lg font-semibold text-white">{user.email}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest text-slate-400">Gender</p>
                  <p className="text-lg font-semibold text-white capitalize">{user.sex || "Not specified"}</p>
                </div>
              </div>

              {user.bio && (
                <div>
                  <p className="text-xs uppercase tracking-widest text-slate-400">Bio</p>
                  <p className="text-white mt-1">{user.bio}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Courses/Enrolled Courses */}
        {coursesLoading ? (
          <div className="text-slate-400">Loading courses...</div>
        ) : courseList && courseList.length > 0 ? (
          <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 shadow-2xl shadow-black/50">
            <h3 className="text-xl font-bold text-white mb-6">
              {user.role === "teacher" ? "Courses Teaching" : "Enrolled Courses"}
            </h3>
            <div className="space-y-3">
              {courseList.map((course) => (
                <div key={course.id} className="flex items-center justify-between bg-slate-800/50 p-4 rounded-xl border border-slate-700/30">
                  <div>
                    <p className="font-medium text-white">{course.title}</p>
                    <p className="text-sm text-slate-400">{course.description}</p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => navigate(`/courses/${course.id}`)}
                    className="rounded-xl border-slate-600 hover:bg-slate-700"
                  >
                    View Course
                  </Button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 shadow-2xl shadow-black/50">
            <h3 className="text-xl font-bold text-white mb-6">
              {user.role === "teacher" ? "Courses Teaching" : "Enrolled Courses"}
            </h3>
            <p className="text-slate-400">No courses available yet.</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
          <Button
            onClick={() => navigate("/profile")}
            className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white font-bold rounded-2xl px-12 py-6 shadow-xl hover:brightness-110 text-lg"
          >
            Edit Profile
          </Button>
        </div>
      </div>
    </div>
  );
}