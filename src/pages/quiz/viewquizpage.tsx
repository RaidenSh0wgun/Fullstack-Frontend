import { useMemo } from "react";
<<<<<<< HEAD
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
=======
import { useNavigate, useParams } from "react-router-dom";
>>>>>>> 7bc9cec5c481f7ef859c04d0e7edd54e453aed52
import { useQuery } from "@tanstack/react-query";

import { fetchQuizViewDetail, type QuizViewResponse } from "@/services/api";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";

function formatDate(dueDate: string | null | undefined): string | null {
  if (!dueDate) return null;
  const dt = new Date(dueDate);
  if (Number.isNaN(dt.getTime())) return null;
  return dt.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function ViewQuizPage() {
  const { quizId } = useParams<{ quizId: string }>();
<<<<<<< HEAD
  const [searchParams] = useSearchParams();
=======
>>>>>>> 7bc9cec5c481f7ef859c04d0e7edd54e453aed52
  const navigate = useNavigate();
  const { user } = useAuth();

  const numericId = useMemo(() => Number(quizId), [quizId]);
<<<<<<< HEAD
  const viewAttempt = searchParams.get("viewAttempt") === "true";
=======
>>>>>>> 7bc9cec5c481f7ef859c04d0e7edd54e453aed52

  const { data, isLoading } = useQuery({
    queryKey: ["quiz-view", numericId],
    queryFn: () => fetchQuizViewDetail(numericId),
    enabled: Number.isFinite(numericId),
  });

  if (!Number.isFinite(numericId)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/30 to-slate-950 p-8 text-white">
        <p className="text-slate-400">Invalid quiz</p>
      </div>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/30 to-slate-950 flex items-center justify-center text-white">
        Loading quiz...
      </div>
    );
  }

  const response: QuizViewResponse = data;
  const quiz = response.quiz;
  const attempt = response.attempt;

  const isStudent = user?.role === "student";
  const attempted = isStudent && Boolean(quiz.has_attempted ?? attempt);
  const dueLabel = formatDate(quiz.due_date);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/30 to-slate-950 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto space-y-10">
        {/* Header */}
        <div>
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-slate-400 hover:text-yellow-400 transition-colors mb-4"
          >
            ← Back
          </button>
          <h1 className="text-4xl font-black bg-gradient-to-r from-red-400 via-yellow-400 to-orange-400 bg-clip-text text-transparent">
            {quiz.title}
          </h1>
          {quiz.description && (
            <p className="text-slate-300 mt-4 text-lg max-w-2xl">{quiz.description}</p>
          )}
        </div>

        {/* Quiz Info Card */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 shadow-2xl shadow-black/50">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div>
              <p className="text-xs uppercase tracking-widest text-slate-400">Duration</p>
              <p className="text-2xl font-semibold text-white mt-1">
                {quiz.duration_minutes} minutes
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-slate-400">Questions</p>
              <p className="text-2xl font-semibold text-white mt-1">
                {quiz.question_count ?? "—"}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-slate-400">Due Date</p>
              <p className="text-2xl font-semibold text-white mt-1">
                {dueLabel || "No due date"}
              </p>
            </div>
          </div>
        </div>

        {/* Status Card */}
        {attempted ? (
          <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-3xl p-10 text-center shadow-xl">
            <div className="w-16 h-16 mx-auto mb-6 bg-emerald-500/20 rounded-2xl flex items-center justify-center">
              <span className="text-4xl">✅</span>
            </div>
            <h2 className="text-3xl font-bold text-emerald-400 mb-2">Quiz Completed</h2>
            <div className="text-5xl font-black text-white mt-4">
              {attempt && quiz.show_scores_after_quiz !== false
                ? `${attempt.effective_score ?? attempt.score} / ${attempt.total}`
                : "Score hidden by instructor"}
            </div>
            <p className="text-emerald-300 mt-2">Well done!</p>
          </div>
        ) : (
          <div className="bg-slate-900/80 border border-slate-700/50 rounded-3xl p-10 text-center shadow-2xl">
            <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-red-500/20 to-yellow-500/20 rounded-2xl flex items-center justify-center">
              <span className="text-4xl">📝</span>
            </div>
            <h2 className="text-3xl font-bold text-white mb-3">Ready to Take the Quiz?</h2>
            <p className="text-slate-400 max-w-md mx-auto">
              Make sure you have enough time. The timer will start when you begin.
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            className="rounded-2xl border-slate-600 hover:bg-slate-800 px-8 py-6 text-lg"
          >
            Back
          </Button>

<<<<<<< HEAD
          {isStudent && (
            attempted ? (
              viewAttempt ? (
                <Button
                  onClick={() => navigate(`/quiz/${quiz.id}?viewAttempt=true`)}
                  className="bg-gradient-to-r from-yellow-400 to-amber-500 text-black font-bold rounded-2xl px-12 py-6 shadow-xl text-lg"
                >
                  View Attempt
                </Button>
              ) : (
                <Button
                  onClick={() => navigate(`/quiz/${quiz.id}?viewAttempt=true`)}
                  className="bg-gradient-to-r from-yellow-400 to-amber-500 text-black font-bold rounded-2xl px-12 py-6 shadow-xl text-lg"
                >
                  View Attempt
                </Button>
              )
            ) : (
              <Button
                onClick={() => navigate(`/quiz/${quiz.id}`)}
                className="bg-gradient-to-r from-red-500 via-yellow-500 to-orange-500 text-white font-bold rounded-2xl px-12 py-6 shadow-xl hover:brightness-110 text-lg"
              >
                Start Quiz Now
              </Button>
            )
=======
          {isStudent && !attempted && (
            <Button
              onClick={() => navigate(`/quiz/${quiz.id}`)}
              className="bg-gradient-to-r from-red-500 via-yellow-500 to-orange-500 text-white font-bold rounded-2xl px-12 py-6 shadow-xl hover:brightness-110 text-lg"
            >
              Start Quiz Now
            </Button>
>>>>>>> 7bc9cec5c481f7ef859c04d0e7edd54e453aed52
          )}
        </div>
      </div>
    </div>
  );
}