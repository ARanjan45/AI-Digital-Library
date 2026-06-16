"use client";

import { useState } from "react";
import { Brain, CheckCircle, XCircle, RotateCcw, Loader2, Trophy } from "lucide-react";
import { SUPPORTED_LANGUAGES } from "@/lib/sarvam";

interface Question {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

interface QuizProps {
  bookId: string;
  bookLanguage?: string;
}

export default function QuizSection({ bookId, bookLanguage = "English" }: QuizProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [showExplanation, setShowExplanation] = useState(false);
  const [quizDone, setQuizDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState(bookLanguage);
  const [numQuestions, setNumQuestions] = useState(5);

  const startQuiz = async () => {
    setLoading(true);
    setQuestions([]);
    setAnswers([]);
    setCurrent(0);
    setSelected(null);
    setShowExplanation(false);
    setQuizDone(false);

    try {
      const res = await fetch("/api/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookId, language, numQuestions }),
      });
      const data = await res.json();
      if (data.questions?.length) setQuestions(data.questions);
      else throw new Error("No questions generated");
    } catch {
      alert("Failed to generate quiz. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (opt: string) => {
    if (selected) return;
    setSelected(opt);
    setShowExplanation(true);
    const correct = opt.startsWith(questions[current].correctAnswer);
    setAnswers((prev) => [...prev, correct]);
  };

  const handleNext = () => {
    if (current + 1 >= questions.length) {
      setQuizDone(true);
      const score = answers.filter(Boolean).length;
      fetch("/api/quiz", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookId, score, total: questions.length }),
      });
    } else {
      setCurrent((c) => c + 1);
      setSelected(null);
      setShowExplanation(false);
    }
  };

  const score = answers.filter(Boolean).length;
  const q = questions[current];

  return (
    <div className="bg-surface-2 border border-border rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-semibold text-text-primary flex items-center gap-2">
          <Brain className="w-5 h-5 text-primary-light" />
          Quiz Mode
        </h3>
      </div>

      {questions.length === 0 && !loading ? (
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">Test your understanding with AI-generated questions from this book.</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-text-muted mb-1.5">Language</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-sm text-text-secondary focus:outline-none focus:border-primary"
              >
                {SUPPORTED_LANGUAGES.map((l) => (
                  <option key={l.code} value={l.name}>{l.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-text-muted mb-1.5">Questions</label>
              <select
                value={numQuestions}
                onChange={(e) => setNumQuestions(Number(e.target.value))}
                className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-sm text-text-secondary focus:outline-none focus:border-primary"
              >
                {[3, 5, 7, 10].map((n) => <option key={n} value={n}>{n} Questions</option>)}
              </select>
            </div>
          </div>
          <button onClick={startQuiz} className="w-full btn-gradient py-3 rounded-xl font-semibold flex items-center justify-center gap-2">
            <Brain className="w-5 h-5" /> Generate Quiz
          </button>
        </div>
      ) : loading ? (
        <div className="flex flex-col items-center py-8 gap-3">
          <Loader2 className="w-8 h-8 text-primary-light animate-spin" />
          <p className="text-sm text-text-secondary">Generating questions in {language}...</p>
        </div>
      ) : quizDone ? (
        <div className="text-center py-6">
          <Trophy className={`w-12 h-12 mx-auto mb-3 ${score >= questions.length * 0.7 ? "text-yellow-400" : "text-text-muted"}`} />
          <h4 className="text-xl font-bold text-text-primary mb-1">Quiz Complete!</h4>
          <p className="text-text-secondary mb-1">You scored</p>
          <p className="text-4xl font-bold gradient-text mb-4">{score}/{questions.length}</p>
          <p className="text-sm text-text-muted mb-6">
            {score >= questions.length * 0.8 ? "Excellent! You know this book well." :
             score >= questions.length * 0.5 ? "Good effort! Keep reading to improve." :
             "Keep reading and try again!"}
          </p>
          <button onClick={startQuiz} className="btn-gradient px-6 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 mx-auto">
            <RotateCcw className="w-4 h-4" /> Try Again
          </button>
        </div>
      ) : q ? (
        <div>
          {/* Progress */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-1.5 bg-surface-3 rounded-full">
              <div
                className="h-full bg-gradient-primary rounded-full transition-all"
                style={{ width: `${((current + 1) / questions.length) * 100}%` }}
              />
            </div>
            <span className="text-xs text-text-muted">{current + 1}/{questions.length}</span>
          </div>

          <p className="text-sm font-medium text-text-primary mb-4 leading-relaxed">{q.question}</p>

          <div className="space-y-2 mb-4">
            {q.options.map((opt) => {
              const isCorrect = opt.startsWith(q.correctAnswer);
              const isSelected = selected === opt;
              return (
                <button
                  key={opt}
                  onClick={() => handleAnswer(opt)}
                  disabled={!!selected}
                  className={`w-full text-left px-4 py-3 rounded-xl text-sm border transition-all ${
                    !selected
                      ? "border-border text-text-secondary hover:border-primary hover:bg-primary/5"
                      : isCorrect
                      ? "border-green-500 bg-green-500/10 text-green-300"
                      : isSelected
                      ? "border-red-500 bg-red-500/10 text-red-300"
                      : "border-border text-text-muted opacity-50"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {selected && isCorrect && <CheckCircle className="w-4 h-4 shrink-0" />}
                    {selected && isSelected && !isCorrect && <XCircle className="w-4 h-4 shrink-0" />}
                    {opt}
                  </span>
                </button>
              );
            })}
          </div>

          {showExplanation && (
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 mb-4 text-sm text-text-secondary">
              <span className="font-medium text-primary-light">Explanation: </span>
              {q.explanation}
            </div>
          )}

          {selected && (
            <button onClick={handleNext} className="w-full btn-gradient py-2.5 rounded-xl text-sm font-semibold">
              {current + 1 >= questions.length ? "See Results" : "Next Question →"}
            </button>
          )}
        </div>
      ) : null}
    </div>
  );
}
