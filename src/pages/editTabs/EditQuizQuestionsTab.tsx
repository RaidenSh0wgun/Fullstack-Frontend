import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createQuestion,
  deleteQuestion,
  fetchQuizDetail,
  updateQuestion,
  type QuestionType,
  type QuizChoicePayload,
  type QuizDetail,
  type QuizQuestionPayload,
} from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function buildPayload(input: {
  text: string;
  question_type: QuestionType;
  correct_text?: string;
  choices: QuizChoicePayload[];
}): QuizQuestionPayload {
  if (input.question_type === "tf") {
    const correctIsTrue = (input.correct_text || "True").toLowerCase() === "true";
    return {
      text: input.text.trim(),
      question_type: "tf",
      correct_text: correctIsTrue ? "True" : "False",
      choices: [
        { text: "True", is_correct: correctIsTrue },
        { text: "False", is_correct: !correctIsTrue },
      ],
    };
  }

  if (input.question_type === "identification" || input.question_type === "enumeration") {
    return {
      text: input.text.trim(),
      question_type: input.question_type,
      correct_text: (input.correct_text || "").trim(),
      choices: [],
    };
  }

  const cleanedChoices = input.choices
    .map((c) => ({ ...c, text: (c.text || "").trim() }))
    .filter((c) => c.text.length > 0);

  const hasCorrect = cleanedChoices.some((c) => c.is_correct);
  const normalized = hasCorrect
    ? cleanedChoices
    : cleanedChoices.map((c, idx) => ({ ...c, is_correct: idx === 0 }));

  return {
    text: input.text.trim(),
    question_type: "mcq",
    correct_text: "",
    choices: normalized,
  };
}

