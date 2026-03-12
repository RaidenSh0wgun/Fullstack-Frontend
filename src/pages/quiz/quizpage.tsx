import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";

type Question = {
  id: number;
  question: string;
};

type Quiz = {
  id: number;
  title: string;
  questions: Question[];
};

export default function QuizPage() {
  const { quizId } = useParams();
  const [quiz, setQuiz] = useState<Quiz | null>(null);

  useEffect(() => {
    if (!quizId) return;

    const loadQuiz = async () => {
      try {
        const response = await fetch(`/api/quizzes/${quizId}`);
        const data: Quiz = await response.json();
        setQuiz(data);
      } catch (error) {
        console.error("Failed to load quiz:", error);
      }
    };

    loadQuiz();
  }, [quizId]);

  if (!quiz) {
    return <div className="p-6">Loading quiz...</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">{quiz.title}</h1>

      <div className="mt-4">
        {quiz.questions.map((q, index) => (
          <div key={index} className="mb-4 border p-3 rounded">
            <p className="font-semibold">{q.question}</p>
          </div>
        ))}
      </div>
    </div>
  );
}