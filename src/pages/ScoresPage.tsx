import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  fetchTeacherCourses,
  fetchQuizzesForCourse,
  fetchQuizAttempts,
} from "@/services/api";

export default function ScoresPage() {
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [selectedQuizId, setSelectedQuizId] = useState<number | null>(null);

  const { data: courses } = useQuery({
    queryKey: ["courses"],
    queryFn: fetchTeacherCourses,
  });
  const { data: quizzes } = useQuery({
    queryKey: ["quizzes", selectedCourseId],
    queryFn: () => fetchQuizzesForCourse(selectedCourseId!),
    enabled: selectedCourseId !== null,
  });
  const { data: attempts, isLoading } = useQuery({
    queryKey: ["quiz-attempts", selectedQuizId],
    queryFn: () => fetchQuizAttempts(selectedQuizId!),
    enabled: selectedQuizId !== null,
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Quiz scores</h1>
      <p className="text-muted-foreground">
        Select a course, then a quiz, to see student scores.
      </p>
      <div className="grid gap-6 md:grid-cols-3">
        <section className="rounded-xl border border-border bg-card p-4">
          <h2 className="font-semibold mb-3">Course</h2>
          {courses?.length ? (
            <ul className="space-y-2">
              {courses.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCourseId(c.id);
                      setSelectedQuizId(null);
                    }}
                    className={`w-full text-left rounded-lg px-3 py-2 text-sm font-medium transition ${
                      selectedCourseId === c.id
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted"
                    }`}
                  >
                    {c.title}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No courses.</p>
          )}
        </section>
        <section className="rounded-xl border border-border bg-card p-4">
          <h2 className="font-semibold mb-3">Quiz</h2>
          {selectedCourseId === null ? (
            <p className="text-sm text-muted-foreground">
              Select a course first.
            </p>
          ) : quizzes?.length ? (
            <ul className="space-y-2">
              {quizzes.map((q) => (
                <li key={q.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedQuizId(q.id)}
                    className={`w-full text-left rounded-lg px-3 py-2 text-sm font-medium transition ${
                      selectedQuizId === q.id
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted"
                    }`}
                  >
                    {q.title}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              No quizzes in this course.
            </p>
          )}
        </section>
        <section className="rounded-xl border border-border bg-card p-4">
          <h2 className="font-semibold mb-3">Scores</h2>
          {selectedQuizId === null ? (
            <p className="text-sm text-muted-foreground">
              Select a quiz to see scores.
            </p>
          ) : isLoading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : attempts?.length ? (
            <ul className="space-y-2">
              {attempts.map((a) => (
                <li
                  key={a.id}
                  className="flex items-center justify-between rounded-lg border border-border bg-muted/20 px-3 py-2"
                >
                  <span className="font-medium">
                    {a.student_name || a.username}
                  </span>
                  <span className="text-muted-foreground">
                    {a.score} / {a.total}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              No attempts yet for this quiz.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
