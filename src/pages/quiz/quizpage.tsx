import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  fetchQuizDetail,
  fetchQuizQuestions,
  fetchQuizAttempts,
  fetchQuizTimer,
  submitQuizAnswers,
  type Question,
} from "@/services/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAntiCheating } from "@/hooks/use-anti-cheating";

function timerStorageKey(quizId: number) {
  return `quiz_timer_remaining_${quizId}`;
}

function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

function shouldRenderAsTextAnswer(q: Question): boolean {
  const raw = q as any;
  const hasChoices = Array.isArray(raw.choices) && raw.choices.length > 0;
  return !hasChoices;
}

function shouldRenderAsMultipleChoice(q: Question): boolean {
  const raw = q as any;
  const choices = Array.isArray(raw.choices) ? raw.choices : [];
  return choices.length >= 2;
}

function parseExpectedTextAnswers(q: Question): string[] {
  const raw = ((q as any).correct_text || "")
    .split("\n")
    .map((v: string) => v.trim())
    .filter(Boolean);
  return raw;
}

function parseSubmittedTextAnswers(value: number | string | undefined, count: number): string[] {
  const base = typeof value === "string" ? value.split("\n") : [];
  const normalized = Array.from({ length: Math.max(1, count) }, (_, idx) => (base[idx] || ""));
  return normalized;
}

function isQuestionCorrect(
  q: any,
  answer: number | string | undefined,
  qType: string
): boolean | null {
  if (answer === undefined || answer === "") return null;

  if (qType === "identification" || qType === "enumeration") {
    const correctText = (q?.correct_text || "").trim();
    if (!correctText) return null;
    
    if (qType === "enumeration") {
      const correctAnswers = correctText.split("\n").map((s: string) => s.trim().toLowerCase()).filter(Boolean);
      const submittedAnswers = typeof answer === "string" 
        ? answer.split("\n").map((s: string) => s.trim().toLowerCase()).filter(Boolean)
        : [];
      if (correctAnswers.length === 0) return null;
      const matchCount = submittedAnswers.filter((a: string) => correctAnswers.includes(a)).length;
      return matchCount === correctAnswers.length;
    } else {
      return typeof answer === "string" && answer.trim().toLowerCase() === correctText.toLowerCase();
    }
  }

  if (qType === "mcq" || qType === "tf") {
    try {
      const choices = Array.isArray(q?.choices) ? q.choices : [];
      const selectedChoice = choices.find((c: any) => Number(c?.id) === Number(answer));
      return selectedChoice?.is_correct ?? null;
    } catch {
      return null;
    }
  }

  return null;
}

