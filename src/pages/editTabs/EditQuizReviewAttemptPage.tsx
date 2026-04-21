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
import { Textarea } from "@/components/ui/textarea";

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

  const { data: quiz, isLoading: quizLoading } = useQuery({
    queryKey: ["quiz", qid],
    queryFn: () => fetchQuizDetail(qid),
    enabled: Number.isInteger(qid),
  });

  const { data: attempt, isLoading: attemptLoading } = useQuery({
    queryKey: ["quiz-attempt", qid, aid],
    queryFn: () => fetchQuizAttemptDetail(qid, aid),
    enabled: Number.isInteger(qid) && Number.isInteger(aid),
  });

  const [answersDraft, setAnswersDraft] = useState<Record<string, number | string>>({});
  const [overrideDraft, setOverrideDraft] = useState<string>("");

  const hydrated = useMemo(() => {
    if (!attempt) return false;
    return Object.keys(answersDraft).length > 0 || overrideDraft.length > 0;
  }, [attempt, answersDraft, overrideDraft]);

  useEffect(() => {
    if (!attempt || hydrated) return;
    setAnswersDraft((attempt.answers as Record<string, number | string>) ?? {});
    setOverrideDraft(
      attempt.score_override === null || attempt.score_override === undefined
        ? ""
        : String(attempt.score_override)
    );
  }, [attempt, hydrated]);

  const saveMutation = useMutation({
    mutationFn: (payload: { answers: Record<string, number | string>; score_override: number | null }) =>
      updateQuizAttempt(qid, aid, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quiz-attempt", qid, aid] });
      queryClient.invalidateQueries({ queryKey: ["quiz-attempts", qid] });
    },
    onError: () => {
      alert("Failed to save changes. Please try again.");
    },
  });

  if (!Number.isInteger(cid) || !Number.isInteger(qid) || !Number.isInteger(aid)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/30 to-slate-950 p-8 text-white">
        <p className="text-slate-400">Invalid submission.</p>
      </div>
    );
  }

  if (quizLoading || attemptLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/30 to-slate-950 p-8 text-white">
        <p className="text-slate-400">Loading review...</p>
      </div>
    );
  }

  if (!quiz || !attempt) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/30 to-slate-950 p-8 text-white">
        <p className="text-slate-400">Quiz or submission not found.</p>
      </div>
    );
  }

  const overrideValue =
    overrideDraft.trim() === "" ? null : Math.max(0, parseInt(overrideDraft, 10) || 0);
  const effectiveScore = overrideValue !== null ? overrideValue : (attempt.effective_score ?? attempt.score);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/30 to-slate-950 p-4 sm:p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Back Button */}
        <Link
          to={`/courses/${cid}/quizzes/${qid}/edit/submissions`}
          className="inline-flex items-center gap-2 text-slate-400 hover:text-yellow-400 transition-colors"
        >
          ← Back to Submissions
        </Link>

        {/* Header Card */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 shadow-2xl shadow-black/50">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold text-white">Review Submission</h1>
              <p className="text-slate-300 mt-2">
                {attempt.student_name} • {attempt.username}
              </p>
            </div>

            <div className="text-right">
              <p className="text-sm text-slate-400">Current Score</p>
              <p className="text-4xl font-black bg-gradient-to-r from-red-400 via-yellow-400 to-orange-400 bg-clip-text text-transparent">
                {effectiveScore} / {attempt.total}
              </p>
            </div>
          </div>

          {/* Score Override */}
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <div>
              <Label className="text-slate-200">Override Score (optional)</Label>
              <Input
                type="number"
                min={0}
                value={overrideDraft}
                onChange={(e) => setOverrideDraft(e.target.value)}
                placeholder="Leave blank to use automatic score"
                className="bg-slate-800 border-slate-600 h-12 rounded-2xl focus:border-yellow-400 mt-2"
                disabled={saveMutation.isPending}
              />
              <p className="mt-2 text-xs text-slate-400">
                Leave empty to use the recalculated score from answers.
              </p>
            </div>

            <div className="flex items-end gap-3">
              <Button
                onClick={() =>
                  saveMutation.mutate({
                    answers: answersDraft,
                    score_override: overrideValue,
                  })
                }
                disabled={saveMutation.isPending}
                className="bg-gradient-to-r from-red-500 via-yellow-500 to-orange-500 text-white font-bold rounded-2xl px-8 py-6 shadow-lg hover:brightness-110"
              >
                {saveMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>

              <Button
                variant="outline"
                onClick={() => {
                  setAnswersDraft((attempt.answers as Record<string, number | string>) ?? {});
                  setOverrideDraft(
                    attempt.score_override === null || attempt.score_override === undefined
                      ? ""
                      : String(attempt.score_override)
                  );
                }}
                disabled={saveMutation.isPending}
                className="rounded-2xl border-slate-600 hover:bg-slate-800"
              >
                Reset
              </Button>
            </div>
          </div>
        </div>

        {/* Answers Section */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 shadow-2xl shadow-black/50">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-white">Student Answers</h2>
            <p className="text-slate-400 mt-1">
              You can change answers below. Score will be recalculated on save unless overridden.
            </p>
          </div>

          <div className="space-y-8 max-h-[65vh] overflow-auto pr-2">
            {quiz.questions.map((q, idx) => {
              const selected = answersDraft[String(q.id)];

              return (
                <div key={q.id} className="border border-slate-700 rounded-2xl p-6 bg-slate-950/30">
                  <p className="font-medium text-white text-lg mb-4">
                    Q{idx + 1}. {q.text}
                  </p>

                  {(q.question_type === "mcq" || q.question_type === "tf") && (
                    <div className="space-y-3">
                      {q.choices.map((c) => (
                        <label
                          key={c.id}
                          className="flex items-center gap-3 bg-slate-900 border border-slate-700 hover:border-yellow-400/30 rounded-2xl p-4 cursor-pointer transition-all"
                        >
                          <input
                            type="radio"
                            name={`q-${q.id}`}
                            checked={selected === c.id}
                            onChange={() =>
                              setAnswersDraft((prev) => ({ ...prev, [String(q.id)]: c.id }))
                            }
                            disabled={saveMutation.isPending}
                            className="accent-yellow-400 w-5 h-5"
                          />
                          <span className="text-slate-200">{c.text}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {(q.question_type === "identification" || q.question_type === "enumeration") && (
                    <div className="space-y-4">
                      <div>
                        <Label className="text-slate-300">Student's Answer</Label>
                        <Textarea
                          value={typeof selected === "string" ? selected : ""}
                          onChange={(e) =>
                            setAnswersDraft((prev) => ({ ...prev, [String(q.id)]: e.target.value }))
                          }
                          disabled={saveMutation.isPending}
                          placeholder="Student's text answer"
                          rows={q.question_type === "enumeration" ? 4 : 2}
                          className="mt-2 bg-slate-800 border-slate-600 rounded-2xl focus:border-yellow-400"
                        />
                      </div>

                      <div>
                        <Label className="text-slate-300">Correct Answer{ q.question_type === "enumeration" ? "s" : "" }</Label>
                        <div className="mt-2 bg-slate-950 border border-slate-700 rounded-2xl p-4 text-slate-300">
                          {(q as any).correct_text || "No correct answer set"}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}