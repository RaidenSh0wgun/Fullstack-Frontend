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
      <div>
        <p className="text-muted-foreground">Invalid course or quiz.</p>
        <Link to="/courses">Back to courses</Link>
      </div>
    );
  }

  if (isLoading || !quiz) {
    return <p className="text-muted-foreground">Loading quiz...</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          to={`/courses/${cid}`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← {course?.title ?? "Course"}
        </Link>
      </div>
      <h1 className="text-2xl font-bold">Add questions: {quiz.title}</h1>

      <section className="rounded-xl border border-border bg-card p-4 space-y-4">
        <h2 className="font-semibold">New question</h2>
        <form onSubmit={handleAddQuestion} className="space-y-4">
          <div>
            <Label>Question text *</Label>
            <Input
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              placeholder="e.g. What is 2 + 2?"
              required
            />
          </div>
          <div>
            <Label>Type</Label>
            <select
              className="h-9 rounded-md border border-input bg-background px-2 w-full"
              value={questionType}
              onChange={(e) => setQuestionType(e.target.value as QuestionType)}
            >
              <option value="mcq">Multiple choice</option>
              <option value="identification">Identification</option>
              <option value="enumeration">Enumeration</option>
              <option value="tf">True / False</option>
            </select>
          </div>
          {questionType === "mcq" && (
            <div className="space-y-2">
              <Label>Choices (select correct)</Label>
              {choices.map((choice, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="correct"
                    checked={choice.is_correct ?? false}
                    onChange={() =>
                      setChoices((prev) =>
                        prev.map((c, i) => ({
                          ...c,
                          is_correct: i === idx,
                        }))
                      )
                    }
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
              >
                Add choice
              </Button>
            </div>
          )}
          {(questionType === "identification" || questionType === "enumeration") && (
            <div className="space-y-2">
              <Label>Correct answer</Label>
              {correctTexts.map((value, idx) => (
                <Input
                  key={idx}
                  value={value}
                  onChange={(e) =>
                    setCorrectTexts((prev) =>
                      prev.map((v, i) => (i === idx ? e.target.value : v))
                    )
                  }
                  placeholder={`Answer ${idx + 1}`}
                />
              ))}
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setCorrectTexts((prev) => [...prev, ""])}
              >
                Add another answer
              </Button>
            </div>
          )}
          {questionType === "tf" && (
            <div>
              <Label>Correct answer</Label>
              <select
                className="h-9 rounded-md border border-input bg-background px-2"
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
          >
            {createQuestionMutation.isPending ? "Adding..." : "Add question"}
          </Button>
        </form>
      </section>

      <section>
        <h2 className="font-semibold mb-2">
          Current questions ({quiz.questions?.length ?? 0})
        </h2>
        {quiz.questions?.length ? (
          <ul className="space-y-2">
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
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">
            No questions yet. Add one above.
          </p>
        )}
      </section>

      <Button variant="outline" onClick={() => navigate(`/courses/${cid}`)}>
        Finish
      </Button>
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
    <li className="flex items-center justify-between rounded-lg border border-border bg-muted/20 px-3 py-2">
      <span className="text-sm font-medium">{question.text}</span>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => {
          if (confirm("Delete this question?")) deleteMutation.mutate();
        }}
        disabled={deleteMutation.isPending}
      >
        Delete
      </Button>
    </li>
  );
}
