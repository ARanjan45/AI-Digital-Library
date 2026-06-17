"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import Vapi from "@vapi-ai/web";
import { ArrowLeft, Mic, MicOff, BookOpen, Brain, Volume2, MessageSquare, TrendingUp, Globe, Loader2, Send, Library, CheckCircle, XCircle } from "lucide-react";
import { getVapiAssistantConfig } from "@/lib/vapi";
import { SUPPORTED_LANGUAGES } from "@/lib/sarvam";

interface Book { _id: string; title: string; author: string; description: string; language: string; category: string; coverUrl: string; pdfUrl: string; totalPages: number; extractedText: string; viewCount: number; }
interface QuizQuestion { question: string; options: string[]; correctAnswer: string; explanation: string; }
type Tab = "overview" | "chat" | "quiz" | "summary" | "progress";

export default function BookPage({ params }: { params: { id: string } }) {
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [selectedLanguage, setSelectedLanguage] = useState("en-IN");
  const [selectedLanguageName, setSelectedLanguageName] = useState("English");

  // Voice state
  const [vapi, setVapi] = useState<Vapi | null>(null);
  const [callStatus, setCallStatus] = useState<"idle" | "connecting" | "active" | "ended">("idle");
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Chat state
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState<{ role: string; content: string }[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Quiz state
  const [quiz, setQuiz] = useState<QuizQuestion[]>([]);
  const [quizLoading, setQuizLoading] = useState(false);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  // Summary state
  const [summary, setSummary] = useState("");
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);

  // Progress state
  const [progress, setProgress] = useState<any>(null);

  useEffect(() => {
    fetchBook();
    fetchProgress();
  }, [params.id]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatHistory]);

  const fetchBook = async () => {
    try {
      const res = await fetch(`/api/books/${params.id}`);
      const data = await res.json();
      setBook(data.book);
      if (data.book?.language) {
        const lang = SUPPORTED_LANGUAGES.find(l => l.name === data.book.language);
        if (lang) { setSelectedLanguage(lang.code); setSelectedLanguageName(lang.name); }
      }
    } catch { } finally { setLoading(false); }
  };

  const fetchProgress = async () => {
    try {
      const res = await fetch(`/api/progress?bookId=${params.id}`);
      const data = await res.json();
      setProgress(data.progress);
    } catch { }
  };

  // Voice call
  const startVoiceCall = async () => {
    if (!book) return;
    setCallStatus("connecting");
    try {
      const vapiInstance = new Vapi(process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY!);
      vapiInstance.on("call-start", () => setCallStatus("active"));
      vapiInstance.on("call-end", () => { setCallStatus("ended"); setTimeout(() => setCallStatus("idle"), 2000); });
      vapiInstance.on("speech-start", () => setIsSpeaking(true));
      vapiInstance.on("speech-end", () => setIsSpeaking(false));
      vapiInstance.on("error", () => setCallStatus("idle"));
      const config = getVapiAssistantConfig(book.title, book.extractedText || "", selectedLanguageName);
      await vapiInstance.start(config as any);
      setVapi(vapiInstance);
    } catch { setCallStatus("idle"); }
  };

  const endVoiceCall = () => { vapi?.stop(); setVapi(null); setCallStatus("idle"); };

  // Text chat
  const sendChat = async () => {
    if (!chatInput.trim() || chatLoading) return;
    const msg = chatInput.trim();
    setChatInput("");
    setChatHistory(h => [...h, { role: "user", content: msg }]);
    setChatLoading(true);
    try {
      const res = await fetch(`/api/books/${params.id}/chat`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: msg, language: selectedLanguageName, history: chatHistory }) });
      const data = await res.json();
      setChatHistory(h => [...h, { role: "assistant", content: data.reply || "Sorry, I could not process that." }]);
    } catch { setChatHistory(h => [...h, { role: "assistant", content: "Error occurred. Please try again." }]); } finally { setChatLoading(false); }
  };

  // Quiz
  const generateQuiz = async () => {
    setQuizLoading(true); setQuiz([]); setAnswers({}); setQuizSubmitted(false);
    try {
      const res = await fetch("/api/quiz", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ bookId: params.id, language: selectedLanguageName }) });
      const data = await res.json();
      setQuiz(data.questions || []);
    } catch { } finally { setQuizLoading(false); }
  };

  const submitQuiz = async () => {
    const s = quiz.reduce((acc, q, i) => acc + (answers[i] === q.correctAnswer ? 1 : 0), 0);
    setScore(s); setQuizSubmitted(true);
    await fetch("/api/quiz", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ bookId: params.id, score: s, total: quiz.length }) });
  };

  // Summary
  // Summary
  const generateSummary = async (withAudio = false) => {
    if (withAudio) {
      setAudioLoading(true);
    }
    else {
      setSummaryLoading(true);
      setSummary("");
    }

    try {
      const res = await fetch("/api/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookId: params.id,
          targetLanguage: selectedLanguage,
          languageName: selectedLanguageName,
          audio: withAudio
        })
      });

      if (withAudio) {
        const contentType = res.headers.get("content-type") || "";

        if (contentType.includes("application/json")) {
          const data = await res.json();
          setSummary(data.summary || "");
          return;
        }

        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audio.onended = () => URL.revokeObjectURL(url);
        try {
          await audio.play();
        } catch (err) {
          console.error("Playback failed:", err);
          window.open(url, "_blank");
        }

      } else {
        const data = await res.json();
        setSummary(data.summary || "");
      }
    } catch (err) {
      console.error("Summary processing failed", err);
    } finally {
      setSummaryLoading(false);
      setAudioLoading(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>;
  if (!book) return <div className="min-h-screen bg-background flex items-center justify-center"><p className="text-text-secondary">Book not found.</p></div>;

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: "overview", label: "Overview", icon: BookOpen },
    { id: "chat", label: "AI Chat", icon: MessageSquare },
    { id: "quiz", label: "Quiz", icon: Brain },
    { id: "summary", label: "Summary", icon: Volume2 },
    { id: "progress", label: "Progress", icon: TrendingUp },
  ];

  return (
    <div className="min-h-screen bg-background">
      <nav className="glass sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl btn-gradient flex items-center justify-center"><Library className="w-5 h-5 text-white" /></div>
          <span className="text-lg font-bold"><span className="text-text-primary">AI</span><span className="gradient-text"> Digital Library</span></span>
        </div>
        <Link href="/library" className="flex items-center gap-2 text-text-secondary hover:text-text-primary text-sm transition-colors"><ArrowLeft className="w-4 h-4" /> Library</Link>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Book Header */}
        <div className="flex gap-6 mb-8">
          <div className="w-32 h-44 rounded-2xl overflow-hidden bg-surface-2 border border-border flex-shrink-0">
            {book.coverUrl ? <Image src={book.coverUrl} alt={book.title} width={128} height={176} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><BookOpen className="w-10 h-10 text-primary-light opacity-50" /></div>}
          </div>
          <div className="flex-1">
            <div className="flex items-start gap-3 mb-2">
              <h1 className="text-3xl font-bold text-text-primary flex-1">{book.title}</h1>
            </div>
            <p className="text-text-secondary mb-1">by {book.author}</p>
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="bg-primary/20 text-primary-light text-xs px-3 py-1 rounded-full">{book.language}</span>
              <span className="bg-surface-3 text-text-secondary text-xs px-3 py-1 rounded-full">{book.category}</span>
              <span className="bg-surface-3 text-text-secondary text-xs px-3 py-1 rounded-full">{book.totalPages} pages</span>
            </div>
            <p className="text-text-secondary text-sm leading-relaxed line-clamp-3">{book.description}</p>

            {/* Language Selector */}
            <div className="flex items-center gap-3 mt-4">
              <Globe className="w-4 h-4 text-text-muted" />
              <select value={selectedLanguage} onChange={(e) => {
                setSelectedLanguage(e.target.value);
                const lang = SUPPORTED_LANGUAGES.find(l => l.code === e.target.value);
                if (lang) setSelectedLanguageName(lang.name);
              }} className="bg-surface-3 border border-border rounded-lg px-3 py-1.5 text-text-secondary text-sm focus:outline-none focus:border-primary">
                {SUPPORTED_LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.nativeName} ({l.name})</option>)}
              </select>
              <span className="text-text-muted text-xs">AI responds in this language</span>
            </div>
          </div>

          {/* Voice Call Button */}
          <div className="flex flex-col items-center gap-3">
            <button onClick={callStatus === "active" ? endVoiceCall : startVoiceCall} disabled={callStatus === "connecting"}
              className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${callStatus === "active" ? "bg-red-500 hover:bg-red-600 voice-ring" : callStatus === "connecting" ? "bg-surface-3 border border-border cursor-not-allowed" : "btn-gradient hover:scale-105 animate-glow"}`}>
              {callStatus === "connecting" ? <Loader2 className="w-8 h-8 text-white animate-spin" /> : callStatus === "active" ? <MicOff className="w-8 h-8 text-white" /> : <Mic className="w-8 h-8 text-white" />}
            </button>
            <p className="text-text-muted text-xs text-center">
              {callStatus === "idle" && "Talk to Book"}{callStatus === "connecting" && "Connecting..."}{callStatus === "active" && "Tap to End"}{callStatus === "ended" && "Call Ended"}
            </p>
            {callStatus === "active" && isSpeaking && (
              <div className="flex gap-1 items-end h-6">
                {[1, 2, 3, 4, 5].map(i => <div key={i} className="wave-bar" style={{ animationDelay: `${i * 0.1}s` }} />)}
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-surface-2 border border-border rounded-2xl p-1 mb-6 overflow-x-auto">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setActiveTab(id)} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap flex-1 justify-center ${activeTab === id ? "btn-gradient text-white" : "text-text-secondary hover:text-text-primary"}`}>
              <Icon className="w-4 h-4" /> {label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="bg-surface-2 border border-border rounded-2xl p-6">
          {/* Overview */}
          {activeTab === "overview" && (
            <div>
              <h2 className="text-xl font-bold text-text-primary mb-4">About this Book</h2>
              <p className="text-text-secondary leading-relaxed mb-6">{book.description || "No description available."}</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[{ label: "Language", value: book.language }, { label: "Category", value: book.category }, { label: "Pages", value: book.totalPages }, { label: "Views", value: book.viewCount }].map(({ label, value }) => (
                  <div key={label} className="bg-surface-3 rounded-xl p-4 text-center">
                    <div className="text-xl font-bold gradient-text mb-1">{value}</div>
                    <div className="text-text-muted text-sm">{label}</div>
                  </div>
                ))}
              </div>
              <a href={book.pdfUrl} target="_blank" rel="noopener noreferrer" className="btn-gradient px-6 py-3 rounded-xl font-semibold inline-flex items-center gap-2">
                <BookOpen className="w-5 h-5" /> Open PDF
              </a>
            </div>
          )}

          {/* Chat */}
          {activeTab === "chat" && (
            <div className="flex flex-col h-[500px]">
              <h2 className="text-xl font-bold text-text-primary mb-4">Chat with this Book</h2>
              <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-1">
                {chatHistory.length === 0 && (
                  <div className="text-center py-12">
                    <MessageSquare className="w-12 h-12 text-text-muted mx-auto mb-3" />
                    <p className="text-text-secondary">Ask anything about "{book.title}"</p>
                    <p className="text-text-muted text-sm mt-1">Responding in: {selectedLanguageName}</p>
                  </div>
                )}
                {chatHistory.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${msg.role === "user" ? "btn-gradient text-white rounded-br-sm" : "bg-surface-3 border border-border text-text-primary rounded-bl-sm"}`}>
                      {msg.content}
                    </div>
                  </div>
                ))}
                {chatLoading && <div className="flex justify-start"><div className="bg-surface-3 border border-border rounded-2xl rounded-bl-sm px-4 py-3"><div className="flex gap-1">{[0, 1, 2].map(i => <div key={i} className="w-2 h-2 bg-primary-light rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}</div></div></div>}
                <div ref={chatEndRef} />
              </div>
              <div className="flex gap-3">
                <input value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendChat()} placeholder={`Ask about ${book.title}...`} className="flex-1 bg-surface-3 border border-border rounded-xl px-4 py-3 text-text-primary placeholder:text-text-muted text-sm focus:outline-none focus:border-primary" />
                <button onClick={sendChat} disabled={chatLoading || !chatInput.trim()} className="btn-gradient px-4 py-3 rounded-xl disabled:opacity-50"><Send className="w-5 h-5 text-white" /></button>
              </div>
            </div>
          )}

          {/* Quiz */}
          {activeTab === "quiz" && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-text-primary">Auto-Generated Quiz</h2>
                <button onClick={generateQuiz} disabled={quizLoading} className="btn-gradient px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 disabled:opacity-50">
                  {quizLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</> : <><Brain className="w-4 h-4" /> Generate Quiz</>}
                </button>
              </div>

              {quiz.length === 0 && !quizLoading && (
                <div className="text-center py-12"><Brain className="w-12 h-12 text-text-muted mx-auto mb-3" /><p className="text-text-secondary">Click "Generate Quiz" to create MCQs from this book</p><p className="text-text-muted text-sm mt-1">Questions in: {selectedLanguageName}</p></div>
              )}

              {quizSubmitted && <div className="bg-primary/10 border border-primary/30 rounded-xl p-4 mb-6 text-center"><p className="text-primary-light font-bold text-xl">{score}/{quiz.length} Correct 🎉</p><p className="text-text-secondary text-sm mt-1">{Math.round((score / quiz.length) * 100)}% score</p></div>}

              <div className="space-y-6">
                {quiz.map((q, i) => (
                  <div key={i} className="bg-surface-3 rounded-2xl p-5">
                    <p className="text-text-primary font-medium mb-4">{i + 1}. {q.question}</p>
                    <div className="space-y-2">
                      {q.options.map((opt) => {
                        const letter = opt[0];
                        const isSelected = answers[i] === letter;
                        const isCorrect = quizSubmitted && letter === q.correctAnswer;
                        const isWrong = quizSubmitted && isSelected && letter !== q.correctAnswer;
                        return (
                          <button key={opt} disabled={quizSubmitted} onClick={() => setAnswers(a => ({ ...a, [i]: letter }))}
                            className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-all border ${isCorrect ? "border-green-500 bg-green-500/10 text-green-300" : isWrong ? "border-red-500 bg-red-500/10 text-red-300" : isSelected ? "border-primary bg-primary/10 text-primary-light" : "border-border bg-surface-2 text-text-secondary hover:border-primary/50"}`}>
                            <div className="flex items-center gap-2">
                              {quizSubmitted && isCorrect && <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />}
                              {quizSubmitted && isWrong && <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />}
                              {opt}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    {quizSubmitted && <p className="text-text-muted text-xs mt-3 italic">{q.explanation}</p>}
                  </div>
                ))}
              </div>

              {quiz.length > 0 && !quizSubmitted && (
                <button onClick={submitQuiz} disabled={Object.keys(answers).length < quiz.length} className="w-full btn-gradient py-3 rounded-xl font-semibold mt-6 disabled:opacity-50">
                  Submit Quiz ({Object.keys(answers).length}/{quiz.length} answered)
                </button>
              )}
            </div>
          )}

          {/* Summary */}
          {/* Summary */}
          {activeTab === "summary" && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-text-primary">AI Summary</h2>
                <div className="flex gap-2">
                  <button onClick={() => generateSummary(false)} disabled={summaryLoading} className="btn-gradient px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 disabled:opacity-50">
                    {summaryLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</> : "Get Summary"}
                  </button>
                  {/* Listen button HATA DIYA */}
                </div>
              </div>
              {!summary && !summaryLoading && (
                <div className="text-center py-12"><Volume2 className="w-12 h-12 text-text-muted mx-auto mb-3" /><p className="text-text-secondary">Generate a 3-paragraph AI summary in {selectedLanguageName}</p></div>
              )}
              {summary && <div className="prose max-w-none"><p className="text-text-secondary leading-relaxed whitespace-pre-wrap">{summary}</p></div>}
            </div>
          )}

          {/* Progress */}
          {activeTab === "progress" && (
            <div>
              <h2 className="text-xl font-bold text-text-primary mb-6">Reading Progress</h2>
              {!progress ? (
                <div className="text-center py-12"><TrendingUp className="w-12 h-12 text-text-muted mx-auto mb-3" /><p className="text-text-secondary">Start reading to track your progress</p></div>
              ) : (
                <div className="space-y-6">
                  <div className="bg-surface-3 rounded-2xl p-5">
                    <div className="flex justify-between mb-2"><span className="text-text-secondary text-sm">Reading Progress</span><span className="text-primary-light font-bold">{progress.percentComplete}%</span></div>
                    <div className="h-3 bg-surface-2 rounded-full overflow-hidden"><div className="h-full btn-gradient rounded-full" style={{ width: `${progress.percentComplete}%` }} /></div>
                    <p className="text-text-muted text-xs mt-2">Page {progress.currentPage} of {progress.totalPages}</p>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    {[{ label: "Time Spent", value: `${progress.timeSpentMinutes}m` }, { label: "Quiz Attempts", value: progress.quizScores?.length || 0 }, { label: "Best Score", value: progress.quizScores?.length ? `${Math.max(...progress.quizScores.map((s: any) => Math.round(s.score / s.total * 100)))}%` : "—" }].map(({ label, value }) => (
                      <div key={label} className="bg-surface-3 rounded-xl p-4 text-center"><div className="text-xl font-bold gradient-text mb-1">{value}</div><div className="text-text-muted text-sm">{label}</div></div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
