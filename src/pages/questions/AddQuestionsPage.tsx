import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchQuizDetail,
  fetchCourseDetail,
  createQuestion,
  deleteQuestion,
  type QuizDetail,
  type QuizQuestionPayload,
  type QuizChoicePayload,
  type QuestionType,
} from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AddQuestionsPage() {
  const { courseId, quizId } = useParams<{ courseId: string; quizId: string }>();
  const cid = courseId ? parseInt(courseId, 10) : NaN;
  const qid = quizId ? parseInt(quizId, 10) : NaN;
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: quiz, isLoading } = useQuery({
    queryKey: ["quiz", qid],
    queryFn: () => fetchQuizDetail(qid),
    enabled: Number.isInteger(qid),
  });

  const { data: course } = useQuery({
    queryKey: ["course", cid],
    queryFn: () => fetchCourseDetail(cid),
    enabled: Number.isInteger(cid),
  });

  const [questionText, setQuestionText] = useState("");
  const [questionType, setQuestionType] = useState<QuestionType>("mcq");
  const [answerFormat, setAnswerFormat] = useState("exact");
  const [correctTexts, setCorrectTexts] = useState<string[]>([""]);
  const [choices, setChoices] = useState<QuizChoicePayload[]>([
    { text: "", is_correct: true },
    { text: "", is_correct: false },
    { text: "", is_correct: false },
    { text: "", is_correct: false },
  ]);

  const createQuestionMutation = useMutation({
    mutationFn: (payload: QuizQuestionPayload) => createQuestion(qid, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quiz", qid] });
      setQuestionText("");
      setAnswerFormat("exact");
      setCorrectTexts([""]);
      setChoices([
        { text: "", is_correct: true },
        { text: "", is_correct: false },
        { text: "", is_correct: false },
        { text: "", is_correct: false },
      ]);
    },
  });

  const handleAddQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionText.trim()) return;

    const payload: QuizQuestionPayload = {
      text: questionText.trim(),
      question_type: questionType,
      answer_format: answerFormat,
      correct_text: correctTexts.map((v) => v.trim()).filter(Boolean).join("\n"),
      choices: choices.map((c) => ({ ...c })),
    };

    if (questionType === "tf") {
      const correctIsTrue = (correctTexts[0] || "").toLowerCase() === "true";
      payload.correct_text = correctIsTrue ? "True" : "False";
      payload.choices = [
        { text: "True", is_correct: correctIsTrue },
        { text: "False", is_correct: !correctIsTrue },
      ];
    }

    if (questionType === "identification" || questionType === "enumeration") {
      payload.choices = [];
    }

    createQuestionMutation.mutate(payload);
  };

  if (!Number.isInteger(qid) || !Number.isInteger(cid)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/30 to-slate-950 p-8 text-white">
        <p className="text-slate-400">Invalid course or quiz.</p>
        <Link to="/courses" className="text-yellow-400 hover:underline">← Back to courses</Link>
      </div>
    );
  }

  if (isLoading || !quiz) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/30 to-slate-950 p-8 text-white">
        <p className="text-slate-400">Loading quiz...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/30 to-slate-950 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Back Navigation */}
        <Link
          to={`/courses/${cid}`}
          className="inline-flex items-center gap-2 text-slate-400 hover:text-yellow-400 transition-colors"
        >
          ← {course?.title ?? "Back to Course"}
        </Link>

        <div>
          <h1 className="text-4xl font-black bg-gradient-to-r from-red-400 via-yellow-400 to-orange-400 bg-clip-text text-transparent">
            Add Questions
          </h1>
          <p className="text-xl text-slate-300 mt-2">{quiz.title}</p>
        </div>

        {/* Add New Question Form */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 shadow-2xl shadow-black/50">
          <h2 className="text-2xl font-bold text-white mb-6">New Question</h2>

          <form onSubmit={handleAddQuestion} className="space-y-6">
            <div>
              <Label className="text-slate-200">Question Text *</Label>
              <Input
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                placeholder="e.g. What is 2 + 2?"
                className="bg-slate-800 border-slate-600 h-12 rounded-2xl focus:border-yellow-400 mt-2"
                required
              />
            </div>

            <div>
              <Label className="text-slate-200">Question Type</Label>
              <select
                className="mt-2 h-12 w-full rounded-2xl border border-slate-600 bg-slate-800 px-4 text-white focus:border-yellow-400"
                value={questionType}
                onChange={(e) => {
                  const next = e.target.value as QuestionType;
                  setQuestionType(next);
                  if (next === "identification") {
                    setCorrectTexts((prev) => [prev[0] ?? ""]);
                  }
                }}
              >
                <option value="mcq">Multiple Choice</option>
                <option value="identification">Identification</option>
                <option value="enumeration">Enumeration</option>
                <option value="tf">True / False</option>
              </select>
            </div>

            {(questionType === "identification" || questionType === "enumeration") && (
              <div>
                <Label className="text-slate-200">Answer Format</Label>
                <select
                  className="mt-2 h-12 w-full rounded-2xl border border-slate-600 bg-slate-800 px-4 text-white focus:border-yellow-400"
                  value={answerFormat}
                  onChange={(e) => setAnswerFormat(e.target.value)}
                >
                  <option value="exact">Exact case</option>
                  <option value="ignore">Ignore case</option>
                  <option value="upper">All uppercase</option>
                  <option value="lower">All lowercase</option>
                  <option value="capitalize">Capitalize</option>
                </select>
              </div>
            )}

            {questionType === "mcq" && (
              <div className="space-y-3">
                <Label className="text-slate-200">Choices (select the correct one)</Label>
                {choices.map((choice, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="correct"
                      checked={choice.is_correct ?? false}
                      onChange={() =>
                        setChoices((prev) =>
                          prev.map((c, i) => ({ ...c, is_correct: i === idx }))
                        )
                      }
                      className="accent-yellow-400"
                    />
                    <Input
                      value={choice.text}
                      onChange={(e) =>
                        setChoices((prev) =>
                          prev.map((c, i) =>
                            i === idx ? { ...c, text: e.target.value } : c
                          )
                        )
                      }
                      placeholder={`Choice ${idx + 1}`}
                      className="bg-slate-800 border-slate-600 rounded-2xl"
                    />
                  </div>
                ))}
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setChoices((prev) => [...prev, { text: "", is_correct: false }])
                  }
                  className="rounded-2xl border-slate-600"
                >
                  + Add Choice
                </Button>
              </div>
            )}

            {(questionType === "identification" || questionType === "enumeration") && (
              <div className="space-y-3">
                <Label className="text-slate-200">Correct Answer{questionType === "enumeration" ? "s" : ""}</Label>
                {(questionType === "identification" ? correctTexts.slice(0, 1) : correctTexts).map(
                  (value, idx, arr) => (
                    <div key={idx} className="flex items-center gap-3">
                      <Input
                        value={value}
                        onChange={(e) =>
                          setCorrectTexts((prev) =>
                            prev.map((v, i) => (i === idx ? e.target.value : v))
                          )
                        }
                        placeholder={`Answer ${idx + 1}`}
                        className="bg-slate-800 border-slate-600 rounded-2xl"
                      />
                      {questionType === "enumeration" && arr.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setCorrectTexts((prev) =>
                              prev.length <= 1 ? prev : prev.filter((_, i) => i !== idx)
                            )
                          }
                          className="text-red-400 hover:text-red-500"
                        >
                          ✕
                        </Button>
                      )}
                    </div>
                  )
                )}
                {questionType === "enumeration" && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setCorrectTexts((prev) => [...prev, ""])}
                    className="rounded-2xl border-slate-600"
                  >
                    + Add Another Answer
                  </Button>
                )}
              </div>
            )}

            {questionType === "tf" && (
              <div>
                <Label className="text-slate-200">Correct Answer</Label>
                <select
                  className="mt-2 h-12 w-full rounded-2xl border border-slate-600 bg-slate-800 px-4 text-white focus:border-yellow-400"
                  value={(correctTexts[0] || "True").toLowerCase()}
                  onChange={(e) =>
                    setCorrectTexts([e.target.value === "true" ? "True" : "False"])
                  }
                >
                  <option value="true">True</option>
                  <option value="false">False</option>
                </select>
              </div>
            )}

            <Button
              type="submit"
              disabled={createQuestionMutation.isPending || !questionText.trim()}
              className="bg-gradient-to-r from-red-500 via-yellow-500 to-orange-500 text-white font-bold rounded-2xl px-8 py-6 shadow-lg hover:brightness-110"
            >
              {createQuestionMutation.isPending ? "Adding Question..." : "Add Question"}
            </Button>
          </form>
        </div>

        {/* Current Questions List */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 shadow-2xl shadow-black/50">
          <h2 className="text-2xl font-bold text-white mb-6">
            Current Questions ({quiz.questions?.length ?? 0})
          </h2>

          {quiz.questions?.length ? (
            <div className="space-y-3">
              {quiz.questions.map((q) => (
                <QuestionItem
                  key={q.id}
                  question={q}
                  quizId={qid}
                  onDeleted={() =>
                    queryClient.invalidateQueries({ queryKey: ["quiz", qid] })
                  }
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-slate-400">No questions added yet. Add one above.</p>
            </div>
          )}
        </div>

        {/* Finish Button */}
        <div className="flex justify-end">
          <Button
            variant="outline"
            onClick={() => navigate(`/courses/${cid}`)}
            className="rounded-2xl border-slate-600 hover:bg-slate-800 px-8"
          >
            Finish & Return to Course
          </Button>
        </div>
      </div>
    </div>
  );
}

function QuestionItem({
  question,
  quizId,
  onDeleted,
}: {
  question: QuizDetail["questions"][0];
  quizId: number;
  onDeleted: () => void;
}) {
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: () => deleteQuestion(question.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quiz", quizId] });
      onDeleted();
    },
  });

  return (
    <div className="flex items-center justify-between bg-slate-900 border border-slate-700 hover:border-yellow-400/30 rounded-2xl px-6 py-4 transition-all group">
      <div className="flex-1 min-w-0 pr-4">
        <p className="text-white font-medium leading-tight">{question.text}</p>
        <p className="text-xs text-slate-500 mt-1">
          {question.question_type.toUpperCase()}
        </p>
      </div>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => {
          if (confirm("Delete this question?")) deleteMutation.mutate();
        }}
        disabled={deleteMutation.isPending}
        className="text-red-400 hover:text-red-500 hover:bg-red-500/10 rounded-2xl px-4"
      >
        Delete
      </Button>
    </div>
  );
}