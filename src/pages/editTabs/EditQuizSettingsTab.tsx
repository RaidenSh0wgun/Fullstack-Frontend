import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
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
  const { quizId } = useParams<{ courseId: string; quizId: string }>();
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

  useEffect(() => {
    if (!quiz) return;
    setIsActive(quiz.is_active ?? true);
    setDuration(String(quiz.duration_minutes ?? 10));
    setDueDate(toLocalInputValue(quiz.due_date ?? null));
  }, [quiz]);

  const saveMutation = useMutation({
    mutationFn: () =>
      updateQuiz(qid, {
        is_active: isActive,
        duration_minutes: Number(duration) || 10,
        due_date: fromLocalInputValue(dueDate),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quiz", qid] });
      queryClient.invalidateQueries({ queryKey: ["quizzes"] });
      queryClient.invalidateQueries({ queryKey: ["pending-quizzes"] });
    },
  });

  if (!Number.isInteger(qid)) {
    return <p className="text-sm text-muted-foreground">Invalid quiz.</p>;
  }

  if (isLoading || !quiz) {
    return <p className="text-sm text-muted-foreground">Loading settings...</p>;
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-border bg-card p-4 space-y-4">
        <h2 className="text-base font-semibold">Quiz availability</h2>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsActive((v) => !v)}
            className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition ${
              isActive
                ? "border-emerald-500 bg-emerald-500/10 text-emerald-700"
                : "border-border bg-muted text-muted-foreground"
            }`}
            disabled={saveMutation.isPending}
          >
            <span
              className={`mr-2 h-2 w-2 rounded-full ${
                isActive ? "bg-emerald-500" : "bg-muted-foreground"
              }`}
            />
            {isActive ? "Active for students" : "Inactive (hidden / blocked)"}
          </button>
        </div>
        <p className="text-xs text-muted-foreground">
          When inactive, students won&apos;t be able to start this quiz (even if they have
          the link).
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 space-y-4">
        <h2 className="text-base font-semibold">Timer & due date</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label>Timer (minutes)</Label>
            <Input
              type="number"
              min={1}
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              disabled={saveMutation.isPending}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              This controls the countdown students see when taking the quiz.
            </p>
          </div>

          <div>
            <Label>Due date (optional)</Label>
            <Input
              type="datetime-local"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              disabled={saveMutation.isPending}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Used for the calendar and can later be enforced to block late attempts.
            </p>
          </div>
        </div>

        <div className="pt-2">
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending || !duration.trim()}
          >
            {saveMutation.isPending ? "Saving..." : "Save settings"}
          </Button>
        </div>
      </div>
    </div>
  );
}

