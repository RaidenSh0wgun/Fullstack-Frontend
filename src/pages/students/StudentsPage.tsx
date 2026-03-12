import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchTeacherCourses, fetchCourseStudents } from "@/services/api";

export default function StudentsPage() {
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);

  const { data: courses } = useQuery({
    queryKey: ["courses"],
    queryFn: fetchTeacherCourses,
  });
  const { data: students, isLoading } = useQuery({
    queryKey: ["course-students", selectedCourseId],
    queryFn: () => fetchCourseStudents(selectedCourseId!),
    enabled: selectedCourseId !== null,
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Students</h1>
      <p className="text-muted-foreground">
        Select a course to see enrolled students.
      </p>
      <div className="grid gap-6 md:grid-cols-[1fr,1.5fr]">
        <section className="rounded-xl border border-border bg-card p-4">
          <h2 className="font-semibold mb-3">Your courses</h2>
          {courses?.length ? (
            <ul className="space-y-2">
              {courses.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedCourseId(c.id)}
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
          <h2 className="font-semibold mb-3">
            Enrolled students
            {selectedCourseId && courses && (
              <span className="text-muted-foreground font-normal">
                {" "}
                — {courses.find((c) => c.id === selectedCourseId)?.title}
              </span>
            )}
          </h2>
          {selectedCourseId === null ? (
            <p className="text-sm text-muted-foreground">
              Select a course from the list.
            </p>
          ) : isLoading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : students?.length ? (
            <ul className="space-y-2">
              {students.map((s) => (
                <li
                  key={s.id}
                  className="flex items-center justify-between rounded-lg border border-border bg-muted/20 px-3 py-2"
                >
                  <div>
                    <span className="font-medium">
                      {s.full_name || s.username}
                    </span>
                    <span className="text-muted-foreground text-sm ml-2">
                      @{s.username} · {s.student_id}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              No students enrolled in this course.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
