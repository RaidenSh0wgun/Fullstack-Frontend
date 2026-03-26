import { useMemo, useState } from "react";
import { Link, NavLink, Outlet, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchQuizDetail, updateQuiz } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";


function TabLink({
  to,
  children,
}: {
  to: string;
  children: React.ReactNode;
}) {
  return (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        [
          "text-sm font-medium px-3 py-2 rounded-md transition",
          isActive ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground",
        ].join(" ")
      }
    >
      {children}
    </NavLink>
  );
}

export default function EditQuizLayout() {
  const { courseId, quizId } = useParams<{ courseId: string; quizId: string }>();
  const cid = courseId ? parseInt(courseId, 10) : NaN;
  const qid = quizId ? parseInt(quizId, 10) : NaN;
  const queryClient = useQueryClient();

  const { data: quiz, isLoading } = useQuery({
    queryKey: ["quiz", qid],
    queryFn: () => fetchQuizDetail(qid),
    enabled: Number.isInteger(qid),
  });

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [draftTitle, setDraftTitle] = useState("");

  const saveTitleMutation = useMutation({
    mutationFn: (nextTitle: string) => updateQuiz(qid, { title: nextTitle }),
    onSuccess: (updated) => {
      queryClient.setQueryData(["quiz", qid], (prev: any) =>
        prev ? { ...prev, title: updated.title } : prev
      );
      queryClient.invalidateQueries({ queryKey: ["quizzes", cid] });
      queryClient.invalidateQueries({ queryKey: ["quiz-detail", qid] });
      setIsEditingTitle(false);
    },
  });

  const title = useMemo(() => quiz?.title ?? "Quiz", [quiz?.title]);

  const startEdit = () => {
    setDraftTitle(title);
    setIsEditingTitle(true);
  };

  const cancelEdit = () => {
    setIsEditingTitle(false);
    setDraftTitle("");
  };

  const saveEdit = () => {
    const next = draftTitle.trim();
    if (!next || next === title) {
      setIsEditingTitle(false);
      return;
    }
    saveTitleMutation.mutate(next);
  };

  if (!Number.isInteger(qid) || !Number.isInteger(cid)) {
    return (
      <div>
        <p className="text-muted-foreground">Invalid course or quiz.</p>
        <Link to="/courses">Back to courses</Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <Link
          to={`/courses/${cid}`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to course
        </Link>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-[240px] flex-1">
            {isLoading || !quiz ? (
              <div>
                <p className="text-sm text-muted-foreground">Loading quiz...</p>
              </div>
            ) : isEditingTitle ? (
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  value={draftTitle}
                  onChange={(e) => setDraftTitle(e.target.value)}
                  className="max-w-md"
                  aria-label="Quiz title"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveEdit();
                    if (e.key === "Escape") cancelEdit();
                  }}
                  disabled={saveTitleMutation.isPending}
                />
                <Button
                  size="sm"
                  onClick={saveEdit}
                  disabled={saveTitleMutation.isPending || !draftTitle.trim()}
                >
                  {saveTitleMutation.isPending ? "Saving..." : "Save"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={cancelEdit}
                  disabled={saveTitleMutation.isPending}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-semibold">{title}</h1>
                <Button size="sm" variant="outline" onClick={startEdit} disabled={isLoading}>
                  Edit title
                </Button>
              </div>
            )}
            {quiz?.description && (
              <p className="text-sm text-muted-foreground">{quiz.description}</p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1 rounded-lg border border-border bg-background p-1">
          <TabLink to="questions">Questions</TabLink>
          <TabLink to="submissions">Submissions</TabLink>
          <TabLink to="settings">Settings</TabLink>
        </div>
      </div>

      <Outlet />
    </div>
  );
}

