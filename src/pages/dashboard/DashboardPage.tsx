import { useAuth } from "@/context/AuthContext";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchTeacherCourses, fetchMyEvents, fetchPendingQuizzes } from "@/services/api";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const { user } = useAuth();

  if (user?.role === "teacher") {
    return <InstructorDashboard />;
  }
  return <StudentDashboard />;
}

function InstructorDashboard() {
  const { data: courses } = useQuery({
    queryKey: ["courses"],
    queryFn: fetchTeacherCourses,
  });
  const { data: events } = useQuery({
    queryKey: ["events"],
    queryFn: fetchMyEvents,
  });

  const upcomingEvents = (events ?? [])
    .filter((e) => new Date(e.start) >= new Date())
    .slice(0, 5);

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <section className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-4">
          <h2 className="text-lg font-semibold mb-3">Courses</h2>
          {courses?.length ? (
            <ul className="space-y-2">
              {courses.slice(0, 5).map((c) => (
                <li key={c.id}>
                  <Link
                    to={`/courses/${c.id}`}
                    className="text-primary hover:underline font-medium"
                  >
                    {c.title}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No courses yet.</p>
          )}
          <Link to="/courses" className="inline-block mt-3">
            <Button size="sm" variant="outline">
              View all courses
            </Button>
          </Link>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <h2 className="text-lg font-semibold mb-3">Calendar</h2>
          {upcomingEvents.length ? (
            <ul className="space-y-2">
              {upcomingEvents.map((e) => (
                <li key={e.id} className="text-sm">
                  <span className="font-medium">{e.title}</span>
                  <span className="text-muted-foreground ml-2">
                    {new Date(e.start).toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No upcoming events.</p>
          )}
          <Link to="/calendar" className="inline-block mt-3">
            <Button size="sm" variant="outline">
              Open calendar
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}

function StudentDashboard() {
  const { data: pending } = useQuery({
    queryKey: ["pending-quizzes"],
    queryFn: fetchPendingQuizzes,
  });
  const { data: events } = useQuery({
    queryKey: ["events"],
    queryFn: fetchMyEvents,
  });

  const upcomingEvents = (events ?? [])
    .filter((e) => new Date(e.start) >= new Date())
    .slice(0, 5);

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <section className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-4">
          <h2 className="text-lg font-semibold mb-3">Quizzes to complete</h2>
          {pending?.length ? (
            <ul className="space-y-2">
              {pending.slice(0, 5).map((q) => (
                <li key={q.id} className="flex items-center justify-between gap-2">
                  <div>
                    <span className="font-medium">{q.title}</span>
                    {q.due_date && (
                      <div className="text-xs text-muted-foreground">
                        Due: {new Date(q.due_date).toLocaleString()}
                      </div>
                    )}
                  </div>
                  <Link to={`/quiz/${q.id}`}>
                    <Button size="sm">View Quiz</Button>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No pending quizzes.</p>
          )}
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <h2 className="text-lg font-semibold mb-3">Calendar</h2>
          {upcomingEvents.length ? (
            <ul className="space-y-2">
              {upcomingEvents.map((e) => (
                <li key={e.id} className="text-sm">
                  <span className="font-medium">{e.title}</span>
                  <span className="text-muted-foreground ml-2">
                    {new Date(e.start).toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No upcoming events.</p>
          )}
          <Link to="/calendar" className="inline-block mt-3">
            <Button size="sm" variant="outline">
              Open calendar
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