export default function QuizPage() {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();

  const numericId = Number(quizId);
  const [searchParams] = useSearchParams();
  const viewAttempt = searchParams.get("viewAttempt") === "true";

  const { data: quiz, isLoading } = useQuery({
    queryKey: ["quiz", numericId],
    queryFn: () => fetchQuizDetail(numericId),
    enabled: Number.isFinite(numericId),
  });

  const { data: fallbackQuestions } = useQuery({
    queryKey: ["quiz-questions", numericId],
    queryFn: () => fetchQuizQuestions(numericId),
    enabled: Number.isFinite(numericId),
  });

  const showAttempt = viewAttempt || (quiz?.has_attempted ?? false);
  const questions: Question[] = quiz?.questions?.length ? quiz.questions : (fallbackQuestions ?? []);

  const { data: attempts, isLoading: attemptsLoading } = useQuery({
    queryKey: ["quiz-attempts", numericId],
    queryFn: () => fetchQuizAttempts(numericId),
    enabled: Number.isFinite(numericId) && showAttempt,
  });

  const [answers, setAnswers] = useState<Record<number, number | string>>({});
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [submittedScore, setSubmittedScore] = useState<number | null>(null);
  const [clientScore, setClientScore] = useState<number | null>(null);
  const [hasAutoSubmitted, setHasAutoSubmitted] = useState(false);

  const submitMutation = useMutation({
    mutationFn: () => submitQuizAnswers(numericId, answers),
    onSuccess: (data) => {
      const serverScore = typeof data?.score === "number" ? data.score : null;
      setSubmittedScore(serverScore);

      if (serverScore === null && quiz) {
        let correct = 0;
        questions.forEach((q) => {
          const userAns = answers[q.id];
          if (shouldRenderAsTextAnswer(q) && typeof userAns === "string") {
            const correctAns = (q as any).correct_text || "";
            if (userAns.trim().toLowerCase() === correctAns.toString().trim().toLowerCase()) {
              correct++;
            }
          }
        });
        setClientScore(correct);
      }

      navigate(`/quiz/${numericId}?viewAttempt=true`, { replace: true });
    },
    onError: (error: unknown) => {
      setHasAutoSubmitted(false);
      const errorMessage =
        error instanceof Error && error.message
          ? error.message
          : "Failed to submit quiz. Please try again.";
      alert(errorMessage);
    },
  });

  useEffect(() => {
    if (!showAttempt || !attempts?.length) return;
    const attempt = attempts[0];
    setSubmittedScore(attempt.score ?? null);

    const normalized: Record<number, number | string> = {};
    try {
      const answersObj = attempt.answers;
      if (answersObj && typeof answersObj === "object") {
        Object.entries(answersObj).forEach(([k, v]) => {
          const id = Number(k);
          if (!Number.isNaN(id)) {
            normalized[id] = typeof v === "number" || typeof v === "string" ? v : "";
          }
        });
      }
    } catch (err) {
      console.error("Error parsing attempt answers:", err);
    }
    setAnswers(normalized);
  }, [showAttempt, attempts]);

  const durationSeconds = useMemo(
    () => (quiz?.duration_minutes ? quiz.duration_minutes * 60 : null),
    [quiz]
  );

  const { data: timerData } = useQuery({
    queryKey: ["quiz-timer", numericId],
    queryFn: () => fetchQuizTimer(numericId),
    enabled: Number.isFinite(numericId) && !showAttempt && !isLoading,
  });

  useEffect(() => {
    if (showAttempt) return;
    if (timeLeft !== null) return;

    const raw = localStorage.getItem(timerStorageKey(numericId));
    const fromStorage = raw ? Number(raw) : NaN;
    if (Number.isFinite(fromStorage)) {
      setTimeLeft(Math.max(0, Math.floor(fromStorage)));
      return;
    }

    if (durationSeconds !== null) {
      setTimeLeft(durationSeconds);
    }
  }, [showAttempt, numericId, durationSeconds]);

  useEffect(() => {
    if (showAttempt) return;
    if (timerData) {
      setTimeLeft(timerData.remaining_seconds);
    }
  }, [showAttempt, timerData]);

  useEffect(() => {
    if (showAttempt || timeLeft === null || timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => (prev !== null && prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [showAttempt, timeLeft]);

  useEffect(() => {
    if (showAttempt) return;
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

  const handleTextAtIndex = (qid: number, idx: number, text: string, expectedCount: number) => {
    if (showAttempt) return;
    setAnswers((prev) => {
      const current = parseSubmittedTextAnswers(prev[qid], expectedCount);
      const next = current.map((v, i) => (i === idx ? text : v));
      return { ...prev, [qid]: next.join("\n") };
    });
  };

  if (!Number.isFinite(numericId)) {
    return <div className="text-slate-400">Invalid quiz</div>;
  }

  const isTimeUp = (timeLeft ?? 0) <= 0;
  const canEdit = !isTimeUp && submittedScore === null && !showAttempt;
  const finalScore = submittedScore ?? clientScore;
  const isLeavingQuiz = showAttempt || submittedScore !== null || submitMutation.isPending;

  useAntiCheating({
    quizId: numericId,
    timeLeft,
    isLeaving: isLeavingQuiz,
    autoSubmitOnCheat: true,
    onAutoSubmit: () => {
      if (!canEdit || hasAutoSubmitted || submitMutation.isPending) return;
      setHasAutoSubmitted(true);
      submitMutation.mutate();
    },
  });

  const questionCorrectness = useMemo(() => {
    if (!showAttempt || !questions.length) return {};
    const map: Record<number, boolean | null> = {};
    questions.forEach((q) => {
      const qType = (q as any)?.question_type as string;
      const answer = answers[q.id];
      map[q.id] = isQuestionCorrect(q, answer, qType);
    });
    return map;
  }, [showAttempt, questions, answers]);

  if (isLoading || !quiz || (showAttempt && attemptsLoading)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/30 to-slate-950 flex items-center justify-center text-white">
        Loading quiz...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/30 to-slate-950 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto space-y-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <button
              onClick={() => quiz?.course && navigate(`/courses/${quiz.course}`)}
              className="inline-flex items-center gap-2 text-slate-400 hover:text-yellow-400 transition-colors mb-3"
            >
              ← Back to course
            </button>
            <h1 className="text-4xl font-black bg-gradient-to-r from-red-400 via-yellow-400 to-orange-400 bg-clip-text text-transparent">
              {quiz.title}
            </h1>
            {quiz.description && (
              <p className="text-slate-300 mt-2">{quiz.description}</p>
            )}
          </div>

          {!showAttempt && timeLeft !== null && (
            <div className="bg-slate-900/80 border border-slate-700 rounded-2xl px-8 py-4 text-center">
              <div className="text-xs text-slate-400">Time Remaining</div>
              <div className={`text-3xl font-bold tabular-nums ${isTimeUp ? "text-red-500" : "text-white"}`}>
                {formatTime(Math.max(timeLeft, 0))}
              </div>
            </div>
          )}
        </div>

        {/* Progress / Score */}
        {!showAttempt && (
          <div className="text-slate-400 text-sm">
            {Object.keys(answers).length} of {questions.length} questions answered
          </div>
        )}

        {showAttempt && finalScore !== null && (
          <div className="bg-slate-900/80 border border-slate-700 rounded-3xl p-8 shadow-2xl shadow-black/50">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div>
                <h2 className="text-2xl font-bold text-white">Your Results</h2>
                <p className="text-slate-400 mt-1">{questions.length} questions total</p>
              </div>
              <div className="text-right">
                <div className="text-6xl font-black bg-gradient-to-r from-red-400 via-yellow-400 to-orange-400 bg-clip-text text-transparent">
                  {finalScore}
                </div>
                <p className="text-slate-400">out of {questions.length}</p>
                <p className="text-xl font-medium text-white mt-1">
                  {Math.round((finalScore / questions.length) * 100)}%
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Questions */}
        <div className="space-y-8">
          {questions.map((q, index) => {
            const answer = answers[q.id];
            const qType = (q as any).question_type as string;
            const isTextBased = qType === "identification" || qType === "enumeration";
            const expectedAnswers = isTextBased ? parseExpectedTextAnswers(q) : [];
            const expectedCount = qType === "enumeration" ? Math.max(1, expectedAnswers.length) : 1;
            const isCorrect = questionCorrectness[q.id];

            return (
              <div
                key={q.id}
                className={`bg-slate-900/80 border rounded-3xl p-8 shadow-xl shadow-black/40 transition-all ${
                  showAttempt && isCorrect === true
                    ? "border-emerald-500/50 bg-emerald-950/30"
                    : showAttempt && isCorrect === false
                    ? "border-red-500/50 bg-red-950/30"
                    : "border-slate-700"
                }`}
              >
                <div className="flex items-start justify-between gap-4 mb-6">
                  <p className="font-semibold text-lg text-white">
                    Question {index + 1}: {q.text}
                  </p>
                  {showAttempt && isCorrect !== null && (
                    <div
                      className={`px-4 py-1 rounded-full text-sm font-medium ${
                        isCorrect
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-red-500/20 text-red-400"
                      }`}
                    >
                      {isCorrect ? "✓ Correct" : "✗ Incorrect"}
                    </div>
                  )}
                </div>

                {isTextBased ? (
                  <div className="space-y-4">
                    {qType === "enumeration" && expectedCount > 1 ? (
                      parseSubmittedTextAnswers(answer, expectedCount).map((value, idx) => (
                        <div key={idx}>
                          <Textarea
                            value={value}
                            onChange={(e) => handleTextAtIndex(q.id, idx, e.target.value, expectedCount)}
                            disabled={!canEdit}
                            placeholder={`Answer ${idx + 1}`}
                            className="min-h-[70px] bg-slate-800 border-slate-600 rounded-2xl focus:border-yellow-400"
                          />
                          {showAttempt && expectedAnswers[idx] && (
                            <p className={`mt-2 text-sm ${isCorrect ? "text-emerald-400" : "text-red-400"}`}>
                              Expected: {expectedAnswers[idx]}
                            </p>
                          )}
                        </div>
                      ))
                    ) : (
                      <Textarea
                        value={typeof answer === "string" ? answer : ""}
                        onChange={(e) => handleText(q.id, e.target.value)}
                        disabled={!canEdit}
                        placeholder="Type your answer here..."
                        className="min-h-[120px] bg-slate-800 border-slate-600 rounded-2xl focus:border-yellow-400"
                      />
                    )}
                  </div>
                ) : shouldRenderAsMultipleChoice(q) ? (
                  <div className="space-y-3">
                    {(q as any).choices.map((ch: any) => {
                      const selected = answer === ch.id;
                      const showFeedback = showAttempt && !canEdit;
                      let style = "border border-slate-700 bg-slate-900 hover:border-yellow-400/50";

                      if (showFeedback) {
                        if (selected) {
                          style = ch.is_correct
                            ? "border-emerald-500 bg-emerald-950/50"
                            : "border-red-500 bg-red-950/50";
                        }
                      } else if (selected) {
                        style = "border-yellow-400 bg-yellow-950/30";
                      }

                      return (
                        <button
                          key={ch.id}
                          type="button"
                          onClick={() => handleChoice(q.id, ch.id)}
                          disabled={!canEdit}
                          className={`w-full text-left p-5 rounded-2xl transition-all text-left ${style}`}
                        >
                          {ch.text}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-amber-400 bg-amber-950/30 p-4 rounded-2xl">Unsupported question type</p>
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between pt-6">
          <Button
            variant="outline"
            onClick={() => {
              if (!showAttempt && timeLeft !== null && timeLeft > 0) {
                if (!confirm("Leave the quiz? The timer will continue.")) return;
              }
              if (quiz?.course) {
                navigate(`/courses/${quiz.course}`);
              } else {
                navigate("/");
              }
            }}
            className="rounded-2xl border-slate-600"
          >
            {showAttempt ? "Back to Course" : "Leave Quiz"}
          </Button>

          {canEdit && (
            <Button
              onClick={() => submitMutation.mutate()}
              disabled={submitMutation.isPending}
              className="bg-gradient-to-r from-red-500 via-yellow-500 to-orange-500 text-white font-bold rounded-2xl px-12 py-6 shadow-xl hover:brightness-110"
            >
              {submitMutation.isPending ? "Submitting Quiz..." : "Submit Quiz"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}