import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { fetchTeacherCourses, fetchCourses } from "@/services/api";
import type { Course } from "@/services/api";

export default function CoursesPage() {
  const { user } = useAuth();
  const isTeacher = user?.role === "teacher";
  const { data: courses, isLoading } = useQuery({
    queryKey: ["courses", isTeacher],
    queryFn: isTeacher ? fetchTeacherCourses : fetchCourses,
  });
  const courseList = (courses ?? []) as Course[];

  if (isLoading) {
    return <p className="text-muted-foreground">Loading courses...</p>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Courses</h1>
      {courseList.length ? (
        <div className="grid gap-3">
          {courseList.map((course) => (
            <Link
              key={course.id}
              to={`/courses/${course.id}`}
              className="flex items-center justify-between rounded-xl border border-border bg-card p-4 hover:bg-muted/50 transition"
            >
              <div>
                <h2 className="font-semibold">{course.title}</h2>
                {course.description && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {course.description}
                  </p>
                )}
              </div>
              <span className="text-primary text-sm font-medium">View →</span>
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground">
          {isTeacher
            ? "You have no courses yet. Create one from the dashboard."
            : "No courses available to enroll in yet."}
        </p>
      )}
    </div>
  );
}
