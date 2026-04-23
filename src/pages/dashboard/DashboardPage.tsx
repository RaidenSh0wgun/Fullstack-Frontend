import { useAuth } from "@/context/AuthContext";
import { Link } from "react-router-dom";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  fetchTeacherCourses,
  fetchCalendarQuizzes,
  fetchPendingQuizzes,
  fetchAttemptedQuizzes,
  fetchAdminUsers,
} from "@/services/api";
import { Button } from "@/components/ui/button";
import { Star, BookOpen, Calendar, Trophy, Clock } from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuth();

  if (user?.role === "admin") {
    return <AdminDashboard />;
  }

  if (user?.role === "teacher") {
    return <InstructorDashboard />;
  }
  if (user?.role === "student" && user.email_verified !== true) {
    return <UnverifiedStudentDashboard />;
  }
  return <StudentDashboard />;
}

function AdminDashboard() {
  const { data: adminUsers, isLoading: statsLoading } = useQuery({
    queryKey: ["admin-users", "stats"],
    queryFn: () => fetchAdminUsers({ role: "all" }),
  });

  const stats = useMemo(() => {
    const counts = { total: 0, male: 0, female: 0, notVerified: 0 };
    if (!adminUsers) return counts;

    counts.total = adminUsers.length;
    for (const user of adminUsers) {
      const sex = (user.sex || "").toLowerCase();
      if (sex === "male") counts.male += 1;
      else if (sex === "female") counts.female += 1;
      if (user.email_verified !== true) counts.notVerified += 1;
    }
    return counts;
  }, [adminUsers]);

  const getPercent = (value: number) => (stats.total ? Math.round((value / stats.total) * 100) : 0);

  return (
    <div className="min-h-full bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 p-4">
      <div className="max-w-6xl mx-auto space-y-10">
        <div className="rounded-3xl bg-slate-900/50 backdrop-blur-md border border-slate-700/50 p-10 shadow-2xl shadow-black/30">
          <div className="text-center mb-10">
            <div className="mx-auto w-24 h-24 bg-gradient-to-r from-red-500/20 to-yellow-500/20 rounded-3xl flex items-center justify-center border-2 border-white/20 mb-6">
              <Star className="w-12 h-12 text-yellow-400" />
            </div>
            <h1 className="text-4xl font-black bg-gradient-to-r from-red-400 via-yellow-400 to-orange-400 bg-clip-text text-transparent">
              ADMIN CONTROL CENTER
            </h1>
          </div>

          <div className="grid gap-8 xl:grid-cols-[1.4fr,0.9fr]">
            <div className="rounded-3xl bg-slate-950/70 border border-slate-700/50 p-8 shadow-inner shadow-black/20">
              <div className="flex items-center justify-between mb-8 gap-4">
                <div>
                  <h2 className="text-2xl font-semibold text-white">Population Overview</h2>
                  <p className="text-sm text-slate-400 mt-2">
                    Track male and female user counts across the platform.
                  </p>
                </div>
                <span className="inline-flex items-center rounded-full bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-200">
                  {statsLoading ? "Loading..." : `${stats.total} users`}
                </span>
              </div>

              <div className="grid gap-4 sm:grid-cols-3 mb-8">
                <div className="rounded-3xl border border-slate-700/70 bg-slate-900/80 p-5">
                  <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Male</p>
                  <p className="mt-3 text-3xl font-bold text-white">{stats.male}</p>
                  <p className="text-sm text-slate-500">{getPercent(stats.male)}%</p>
                </div>
                <div className="rounded-3xl border border-slate-700/70 bg-slate-900/80 p-5">
                  <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Female</p>
                  <p className="mt-3 text-3xl font-bold text-white">{stats.female}</p>
                  <p className="text-sm text-slate-500">{getPercent(stats.female)}%</p>
                </div>
                <div className="rounded-3xl border border-slate-700/70 bg-slate-900/80 p-5">
                  <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Not Verified</p>
                  <p className="mt-3 text-3xl font-bold text-white">{stats.notVerified}</p>
                  <p className="text-sm text-slate-500">{getPercent(stats.notVerified)}%</p>
                </div>
              </div>

              <div className="space-y-6">
                {[
                  { label: "Male", value: stats.male, color: "bg-blue-500" },
                  { label: "Female", value: stats.female, color: "bg-pink-500" },
                  { label: "Not Verified", value: stats.notVerified, color: "bg-amber-500" },
                ].map((slice) => (
                  <div key={slice.label}>
                    <div className="flex items-center justify-between text-sm text-slate-300 mb-2">
                      <span>{slice.label}</span>
                      <span>{stats.total ? `${getPercent(slice.value)}%` : "0%"}</span>
                    </div>
                    <div className="h-4 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className={`${slice.color} h-full rounded-full transition-all duration-300`}
                        style={{ width: `${getPercent(slice.value)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl bg-slate-950/70 border border-slate-700/50 p-8 shadow-inner shadow-black/20">
              <h2 className="text-2xl font-semibold text-white mb-4">Admin Tools</h2>
              <p className="text-slate-400 leading-relaxed mb-8">
                View and manage student and teacher accounts from the Admin panel. Use the dashboard metrics to keep track of population balance.
              </p>
              <Link to="/admin" className="block">
                <Button className="w-full h-14 bg-gradient-to-r from-red-500 via-yellow-500 to-orange-500 text-white font-bold rounded-2xl shadow-xl">
                  OPEN ADMIN PANEL
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function UnverifiedStudentDashboard() {
  return (
    <div className="min-h-full bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 p-6 flex items-center justify-center">
      <div className="w-full max-w-xl bg-slate-900/50 backdrop-blur-md border border-slate-700/50 rounded-3xl p-10 shadow-2xl shadow-black/30 text-center">
        <h1 className="text-3xl font-black text-white">Verify your email</h1>
        <p className="text-slate-400 mt-4 leading-relaxed">
          Your student dashboard is locked until your email is verified.
        </p>
        <p className="text-slate-300 mt-2 text-sm">
          After verifying, reload to access the dashboard.
        </p>
        <div className="mt-8">
          <Link to="/profile" className="inline-flex">
            <button className="h-12 px-8 bg-gradient-to-r from-red-500 via-yellow-500 to-orange-500 text-white font-bold rounded-2xl shadow-xl hover:brightness-110 transition-all">
              Go to Profile
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}

function InstructorDashboard() {
  const { data: courses } = useQuery({
    queryKey: ["courses"],
    queryFn: fetchTeacherCourses,
  });
  const { data: events } = useQuery({
    queryKey: ["calendar-quizzes"],
    queryFn: fetchCalendarQuizzes,
  });

  const upcomingEvents = (events ?? [])
    .filter((e) => e.due_date && new Date(e.due_date) >= new Date())
    .slice(0, 5);

  return (
    <div className="min-h-full bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-12">
          <div className="w-16 h-16 bg-gradient-to-r from-red-500/20 to-yellow-500/20 rounded-3xl flex items-center justify-center border-2 border-white/20">
            <BookOpen className="w-9 h-9 text-yellow-400" />
          </div>
          <h1 className="text-4xl font-black bg-gradient-to-r from-red-400 via-yellow-400 to-orange-400 bg-clip-text text-transparent">
            INSTRUCTOR DASHBOARD
          </h1>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          <div className="bg-slate-900/50 backdrop-blur-md border border-slate-700/50 rounded-3xl p-8 shadow-2xl shadow-black/30">
            <div className="flex items-center gap-3 mb-8">
              <BookOpen className="w-8 h-8 text-yellow-400" />
              <h2 className="text-2xl font-bold text-slate-100">Courses</h2>
            </div>

            {courses?.length ? (
              <ul className="space-y-4 mb-8">
                {courses.slice(0, 5).map((c) => (
                  <li key={c.id}>
                    <Link
                      to={`/courses/${c.id}`}
                      className="block p-4 bg-slate-800/80 hover:bg-slate-700/80 rounded-2xl border border-slate-600/50 hover:border-yellow-400/50 transition-all"
                    >
                      <span className="font-semibold text-lg text-white">{c.title}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-slate-400 py-8 text-center">No courses yet.</p>
            )}

            <Link to="/courses">
              <Button className="w-full h-12 bg-gradient-to-r from-red-500 via-yellow-500 to-orange-500 text-white font-bold rounded-2xl shadow-xl">
                VIEW ALL COURSES
              </Button>
            </Link>
          </div>

          <div className="bg-slate-900/50 backdrop-blur-md border border-slate-700/50 rounded-3xl p-8 shadow-2xl shadow-black/30">
            <div className="flex items-center gap-3 mb-8">
              <Calendar className="w-8 h-8 text-yellow-400" />
              <h2 className="text-2xl font-bold text-slate-100">Calendar</h2>
            </div>

            {upcomingEvents.length ? (
              <ul className="space-y-4 mb-8">
                {upcomingEvents.map((e) => (
                  <li key={e.id} className="p-4 bg-slate-800/80 rounded-2xl border border-slate-600/50">
                    <div className="font-semibold text-white">{e.title}</div>
                    <div className="text-sm text-slate-400 mt-1">
                      {e.due_date ? new Date(e.due_date).toLocaleString() : ""}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-slate-400 py-8 text-center">No upcoming events.</p>
            )}

            <Link to="/calendar">
              <Button
           variant="outline"
           className="w-full h-12 border-slate-600 text-black hover:bg-slate-800 hover:text-white rounded-2xl"
          >
           OPEN CALENDAR
</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function StudentDashboard() {
  const { data: pending } = useQuery({
    queryKey: ["pending-quizzes"],
    queryFn: fetchPendingQuizzes,
  });

  const { data: attempted } = useQuery({
    queryKey: ["attempted-quizzes"],
    queryFn: fetchAttemptedQuizzes,
  });

  const { data: events } = useQuery({
    queryKey: ["calendar-quizzes"],
    queryFn: fetchCalendarQuizzes,
  });

  const upcomingEvents = (events ?? [])
    .filter((e) => e.due_date && new Date(e.due_date) >= new Date())
    .slice(0, 5);

  return (
    <div className="min-h-full bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-12">
          <div className="w-16 h-16 bg-gradient-to-r from-red-500/20 to-yellow-500/20 rounded-3xl flex items-center justify-center border-2 border-white/20">
            <Trophy className="w-9 h-9 text-yellow-400" />
          </div>
          <h1 className="text-4xl font-black bg-gradient-to-r from-red-400 via-yellow-400 to-orange-400 bg-clip-text text-transparent">
            STUDENT DASHBOARD
          </h1>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          <div className="bg-slate-900/50 backdrop-blur-md border border-slate-700/50 rounded-3xl p-8 shadow-2xl shadow-black/30">
            <div className="flex items-center gap-3 mb-8">
              <Trophy className="w-8 h-8 text-yellow-400" />
              <h2 className="text-2xl font-bold text-slate-100">Quizzes to complete</h2>
            </div>

            {pending?.length ? (
              <div className="space-y-4 mb-8">
                {pending.slice(0, 5).map((q) => (
                  <div key={q.id} className="flex items-center justify-between bg-slate-800/80 p-5 rounded-2xl border border-slate-600/50">
                    <div>
                      <div className="font-semibold text-lg text-white">{q.title}</div>
                      {q.due_date && (
                        <div className="text-sm text-red-400 mt-1">
                          Due: {new Date(q.due_date).toLocaleString()}
                        </div>
                      )}
                    </div>
                    <Link to={`/quizview/${q.id}`}>
                      <Button className="bg-gradient-to-r from-red-500 via-yellow-500 to-orange-500 text-white font-bold px-8 rounded-2xl">
                        VIEW QUIZ
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 py-8 text-center">No pending quizzes.</p>
            )}

            {!!attempted?.length && (
              <div className="mt-10 pt-8 border-t border-slate-700">
                <h3 className="text-yellow-400 font-bold mb-4 flex items-center gap-2">
                  <Star className="w-5 h-5" /> Completed quizzes
                </h3>
                <div className="space-y-3">
                  {attempted.slice(0, 5).map((q) => (
                    <Link
                      key={q.id}
                      to={`/quiz/${q.id}?viewAttempt=true`}
                      className="block p-5 bg-slate-800/80 hover:bg-slate-700/80 rounded-2xl border border-slate-600/50 transition-all"
                    >
                      <span className="font-medium text-white">{q.title}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="bg-slate-900/50 backdrop-blur-md border border-slate-700/50 rounded-3xl p-8 shadow-2xl shadow-black/30">
            <div className="flex items-center gap-3 mb-8">
              <Calendar className="w-8 h-8 text-yellow-400" />
              <h2 className="text-2xl font-bold text-slate-100">Calendar</h2>
            </div>

            {upcomingEvents.length ? (
              <ul className="space-y-4 mb-8">
                {upcomingEvents.map((e) => (
                  <li key={e.id} className="p-4 bg-slate-800/80 rounded-2xl border border-slate-600/50">
                    <div className="font-semibold text-white">{e.title}</div>
                    <div className="text-sm text-slate-400 mt-1 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      {e.due_date ? new Date(e.due_date).toLocaleString() : ""}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-slate-400 py-8 text-center">No upcoming events.</p>
            )}

            <Link to="/calendar">
              <Button variant="outline" className="w-full h-12 border-slate-600 text-slate-300 hover:bg-slate-800 rounded-2xl">
                OPEN CALENDAR
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}