import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  fetchQuizDetail,
  fetchQuizAttempts,
  fetchQuizTimer,
  submitQuizAnswers,
  type Question,
} from "@/services/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

function timerStorageKey(quizId: number) {
  return `quiz_timer_remaining_${quizId}`;
}

function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

function shouldRenderAsIdentification(q: Question): boolean {
  const raw = q as any;
  const hasChoices = Array.isArray(raw.choices) && raw.choices.length > 0;
  return !hasChoices;
}

function shouldRenderAsMultipleChoice(q: Question): boolean {
  const raw = q as any;
  return Array.isArray(raw.choices) && raw.choices.length > 0;
}

export default function QuizPage() {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();

  const numericId = Number(quizId);
  const [searchParams] = useSearchParams();
  const viewAttempt = searchParams.get("viewAttempt") === "true";

  const { data: quiz, isLoading } = useQuery({
    queryKey: ["quiz-detail", numericId],
    queryFn: () => fetchQuizDetail(numericId),
    enabled: Number.isFinite(numericId),
  });

  const showAttempt = viewAttempt || (quiz?.has_attempted ?? false);

  const { data: attempts, isLoading: attemptsLoading } = useQuery({
    queryKey: ["quiz-attempts", numericId],
    queryFn: () => fetchQuizAttempts(numericId),
    enabled: Number.isFinite(numericId) && showAttempt,
  });

  const [answers, setAnswers] = useState<Record<number, number | string>>({});
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [submittedScore, setSubmittedScore] = useState<number | null>(null);
  const [clientScore, setClientScore] = useState<number | null>(null);

  const submitMutation = useMutation({
    mutationFn: () => {
      return submitQuizAnswers(numericId, answers);
    },
    onSuccess: (data) => {
      console.log("Submit response from backend:", data);
      const serverScore = typeof data?.score === "number" ? data.score : null;
      setSubmittedScore(serverScore);

      
      if (serverScore === null && quiz) {
        let correct = 0;
        quiz.questions.forEach((q) => {
          const userAns = answers[q.id];
          if (shouldRenderAsIdentification(q) && typeof userAns === "string") {
            const correctAns = (q as any).correct_text || "";
            if (userAns.trim().toLowerCase() === correctAns.toString().trim().toLowerCase()) {
              correct++;
            }
          }
        });
        setClientScore(correct);
      }

      navigate(`/quizview/${numericId}`, { replace: true });
    },
    onError: (error) => {
      console.error("Quiz submission failed:", error);
    },
  });

  useEffect(() => {
    if (!showAttempt || !attempts?.length) return;
    const attempt = attempts[0];
    setSubmittedScore(attempt.score ?? null);

    const normalized: Record<number, number | string> = {};
    Object.entries(attempt.answers ?? {}).forEach(([k, v]) => {
      const id = Number(k);
      if (!Number.isNaN(id)) {
        normalized[id] = typeof v === "number" || typeof v === "string" ? v : "";
      }
    });
    setAnswers(normalized);
  }, [showAttempt, attempts]);

  const durationSeconds = useMemo(
    () => (quiz?.duration_minutes ? quiz.duration_minutes * 60 : null),
    [quiz]
  );

  const { data: timerData, isLoading: timerLoading } = useQuery({
    queryKey: ["quiz-timer", numericId],
    queryFn: () => fetchQuizTimer(numericId),
    enabled: Number.isFinite(numericId) && !showAttempt && !isLoading,
  });

  useEffect(() => {
    if (showAttempt) return;
    if (timeLeft !== null) return;
    if (!Number.isFinite(numericId)) return;

    const raw = localStorage.getItem(timerStorageKey(numericId));
    const fromStorage = raw ? Number(raw) : NaN;
    if (Number.isFinite(fromStorage)) {
      setTimeLeft(Math.max(0, Math.floor(fromStorage)));
      return;
    }

    if (durationSeconds !== null) {
      setTimeLeft(durationSeconds);
    }
  }, [showAttempt, timeLeft, numericId, durationSeconds]);

  useEffect(() => {
    if (showAttempt) return;
    if (timerLoading) return;
    if (timerData) {
      setTimeLeft(timerData.remaining_seconds);
      return;
    }
  }, [showAttempt, timerLoading, timerData]);

  useEffect(() => {
    if (showAttempt || timeLeft === null || timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => (prev !== null && prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [showAttempt, timeLeft]);

  useEffect(() => {
    if (showAttempt) return;
    if (!Number.isFinite(numericId)) return;
    if (timeLeft === null) return;
    localStorage.setItem(timerStorageKey(numericId), String(timeLeft));
  }, [showAttempt, numericId, timeLeft]);

  useEffect(() => {
    if (showAttempt || timeLeft === null || timeLeft > 0) return;
    if (!submitMutation.isPending && submittedScore === null) {
      submitMutation.mutate();
    }
  }, [timeLeft, showAttempt, submitMutation, submittedScore]);

  const handleChoice = (qid: number, cid: number) => {
    if (showAttempt) return;
    setAnswers((prev) => ({ ...prev, [qid]: cid }));
  };

  const handleText = (qid: number, text: string) => {
    if (showAttempt) return;
    setAnswers((prev) => ({ ...prev, [qid]: text })); 
  };

  if (!Number.isFinite(numericId)) return <div>Invalid quiz</div>;

  if (isLoading || !quiz || (showAttempt && attemptsLoading)) {
    return <div className="flex min-h-[50vh] items-center justify-center">Loading quiz...</div>;
  }

  const isTimeUp = (timeLeft ?? 0) <= 0;
  const canEdit = !isTimeUp && submittedScore === null && !showAttempt;
  const hasSubmitted = submitMutation.isSuccess || submittedScore !== null || clientScore !== null;

  const finalScore = submittedScore ?? clientScore;

  return (
    <div className="space-y-6 p-4 max-w-4xl mx-auto">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">{quiz.title}</h1>
          {quiz.description && <p className="text-muted-foreground">{quiz.description}</p>}
        </div>

        {!showAttempt && timeLeft !== null && (
          <div className="border rounded-lg px-4 py-2 text-center bg-card">
            <div className="text-xs text-muted-foreground">Time remaining</div>
            <div className={`text-xl font-bold ${isTimeUp ? "text-red-600" : ""}`}>
              {formatTime(Math.max(timeLeft, 0))}
            </div>
          </div>
        )}
      </div>

      {!showAttempt && (
        <div className="text-sm text-muted-foreground">
          {Object.keys(answers).length} / {quiz.questions.length} answered
        </div>
      )}

      <div className="space-y-6">
        {quiz.questions.map((q, index) => {
          const answer = answers[q.id];
          const isAnswered = answer !== undefined && answer !== "";

          return (
            <div key={q.id} className="border rounded-lg p-5 bg-card shadow-sm">
              <p className="font-medium mb-3">
                Question {index + 1}: {q.text}
              </p>

              {shouldRenderAsMultipleChoice(q) ? (
                <div className="space-y-2">
                  {(q as any).choices.map((ch: { id: number; text: string }) => {
                    const selected = answer === ch.id;
                    return (
                      <button
                        key={ch.id}
                        type="button"
                        disabled={!canEdit}
                        onClick={() => handleChoice(q.id, ch.id)}
                        className={`
                          w-full text-left p-3 border rounded-md transition
                          ${selected ? "border-blue-500 bg-blue-50" : "hover:bg-gray-50"}
                          ${!canEdit ? "opacity-60 cursor-not-allowed" : ""}
                        `}
                      >
                        {ch.text}
                      </button>
                    );
                  })}
                </div>
              ) : shouldRenderAsIdentification(q) ? (
                <div className="space-y-2">
                  <Textarea
                    placeholder={canEdit ? "Type your answer here..." : "Answer (view mode)"}
                    value={typeof answer === "string" ? answer : ""}
                    onChange={(e) => handleText(q.id, e.target.value)}
                    disabled={!canEdit}
                    className={`min-h-[100px] ${!canEdit ? "bg-gray-100 cursor-not-allowed" : ""}`}
                  />
                  {isAnswered && canEdit && (
                    <p className="text-xs text-green-600">Answer saved</p>
                  )}
                  {!canEdit && typeof answer === "string" && answer.trim() && (
                    <div className="p-3 bg-gray-100 rounded border text-sm">
                      Your answer: <strong>{answer}</strong>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-amber-700 bg-amber-50 p-3 rounded">
                  Unsupported question format
                </p>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex justify-between pt-4">
        <Button
          variant="outline"
          onClick={() => {
            if (!showAttempt && timeLeft !== null && timeLeft > 0) {
              const ok = window.confirm(
                "Are you sure you want to leave the quiz? The timer will keep counting down."
              );
              if (!ok) return;
            }
            navigate("/");
          }}
        >
          Back to dashboard
        </Button>

        {canEdit && (
          <Button
            onClick={() => submitMutation.mutate()}
            disabled={submitMutation.isPending}
          >
            {submitMutation.isPending ? "Submitting..." : "Submit Quiz"}
          </Button>
        )}
      </div>

      {hasSubmitted && (
        <div className="mt-8 rounded-lg border bg-green-50 p-6 text-center shadow-sm">
          <h2 className="text-xl font-semibold text-green-800 mb-3">
            Quiz Submitted Successfully!
          </h2>

          {finalScore !== null ? (
            <div className="text-3xl font-bold text-green-700">
              Your Score: {finalScore}
              {quiz && ` / ${quiz.questions.length}`}
            </div>
          ) : (
            <div className="text-gray-700">
              <p>Submission received.</p>
              <p className="text-sm mt-2">Score is being calculated...</p>
            </div>
          )}
        </div>
      )}

      {showAttempt && !hasSubmitted && (
        <div className="mt-8 rounded-lg border bg-card p-6 text-center">
          <p className="text-lg font-medium">You have already completed this quiz.</p>
          {submittedScore !== null && (
            <p className="mt-3 text-xl">
              Score: <span className="font-bold">{submittedScore}</span>
            </p>
          )}
        </div>
      )}
    </div>
  );
}