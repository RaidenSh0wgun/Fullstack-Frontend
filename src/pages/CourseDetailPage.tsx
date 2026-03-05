import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchCourseDetail,
  fetchQuizzesForCourse,
  createQuiz,
  deleteQuiz,
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
    mutationFn: () => enrollCourse(id),
    onSuccess: () => {
      refetchCourse();
      queryClient.invalidateQueries({ queryKey: ["courses"] });
    },
  });
  const unenrollMutation = useMutation({
    mutationFn: () => unenrollCourse(id),
    onSuccess: () => {
      refetchCourse();
      queryClient.invalidateQueries({ queryKey: ["courses"] });
    },
  });

  const { data: quizzes, isLoading } = useQuery({
    queryKey: ["quizzes", id],
    queryFn: () => fetchQuizzesForCourse(id),
    enabled: Number.isInteger(id),
  });

  const [openCreateQuiz, setOpenCreateQuiz] = useState(false);
  const [quizTitle, setQuizTitle] = useState("");
  const [quizDescription, setQuizDescription] = useState("");
  const [quizDuration, setQuizDuration] = useState("10");
  const [quizDueDate, setQuizDueDate] = useState("");

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
        </div>
        {!isTeacher && course && (
          <div>
            {course.is_enrolled ? (
              <Button
                size="sm"
                variant="outline"
                disabled={unenrollMutation.isPending}
                onClick={() => unenrollMutation.mutate()}
              >
                Unenroll
              </Button>
            ) : (
              <Button
                size="sm"
                disabled={enrollMutation.isPending}
                onClick={() => enrollMutation.mutate()}
              >
                Enroll
              </Button>
            )}
          </div>
        )}
      </div>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Quizzes</h2>
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

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading quizzes...</p>
        ) : quizzes?.length ? (
          <ul className="space-y-2">
            {quizzes.map((quiz) => (
              <QuizRow
                key={quiz.id}
                quiz={quiz}
                courseId={id}
                isTeacher={isTeacher}
                onDelete={() => deleteQuizMutation.mutate(quiz.id)}
              />
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">
            No quizzes in this course yet.
            {isTeacher && " Create one above."}
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
  onDelete,
}: {
  quiz: Quiz;
  courseId: number;
  isTeacher: boolean;
  onDelete: () => void;
}) {
  const taken = quiz.has_attempted ?? false;

  return (
    <li className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3">
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
            <Link to={`/courses/${courseId}/quizzes/${quiz.id}/questions`}>
              <Button size="sm" variant="outline">
                Edit questions
              </Button>
            </Link>
            <Button size="sm" variant="ghost" onClick={onDelete}>
              Delete
            </Button>
          </>
        ) : (
          <Link to={taken ? "#" : `/quiz/${quiz.id}`}>
            <Button size="sm" disabled={taken}>
              {taken ? "Completed" : "Take quiz"}
            </Button>
          </Link>
        )}
      </div>
    </li>
  );
}
