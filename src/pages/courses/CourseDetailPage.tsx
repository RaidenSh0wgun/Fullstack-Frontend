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
import { Star, BookOpen, Plus, ArrowLeft, Edit, Trash2, Users } from "lucide-react";

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
    onError: () => {
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
    enabled: Number.isInteger(id) && (isTeacher || course?.is_enrolled),
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
  const [quizShowScores, setQuizShowScores] = useState(true);
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
        .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime());
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
      setQuizShowScores(true);
      navigate(`/courses/${id}/quizzes/${created.id}/questions`);
    },
    onError: () => {
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
    onError: () => {
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
      show_scores_after_quiz: quizShowScores,
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
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/30 to-slate-950 p-6 text-white">
        <p className="text-slate-400">Invalid course.</p>
        <Link to="/courses" className="text-yellow-400 hover:underline">← Back to courses</Link>
      </div>
    );
  }

  if (courseLoaded && !course) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/30 to-slate-950 p-6 text-white">
        <p className="text-slate-400">Course not found.</p>
        <Link to="/courses" className="text-yellow-400 hover:underline">← Back to courses</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/30 to-slate-950 p-4 sm:p-8">
      <div className="max-w-5xl mx-auto">
        <Link 
          to="/courses" 
          className="inline-flex items-center gap-2 text-slate-400 hover:text-yellow-400 mb-8 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" /> Back to Courses
        </Link>

        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 sm:p-10 shadow-2xl shadow-black/50 mb-10">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-8">
            <div className="flex items-start gap-6">
              <div className="w-20 h-20 bg-gradient-to-br from-red-500/20 to-yellow-500/20 rounded-3xl flex items-center justify-center border border-white/10 flex-shrink-0 shadow-inner">
                <BookOpen className="w-11 h-11 text-yellow-400" />
              </div>
              <div>
                <h1 className="text-4xl sm:text-5xl font-black bg-gradient-to-r from-red-400 via-yellow-400 to-orange-400 bg-clip-text text-transparent leading-none">
                  {course?.title ?? "Course"}
                </h1>
                {course?.description && (
                  <p className="text-xl text-slate-300 mt-5 max-w-2xl">{course.description}</p>
                )}
                {course?.author_name && (
                  <p className="text-slate-400 mt-4 flex items-center gap-2">
                    <Users className="w-5 h-5" /> Teacher: <span className="font-medium text-white">{course.author_name}</span>
                  </p>
                )}
                {isTeacher && course?.is_active === false && (
                  <p className="text-amber-400 text-sm mt-3 font-medium">● Deactivated</p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              {isTeacher && course && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleCourseMutation.mutate(!(course.is_active ?? true))}
                    disabled={toggleCourseMutation.isPending}
                    className="rounded-2xl border-slate-600 hover:bg-slate-800"
                  >
                    {(course.is_active ?? true) ? "Deactivate" : "Reactivate"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleEditDialogOpen}
                    className="rounded-2xl border-slate-600 hover:bg-slate-800"
                  >
                    <Edit className="w-4 h-4 mr-2" /> Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      if (confirm(`Delete course "${course.title}" and its quizzes?`)) {
                        deleteCourseMutation.mutate();
                      }
                    }}
                    disabled={deleteCourseMutation.isPending}
                    className="text-red-400 hover:text-red-500 hover:bg-red-500/10 rounded-2xl"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </>
              )}

              {!isTeacher && course?.is_enrolled && (
                <Button
                  variant="outline"
                  onClick={() => setOpenUnenrollDialog(true)}
                  disabled={unenrollMutation.isPending}
                  className="rounded-2xl border-slate-600 hover:bg-slate-800"
                >
                  Unenroll
                </Button>
              )}
            </div>
          </div>
        </div>

        {isTeacher || course?.is_enrolled ? (
          <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 sm:p-10 shadow-2xl shadow-black/50">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10">
              <div className="flex items-center gap-4">
                <Star className="w-9 h-9 text-yellow-400" />
                <h2 className="text-3xl font-bold text-white">Quizzes</h2>
              </div>

              <div className="flex items-center gap-4 flex-wrap">
                {!isTeacher && (
                  <div className="flex bg-slate-800/90 rounded-2xl p-1 border border-slate-700">
                    {(["all", "pending", "completed", "dueDate"] as const).map((filter) => (
                      <button
                        key={filter}
                        onClick={() => setQuizFilter(filter)}
                        className={`px-6 py-2.5 text-sm font-medium rounded-xl transition-all ${
                          quizFilter === filter
                            ? "bg-gradient-to-r from-red-500 to-yellow-500 text-white shadow-md"
                            : "text-slate-400 hover:text-white"
                        }`}
                      >
                        {filter === "all" ? "All" : filter === "pending" ? "Pending" : filter === "completed" ? "Completed" : "Due Soon"}
                      </button>
                    ))}
                  </div>
                )}

                {isTeacher && (
                  <Dialog open={openCreateQuiz} onOpenChange={setOpenCreateQuiz}>
                    <DialogTrigger asChild>
                      <Button className="bg-gradient-to-r from-red-500 via-yellow-500 to-orange-500 text-white font-bold rounded-2xl h-14 px-8 flex items-center gap-3 shadow-lg shadow-orange-500/30 hover:brightness-110">
                        <Plus className="w-6 h-6" />
                        NEW QUIZ
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-slate-900 border-slate-700 text-white">
                      <DialogHeader>
                        <DialogTitle className="text-2xl">Create New Quiz</DialogTitle>
                        <DialogDescription className="text-slate-400">
                          Create a quiz and add questions on the next page.
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleCreateQuiz} className="space-y-6">
                        <div>
                          <Label className="text-slate-200">Quiz Title *</Label>
                          <Input
                            value={quizTitle}
                            onChange={(e) => setQuizTitle(e.target.value)}
                            placeholder="e.g. Week 1 Quiz"
                            required
                            className="bg-slate-800 border-slate-600 h-12 rounded-2xl focus:border-yellow-400"
                          />
                        </div>
                        <div>
                          <Label className="text-slate-200">Description (optional)</Label>
                          <Textarea
                            value={quizDescription}
                            onChange={(e) => setQuizDescription(e.target.value)}
                            placeholder="What does this quiz cover?"
                            rows={3}
                            className="bg-slate-800 border-slate-600 rounded-2xl focus:border-yellow-400"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-slate-200">Duration (minutes)</Label>
                            <Input
                              type="number"
                              min={1}
                              value={quizDuration}
                              onChange={(e) => setQuizDuration(e.target.value)}
                              className="bg-slate-800 border-slate-600 h-12 rounded-2xl"
                            />
                          </div>
                          <div>
                            <Label className="text-slate-200">Due Date (optional)</Label>
                            <Input
                              type="datetime-local"
                              value={quizDueDate}
                              onChange={(e) => setQuizDueDate(e.target.value)}
                              className="bg-slate-800 border-slate-600 h-12 rounded-2xl"
                            />
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="showScores"
                            checked={quizShowScores}
                            onChange={(e) => setQuizShowScores(e.target.checked)}
                            className="w-4 h-4 text-yellow-400 bg-slate-800 border-slate-600 rounded focus:ring-yellow-400 focus:ring-2"
                          />
                          <Label htmlFor="showScores" className="text-slate-200 text-sm">
                            Allow students to view their scores after completing the quiz
                          </Label>
                        </div>
                        <DialogFooter>
                          <Button type="button" variant="outline" onClick={() => setOpenCreateQuiz(false)} className="rounded-2xl">
                            Cancel
                          </Button>
                          <Button
                            type="submit"
                            disabled={createQuizMutation.isPending || !quizTitle.trim()}
                            className="bg-gradient-to-r from-red-500 via-yellow-500 to-orange-500 rounded-2xl"
                          >
                            Create & Add Questions
                          </Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </div>

            {isLoading ? (
              <p className="text-slate-400 text-center py-12">Loading quizzes...</p>
            ) : filteredQuizzes.length ? (
              <div className="space-y-4">
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
              </div>
            ) : (
              <div className="text-center py-20">
                <Star className="w-16 h-16 text-yellow-400 mx-auto mb-6 opacity-50" />
                <p className="text-slate-400 text-xl">
                  {quizFilter === "all" ? "No quizzes in this course yet." : 
                   quizFilter === "completed" ? "No completed quizzes." :
                   quizFilter === "pending" ? "No pending quizzes." : "No quizzes with due dates."}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 sm:p-10 shadow-2xl shadow-black/50 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-red-500/20 to-yellow-500/20 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-white/10">
              <Star className="w-11 h-11 text-yellow-400" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">Enroll to Access Quizzes</h2>
            <p className="text-slate-400 text-lg mb-8 max-w-md mx-auto">
              You need to enroll in this course first to view and take the quizzes.
            </p>
            <Button
              onClick={() => setOpenEnrollDialog(true)}
              disabled={enrollMutation.isPending}
              className="bg-gradient-to-r from-red-500 via-yellow-500 to-orange-500 text-white font-bold rounded-2xl px-10 py-6 text-lg shadow-lg shadow-orange-500/30"
            >
              ENROLL NOW
            </Button>
          </div>
        )}
      </div>

      <Dialog open={openEnrollDialog} onOpenChange={(isOpen) => {
        setOpenEnrollDialog(isOpen);
        if (!isOpen) setEnrollPasskey("");
      }}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle>Enter Passkey</DialogTitle>
            <DialogDescription>Provide the course passkey to enroll in {course?.title}.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEnrollSubmit} className="space-y-6">
            <div>
              <Label>Passkey</Label>
              <Input
                type="password"
                value={enrollPasskey}
                onChange={(e) => setEnrollPasskey(e.target.value)}
                placeholder="Enter passkey"
                className="bg-slate-800 border-slate-600 h-12 rounded-2xl"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpenEnrollDialog(false)} className="rounded-2xl">Cancel</Button>
              <Button type="submit" disabled={enrollMutation.isPending} className="bg-gradient-to-r from-red-500 via-yellow-500 to-orange-500 rounded-2xl">
                {enrollMutation.isPending ? "Enrolling..." : "Enroll"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={openUnenrollDialog} onOpenChange={setOpenUnenrollDialog}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle>Unenroll from Course</DialogTitle>
            <DialogDescription>
              Are you sure you want to unenroll from "{course?.title}"? You will lose access to all quizzes.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenUnenrollDialog(false)} className="rounded-2xl">Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => {
                unenrollMutation.mutate();
                setOpenUnenrollDialog(false);
              }}
              disabled={unenrollMutation.isPending}
              className="rounded-2xl"
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
        <DialogContent className="bg-slate-900 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle>Edit Course</DialogTitle>
            <DialogDescription>Update course details.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-6">
            <div>
              <Label>Course Name *</Label>
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Course name"
                required
                className="bg-slate-800 border-slate-600 h-12 rounded-2xl"
              />
            </div>
            <div>
              <Label>Description (optional)</Label>
              <Textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Describe this course..."
                rows={4}
                className="bg-slate-800 border-slate-600 rounded-2xl"
              />
            </div>
            <div>
              <Label>Passkey (optional)</Label>
              <Input
                type="text"
                value={editPasskey}
                onChange={(e) => setEditPasskey(e.target.value)}
                placeholder="Leave blank for no passkey"
                className="bg-slate-800 border-slate-600 h-12 rounded-2xl"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpenEditDialog(false)} className="rounded-2xl">Cancel</Button>
              <Button type="submit" disabled={editCourseMutation.isPending || !editTitle.trim()} className="bg-gradient-to-r from-red-500 via-yellow-500 to-orange-500 rounded-2xl">
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
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
    <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-slate-900/70 border border-slate-700 hover:border-yellow-400/50 rounded-2xl p-7 sm:p-8 transition-all shadow-xl shadow-black/30 group ${taken ? "border-yellow-400/40" : ""}`}>
      <div className="flex-1">
        <p className="font-bold text-2xl text-white">{quiz.title}</p>
        <p className="text-slate-400 mt-2 text-[15px]">
          {quiz.description && `${quiz.description} • `}
          {quiz.duration_minutes} min
          {quiz.due_date && ` • Due ${new Date(quiz.due_date).toLocaleString()}`}
        </p>
      </div>

      <div className="flex items-center gap-4">
        {isTeacher ? (
          <>
            <Link to={`/courses/${courseId}/quizzes/${quiz.id}/edit`}>
              <Button variant="outline" className="rounded-2xl border-slate-600">Edit Quiz</Button>
            </Link>
            <Button 
              variant="ghost" 
              onClick={onDelete}
              className="text-red-400 hover:text-red-500 hover:bg-red-500/10 rounded-2xl p-3"
            >
              <Trash2 className="w-5 h-5" />
            </Button>
          </>
        ) : isEnrolled ? (
          <Link to={`/quiz/${quiz.id}${taken ? "?viewAttempt=true" : ""}`}>
            <Button className={`rounded-2xl font-bold px-8 py-6 shadow-lg ${taken 
              ? "bg-gradient-to-r from-yellow-400 to-amber-500 text-black" 
              : "bg-gradient-to-r from-red-500 via-yellow-500 to-orange-500 text-white shadow-orange-500/40"}`}>
              {taken ? "View Attempt" : "Take Quiz"}
            </Button>
          </Link>
        ) : (
          <Button disabled variant="outline" className="rounded-2xl">Enroll to Access</Button>
        )}
      </div>
    </div>
  );
}