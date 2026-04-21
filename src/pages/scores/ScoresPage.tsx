import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  fetchTeacherCourses,
  fetchQuizzesForCourse,
  fetchQuizAttempts,
} from "@/services/api";

export default function ScoresPage() {
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [selectedQuizId, setSelectedQuizId] = useState<number | null>(null);

  const { data: courses } = useQuery({
    queryKey: ["courses"],
    queryFn: fetchTeacherCourses,
  });

  const { data: quizzes } = useQuery({
    queryKey: ["quizzes", selectedCourseId],
    queryFn: () => fetchQuizzesForCourse(selectedCourseId!),
    enabled: selectedCourseId !== null,
  });

  const { data: attempts, isLoading } = useQuery({
    queryKey: ["quiz-attempts", selectedQuizId],
    queryFn: () => fetchQuizAttempts(selectedQuizId!),
    enabled: selectedQuizId !== null,
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/30 to-slate-950 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto space-y-10">
        {/* Header */}
        <div>
          <h1 className="text-5xl font-black bg-gradient-to-r from-red-400 via-yellow-400 to-orange-400 bg-clip-text text-transparent">
            Quiz Scores
          </h1>
          <p className="text-xl text-slate-400 mt-3">
            View student performance across your courses
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Courses Column */}
          <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 shadow-2xl shadow-black/50">
            <h2 className="text-2xl font-bold text-white mb-6">Courses</h2>
            
            {courses?.length ? (
              <div className="space-y-2">
                {courses.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setSelectedCourseId(c.id);
                      setSelectedQuizId(null);
                    }}
                    className={`w-full text-left px-6 py-4 rounded-2xl transition-all text-lg font-medium ${
                      selectedCourseId === c.id
                        ? "bg-gradient-to-r from-red-500 via-yellow-500 to-orange-500 text-white shadow-lg"
                        : "bg-slate-800 hover:bg-slate-700 text-slate-200"
                    }`}
                  >
                    {c.title}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 py-8 text-center">No courses found.</p>
            )}
          </div>

          {/* Quizzes Column */}
          <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 shadow-2xl shadow-black/50">
            <h2 className="text-2xl font-bold text-white mb-6">Quizzes</h2>
            
            {selectedCourseId === null ? (
              <div className="text-center py-12 text-slate-400">
                Select a course to see its quizzes
              </div>
            ) : quizzes?.length ? (
              <div className="space-y-2">
                {quizzes.map((q) => (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => setSelectedQuizId(q.id)}
                    className={`w-full text-left px-6 py-4 rounded-2xl transition-all text-lg font-medium ${
                      selectedQuizId === q.id
                        ? "bg-gradient-to-r from-red-500 via-yellow-500 to-orange-500 text-white shadow-lg"
                        : "bg-slate-800 hover:bg-slate-700 text-slate-200"
                    }`}
                  >
                    {q.title}
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400">
                No quizzes in this course yet.
              </div>
            )}
          </div>

          {/* Scores Column */}
          <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 shadow-2xl shadow-black/50 lg:col-span-1">
            <h2 className="text-2xl font-bold text-white mb-6">Student Scores</h2>
            
            {selectedQuizId === null ? (
              <div className="text-center py-12 text-slate-400">
                Select a quiz to view student scores
              </div>
            ) : isLoading ? (
              <div className="text-center py-12 text-slate-400">Loading scores...</div>
            ) : attempts?.length ? (
              <div className="space-y-3">
                {attempts.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between bg-slate-950 border border-slate-700 rounded-2xl px-6 py-5 hover:border-yellow-400/30 transition-all"
                  >
                    <div>
                      <p className="font-medium text-white">
                        {a.student_name || a.username}
                      </p>
                      <p className="text-xs text-slate-500">
                        Submitted {new Date(a.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-bold text-white">
                        {a.score}
                      </span>
                      <span className="text-slate-400"> / {a.total}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400">
                No attempts yet for this quiz.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}