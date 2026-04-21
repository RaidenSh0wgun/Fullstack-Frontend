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
    return <p className="text-slate-400">Invalid quiz.</p>;
  }

  if (isLoading) {
    return <p className="text-slate-400">Loading submissions...</p>;
  }

  return (
    <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 shadow-2xl shadow-black/50">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-bold text-white">Submissions</h2>
          <p className="text-slate-400 mt-1">Students who have taken this quiz</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-slate-400">Total Submissions</p>
          <p className="text-4xl font-black text-white">{attempts?.length ?? 0}</p>
        </div>
      </div>

      {attempts && attempts.length > 0 ? (
        <div className="overflow-x-auto rounded-2xl border border-slate-700 bg-slate-950/50">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700 bg-slate-900 text-left text-xs uppercase tracking-widest text-slate-400">
                <th className="px-8 py-5 font-medium">Student</th>
                <th className="px-8 py-5 font-medium">Username</th>
                <th className="px-8 py-5 font-medium">Score</th>
                <th className="px-8 py-5 font-medium">Submitted</th>
                <th className="px-8 py-5 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {attempts.map((a) => (
                <tr key={a.id} className="hover:bg-slate-900/70 transition-colors">
                  <td className="px-8 py-5 font-medium text-white">{a.student_name}</td>
                  <td className="px-8 py-5 text-slate-400">{a.username}</td>
                  <td className="px-8 py-5">
                    <span className="font-semibold text-white">
                      {a.score} / {a.total}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-slate-400">
                    {new Date(a.created_at).toLocaleString()}
                  </td>
                  <td className="px-8 py-5 text-right">
                    <Link to={`/courses/${cid}/quizzes/${qid}/edit/review/${a.id}`}>
                      <Button 
                        size="sm" 
                        className="bg-gradient-to-r from-red-500 via-yellow-500 to-orange-500 text-white font-medium rounded-2xl px-6 hover:brightness-110"
                      >
                        Review Attempt
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-20">
          <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-red-500/20 to-yellow-500/20 rounded-3xl flex items-center justify-center">
            <span className="text-4xl opacity-50">📝</span>
          </div>
          <h3 className="text-xl font-semibold text-slate-300">No submissions yet</h3>
          <p className="text-slate-400 mt-2">Students haven&apos;t taken this quiz yet.</p>
        </div>
      )}
    </div>
  );
}