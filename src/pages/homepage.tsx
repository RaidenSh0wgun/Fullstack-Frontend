import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createCourse,
  createQuiz,
  deleteCourse,
  deleteQuiz,
  fetchQuizzesForCourse,
  fetchTeacherCourses,
  fetchQuizDetail,
  type Course,
  type Quiz,
  type QuizCreatePayload,
  type QuizQuestionPayload,
  type QuizChoicePayload,
  type QuestionType,
  enrollCourse,
  unenrollCourse,
  updateQuiz,
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

  const [openCourseDialog, setOpenCourseDialog] = useState(false);
  const [courseTitle, setCourseTitle] = useState("");
  const [courseDescription, setCourseDescription] = useState("");
  const [openQuizDialog, setOpenQuizDialog] = useState(false);
  const [quizTitle, setQuizTitle] = useState("");
  const [quizDescription, setQuizDescription] = useState("");
  const [quizDuration, setQuizDuration] = useState("10");
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestionPayload[]>([]);
  const [editingQuizId, setEditingQuizId] = useState<number | null>(null);

  const createCourseMutation = useMutation({
    mutationFn: createCourse,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      setOpenCourseDialog(false);
      setCourseTitle("");
      setCourseDescription("");
    },
    onError: (err) => {
      console.error("Failed to create course:", err);
      alert("Could not create the course. Please try again.");
    },
  });

  const deleteCourseMutation = useMutation({
    mutationFn: deleteCourse,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      setSelectedCourseId(null);
    },
    onError: (err) => {
      console.error("Failed to delete course:", err);
      alert("Could not delete this course. Please try again.");
    },
  });

  const saveQuizMutation = useMutation({
    mutationFn: async (payload: QuizCreatePayload) => {
      if (editingQuizId) {
        // For updates, send full payload to the update endpoint.
        return await updateQuiz(editingQuizId, payload);
      }
      return await createQuiz(payload);
    },
    onSuccess: () => {
      if (selectedCourseId) {
        queryClient.invalidateQueries({
          queryKey: ["quizzes", selectedCourseId],
        });
      }
      setEditingQuizId(null);
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
    onError: (err) => {
      console.error("Failed to delete quiz:", err);
      alert("Could not delete this quiz. Please try again.");
    },
  });

  const visibleQuizzes =
    selectedCourseId && quizzes
      ? quizzes.filter((quiz) => quiz.course === selectedCourseId)
      : [];

  const handleCreateCourseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseTitle.trim()) return;

    await createCourseMutation.mutateAsync({
      title: courseTitle,
      description: courseDescription,
    });
  };

  const handleDeleteCourse = async (course: Course) => {
    if (!confirm(`Delete course "${course.title}" and its quizzes?`)) return;
    await deleteCourseMutation.mutateAsync(course.id);
  };

  const handleOpenQuizDialog = () => {
    if (!selectedCourseId) {
      alert("Select a course first.");
      return;
    }
    // Reset state for a fresh create.
    setEditingQuizId(null);
    setQuizTitle("");
    setQuizDescription("");
    setQuizDuration("10");
    setQuizQuestions([]);
    setOpenQuizDialog(true);
  };

  const handleCreateQuizSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseId) return;
    if (!quizTitle.trim()) return;
    const duration = Number(quizDuration) || 10;

    const payload: QuizCreatePayload = {
      title: quizTitle.trim(),
      description: quizDescription.trim() || undefined,
      duration_minutes: duration,
      course: selectedCourseId,
      questions: quizQuestions.map((q) => {
        const base: QuizQuestionPayload = {
          text: q.text.trim(),
          question_type: q.question_type,
          correct_text: q.correct_text,
          choices: q.choices,
        };

        // For true/false, normalize choices to "True" / "False" automatically.
        if (q.question_type === "tf") {
          const correctIsTrue = (q.correct_text || "").toLowerCase() === "true";
          base.correct_text = correctIsTrue ? "True" : "False";
          base.choices = [
            { text: "True", is_correct: correctIsTrue },
            { text: "False", is_correct: !correctIsTrue },
          ];
        }

        // For identification, we don't need choices; only correct_text.
        if (q.question_type === "identification") {
          base.choices = [];
        }

        return base;
      }),
    };

    await saveQuizMutation.mutateAsync(payload);
    setOpenQuizDialog(false);
    setQuizTitle("");
    setQuizDescription("");
    setQuizDuration("10");
    setQuizQuestions([]);
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

          <Dialog open={openCourseDialog} onOpenChange={setOpenCourseDialog}>
            <DialogTrigger asChild>
              <Button
                size="sm"
                disabled={createCourseMutation.isPending}
              >
                {createCourseMutation.isPending ? "Creating..." : "New course"}
              </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Create new course</DialogTitle>
                <DialogDescription>
                  Add a course that students can enroll in and you can attach quizzes to.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleCreateCourseSubmit} className="space-y-6 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="course-title">Course title *</Label>
                  <Input
                    id="course-title"
                    value={courseTitle}
                    onChange={(e) => setCourseTitle(e.target.value)}
                    placeholder="e.g. Introduction to Python Programming"
                    required
                    autoFocus
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="course-desc">Description (optional)</Label>
                  <Textarea
                    id="course-desc"
                    value={courseDescription}
                    onChange={(e) => setCourseDescription(e.target.value)}
                    placeholder="What will students learn in this course?"
                    rows={3}
                  />
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setOpenCourseDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createCourseMutation.isPending || !courseTitle.trim()}
                  >
                    {createCourseMutation.isPending ? "Creating..." : "Create course"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
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
          <Dialog open={openQuizDialog} onOpenChange={setOpenQuizDialog}>
            <DialogTrigger asChild>
              <Button
                size="sm"
                onClick={handleOpenQuizDialog}
                disabled={!selectedCourseId || saveQuizMutation.isPending}
              >
                {saveQuizMutation.isPending ? "Working..." : "New quiz"}
              </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Create new quiz</DialogTitle>
                {editingQuizId && (
                  <p className="text-xs text-muted-foreground">
                    Editing existing quiz
                  </p>
                )}
                <DialogDescription>
                  Set the basic details for this quiz.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleCreateQuizSubmit} className="space-y-6 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="quiz-title">Quiz title *</Label>
                  <Input
                    id="quiz-title"
                    value={quizTitle}
                    onChange={(e) => setQuizTitle(e.target.value)}
                    placeholder="e.g. Week 1 Quiz"
                    required
                    autoFocus
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="quiz-desc">Description (optional)</Label>
                  <Textarea
                    id="quiz-desc"
                    value={quizDescription}
                    onChange={(e) => setQuizDescription(e.target.value)}
                    placeholder="What does this quiz cover?"
                    rows={3}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="quiz-duration">Duration (minutes)</Label>
                  <Input
                    id="quiz-duration"
                    type="number"
                    min={1}
                    value={quizDuration}
                    onChange={(e) => setQuizDuration(e.target.value)}
                  />
                </div>

                <div className="space-y-3 border-t pt-4">
                  <div className="flex items-center justify-between gap-2">
                    <Label className="font-medium">Questions</Label>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const defaultQuestionType: QuestionType = "mcq";
                        const defaultChoices: QuizChoicePayload[] = [
                          { text: "", is_correct: true },
                          { text: "", is_correct: false },
                          { text: "", is_correct: false },
                          { text: "", is_correct: false },
                        ];
                        setQuizQuestions((prev) => [
                          ...prev,
                          {
                            text: "",
                            question_type: defaultQuestionType,
                            correct_text: "",
                            choices: defaultChoices,
                          },
                        ]);
                      }}
                    >
                      Add question
                    </Button>
                  </div>

                  {quizQuestions.length === 0 && (
                    <p className="text-xs text-muted-foreground">
                      Add at least one question. You can add as many as you like.
                    </p>
                  )}

                  <div className="space-y-4 max-h-[320px] overflow-y-auto pr-1">
                    {quizQuestions.map((question, qIndex) => (
                      <div
                        key={qIndex}
                        className="space-y-3 rounded-md border border-border bg-muted/20 p-3"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-semibold">
                            Question {qIndex + 1}
                          </p>
                          <Button
                            type="button"
                            size="icon-xs"
                            variant="ghost"
                            onClick={() => {
                              setQuizQuestions((prev) =>
                                prev.filter((_, idx) => idx !== qIndex)
                              );
                            }}
                          >
                            ✕
                          </Button>
                        </div>

                        <div className="grid gap-2">
                          <Label className="text-xs">Question text</Label>
                          <Input
                            value={question.text}
                            onChange={(e) => {
                              const value = e.target.value;
                              setQuizQuestions((prev) =>
                                prev.map((q, idx) =>
                                  idx === qIndex ? { ...q, text: value } : q
                                )
                              );
                            }}
                            placeholder="e.g. What is 2 + 2?"
                            required
                          />
                        </div>

                        <div className="grid gap-2">
                          <Label className="text-xs">Question type</Label>
                          <select
                            className="h-9 rounded-md border border-input bg-background px-2 text-xs"
                            value={question.question_type}
                            onChange={(e) => {
                              const nextType = e.target
                                .value as QuestionType;
                              setQuizQuestions((prev) =>
                                prev.map((q, idx) =>
                                  idx === qIndex
                                    ? {
                                        ...q,
                                        question_type: nextType,
                                      }
                                    : q
                                )
                              );
                            }}
                          >
                            <option value="mcq">Multiple choice</option>
                            <option value="identification">
                              Identification
                            </option>
                            <option value="tf">True / False</option>
                          </select>
                        </div>

                        {question.question_type === "mcq" && (
                          <div className="space-y-2">
                            <p className="text-xs font-medium">
                              Choices (select the correct answer)
                            </p>
                            {question.choices.map((choice, cIndex) => (
                              <div
                                key={cIndex}
                                className="flex items-center gap-2"
                              >
                                <input
                                  type="radio"
                                  name={`q-${qIndex}-correct`}
                                  className="h-3 w-3"
                                  checked={choice.is_correct ?? false}
                                  onChange={() => {
                                    setQuizQuestions((prev) =>
                                      prev.map((q, idx) => {
                                        if (idx !== qIndex) return q;
                                        return {
                                          ...q,
                                          choices: q.choices.map(
                                            (ch, chIndex) => ({
                                              ...ch,
                                              is_correct: chIndex === cIndex,
                                            })
                                          ),
                                          correct_text:
                                            q.choices[cIndex]?.text || "",
                                        };
                                      })
                                    );
                                  }}
                                />
                                <Input
                                  className="h-8 text-xs"
                                  placeholder={`Choice ${cIndex + 1}`}
                                  value={choice.text}
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    setQuizQuestions((prev) =>
                                      prev.map((q, idx) => {
                                        if (idx !== qIndex) return q;
                                        const updatedChoices =
                                          q.choices.map((ch, chIndex) =>
                                            chIndex === cIndex
                                              ? { ...ch, text: value }
                                              : ch
                                          );
                                        return {
                                          ...q,
                                          choices: updatedChoices,
                                          correct_text:
                                            updatedChoices[
                                              cIndex
                                            ]?.is_correct
                                              ? updatedChoices[cIndex].text
                                              : q.correct_text,
                                        };
                                      })
                                    );
                                  }}
                                />
                              </div>
                            ))}
                            <Button
                              type="button"
                              size="xs"
                              variant="outline"
                              onClick={() => {
                                setQuizQuestions((prev) =>
                                  prev.map((q, idx) =>
                                    idx === qIndex
                                      ? {
                                          ...q,
                                          choices: [
                                            ...q.choices,
                                            {
                                              text: "",
                                              is_correct: false,
                                            },
                                          ],
                                        }
                                      : q
                                  )
                                );
                              }}
                            >
                              Add choice
                            </Button>
                          </div>
                        )}

                        {question.question_type === "identification" && (
                          <div className="grid gap-2">
                            <Label className="text-xs">
                              Correct answer (only visible to you)
                            </Label>
                            <Input
                              value={question.correct_text || ""}
                              onChange={(e) => {
                                const value = e.target.value;
                                setQuizQuestions((prev) =>
                                  prev.map((q, idx) =>
                                    idx === qIndex
                                      ? { ...q, correct_text: value }
                                      : q
                                  )
                                );
                              }}
                              placeholder="e.g. 4"
                              required
                            />
                          </div>
                        )}

                        {question.question_type === "tf" && (
                          <div className="grid gap-2">
                            <Label className="text-xs">
                              Correct answer (True or False)
                            </Label>
                            <select
                              className="h-9 rounded-md border border-input bg-background px-2 text-xs"
                              value={
                                (question.correct_text || "True")
                                  .toLowerCase()
                              }
                              onChange={(e) => {
                                const value = e.target.value;
                                setQuizQuestions((prev) =>
                                  prev.map((q, idx) =>
                                    idx === qIndex
                                      ? {
                                          ...q,
                                          correct_text:
                                            value.toLowerCase() === "true"
                                              ? "True"
                                              : "False",
                                        }
                                      : q
                                  )
                                );
                              }}
                            >
                              <option value="true">True</option>
                              <option value="false">False</option>
                            </select>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setOpenQuizDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={
                      saveQuizMutation.isPending ||
                      !quizTitle.trim() ||
                      quizQuestions.length === 0
                    }
                  >
                    {saveQuizMutation.isPending
                      ? editingQuizId
                        ? "Saving..."
                        : "Creating..."
                      : editingQuizId
                      ? "Update quiz"
                      : "Create quiz"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {!selectedCourseId ? (
          <p className="text-sm text-muted-foreground">
            Select a course to see and manage its quizzes.
          </p>
        ) : quizzesLoading ? (
          <p className="text-sm text-muted-foreground">Loading quizzes...</p>
        ) : visibleQuizzes.length ? (
          <div className="space-y-2">
            {visibleQuizzes.map((quiz) => (
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
                    size="sm"
                    variant="outline"
                    type="button"
                    onClick={async () => {
                      // Load full quiz details (including questions) for editing.
                      try {
                        const full = await fetchQuizDetail(quiz.id);
                        setEditingQuizId(full.id);
                        setQuizTitle(full.title);
                        setQuizDescription(full.description ?? "");
                        setQuizDuration(String(full.duration_minutes));
                        setQuizQuestions(
                          (full.questions || []).map((q) => ({
                            text: q.text,
                            question_type: q.question_type,
                            correct_text: q.correct_text,
                            choices: q.choices.map((c) => ({
                              text: c.text,
                              // We don't get is_correct on read; default to false,
                              // teacher can re-mark the correct answer if needed.
                              is_correct: false,
                            })),
                          }))
                        );
                        setOpenQuizDialog(true);
                      } catch (err) {
                        console.error("Failed to load quiz details", err);
                        alert("Could not load this quiz for editing.");
                      }
                    }}
                  >
                    Edit
                  </Button>
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
  const queryClient = useQueryClient();
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);

  const { data: courses, isLoading } = useQuery({
    queryKey: ["courses"],
    queryFn: fetchTeacherCourses,
  });

  const {
    data: quizzes,
    isLoading: quizzesLoading,
  } = useQuery({
    queryKey: ["student-quizzes", selectedCourseId],
    queryFn: () => fetchQuizzesForCourse(selectedCourseId as number),
    enabled: selectedCourseId !== null,
  });

  const enrollMutation = useMutation({
    mutationFn: enrollCourse,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses"] });
    },
  });

  const unenrollMutation = useMutation({
    mutationFn: unenrollCourse,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses"] });
    },
  });

  const visibleQuizzes =
    selectedCourseId && quizzes
      ? quizzes.filter((quiz) => quiz.course === selectedCourseId)
      : [];

  return (
    <div className="grid gap-6 md:grid-cols-[1.2fr,1.5fr]">
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Available courses</h2>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading courses...</p>
        ) : courses && courses.length > 0 ? (
          <div className="space-y-2">
            {courses.map((course) => {
              const isSelected = selectedCourseId === course.id;
              const enrolled = course.is_enrolled ?? false;
              const enrolling =
                enrollMutation.isPending || unenrollMutation.isPending;
              return (
                <button
                  key={course.id}
                  type="button"
                  onClick={() => setSelectedCourseId(course.id)}
                  className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-sm transition ${
                    isSelected
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
                    size="sm"
                    type="button"
                    variant={enrolled ? "outline" : "default"}
                    disabled={enrolling}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (enrolled) {
                        unenrollMutation.mutate(course.id);
                      } else {
                        enrollMutation.mutate(course.id);
                      }
                    }}
                  >
                    {enrolled ? "Enrolled" : "Enroll"}
                  </Button>
                </button>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No courses are available yet.
          </p>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">Quizzes</h2>
        </div>

        {!selectedCourseId ? (
          <p className="text-sm text-muted-foreground">
            Select a course to view its quizzes.
          </p>
        ) : quizzesLoading ? (
          <p className="text-sm text-muted-foreground">Loading quizzes...</p>
        ) : visibleQuizzes.length ? (
          <div className="space-y-2">
            {visibleQuizzes.map((quiz) => {
              const taken = quiz.has_attempted ?? false;
              return (
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
                    <a
                      href={taken ? undefined : `/quiz/${quiz.id}`}
                      onClick={(e) => {
                        if (taken) {
                          e.preventDefault();
                        }
                      }}
                    >
                      <Button
                        type="button"
                        size="sm"
                        variant={taken ? "outline" : "default"}
                        className={taken ? "opacity-60 cursor-not-allowed" : ""}
                        disabled={taken}
                      >
                        {taken ? "Completed" : "Take quiz"}
                      </Button>
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No quizzes available for this course yet.
          </p>
        )}
      </section>
    </div>
  );
}