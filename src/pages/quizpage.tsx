import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  fetchQuizDetail,
  submitQuizAnswers,
  type Question,
} from "@/services/api";
import { Button } from "@/components/ui/button";

function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs
    .toString()
    .padStart(2, "0")}`;
}

export default function QuizPage() {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();

  const numericId = Number(quizId);

  const { data: quiz, isLoading } = useQuery({
    queryKey: ["quiz-detail", numericId],
    queryFn: () => fetchQuizDetail(numericId),
    enabled: Number.isFinite(numericId),
  });

  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [submittedScore, setSubmittedScore] = useState<number | null>(null);

  const submitMutation = useMutation({
    mutationFn: () => submitQuizAnswers(numericId, answers),
    onSuccess: (data) => {
      setSubmittedScore(data.score);
    },
  });

  const durationSeconds = useMemo(
    () => (quiz ? quiz.duration_minutes * 60 : null),
    [quiz]
  );

  useEffect(() => {
    if (!durationSeconds) return;
    setTimeLeft(durationSeconds);
  }, [durationSeconds]);

  useEffect(() => {
    if (timeLeft === null) return;
    if (timeLeft <= 0 && !submitMutation.isPending && submittedScore === null) {
      submitMutation.mutate();
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft((prev) => (prev === null ? prev : prev - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLeft, submitMutation, submittedScore]);

  const handleSelectChoice = (questionId: number, choiceId: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: choiceId }));
  };

  const handleSubmit = () => {
    if (!submitMutation.isPending) {
      submitMutation.mutate();
    }
  };

  if (!Number.isFinite(numericId)) {
    return (
      <div>
        <p>Invalid quiz.</p>
      </div>
    );
  }

  if (isLoading || !quiz || timeLeft === null) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-lg font-medium">Loading quiz...</p>
      </div>
    );
  }

  const isTimeUp = timeLeft <= 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{quiz.title}</h1>
          {quiz.description && (
            <p className="text-sm text-muted-foreground">
              {quiz.description}
            </p>
          )}
        </div>
        <div className="rounded-lg border border-border bg-card px-4 py-2 text-center">
          <p className="text-xs font-medium text-muted-foreground">Time left</p>
          <p
            className={`text-xl font-semibold ${
              isTimeUp ? "text-destructive" : ""
            }`}
          >
            {formatTime(Math.max(timeLeft, 0))}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {quiz.questions.map((q: Question, index: number) => (
          <div
            key={q.id}
            className="rounded-xl border border-border bg-card p-4 text-left"
          >
            <p className="mb-3 text-sm font-medium">
              Q{index + 1}. {q.text}
            </p>
            <div className="space-y-2">
              {q.choices.map((choice) => {
                const selected = answers[q.id] === choice.id;
                return (
                  <button
                    key={choice.id}
                    type="button"
                    disabled={isTimeUp || submittedScore !== null}
                    onClick={() => handleSelectChoice(q.id, choice.id)}
                    className={`block w-full rounded-md border px-3 py-2 text-left text-sm transition ${
                      selected
                        ? "border-primary bg-primary/10"
                        : "border-input hover:bg-muted"
                    } disabled:cursor-not-allowed disabled:opacity-60`}
                  >
                    {choice.text}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between gap-3">
        <Button
          variant="outline"
          type="button"
          onClick={() => navigate("/")}
          disabled={submitMutation.isPending}
        >
          Back to dashboard
        </Button>
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={isTimeUp || submitMutation.isPending || submittedScore !== null}
        >
          {submitMutation.isPending ? "Submitting..." : "Submit quiz"}
        </Button>
      </div>

      {submittedScore !== null && (
        <div className="mt-4 rounded-lg border border-border bg-card p-4 text-center">
          <p className="text-sm font-medium">
            Your score: <span className="font-semibold">{submittedScore}</span>
          </p>
        </div>
      )}
    </div>
  );
}

