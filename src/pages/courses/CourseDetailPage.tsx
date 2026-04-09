import { useState, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchCourseDetail,
  fetchQuizzesForCourse,
  createQuiz,
  deleteQuiz,
  deleteCourse,
  updateCourse,
  enrollCourse,
  unenrollCourse,
  type Quiz,
  type QuizCreatePayload,
} from "@/services/api";
import { useAuth } from "@/context/AuthContext";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function CourseDetailPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const id = courseId ? parseInt(courseId, 10) : NaN;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isTeacher = user?.role === "teacher";

  const { data: course, isSuccess: courseLoaded, refetch: refetchCourse } = useQuery({
    queryKey: ["course", id],
    queryFn: () => fetchCourseDetail(id),
    enabled: Number.isInteger(id),
  });
  const enrollMutation = useMutation({
    mutationFn: ({ passkey }: { passkey?: string }) => enrollCourse(id, passkey),
    onSuccess: () => {
      refetchCourse();
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      setOpenEnrollDialog(false);
      setEnrollPasskey("");
    },
    onError: (err) => {
      console.error("Enroll failed", err);
      alert("Unable to enroll. Please verify the passkey and try again.");
    },
  });
  const unenrollMutation = useMutation({
    mutationFn: () => unenrollCourse(id),
    onSuccess: () => {
      refetchCourse();
      queryClient.invalidateQueries({ queryKey: ["courses"] });
    },
  });
  const toggleCourseMutation = useMutation({
    mutationFn: (is_active: boolean) => updateCourse(id, { is_active }),
    onSuccess: () => {
      refetchCourse();
      queryClient.invalidateQueries({ queryKey: ["courses"] });
    },
  });
  const deleteCourseMutation = useMutation({
    mutationFn: () => deleteCourse(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      navigate("/courses");
    },
  });

  const handleEnrollSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await enrollMutation.mutateAsync({ passkey: enrollPasskey.trim() || undefined });
  };

  const { data: quizzes, isLoading } = useQuery({
    queryKey: ["quizzes", id],
    queryFn: () => fetchQuizzesForCourse(id),
    enabled: Number.isInteger(id),
  });

  const [openCreateQuiz, setOpenCreateQuiz] = useState(false);
  const [openEnrollDialog, setOpenEnrollDialog] = useState(false);
  const [enrollPasskey, setEnrollPasskey] = useState("");
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editPasskey, setEditPasskey] = useState("");
  const [quizTitle, setQuizTitle] = useState("");
  const [quizDescription, setQuizDescription] = useState("");
  const [quizDuration, setQuizDuration] = useState("10");
  const [quizDueDate, setQuizDueDate] = useState("");
  const [quizFilter, setQuizFilter] = useState<"all" | "completed" | "pending" | "dueDate">("all");
  const [openUnenrollDialog, setOpenUnenrollDialog] = useState(false);

  const filteredQuizzes = useMemo(() => {
    if (!quizzes) return [];
    let filtered = [...quizzes];

    if (quizFilter === "completed") {
      filtered = filtered.filter((q) => q.has_attempted);
    } else if (quizFilter === "pending") {
      filtered = filtered.filter((q) => !q.has_attempted);
    } else if (quizFilter === "dueDate") {
      filtered = filtered
        .filter((q) => q.due_date)
        .sort((a, b) => {
          const dateA = new Date(a.due_date!).getTime();
          const dateB = new Date(b.due_date!).getTime();
          return dateA - dateB;
        });
    }

    return filtered;
  }, [quizzes, quizFilter]);

  const createQuizMutation = useMutation({
    mutationFn: (payload: QuizCreatePayload) => createQuiz(payload),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ["quizzes", id] });
      setOpenCreateQuiz(false);
      setQuizTitle("");
      setQuizDescription("");
      setQuizDuration("10");
      setQuizDueDate("");
      navigate(`/courses/${id}/quizzes/${created.id}/questions`);
    },
    onError: (err) => {
      console.error(err);
      alert("Failed to create quiz.");
    },
  });

  const deleteQuizMutation = useMutation({
    mutationFn: deleteQuiz,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quizzes", id] });
    },
  });

  const editCourseMutation = useMutation({
    mutationFn: () =>
      updateCourse(id, {
        title: editTitle.trim(),
        description: editDescription.trim() || undefined,
        passkey: editPasskey.trim() || null,
      }),
    onSuccess: () => {
      refetchCourse();
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      setOpenEditDialog(false);
      setEditTitle("");
      setEditDescription("");
      setEditPasskey("");
    },
    onError: (err) => {
      console.error("Edit course failed", err);
      alert("Failed to update course. Please try again.");
    },
  });

  const handleCreateQuiz = (e: React.FormEvent) => {
    e.preventDefault();
    if (!Number.isInteger(id) || !quizTitle.trim()) return;
    const payload: QuizCreatePayload = {
      title: quizTitle.trim(),
      description: quizDescription.trim() || undefined,
      duration_minutes: Number(quizDuration) || 10,
      course: id,
      due_date: quizDueDate.trim() || null,
      questions: [],
    };
    createQuizMutation.mutate(payload);
  };

  const handleEditDialogOpen = () => {
    setEditTitle(course?.title ?? "");
    setEditDescription(course?.description ?? "");
    setEditPasskey(course?.passkey ?? "");
    setOpenEditDialog(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTitle.trim()) return;
    editCourseMutation.mutate();
  };

  if (!Number.isInteger(id)) {
    return (
      <div>
        <p className="text-muted-foreground">Invalid course.</p>
        <Link to="/courses">Back to courses</Link>
      </div>
    );
  }

  if (courseLoaded && !course) {
    return (
      <div>
        <p className="text-muted-foreground">Course not found.</p>
        <Link to="/courses">Back to courses</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/courses" className="text-sm text-muted-foreground hover:text-foreground">
          ← Courses
        </Link>
      </div>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{course?.title ?? "Course"}</h1>
          {course?.description && (
            <p className="text-muted-foreground">{course.description}</p>
          )}
          {course?.author_name && (
            <p className="text-sm text-muted-foreground mt-2">
              Teacher: <span className="font-medium text-foreground">{course.author_name}</span>
            </p>
          )}
          {isTeacher && course?.is_active === false && (
            <p className="text-xs text-amber-600 mt-1">Deactivated</p>
          )}
        </div>
        {isTeacher && course ? (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={toggleCourseMutation.isPending}
              onClick={() => toggleCourseMutation.mutate(!(course.is_active ?? true))}
            >
              {(course.is_active ?? true) ? "Deactivate course" : "Reactivate course"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleEditDialogOpen}
            >
              Edit course
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={deleteCourseMutation.isPending}
              onClick={() => {
                if (confirm(`Delete course "${course.title}" and its quizzes?`)) {
                  deleteCourseMutation.mutate();
                }
              }}
            >
              Delete course
            </Button>
          </div>
        ) : !isTeacher && course && (
          <div>
            {course.is_enrolled ? (
              <Button
                size="sm"
                variant="outline"
                disabled={unenrollMutation.isPending}
                onClick={() => setOpenUnenrollDialog(true)}
              >
                Unenroll
              </Button>
            ) : (
              <Button
                size="sm"
                disabled={enrollMutation.isPending}
                onClick={() => setOpenEnrollDialog(true)}
              >
                Enroll
              </Button>
            )}
          </div>
        )}
      </div>

      <Dialog open={openEnrollDialog} onOpenChange={(isOpen) => {
        setOpenEnrollDialog(isOpen);
        if (!isOpen) {
          setEnrollPasskey("");
        }
      }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Enter course passkey</DialogTitle>
            <DialogDescription>
              Provide the course passkey to enroll in {course?.title || "this course"}.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleEnrollSubmit} className="space-y-4 py-4">
            <div>
              <Label htmlFor="detail-enroll-passkey">Passkey</Label>
              <Input
                id="detail-enroll-passkey"
                type="password"
                value={enrollPasskey}
                onChange={(e) => setEnrollPasskey(e.target.value)}
                placeholder="Enter passkey if required"
                autoFocus
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpenEnrollDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={enrollMutation.isPending}>
                {enrollMutation.isPending ? "Enrolling..." : "Enroll"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={openUnenrollDialog} onOpenChange={setOpenUnenrollDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Unenroll from course</DialogTitle>
            <DialogDescription>
              Are you sure you want to unenroll from "{course?.title}"? You will lose access to all quizzes and course materials.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenUnenrollDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={unenrollMutation.isPending}
              onClick={() => {
                unenrollMutation.mutate();
                setOpenUnenrollDialog(false);
              }}
            >
              {unenrollMutation.isPending ? "Unenrolling..." : "Unenroll"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={openEditDialog} onOpenChange={(isOpen) => {
        setOpenEditDialog(isOpen);
        if (!isOpen) {
          setEditTitle("");
          setEditDescription("");
          setEditPasskey("");
        }
      }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit course</DialogTitle>
            <DialogDescription>
              Update the course name, description, and passkey.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleEditSubmit} className="space-y-4 py-4">
            <div>
              <Label htmlFor="edit-course-title">Course name *</Label>
              <Input
                id="edit-course-title"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="e.g. Biology 101"
                required
                autoFocus
              />
            </div>
            <div>
              <Label htmlFor="edit-course-description">Description (optional)</Label>
              <Textarea
                id="edit-course-description"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Describe this course..."
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="edit-course-passkey">Passkey (optional)</Label>
              <Input
                id="edit-course-passkey"
                type="text"
                value={editPasskey}
                onChange={(e) => setEditPasskey(e.target.value)}
                placeholder="Enter passkey or leave blank for no passkey"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpenEditDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={editCourseMutation.isPending || !editTitle.trim()}>
                {editCourseMutation.isPending ? "Saving..." : "Save changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <section>
        <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
          <h2 className="text-lg font-semibold">Quizzes</h2>
          <div className="flex items-center gap-2 flex-wrap">
            {!isTeacher && (
              <div className="flex items-center gap-1 rounded-lg border border-border p-1">
                {(["all", "pending", "completed", "dueDate"] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setQuizFilter(filter)}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition ${
                      quizFilter === filter
                        ? "bg-blue-500 text-white"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    {filter === "all" ? "All" : filter === "pending" ? "Pending" : filter === "completed" ? "Completed" : "Due soon"}
                  </button>
                ))}
              </div>
            )}
            {isTeacher && (
              <Dialog open={openCreateQuiz} onOpenChange={setOpenCreateQuiz}>
                <DialogTrigger asChild>
                  <Button size="sm">New quiz</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create quiz</DialogTitle>
                    <DialogDescription>
                      Create a quiz and add questions on the next page.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateQuiz} className="space-y-4">
                    <div>
                      <Label>Title *</Label>
                      <Input
                        value={quizTitle}
                        onChange={(e) => setQuizTitle(e.target.value)}
                        placeholder="e.g. Week 1 Quiz"
                        required
                      />
                    </div>
                    <div>
                      <Label>Description (optional)</Label>
                      <Textarea
                        value={quizDescription}
                        onChange={(e) => setQuizDescription(e.target.value)}
                        placeholder="What does this quiz cover?"
                        rows={2}
                      />
                    </div>
                    <div>
                      <Label>Duration (minutes)</Label>
                      <Input
                        type="number"
                        min={1}
                        value={quizDuration}
                        onChange={(e) => setQuizDuration(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Due date (optional, for calendar)</Label>
                      <Input
                        type="datetime-local"
                        value={quizDueDate}
                        onChange={(e) => setQuizDueDate(e.target.value)}
                      />
                    </div>
                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setOpenCreateQuiz(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={createQuizMutation.isPending || !quizTitle.trim()}
                      >
                        Create and add questions
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading quizzes...</p>
        ) : filteredQuizzes.length ? (
          <ul className="space-y-2">
            {filteredQuizzes.map((quiz) => (
              <QuizRow
                key={quiz.id}
                quiz={quiz}
                courseId={id}
                isTeacher={isTeacher}
                isEnrolled={course?.is_enrolled ?? false}
                onDelete={() => deleteQuizMutation.mutate(quiz.id)}
              />
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">
            {quizFilter === "all"
              ? "No quizzes in this course yet."
              : quizFilter === "completed"
              ? "No completed quizzes."
              : quizFilter === "pending"
              ? "No pending quizzes."
              : "No quizzes with due dates."}
            {isTeacher && quizFilter === "all" && " Create one above."}
          </p>
        )}
      </section>
    </div>
  );
}

function QuizRow({
  quiz,
  courseId,
  isTeacher,
  isEnrolled,
  onDelete,
}: {
  quiz: Quiz;
  courseId: number;
  isTeacher: boolean;
  isEnrolled: boolean;
  onDelete: () => void;
}) {
  const taken = quiz.has_attempted ?? false;

  return (
    <li className={`flex items-center justify-between rounded-lg border px-4 py-3 ${
      taken 
        ? "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800" 
        : "border-border bg-card"
    }`}>
      <div>
        <p className="font-medium">{quiz.title}</p>
        <p className="text-xs text-muted-foreground">
          {quiz.description && `${quiz.description} • `}
          {quiz.duration_minutes} min
          {quiz.due_date && ` • Due ${new Date(quiz.due_date).toLocaleString()}`}
        </p>
      </div>
      <div className="flex items-center gap-2">
        {isTeacher ? (
          <>
            <Link to={`/courses/${courseId}/quizzes/${quiz.id}/edit`}>
              <Button size="sm">Edit quiz</Button>
            </Link>
            <Button size="sm" variant="ghost" onClick={onDelete}>
              Delete
            </Button>
          </>
        ) : isEnrolled ? (
          <Link to={`/quiz/${quiz.id}${taken ? "?viewAttempt=true" : ""}`}>
            <Button size="sm">{taken ? "View attempt" : "Take quiz"}</Button>
          </Link>
        ) : (
          <Button disabled size="sm" variant="outline">
            Enroll to take quiz
          </Button>
        )}
      </div>
    </li>
  );
}
