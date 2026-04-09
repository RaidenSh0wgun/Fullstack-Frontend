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
  const base = typeof value === "string"
    ? value.split("\n")
    : [];
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
  const questions: Question[] =
    quiz?.questions?.length ? quiz.questions : (fallbackQuestions ?? []);

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
    onError: (error) => {
      console.error("Quiz submission failed:", error);
    },
  });

  useEffect(() => {
    if (!showAttempt || !attempts?.length) return;
    const attempt = attempts[0];
    console.log("Raw attempt data:", attempt);
    setSubmittedScore(attempt.score ?? null);

    const normalized: Record<number, number | string> = {};
    try {
      const answersObj = attempt.answers;
      console.log("Raw answers:", answersObj, typeof answersObj);
      
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
    console.log("Loaded attempt answers:", normalized);
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

  const handleTextAtIndex = (qid: number, idx: number, text: string, expectedCount: number) => {
    if (showAttempt) return;
    setAnswers((prev) => {
      const current = parseSubmittedTextAnswers(prev[qid], expectedCount);
      const next = current.map((v, i) => (i === idx ? text : v));
      return { ...prev, [qid]: next.join("\n") };
    });
  };

  if (!Number.isFinite(numericId)) return <div>Invalid quiz</div>;

  const isTimeUp = (timeLeft ?? 0) <= 0;
  const canEdit = !isTimeUp && submittedScore === null && !showAttempt;
  const hasSubmitted = submitMutation.isSuccess || submittedScore !== null || clientScore !== null;
  const finalScore = submittedScore ?? clientScore;

  // Compute per-question correctness for view mode
  const questionCorrectness = useMemo(() => {
    if (!showAttempt || !questions.length) return {};
    const map: Record<number, boolean | null> = {};
    try {
      questions.forEach((q) => {
        try {
          const qType = (q as any)?.question_type as string;
          const answer = answers[q.id];
          map[q.id] = isQuestionCorrect(q, answer, qType);
        } catch {
          map[q.id] = null;
        }
      });
    } catch {
      console.error("Error computing question correctness");
    }
    return map;
  }, [showAttempt, questions, answers]);

  if (isLoading || !quiz || (showAttempt && attemptsLoading)) {
    return <div className="flex min-h-[50vh] items-center justify-center">Loading quiz...</div>;
  }

  return (
    <div className="space-y-6 p-4 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        {quiz?.course && (
          <button
            onClick={() => navigate(`/courses/${quiz.course}`)}
            className="text-sm text-muted-foreground hover:text-foreground transition"
          >
            ← Back to course
          </button>
        )}
      </div>
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
          {Object.keys(answers).length} / {questions.length} answered
        </div>
      )}

      {showAttempt && finalScore !== null && (
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">Quiz Results</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {questions.length} question{questions.length !== 1 ? "s" : ""} total
              </p>
            </div>
            <div className="text-right">
              <div className={`text-4xl font-bold ${
                finalScore >= (questions.length * 0.7) ? "text-green-600" : "text-red-600"
              }`}>
                {finalScore} / {questions.length}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {Math.round((finalScore / questions.length) * 100)}%
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {questions.map((q, index) => {
          const answer = answers[q.id];
          const isAnswered = answer !== undefined && answer !== "";
          const qType = (q as any).question_type as string | undefined;
          const isTextBased = qType === "identification" || qType === "enumeration";
          const expectedAnswers = isTextBased ? parseExpectedTextAnswers(q) : [];
          const expectedCount = qType === "enumeration" ? Math.max(1, expectedAnswers.length) : 1;
          const isCorrect = questionCorrectness[q.id];
          const cardBg = showAttempt && isCorrect === true 
            ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800" 
            : showAttempt && isCorrect === false 
            ? "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800"
            : "bg-card";

          return (
            <div key={q.id} className={`border rounded-lg p-5 shadow-sm transition-colors ${cardBg}`}>
              <div className="flex items-start justify-between gap-2 mb-3">
                <p className="font-medium">
                  Question {index + 1}: {q.text}
                  {isTextBased && (
                    <span className="ml-2 text-xs text-muted-foreground capitalize">
                      ({qType})
                    </span>
                  )}
                </p>
                {showAttempt && isCorrect !== null && (
                  <span className={`shrink-0 text-xs font-medium px-2 py-1 rounded-full ${
                    isCorrect 
                      ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" 
                      : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                  }`}>
                    {isCorrect ? "✓ Correct" : "✗ Incorrect"}
                  </span>
                )}
              </div>

              {isTextBased ? (
                <div className="space-y-2">
                  {qType === "enumeration" && expectedCount >= 2 ? (
                    <div className="space-y-2">
                      {parseSubmittedTextAnswers(answer, expectedCount).map((value, idx) => (
                        <div key={idx}>
                          <Textarea
                            placeholder={canEdit ? `Answer ${idx + 1}` : `Answer ${idx + 1} (view mode)`}
                            value={value}
                            onChange={(e) => handleTextAtIndex(q.id, idx, e.target.value, expectedCount)}
                            disabled={!canEdit}
                            className={`min-h-[80px] ${!canEdit ? "bg-background cursor-not-allowed" : ""}`}
                          />
                          {showAttempt && expectedAnswers[idx] && (
                            <div className={`mt-1 px-3 py-2 rounded text-sm ${
                              isCorrect 
                                ? "text-green-700 dark:text-green-300" 
                                : "text-red-700 dark:text-red-300"
                            }`}>
                              {isCorrect ? "✓" : "Expected:"} {expectedAnswers[idx]}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div>
                      <Textarea
                        placeholder={canEdit ? "Type your answer here..." : "Answer (view mode)"}
                        value={typeof answer === "string" ? answer : ""}
                        onChange={(e) => handleText(q.id, e.target.value)}
                        disabled={!canEdit}
                        className={`min-h-[100px] ${!canEdit ? "bg-background cursor-not-allowed" : ""}`}
                      />
                      {showAttempt && !canEdit && expectedAnswers[0] && (
                        <div className={`mt-2 px-3 py-2 rounded text-sm ${
                          isCorrect 
                            ? "text-green-700 dark:text-green-300" 
                            : "text-red-700 dark:text-red-300"
                        }`}>
                          {isCorrect ? "✓ Correct!" : `Correct answer: ${expectedAnswers[0]}`}
                        </div>
                      )}
                    </div>
                  )}
                  {isAnswered && canEdit && (
                    <p className="text-xs text-green-600">Answer saved</p>
                  )}
                </div>
              ) : shouldRenderAsMultipleChoice(q) ? (
                <div className="space-y-2">
                  {(() => {
                    const showFeedback = showAttempt && !canEdit;
                    return (
                      <>
                        {(q as any).choices.map((ch: { id: number; text: string; is_correct?: boolean }) => {
                          const selected = answer === ch.id;
                          const isCorrectChoice = ch.is_correct;

                          let choiceStyle = "";
                          if (showFeedback) {
                            // Only highlight the student's chosen answer
                            if (selected) {
                              choiceStyle = isCorrectChoice
                                ? "border-green-400 bg-green-50 dark:bg-green-950/20"
                                : "border-red-400 bg-red-50 dark:bg-red-950/20";
                            }
                          } else if (selected) {
                            choiceStyle = "border-blue-500 bg-blue-50";
                          }

                          if (canEdit) {
                            return (
                              <button
                                key={ch.id}
                                type="button"
                                onClick={() => handleChoice(q.id, ch.id)}
                                className={`w-full text-left p-3 border rounded-md transition ${choiceStyle || "border-border"}`}
                              >
                                {ch.text}
                              </button>
                            );
                          }

                          return (
                            <div
                              key={ch.id}
                              className={`p-3 border rounded-md transition ${choiceStyle || "border-border"} ${
                                !selected ? "opacity-50" : ""
                              }`}
                            >
                              {ch.text}
                            </div>
                          );
                        })}
                        {showFeedback && (
                          <div className={`mt-2 px-3 py-2 rounded text-sm ${
                            isCorrect
                              ? "text-green-700 dark:text-green-300"
                              : "text-red-700 dark:text-red-300"
                          }`}>
                            {isCorrect ? "✓ Correct!" : (() => {
                              const correctChoice = (q as any).choices?.find((c: any) => c.is_correct);
                              return correctChoice ? `Correct answer: ${correctChoice.text}` : "";
                            })()}
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              ) : shouldRenderAsTextAnswer(q) ? (
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
            if (showAttempt && quiz?.course) {
              navigate(`/courses/${quiz.course}`);
            } else {
              navigate("/");
            }
          }}
        >
          {showAttempt ? "Back to course" : "Back to dashboard"}
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