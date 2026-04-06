import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { fetchQuizViewDetail, type QuizViewResponse } from "@/services/api";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";

function formatDate(dueDate: string | null | undefined): string | null {
  if (!dueDate) return null;
  const dt = new Date(dueDate);
  if (Number.isNaN(dt.getTime())) return null;
  return dt.toLocaleString();
}

export default function ViewQuizPage() {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const numericId = useMemo(() => Number(quizId), [quizId]);

  const { data, isLoading } = useQuery({
    queryKey: ["quiz-view", numericId],
    queryFn: () => fetchQuizViewDetail(numericId),
    enabled: Number.isFinite(numericId),
  });

  if (!Number.isFinite(numericId)) return <div>Invalid quiz</div>;
  if (isLoading || !data) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
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
    <div className="space-y-6 p-4 max-w-4xl mx-auto">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">{quiz.title}</h1>
          {quiz.description && (
            <p className="text-muted-foreground">{quiz.description}</p>
          )}
          <div className="text-sm text-muted-foreground mt-2">
            {quiz.duration_minutes} min
            {dueLabel ? ` • Due ${dueLabel}` : ""}
            {typeof quiz.question_count === "number"
              ? ` • ${quiz.question_count} questions`
              : ""}
          </div>
        </div>
      </div>

      {attempted ? (
        <div className="mt-4 rounded-lg border bg-green-50 p-6 text-center shadow-sm">
          <h2 className="text-xl font-semibold text-green-800 mb-3">
            View score
          </h2>
          <div className="text-3xl font-bold text-green-700">
            {attempt
              ? `${attempt.effective_score ?? attempt.score} / ${attempt.total}`
              : "Score unavailable"}
          </div>
        </div>
      ) : (
        <div className="mt-4 rounded-lg border bg-card p-6 text-center shadow-sm">
          <h2 className="text-xl font-semibold mb-3">Ready to start</h2>
          <p className="text-muted-foreground">
            Review the quiz details below, then take the quiz when you're ready.
          </p>
        </div>
      )}

      <div className="flex justify-between pt-4 gap-3">
        <Button variant="outline" onClick={() => navigate("/")}>
          Back to dashboard
        </Button>

        {isStudent && !attempted && (
          <Button onClick={() => navigate(`/quiz/${quiz.id}`)}>
            Take quiz
          </Button>
        )}
      </div>
    </div>
  );
}