export default function EditQuizQuestionsTab() {
  const { quizId } = useParams<{ courseId: string; quizId: string }>();
  const qid = quizId ? parseInt(quizId, 10) : NaN;
  const queryClient = useQueryClient();

  const { data: quiz, isLoading } = useQuery({
    queryKey: ["quiz", qid],
    queryFn: () => fetchQuizDetail(qid),
    enabled: Number.isInteger(qid),
  });

  const [newText, setNewText] = useState("");
  const [newType, setNewType] = useState<QuestionType>("mcq");
  const [newCorrectTexts, setNewCorrectTexts] = useState<string[]>([""]);
  const [newChoices, setNewChoices] = useState<QuizChoicePayload[]>([
    { text: "", is_correct: true },
    { text: "", is_correct: false },
    { text: "", is_correct: false },
    { text: "", is_correct: false },
  ]);

  const createMutation = useMutation({
    mutationFn: (payload: QuizQuestionPayload) => createQuestion(qid, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quiz", qid] });
      setNewText("");
      setNewType("mcq");
      setNewCorrectTexts([""]);
      setNewChoices([
        { text: "", is_correct: true },
        { text: "", is_correct: false },
        { text: "", is_correct: false },
        { text: "", is_correct: false },
      ]);
    },
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newText.trim()) return;
    const payload = buildPayload({
      text: newText,
      question_type: newType,
      correct_text: newCorrectTexts.map((v) => v.trim()).filter(Boolean).join("\n"),
      choices: newChoices,
    });
    createMutation.mutate(payload);
  };

  if (!Number.isInteger(qid)) {
    return <p className="text-sm text-muted-foreground">Invalid quiz.</p>;
  }

  if (isLoading || !quiz) {
    return <p className="text-sm text-muted-foreground">Loading questions...</p>;
  }

  return (
    <div className="space-y-5">
      <section className="rounded-xl border border-border bg-card p-4 space-y-4">
        <h2 className="font-semibold">New question</h2>
        <form onSubmit={handleAdd} className="space-y-4">
          <div>
            <Label>Question text *</Label>
            <Input
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              placeholder="e.g. What is 2 + 2?"
              required
            />
          </div>

          <div>
            <Label>Type</Label>
            <select
              className="h-9 rounded-md border border-input bg-background px-2 w-full"
              value={newType}
              onChange={(e) => {
                const next = e.target.value as QuestionType;
                setNewType(next);
                if (next === "identification") {
                  setNewCorrectTexts((prev) => [prev[0] ?? ""]);
                }
              }}
            >
              <option value="mcq">Multiple choice</option>
              <option value="identification">Identification</option>
              <option value="enumeration">Enumeration</option>
              <option value="tf">True / False</option>
            </select>
          </div>

          {newType === "mcq" && (
            <div className="space-y-2">
              <Label>Choices (select correct)</Label>
              {newChoices.map((choice, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="new-correct"
                    checked={choice.is_correct ?? false}
                    onChange={() =>
                      setNewChoices((prev) =>
                        prev.map((c, i) => ({ ...c, is_correct: i === idx }))
                      )
                    }
                  />
                  <Input
                    value={choice.text}
                    onChange={(e) =>
                      setNewChoices((prev) =>
                        prev.map((c, i) => (i === idx ? { ...c, text: e.target.value } : c))
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
                  setNewChoices((prev) => [...prev, { text: "", is_correct: false }])
                }
              >
                Add choice
              </Button>
            </div>
          )}

          {(newType === "identification" || newType === "enumeration") && (
            <div className="space-y-2">
              <Label>Correct answer</Label>
              {(newType === "identification" ? newCorrectTexts.slice(0, 1) : newCorrectTexts).map(
                (value, idx, arr) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Input
                      value={value}
                      onChange={(e) =>
                        setNewCorrectTexts((prev) =>
                          prev.map((v, i) => (i === idx ? e.target.value : v))
                        )
                      }
                      placeholder={`Answer ${idx + 1}`}
                    />
                    {newType === "enumeration" && (
                      <Button
                        type="button"
                        size="icon-xs"
                        variant="ghost"
                        disabled={arr.length <= 1}
                        onClick={() =>
                          setNewCorrectTexts((prev) =>
                            prev.length <= 1 ? prev : prev.filter((_, i) => i !== idx)
                          )
                        }
                        aria-label={`Remove answer ${idx + 1}`}
                        title="Remove"
                      >
                        ✕
                      </Button>
                    )}
                  </div>
                )
              )}
              {newType === "enumeration" && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setNewCorrectTexts((prev) => [...prev, ""])}
                >
                  Add another correct answer
                </Button>
              )}
            </div>
          )}

          {newType === "tf" && (
            <div>
              <Label>Correct answer</Label>
              <select
                className="h-9 rounded-md border border-input bg-background px-2"
                value={(newCorrectTexts[0] || "True").toLowerCase()}
                onChange={(e) => setNewCorrectTexts([e.target.value === "true" ? "True" : "False"])}
              >
                <option value="true">True</option>
                <option value="false">False</option>
              </select>
            </div>
          )}

          <Button type="submit" disabled={createMutation.isPending || !newText.trim()}>
            {createMutation.isPending ? "Adding..." : "Add question"}
          </Button>
        </form>
      </section>

      <section className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-semibold">Questions ({quiz.questions?.length ?? 0})</h2>
          <p className="text-xs text-muted-foreground">
            Scroll inside the list to edit quickly.
          </p>
        </div>

        <div className="max-h-[60vh] overflow-auto rounded-xl border border-border bg-card">
          {quiz.questions?.length ? (
            <ul className="divide-y divide-border">
              {quiz.questions.map((q) => (
                <EditableQuestionRow key={q.id} question={q} quizId={qid} />
              ))}
            </ul>
          ) : (
            <div className="p-4">
              <p className="text-sm text-muted-foreground">No questions yet. Add one above.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function EditableQuestionRow({
  question,
  quizId,
}: {
  question: QuizDetail["questions"][0];
  quizId: number;
}) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const initialChoices = useMemo<QuizChoicePayload[]>(
    () => question.choices.map((c) => ({ text: c.text, is_correct: false })),
    [question.choices]
  );

  const [text, setText] = useState(question.text);
  const [type, setType] = useState<QuestionType>(question.question_type);
  const [correctTexts, setCorrectTexts] = useState<string[]>(() => {
    const base = (question.correct_text || "")
      .split("\n")
      .map((v) => v.trim())
      .filter(Boolean);
    const normalized = base.length ? base : [""];
    return question.question_type === "identification" ? normalized.slice(0, 1) : normalized;
  });
  const [choices, setChoices] = useState<QuizChoicePayload[]>(() => {
    if (question.question_type !== "mcq") return initialChoices;
    // We can’t see is_correct in read payload (write_only), so default to first option.
    return question.choices.map((c, idx) => ({ text: c.text, is_correct: idx === 0 }));
  });

  const updateMutation = useMutation({
    mutationFn: (payload: QuizQuestionPayload) => updateQuestion(question.id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quiz", quizId] });
      setOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteQuestion(question.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quiz", quizId] });
    },
  });

  const handleSave = () => {
    if (!text.trim()) return;
    const payload = buildPayload({
      text,
      question_type: type,
      correct_text: correctTexts.map((v) => v.trim()).filter(Boolean).join("\n"),
      choices,
    });
    updateMutation.mutate(payload);
  };

  return (
    <li className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium truncate">{question.text}</p>
          <p className="text-xs text-muted-foreground">
            Type: {question.question_type.toUpperCase()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => setOpen((v) => !v)}>
            {open ? "Close" : "Edit"}
          </Button>
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
        </div>
      </div>

      {open && (
        <div className="mt-4 space-y-4 rounded-lg border border-border bg-muted/20 p-3">
          <div>
            <Label>Question text *</Label>
            <Input value={text} onChange={(e) => setText(e.target.value)} required />
          </div>

          <div>
            <Label>Type</Label>
            <select
              className="h-9 rounded-md border border-input bg-background px-2 w-full"
              value={type}
              onChange={(e) => {
                const next = e.target.value as QuestionType;
                setType(next);
                if (next === "identification") {
                  setCorrectTexts((prev) => [prev[0] ?? ""]);
                }
              }}
            >
              <option value="mcq">Multiple choice</option>
              <option value="identification">Identification</option>
              <option value="enumeration">Enumeration</option>
              <option value="tf">True / False</option>
            </select>
          </div>

          {type === "mcq" && (
            <div className="space-y-2">
              <Label>Choices (select correct)</Label>
              {choices.map((choice, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name={`correct-${question.id}`}
                    checked={choice.is_correct ?? false}
                    onChange={() =>
                      setChoices((prev) =>
                        prev.map((c, i) => ({ ...c, is_correct: i === idx }))
                      )
                    }
                  />
                  <Input
                    value={choice.text}
                    onChange={(e) =>
                      setChoices((prev) =>
                        prev.map((c, i) => (i === idx ? { ...c, text: e.target.value } : c))
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

          {(type === "identification" || type === "enumeration") && (
            <div className="space-y-2">
              <Label>Correct answer</Label>
              {(type === "identification" ? correctTexts.slice(0, 1) : correctTexts).map(
                (value, idx, arr) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Input
                      value={value}
                      onChange={(e) =>
                        setCorrectTexts((prev) =>
                          prev.map((v, i) => (i === idx ? e.target.value : v))
                        )
                      }
                      placeholder={`Answer ${idx + 1}`}
                    />
                    {type === "enumeration" && (
                      <Button
                        type="button"
                        size="icon-xs"
                        variant="ghost"
                        disabled={arr.length <= 1}
                        onClick={() =>
                          setCorrectTexts((prev) =>
                            prev.length <= 1 ? prev : prev.filter((_, i) => i !== idx)
                          )
                        }
                        aria-label={`Remove answer ${idx + 1}`}
                        title="Remove"
                      >
                        ✕
                      </Button>
                    )}
                  </div>
                )
              )}
              {type === "enumeration" && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setCorrectTexts((prev) => [...prev, ""])}
                >
                  Add another correct answer
                </Button>
              )}
            </div>
          )}

          {type === "tf" && (
            <div>
              <Label>Correct answer</Label>
              <select
                className="h-9 rounded-md border border-input bg-background px-2"
                value={(correctTexts[0] || "True").toLowerCase()}
                onChange={(e) => setCorrectTexts([e.target.value === "true" ? "True" : "False"])}
              >
                <option value="true">True</option>
                <option value="false">False</option>
              </select>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={handleSave}
              disabled={updateMutation.isPending || !text.trim()}
            >
              {updateMutation.isPending ? "Saving..." : "Save changes"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={updateMutation.isPending}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </li>
  );
}

