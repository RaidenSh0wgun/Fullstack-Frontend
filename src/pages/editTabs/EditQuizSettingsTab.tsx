import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchQuizDetail, updateQuiz } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function toLocalInputValue(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => n.toString().padStart(2, "0");
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mi = pad(d.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

function fromLocalInputValue(value: string): string | null {
  if (!value.trim()) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

export default function EditQuizSettingsTab() {
  const { quizId } = useParams<{ quizId: string }>();
  const qid = quizId ? parseInt(quizId, 10) : NaN;
  const queryClient = useQueryClient();

  const { data: quiz, isLoading } = useQuery({
    queryKey: ["quiz", qid],
    queryFn: () => fetchQuizDetail(qid),
    enabled: Number.isInteger(qid),
  });

  const [isActive, setIsActive] = useState(true);
  const [duration, setDuration] = useState("10");
  const [dueDate, setDueDate] = useState("");
  const [showScores, setShowScores] = useState(true);

  useEffect(() => {
    if (!quiz) return;
    setIsActive(quiz.is_active ?? true);
    setDuration(String(quiz.duration_minutes ?? 10));
    setDueDate(toLocalInputValue(quiz.due_date ?? null));
    setShowScores(quiz.show_scores_after_quiz ?? true);
  }, [quiz]);

  const saveMutation = useMutation({
    mutationFn: () =>
      updateQuiz(qid, {
        is_active: isActive,
        duration_minutes: Number(duration) || 10,
        due_date: fromLocalInputValue(dueDate),
        show_scores_after_quiz: showScores,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quiz", qid] });
      queryClient.invalidateQueries({ queryKey: ["quizzes"] });
    },
  });

  if (!Number.isInteger(qid)) {
    return <p className="text-slate-400">Invalid quiz.</p>;
  }

  if (isLoading || !quiz) {
    return <p className="text-slate-400">Loading settings...</p>;
  }

  return (
    <div className="space-y-8">
      {/* Quiz Availability Card */}
      <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 shadow-2xl shadow-black/50">
        <h2 className="text-2xl font-bold text-white mb-6">Quiz Availability</h2>

        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setIsActive((v) => !v)}
            disabled={saveMutation.isPending}
            className={`inline-flex items-center gap-3 rounded-2xl border px-6 py-4 text-sm font-medium transition-all ${
              isActive
                ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400"
                : "border-slate-700 bg-slate-800 text-slate-400"
            }`}
          >
            <div
              className={`h-3 w-3 rounded-full transition-all ${
                isActive ? "bg-emerald-500" : "bg-slate-500"
              }`}
            />
            {isActive ? "Active for students" : "Inactive (hidden from students)"}
          </button>
        </div>

        <p className="mt-4 text-slate-400 text-sm max-w-md">
          When inactive, students will not be able to start this quiz even if they have the direct link.
        </p>
      </div>

      {/* Timer & Due Date Card */}
      <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 shadow-2xl shadow-black/50">
        <h2 className="text-2xl font-bold text-white mb-6">Timer & Due Date</h2>

        <div className="grid gap-8 md:grid-cols-2">
          {/* Duration */}
          <div>
            <Label className="text-slate-200">Timer Duration (minutes)</Label>
            <Input
              type="number"
              min={1}
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              disabled={saveMutation.isPending}
              className="bg-slate-800 border-slate-600 h-12 rounded-2xl focus:border-yellow-400 mt-3 text-lg text-white placeholder:text-slate-400 caret-white"
            />
            <p className="mt-3 text-xs text-slate-400">
              This controls the countdown timer students see while taking the quiz.
            </p>
          </div>

          {/* Due Date */}
          <div>
            <Label className="text-slate-200">Due Date (optional)</Label>
            <Input
              type="datetime-local"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              disabled={saveMutation.isPending}
              className="bg-slate-800 border-slate-600 h-12 rounded-2xl focus:border-yellow-400 mt-3 text-white placeholder:text-slate-400 caret-white"
            />
            <p className="mt-3 text-xs text-slate-400">
              Students will see this date. You can later enforce it to block late submissions.
            </p>
          </div>
        </div>

        {/* Score Visibility */}
        <div className="mt-8">
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="showScores"
              checked={showScores}
              onChange={(e) => setShowScores(e.target.checked)}
              disabled={saveMutation.isPending}
              className="w-5 h-5 text-yellow-400 bg-slate-800 border-slate-600 rounded focus:ring-yellow-400 focus:ring-2"
            />
            <Label htmlFor="showScores" className="text-slate-200 text-base">
              Allow students to view their scores after completing the quiz
            </Label>
          </div>
          <p className="mt-2 text-xs text-slate-400">
            When enabled, students can see their final score and correct answers after submitting.
          </p>
        </div>

        {/* Save Button */}
        <div className="mt-10">
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending || !duration.trim()}
            className="bg-gradient-to-r from-red-500 via-yellow-500 to-orange-500 text-white font-bold rounded-2xl px-10 py-6 shadow-lg hover:brightness-110"
          >
            {saveMutation.isPending ? "Saving Settings..." : "Save Settings"}
          </Button>
        </div>
      </div>
    </div>
  );
}