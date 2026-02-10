import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createCourse,
  createQuiz,
  deleteCourse,
  deleteQuiz,
  fetchQuizzesForCourse,
  fetchTeacherCourses,
  type Course,
  type Quiz,
} from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function Homepage() {
  const { user } = useAuth();

  if (!user) return null;

  if (user.role === "teacher") {
    return <TeacherDashboard />;
  }

  return <StudentDashboard />;
}

function TeacherDashboard() {
  const queryClient = useQueryClient();
  const { data: courses } = useQuery({
    queryKey: ["courses"],
    queryFn: fetchTeacherCourses,
  });

  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);

  const {
    data: quizzes,
    isLoading: quizzesLoading,
  } = useQuery({
    queryKey: ["quizzes", selectedCourseId],
    queryFn: () => fetchQuizzesForCourse(selectedCourseId as number),
    enabled: selectedCourseId !== null,
  });

  const createCourseMutation = useMutation({
    mutationFn: createCourse,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses"] });
    },
  });

  const deleteCourseMutation = useMutation({
    mutationFn: deleteCourse,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      setSelectedCourseId(null);
    },
  });

  const createQuizMutation = useMutation({
    mutationFn: createQuiz,
    onSuccess: () => {
      if (selectedCourseId) {
        queryClient.invalidateQueries({
          queryKey: ["quizzes", selectedCourseId],
        });
      }
    },
  });

  const deleteQuizMutation = useMutation({
    mutationFn: deleteQuiz,
    onSuccess: () => {
      if (selectedCourseId) {
        queryClient.invalidateQueries({
          queryKey: ["quizzes", selectedCourseId],
        });
      }
    },
  });

  const handleCreateCourse = async () => {
    const title = prompt("Course title:");
    if (!title) return;
    const description = prompt("Course description (optional):") ?? "";
    await createCourseMutation.mutateAsync({ title, description });
  };

  const handleDeleteCourse = async (course: Course) => {
    if (!confirm(`Delete course "${course.title}" and its quizzes?`)) return;
    await deleteCourseMutation.mutateAsync(course.id);
  };

  const handleCreateQuiz = async () => {
    if (!selectedCourseId) {
      alert("Select a course first.");
      return;
    }
    const title = prompt("Quiz title:");
    if (!title) return;
    const description = prompt("Quiz description (optional):") ?? "";
    const durationStr = prompt("Duration in minutes (e.g. 10):", "10");
    const duration = durationStr ? Number(durationStr) : 10;
    await createQuizMutation.mutateAsync({
      title,
      description,
      duration_minutes: duration,
      course: selectedCourseId,
      id: 0,
    } as Quiz);
  };

  const handleDeleteQuiz = async (quiz: Quiz) => {
    if (!confirm(`Delete quiz "${quiz.title}"?`)) return;
    await deleteQuizMutation.mutateAsync(quiz.id);
  };

  return (
    <div className="grid gap-6 md:grid-cols-[1.2fr,1.5fr]">
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">Your courses</h2>
          <Button
            size="sm"
            onClick={handleCreateCourse}
            disabled={createCourseMutation.isPending}
          >
            {createCourseMutation.isPending ? "Creating..." : "New course"}
          </Button>
        </div>
        <div className="space-y-2">
          {courses?.length ? (
            courses.map((course) => (
              <button
                key={course.id}
                type="button"
                onClick={() => setSelectedCourseId(course.id)}
                className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-sm transition ${
                  selectedCourseId === course.id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-muted"
                }`}
              >
                <div>
                  <p className="font-medium">{course.title}</p>
                  {course.description && (
                    <p className="text-xs text-muted-foreground">
                      {course.description}
                    </p>
                  )}
                </div>
                <Button
                  size="icon-xs"
                  variant="ghost"
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteCourse(course);
                  }}
                >
                  ✕
                </Button>
              </button>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">
              You have no courses yet. Create one to start adding quizzes.
            </p>
          )}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">Quizzes</h2>
          <Button
            size="sm"
            onClick={handleCreateQuiz}
            disabled={!selectedCourseId || createQuizMutation.isPending}
          >
            {createQuizMutation.isPending ? "Creating..." : "New quiz"}
          </Button>
        </div>
        {!selectedCourseId ? (
          <p className="text-sm text-muted-foreground">
            Select a course to see and manage its quizzes.
          </p>
        ) : quizzesLoading ? (
          <p className="text-sm text-muted-foreground">Loading quizzes...</p>
        ) : quizzes?.length ? (
          <div className="space-y-2">
            {quizzes.map((quiz) => (
              <div
                key={quiz.id}
                className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2 text-sm"
              >
                <div>
                  <p className="font-medium">{quiz.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {quiz.description} • {quiz.duration_minutes} min
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="icon-xs"
                    variant="ghost"
                    type="button"
                    onClick={() => handleDeleteQuiz(quiz)}
                  >
                    ✕
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No quizzes for this course yet. Create one above.
          </p>
        )}
      </section>
    </div>
  );
}

function StudentDashboard() {
  const { data: courses } = useQuery({
    queryKey: ["courses"],
    queryFn: fetchTeacherCourses,
  });

  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);

  const {
    data: quizzes,
    isLoading: quizzesLoading,
  } = useQuery({
    queryKey: ["quizzes", selectedCourseId],
    queryFn: () => fetchQuizzesForCourse(selectedCourseId as number),
    enabled: selectedCourseId !== null,
  });

  return (
    <div className="grid gap-6 md:grid-cols-[1.2fr,1.5fr]">
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Available courses</h2>
        <div className="space-y-2">
          {courses?.length ? (
            courses.map((course) => (
              <button
                key={course.id}
                type="button"
                onClick={() => setSelectedCourseId(course.id)}
                className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-sm transition ${
                  selectedCourseId === course.id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-muted"
                }`}
              >
                <div>
                  <p className="font-medium">{course.title}</p>
                  {course.description && (
                    <p className="text-xs text-muted-foreground">
                      {course.description}
                    </p>
                  )}
                </div>
              </button>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">
              No courses available yet.
            </p>
          )}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Quizzes</h2>
        {!selectedCourseId ? (
          <p className="text-sm text-muted-foreground">
            Select a course to see quizzes you can take.
          </p>
        ) : quizzesLoading ? (
          <p className="text-sm text-muted-foreground">Loading quizzes...</p>
        ) : quizzes?.length ? (
          <div className="space-y-2">
            {quizzes.map((quiz) => (
              <div
                key={quiz.id}
                className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2 text-sm"
              >
                <div>
                  <p className="font-medium">{quiz.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {quiz.description} • {quiz.duration_minutes} min
                  </p>
                </div>
                <Link to={`/quiz/${quiz.id}`}>
                  <Button size="sm">Take quiz</Button>
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No quizzes for this course yet.
          </p>
        )}
      </section>
    </div>
  );
}
