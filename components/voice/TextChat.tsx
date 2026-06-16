"use client";

import { useState, useRef, useEffect } from "react";
import { Send, MessageCircle, Loader2 } from "lucide-react";
import { SUPPORTED_LANGUAGES } from "@/lib/sarvam";

interface ChatProps {
  bookId: string;
  defaultLanguage?: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function TextChat({ bookId, defaultLanguage = "English" }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState(defaultLanguage);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(`/api/books/${bookId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input, language, history: messages }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Sorry, I couldn't process that. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-surface-2 border border-border rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <h3 className="font-semibold text-text-primary flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-primary-light" />
          Chat with Book
        </h3>
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="bg-surface border border-border rounded-xl px-3 py-1.5 text-xs text-text-secondary focus:outline-none focus:border-primary"
        >
          {SUPPORTED_LANGUAGES.map((l) => (
            <option key={l.code} value={l.name}>{l.name}</option>
          ))}
        </select>
      </div>

      <div className="h-72 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center gap-2">
            <MessageCircle className="w-8 h-8 text-text-muted" />
            <p className="text-sm text-text-muted">Ask anything about this book</p>
            <div className="flex flex-wrap justify-center gap-2 mt-2">
              {["What is the main theme?", "Summarize chapter 1", "Who are the key characters?"].map((s) => (
                <button
                  key={s}
                  onClick={() => setInput(s)}
                  className="text-xs px-3 py-1.5 bg-surface border border-border rounded-full text-text-muted hover:border-primary hover:text-primary-light transition-all"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-primary text-white rounded-br-sm"
                    : "bg-surface border border-border text-text-secondary rounded-bl-sm"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))
        )}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-surface border border-border rounded-2xl rounded-bl-sm px-4 py-3">
              <Loader2 className="w-4 h-4 text-text-muted animate-spin" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={sendMessage} className="border-t border-border p-3 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`Ask in ${language}...`}
          className="flex-1 bg-surface border border-border rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors"
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="btn-gradient p-2.5 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
}
