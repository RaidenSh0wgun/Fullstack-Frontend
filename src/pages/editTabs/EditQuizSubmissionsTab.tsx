import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchQuizAttempts } from "@/services/api";
import { Button } from "@/components/ui/button";

export default function EditQuizSubmissionsTab() {
  const { courseId, quizId } = useParams<{ courseId: string; quizId: string }>();
  const cid = courseId ? parseInt(courseId, 10) : NaN;
  const qid = quizId ? parseInt(quizId, 10) : NaN;

  const { data: attempts, isLoading } = useQuery({
    queryKey: ["quiz-attempts", qid],
    queryFn: () => fetchQuizAttempts(qid),
    enabled: Number.isInteger(qid),
  });

  if (!Number.isInteger(cid) || !Number.isInteger(qid)) {
    return <p className="text-sm text-muted-foreground">Invalid quiz.</p>;
  }

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading submissions...</p>;
  }

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between gap-3 p-4">
          <div>
            <h2 className="text-base font-semibold">Submissions</h2>
            <p className="text-xs text-muted-foreground">
              Students who have taken this quiz.
            </p>
          </div>
          <p className="text-xs text-muted-foreground">
            Total: {attempts?.length ?? 0}
          </p>
        </div>

        {attempts?.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-t border-border bg-muted/30 text-left text-xs text-muted-foreground">
                <tr>
                  <th className="px-4 py-2 font-medium">Student</th>
                  <th className="px-4 py-2 font-medium">Username</th>
                  <th className="px-4 py-2 font-medium">Score</th>
                  <th className="px-4 py-2 font-medium">Submitted</th>
                  <th className="px-4 py-2 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {attempts.map((a) => (
                  <tr key={a.id} className="align-middle">
                    <td className="px-4 py-3 font-medium">{a.student_name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{a.username}</td>
                    <td className="px-4 py-3">
                      {a.score} / {a.total}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(a.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link to={`/courses/${cid}/quizzes/${qid}/edit/submissions/${a.id}`}>
                        <Button size="sm" variant="outline">
                          Review
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-4">
            <p className="text-sm text-muted-foreground">
              No submissions yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

