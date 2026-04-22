import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchTeacherCourses, fetchCourseStudents } from "@/services/api";
import { Link } from "react-router-dom";
import { Users } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function StudentsPage() {
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [courseSearch, setCourseSearch] = useState("");
  const [studentSearch, setStudentSearch] = useState("");

  const { data: courses } = useQuery({
    queryKey: ["courses"],
    queryFn: fetchTeacherCourses,
  });

  const { data: students, isLoading } = useQuery({
    queryKey: ["course-students", selectedCourseId],
    queryFn: () => fetchCourseStudents(selectedCourseId!),
    enabled: selectedCourseId !== null,
  });

  const courseQ = courseSearch.trim().toLowerCase();
  const visibleCourses = courseQ
    ? (courses ?? []).filter((c) => (c.title ?? "").toLowerCase().includes(courseQ))
    : (courses ?? []);

  const studentQ = studentSearch.trim().toLowerCase();
  const visibleStudents = studentQ
    ? (students ?? []).filter((s) => {
        const hay = `${s.full_name ?? ""}\n${s.username ?? ""}\n${s.user ?? ""}`.toLowerCase();
        return hay.includes(studentQ);
      })
    : (students ?? []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/30 to-slate-950 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto space-y-10">
        <div>
          <h1 className="text-5xl font-black bg-gradient-to-r from-red-400 via-yellow-400 to-orange-400 bg-clip-text text-transparent">
            Students
          </h1>
          <p className="text-xl text-slate-400 mt-3">
            Manage enrolled students across your courses
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-[1fr,1.6fr]">
          <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 shadow-2xl shadow-black/50 h-fit">
            <h2 className="text-2xl font-bold text-white mb-6">Your Courses</h2>

            <Input
              value={courseSearch}
              onChange={(e) => setCourseSearch(e.target.value)}
              placeholder="Search courses..."
              className="h-12 rounded-2xl bg-slate-800 border-slate-600 text-white placeholder:text-slate-400 caret-white mb-5"
            />

            {visibleCourses.length ? (
              <div className="space-y-2">
                {visibleCourses.map((course) => (
                  <button
                    key={course.id}
                    type="button"
                    onClick={() => setSelectedCourseId(course.id)}
                    className={`w-full text-left px-6 py-5 rounded-2xl transition-all text-lg font-medium ${
                      selectedCourseId === course.id
                        ? "bg-gradient-to-r from-red-500 via-yellow-500 to-orange-500 text-white shadow-lg"
                        : "bg-slate-800 hover:bg-slate-700 text-slate-200"
                    }`}
                  >
                    {course.title}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 py-12 text-center">You have no courses yet.</p>
            )}
          </div>

          <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 shadow-2xl shadow-black/50">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-white">Enrolled Students</h2>
              {selectedCourseId && courses && (
                <p className="text-slate-400 text-sm">
                  {courses.find((c) => c.id === selectedCourseId)?.title}
                </p>
              )}
            </div>

            {selectedCourseId === null ? (
              <div className="text-center py-20 text-slate-400">
                Select a course from the left to see enrolled students
              </div>
            ) : isLoading ? (
              <div className="text-center py-20 text-slate-400">Loading students...</div>
            ) : (
              <>
                <Input
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  placeholder="Search students..."
                  className="h-12 rounded-2xl bg-slate-800 border-slate-600 text-white placeholder:text-slate-400 caret-white mb-5"
                />
                {visibleStudents.length ? (
              <div className="space-y-3">
                {visibleStudents.map((student) => (
                  <div
                    key={student.id}
                    className="flex items-center justify-between bg-slate-950 border border-slate-700 hover:border-yellow-400/30 rounded-2xl px-8 py-6 transition-all"
                  >
                    <div>
                      <Link
                        to={`/users/${student.username}`}
                        className="font-semibold text-white text-lg hover:text-yellow-400 transition-colors"
                      >
                        {student.full_name || student.username}
                      </Link>
                      <p className="text-slate-400 text-sm">
                        @{student.username} • ID: {student.user}
                      </p>
                    </div>
                    <div className="text-xs uppercase tracking-widest text-emerald-400 font-medium">
                      Enrolled
                    </div>
                  </div>
                ))}
              </div>
                ) : (
                  <div className="text-center py-20">
                    <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-red-500/20 to-yellow-500/20 rounded-3xl flex items-center justify-center">
                      <Users className="h-9 w-9 opacity-50 text-slate-200" />
                    </div>
                    <p className="text-slate-400">No students found.</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}