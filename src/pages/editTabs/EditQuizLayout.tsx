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
        `px-5 py-2.5 text-sm font-medium rounded-xl transition-all ${
          isActive
            ? "bg-gradient-to-r from-red-500 via-yellow-500 to-orange-500 text-white shadow-md"
            : "text-slate-400 hover:text-white hover:bg-slate-800"
        }`
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
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/30 to-slate-950 p-8 text-white">
        <p className="text-slate-400">Invalid course or quiz.</p>
        <Link to="/courses" className="text-yellow-400 hover:underline">← Back to courses</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/30 to-slate-950 p-4 sm:p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Back Button */}
        <Link
          to={`/courses/${cid}`}
          className="inline-flex items-center gap-2 text-slate-400 hover:text-yellow-400 transition-colors"
        >
          ← Back to course
        </Link>

        {/* Quiz Header */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 shadow-2xl shadow-black/50">
          <div className="flex flex-col gap-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                {isLoading || !quiz ? (
                  <p className="text-slate-400">Loading quiz...</p>
                ) : isEditingTitle ? (
                  <div className="flex flex-wrap items-center gap-3">
                    <Input
                      value={draftTitle}
                      onChange={(e) => setDraftTitle(e.target.value)}
                      className="bg-slate-800 border-slate-600 h-12 rounded-2xl focus:border-yellow-400 text-lg font-semibold max-w-lg"
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
                      className="bg-gradient-to-r from-red-500 via-yellow-500 to-orange-500 rounded-2xl"
                    >
                      {saveTitleMutation.isPending ? "Saving..." : "Save"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={cancelEdit}
                      disabled={saveTitleMutation.isPending}
                      className="rounded-2xl border-slate-600"
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center gap-4">
                    <h1 className="text-4xl font-black bg-gradient-to-r from-red-400 via-yellow-400 to-orange-400 bg-clip-text text-transparent">
                      {title}
                    </h1>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={startEdit}
                      disabled={isLoading}
                      className="rounded-2xl border-slate-600 hover:bg-slate-800"
                    >
                      Edit Title
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {quiz?.description && (
              <p className="text-slate-300 text-lg">{quiz.description}</p>
            )}

            {/* Tabs */}
            <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-700">
              <TabLink to="questions">Questions</TabLink>
              <TabLink to="submissions">Submissions</TabLink>
              <TabLink to="settings">Settings</TabLink>
            </div>
          </div>
        </div>

        <Outlet />
      </div>
    </div>
  );
}