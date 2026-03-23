import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchQuizAttemptDetail,
  fetchQuizDetail,
  updateQuizAttempt,
} from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function EditQuizReviewAttemptPage() {
  const { courseId, quizId, attemptId } = useParams<{
    courseId: string;
    quizId: string;
    attemptId: string;
  }>();

  const cid = courseId ? parseInt(courseId, 10) : NaN;
  const qid = quizId ? parseInt(quizId, 10) : NaN;
  const aid = attemptId ? parseInt(attemptId, 10) : NaN;
  const queryClient = useQueryClient();

  const { data: quiz, isLoading: quizLoading, error: quizError } = useQuery({
    queryKey: ["quiz", qid],
    queryFn: () => fetchQuizDetail(qid),
    enabled: Number.isInteger(qid),
  });

  const { data: attempt, isLoading: attemptLoading, error: attemptError } = useQuery({
    queryKey: ["quiz-attempt", qid, aid],
    queryFn: () => fetchQuizAttemptDetail(qid, aid),
    enabled: Number.isInteger(qid) && Number.isInteger(aid),
  });

  const [answersDraft, setAnswersDraft] = useState<Record<string, number>>({});
  const [overrideDraft, setOverrideDraft] = useState<string>("");

  const hydrated = useMemo(() => {
    if (!attempt) return false;
    return Object.keys(answersDraft).length > 0 || overrideDraft.length > 0;
  }, [attempt, answersDraft, overrideDraft]);

  useEffect(() => {
    if (!attempt || hydrated) return;
    setAnswersDraft((attempt.answers as Record<string, number>) ?? {});
    setOverrideDraft(
      attempt.score_override === null || attempt.score_override === undefined
        ? ""
        : String(attempt.score_override)
    );
  }, [attempt, hydrated]);

  const saveMutation = useMutation({
    mutationFn: (payload: { answers: Record<string, number>; score_override: number | null }) =>
      updateQuizAttempt(qid, aid, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quiz-attempt", qid, aid] });
      queryClient.invalidateQueries({ queryKey: ["quiz-attempts", qid] });
    },
  });

  if (!Number.isInteger(cid) || !Number.isInteger(qid) || !Number.isInteger(aid)) {
    return <p className="text-sm text-muted-foreground">Invalid submission.</p>;
  }

  if (quizError || attemptError) {
    console.error("Quiz error:", quizError);
    console.error("Attempt error:", attemptError);
    return <p className="text-sm text-muted-foreground">Failed to load review. Check console for details.</p>;
  }

  if (quizLoading || attemptLoading) {
    return <p className="text-sm text-muted-foreground">Loading review...</p>;
  }

  if (!quiz || !attempt) {
    return <p className="text-sm text-muted-foreground">Quiz or submission not found.</p>;
  }

  const effectiveScore = attempt.effective_score ?? attempt.score;
  const overrideValue =
    overrideDraft.trim() === "" ? null : Math.max(0, parseInt(overrideDraft, 10) || 0);

  return (
    <div className="space-y-4">
      <div>
        <Link
          to={`/courses/${cid}/quizzes/${qid}/edit/submissions`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to submissions
        </Link>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Review submission</h2>
            <p className="text-sm text-muted-foreground">
              {attempt.student_name} ({attempt.username})
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Score</p>
            <p className="text-lg font-semibold">
              {effectiveScore} / {attempt.total}
            </p>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <Label>Override score (optional)</Label>
            <Input
              type="number"
              min={0}
              value={overrideDraft}
              onChange={(e) => setOverrideDraft(e.target.value)}
              placeholder="Leave blank for automatic score"
              disabled={saveMutation.isPending}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Leave empty to use the recalculated score from answers.
            </p>
          </div>
          <div className="flex items-end gap-2">
            <Button
              onClick={() =>
                saveMutation.mutate({
                  answers: answersDraft,
                  score_override: overrideValue,
                })
              }
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending ? "Saving..." : "Save changes"}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setAnswersDraft((attempt.answers as Record<string, number>) ?? {});
                setOverrideDraft(
                  attempt.score_override === null || attempt.score_override === undefined
                    ? ""
                    : String(attempt.score_override)
                );
              }}
              disabled={saveMutation.isPending}
            >
              Reset
            </Button>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card">
        <div className="p-4 border-b border-border">
          <h3 className="font-semibold">Answers</h3>
          <p className="text-xs text-muted-foreground">
            Changing an answer will recalculate the score on save (unless you set an override).
          </p>
        </div>
        <div className="max-h-[65vh] overflow-auto divide-y divide-border">
          {quiz.questions.map((q, idx) => {
            const selected = answersDraft[String(q.id)];
            return (
              <div key={q.id} className="p-4 space-y-2">
                <p className="text-sm font-medium">
                  Q{idx + 1}. {q.text}
                </p>

                {q.question_type === "mcq" || q.question_type === "tf" ? (
                  <div className="space-y-2">
                    {q.choices.map((c) => (
                      <label
                        key={c.id}
                        className="flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm"
                      >
                        <input
                          type="radio"
                          name={`q-${q.id}`}
                          checked={selected === c.id}
                          onChange={() =>
                            setAnswersDraft((prev) => ({ ...prev, [String(q.id)]: c.id }))
                          }
                          disabled={saveMutation.isPending}
                        />
                        <span>{c.text}</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Identification review UI isn’t wired yet (your student quiz page currently submits only choice IDs).
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

