import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import {
  fetchTeacherCourses,
  fetchCourses,
  fetchEnrolledCourses,
  fetchQuizzesForCourse,
  createCourse,
  type Course,
  type Quiz,
} from "@/services/api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export default function CoursesPage() {
  const { user } = useAuth();
  const isTeacher = user?.role === "teacher";
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [openCreateCourse, setOpenCreateCourse] = useState(false);
  const [courseTitle, setCourseTitle] = useState("");
  const [courseDescription, setCourseDescription] = useState("");

  const [viewMode, setViewMode] = useState<"all" | "my">("all");

  const { data: courses, isLoading } = useQuery({
    queryKey: ["courses", viewMode, isTeacher],
    queryFn: () => {
      if (viewMode === "all") {
        return fetchCourses();
      }

      if (viewMode === "my") {
        return isTeacher ? fetchTeacherCourses() : fetchEnrolledCourses();
      }

      return fetchCourses();
    },
  });
  const courseList = (courses ?? []) as Course[];

  const handleViewCourse = async (courseId: number, isEnrolled: boolean) => {
    try {
      if (isTeacher) {
        navigate(`/courses/${courseId}`);
        return;
      }

      if (!isEnrolled) {
        navigate(`/courses/${courseId}`);
        return;
      }

      const quizzes = await fetchQuizzesForCourse(courseId);
      const asQuiz = quizzes as Quiz[];

      const quizToView =
        asQuiz.find((q) => !(q.has_attempted ?? false)) ?? asQuiz[0];

      if (quizToView) {
        navigate(`/quizview/${quizToView.id}`);
        return;
      }

      navigate(`/courses/${courseId}`);
    } catch (e) {
      console.error("Failed to load quiz for course view:", e);
      navigate(`/courses/${courseId}`);
    }
  };

  const createCourseMutation = useMutation({
    mutationFn: (payload: Pick<Course, "title" | "description">) =>
      createCourse(payload),
    onSuccess: () => {
      setOpenCreateCourse(false);
      setCourseTitle("");
      setCourseDescription("");
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      queryClient.invalidateQueries({ queryKey: ["courses", true] });
    },
    onError: () => {
      alert("Failed to create course.");
    },
  });

  const handleCreateCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseTitle.trim()) return;
    const payload: Pick<Course, "title" | "description"> = {
      title: courseTitle.trim(),
      description: courseDescription.trim() || undefined,
    };
    createCourseMutation.mutate(payload);
  };

  if (isLoading) {
    return <p className="text-muted-foreground">Loading courses...</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Courses</h1>
          <div className="mt-3 flex gap-2">
            <Button
              size="sm"
              variant={viewMode === "all" ? "default" : "outline"}
              onClick={() => setViewMode("all")}
            >
              All Courses
            </Button>
            <Button
              size="sm"
              variant={viewMode === "my" ? "default" : "outline"}
              onClick={() => setViewMode("my")}
            >
              My Courses
            </Button>
          </div>
        </div>
        {isTeacher && (
          <Dialog open={openCreateCourse} onOpenChange={setOpenCreateCourse}>
            <DialogTrigger asChild>
              <Button size="sm">Add course</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create course</DialogTitle>
                <DialogDescription>
                  Add a new course that you can later attach quizzes to.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateCourse} className="space-y-4">
                <div>
                  <Label>Title *</Label>
                  <Input
                    value={courseTitle}
                    onChange={(e) => setCourseTitle(e.target.value)}
                    placeholder="e.g. Math 101"
                    required
                  />
                </div>
                <div>
                  <Label>Description (optional)</Label>
                  <Textarea
                    value={courseDescription}
                    onChange={(e) => setCourseDescription(e.target.value)}
                    placeholder="What is this course about?"
                    rows={2}
                  />
                </div>
                <DialogFooter>
                  <Button
                    type="submit"
                    disabled={
                      createCourseMutation.isPending || !courseTitle.trim()
                    }
                  >
                    {createCourseMutation.isPending
                      ? "Creating..."
                      : "Create course"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>
      {courseList.length ? (
        <div className="grid gap-3">
          {courseList.map((course) => (
            <>
              {isTeacher ? (
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
                  <span className="text-primary text-sm font-medium">
                    View →
                  </span>
                </Link>
              ) : (
                <button
                  key={course.id}
                  type="button"
                  className="flex items-center justify-between rounded-xl border border-border bg-card p-4 hover:bg-muted/50 transition w-full text-left"
                  onClick={() => handleViewCourse(course.id, course.is_enrolled ?? false)}
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
                </button>
              )}
            </>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground">
          {viewMode === "all" && courseList.length === 0 &&
            "No courses available yet."}
          {viewMode === "my" && isTeacher &&
            "You have no courses yet."}
          {viewMode === "my" && !isTeacher &&
            "You are not enrolled in any courses yet."}
        </p>
      )}
    </div>
  );
}
