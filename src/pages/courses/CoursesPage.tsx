import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import {
  fetchTeacherCourses,
  fetchCourses,
  createCourse,
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
  const queryClient = useQueryClient();
  const [openCreateCourse, setOpenCreateCourse] = useState(false);
  const [courseTitle, setCourseTitle] = useState("");
  const [courseDescription, setCourseDescription] = useState("");

  const { data: courses, isLoading } = useQuery({
    queryKey: ["courses", isTeacher],
    queryFn: isTeacher ? fetchTeacherCourses : fetchCourses,
  });
  const courseList = (courses ?? []) as Course[];

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
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Courses</h1>
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
            ? "You have no courses yet."
            : "No courses available to enroll in yet."}
        </p>
      )}
    </div>
  );
}
