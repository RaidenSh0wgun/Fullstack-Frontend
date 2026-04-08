import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import {
  fetchTeacherCourses,
  fetchCourses,
  fetchEnrolledCourses,
  createCourse,
  updateCourse,
  deleteCourse,
  type Course,
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
      if (isTeacher) {
        return fetchTeacherCourses();
      }
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

  const handleViewCourse = (courseId: number) => {
    navigate(`/courses/${courseId}`);
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

  const deleteCourseMutation = useMutation({
    mutationFn: (id: number) => deleteCourse(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses"] });
    },
    onError: () => {
      alert("Failed to delete course.");
    },
  });

  const toggleCourseMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: number; is_active: boolean }) =>
      updateCourse(id, { is_active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses"] });
    },
    onError: () => {
      alert("Failed to update course status.");
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
          {!isTeacher && (
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
          )}
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
                    {course.is_active === false && (
                      <p className="text-xs text-amber-600 mt-1">Deactivated</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleCourseMutation.mutate({
                          id: course.id,
                          is_active: !(course.is_active ?? true),
                        });
                      }}
                      disabled={toggleCourseMutation.isPending}
                    >
                      {(course.is_active ?? true) ? "Deactivate" : "Reactivate"}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (confirm(`Delete course "${course.title}" and its quizzes?`)) {
                          deleteCourseMutation.mutate(course.id);
                        }
                      }}
                      disabled={deleteCourseMutation.isPending}
                    >
                      Delete
                    </Button>
                    <span className="text-primary text-sm font-medium">View →</span>
                  </div>
                </Link>
              ) : (
                <button
                  key={course.id}
                  type="button"
                  className="flex items-center justify-between rounded-xl border border-border bg-card p-4 hover:bg-muted/50 transition w-full text-left"
                  onClick={() => handleViewCourse(course.id)}
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
