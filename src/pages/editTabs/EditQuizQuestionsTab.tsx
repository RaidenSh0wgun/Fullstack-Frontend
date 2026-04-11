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
  answer_format?: string;
  correct_text?: string;
  choices: QuizChoicePayload[];
}): QuizQuestionPayload {
  if (input.question_type === "tf") {
    const correctIsTrue = (input.correct_text || "True").toLowerCase() === "true";
    return {
      text: input.text.trim(),
      question_type: "tf",
      answer_format: input.answer_format,
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
      answer_format: input.answer_format,
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
    answer_format: input.answer_format,
    correct_text: "",
    choices: normalized,
  };
}

export default function EditQuizQuestionsTab() {
  const { quizId } = useParams<{ quizId: string }>();
  const qid = quizId ? parseInt(quizId, 10) : NaN;
  const queryClient = useQueryClient();

  const { data: quiz, isLoading } = useQuery({
    queryKey: ["quiz", qid],
    queryFn: () => fetchQuizDetail(qid),
    enabled: Number.isInteger(qid),
  });

  const [newText, setNewText] = useState("");
  const [newType, setNewType] = useState<QuestionType>("mcq");
  const [newAnswerFormat, setNewAnswerFormat] = useState("exact");
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
      setNewAnswerFormat("exact");
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
      answer_format: newAnswerFormat,
      correct_text: newCorrectTexts.map((v) => v.trim()).filter(Boolean).join("\n"),
      choices: newChoices,
    });
    createMutation.mutate(payload);
  };

  if (!Number.isInteger(qid)) {
    return <p className="text-slate-400">Invalid quiz.</p>;
  }

  if (isLoading || !quiz) {
    return <p className="text-slate-400">Loading questions...</p>;
  }

  return (
    <div className="space-y-8">
      {/* Add New Question Section */}
      <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 shadow-2xl shadow-black/50">
        <h2 className="text-2xl font-bold text-white mb-6">Add New Question</h2>
        
        <form onSubmit={handleAdd} className="space-y-6">
          <div>
            <Label className="text-slate-200">Question Text *</Label>
            <Input
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              placeholder="e.g. What is 2 + 2?"
              className="bg-slate-800 border-slate-600 h-12 rounded-2xl focus:border-yellow-400 mt-2"
              required
            />
          </div>

          <div>
            <Label className="text-slate-200">Question Type</Label>
            <select
              className="mt-2 h-12 w-full rounded-2xl border border-slate-600 bg-slate-800 px-4 text-white focus:border-yellow-400"
              value={newType}
              onChange={(e) => {
                const next = e.target.value as QuestionType;
                setNewType(next);
                if (next === "identification") {
                  setNewCorrectTexts((prev) => [prev[0] ?? ""]);
                }
              }}
            >
              <option value="mcq">Multiple Choice</option>
              <option value="identification">Identification</option>
              <option value="enumeration">Enumeration</option>
              <option value="tf">True / False</option>
            </select>
          </div>

          {newType === "mcq" && (
            <div className="space-y-3">
              <Label className="text-slate-200">Choices (select the correct one)</Label>
              {newChoices.map((choice, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="new-correct"
                    checked={choice.is_correct ?? false}
                    onChange={() =>
                      setNewChoices((prev) =>
                        prev.map((c, i) => ({ ...c, is_correct: i === idx }))
                      )
                    }
                    className="accent-yellow-400"
                  />
                  <Input
                    value={choice.text}
                    onChange={(e) =>
                      setNewChoices((prev) =>
                        prev.map((c, i) => (i === idx ? { ...c, text: e.target.value } : c))
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
                  setNewChoices((prev) => [...prev, { text: "", is_correct: false }])
                }
                className="rounded-2xl border-slate-600"
              >
                + Add Choice
              </Button>
            </div>
          )}

          {(newType === "identification" || newType === "enumeration") && (
            <div className="space-y-3">
              <Label className="text-slate-200">Correct Answer{newType === "enumeration" ? "s" : ""}</Label>
              {(newType === "identification" ? newCorrectTexts.slice(0, 1) : newCorrectTexts).map(
                (value, idx, arr) => (
                  <div key={idx} className="flex items-center gap-3">
                    <Input
                      value={value}
                      onChange={(e) =>
                        setNewCorrectTexts((prev) =>
                          prev.map((v, i) => (i === idx ? e.target.value : v))
                        )
                      }
                      placeholder={`Answer ${idx + 1}`}
                      className="bg-slate-800 border-slate-600 rounded-2xl"
                    />
                    {newType === "enumeration" && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={arr.length <= 1}
                        onClick={() =>
                          setNewCorrectTexts((prev) =>
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
              {newType === "enumeration" && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setNewCorrectTexts((prev) => [...prev, ""])}
                  className="rounded-2xl border-slate-600"
                >
                  + Add Another Answer
                </Button>
              )}
            </div>
          )}

          {newType === "tf" && (
            <div>
              <Label className="text-slate-200">Correct Answer</Label>
              <select
                className="mt-2 h-12 w-full rounded-2xl border border-slate-600 bg-slate-800 px-4 text-white focus:border-yellow-400"
                value={(newCorrectTexts[0] || "True").toLowerCase()}
                onChange={(e) => setNewCorrectTexts([e.target.value === "true" ? "True" : "False"])}
              >
                <option value="true">True</option>
                <option value="false">False</option>
              </select>
            </div>
          )}

          <Button
            type="submit"
            disabled={createMutation.isPending || !newText.trim()}
            className="bg-gradient-to-r from-red-500 via-yellow-500 to-orange-500 text-white font-bold rounded-2xl px-8 py-6 shadow-lg hover:brightness-110"
          >
            {createMutation.isPending ? "Adding Question..." : "Add Question"}
          </Button>
        </form>
      </div>

      {/* Existing Questions List */}
      <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 shadow-2xl shadow-black/50">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">
            Questions ({quiz.questions?.length ?? 0})
          </h2>
          <p className="text-sm text-slate-400">Click Edit to modify any question</p>
        </div>

        <div className="max-h-[65vh] overflow-auto rounded-2xl border border-slate-700 bg-slate-950/50">
          {quiz.questions?.length ? (
            <div className="divide-y divide-slate-800">
              {quiz.questions.map((q) => (
                <EditableQuestionRow key={q.id} question={q} quizId={qid} />
              ))}
            </div>
          ) : (
            <div className="p-12 text-center">
              <p className="text-slate-400">No questions added yet.</p>
            </div>
          )}
        </div>
      </div>
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

  const [text, setText] = useState(question.text);
  const [type, setType] = useState<QuestionType>(question.question_type);
  const [answerFormat, setAnswerFormat] = useState(question.answer_format || "exact");
  const [correctTexts, setCorrectTexts] = useState<string[]>(() => {
    const base = (question.correct_text || "")
      .split("\n")
      .map((v) => v.trim())
      .filter(Boolean);
    const normalized = base.length ? base : [""];
    return question.question_type === "identification" ? normalized.slice(0, 1) : normalized;
  });
  const [choices, setChoices] = useState<QuizChoicePayload[]>(() => {
    if (question.question_type !== "mcq") return [];
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
      answer_format: answerFormat,
      correct_text: correctTexts.map((v) => v.trim()).filter(Boolean).join("\n"),
      choices,
    });
    updateMutation.mutate(payload);
  };

  return (
    <div className="p-6 hover:bg-slate-900/70 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-white text-[17px] leading-tight">{question.text}</p>
          <p className="text-xs text-slate-500 mt-1">
            {question.question_type.toUpperCase()}
          </p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setOpen(!open)}
            className="rounded-2xl border-slate-600"
          >
            {open ? "Close" : "Edit"}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              if (confirm("Delete this question?")) deleteMutation.mutate();
            }}
            disabled={deleteMutation.isPending}
            className="text-red-400 hover:text-red-500 hover:bg-red-500/10 rounded-2xl"
          >
            Delete
          </Button>
        </div>
      </div>

      {open && (
        <div className="mt-6 p-6 bg-slate-900 border border-slate-700 rounded-2xl space-y-6">
          <div>
            <Label className="text-slate-200">Question Text *</Label>
            <Input
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="bg-slate-800 border-slate-600 h-12 rounded-2xl mt-2 focus:border-yellow-400"
              required
            />
          </div>

          <div>
            <Label className="text-slate-200">Question Type</Label>
            <select
              className="mt-2 h-12 w-full rounded-2xl border border-slate-600 bg-slate-800 px-4 text-white focus:border-yellow-400"
              value={type}
              onChange={(e) => {
                const next = e.target.value as QuestionType;
                setType(next);
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

          {(type === "identification" || type === "enumeration") && (
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

          {type === "mcq" && (
            <div className="space-y-3">
              <Label className="text-slate-200">Choices</Label>
              {choices.map((choice, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <input
                    type="radio"
                    name={`correct-${question.id}`}
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
                        prev.map((c, i) => (i === idx ? { ...c, text: e.target.value } : c))
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

          {(type === "identification" || type === "enumeration") && (
            <div className="space-y-3">
              <Label className="text-slate-200">Correct Answer{type === "enumeration" ? "s" : ""}</Label>
              {(type === "identification" ? correctTexts.slice(0, 1) : correctTexts).map(
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
                    {type === "enumeration" && arr.length > 1 && (
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
              {type === "enumeration" && (
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

          {type === "tf" && (
            <div>
              <Label className="text-slate-200">Correct Answer</Label>
              <select
                className="mt-2 h-12 w-full rounded-2xl border border-slate-600 bg-slate-800 px-4 text-white focus:border-yellow-400"
                value={(correctTexts[0] || "True").toLowerCase()}
                onChange={(e) => setCorrectTexts([e.target.value === "true" ? "True" : "False"])}
              >
                <option value="true">True</option>
                <option value="false">False</option>
              </select>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleSave}
              disabled={updateMutation.isPending || !text.trim()}
              className="bg-gradient-to-r from-red-500 via-yellow-500 to-orange-500 text-white font-bold rounded-2xl px-8"
            >
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={updateMutation.isPending}
              className="rounded-2xl border-slate-600"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}