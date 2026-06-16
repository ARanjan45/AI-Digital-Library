"use client";

import { Mic, MicOff, PhoneOff, Volume2, Loader2 } from "lucide-react";
import { useVapi } from "@/hooks/useVapi";
import { SUPPORTED_LANGUAGES } from "@/lib/sarvam";
import { useState } from "react";

interface VoiceConversationProps {
  bookTitle: string;
  bookText: string;
  defaultLanguage?: string;
}

export default function VoiceConversation({
  bookTitle,
  bookText,
  defaultLanguage = "English",
}: VoiceConversationProps) {
  const [language, setLanguage] = useState(defaultLanguage);
  const [muted, setMuted] = useState(false);
  const { callStatus, isSpeaking, transcript, error, startCall, endCall, toggleMute } =
    useVapi({ bookTitle, bookText, language });

  const handleMute = () => {
    toggleMute();
    setMuted((m) => !m);
  };

  return (
    <div className="bg-surface-2 border border-border rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-semibold text-text-primary flex items-center gap-2">
          <Volume2 className="w-5 h-5 text-primary-light" />
          Voice Conversation
        </h3>
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          disabled={callStatus === "active" || callStatus === "connecting"}
          className="bg-surface border border-border rounded-xl px-3 py-1.5 text-xs text-text-secondary focus:outline-none focus:border-primary disabled:opacity-50"
        >
          {SUPPORTED_LANGUAGES.map((l) => (
            <option key={l.code} value={l.name}>{l.name}</option>
          ))}
        </select>
      </div>

      {/* Visual indicator */}
      <div className="flex flex-col items-center py-6">
        <div
          className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 transition-all ${
            callStatus === "active" && isSpeaking
              ? "bg-primary/20 voice-ring"
              : callStatus === "active"
              ? "bg-primary/10 animate-pulse-slow"
              : "bg-surface-3"
          }`}
        >
          {callStatus === "connecting" ? (
            <Loader2 className="w-8 h-8 text-primary-light animate-spin" />
          ) : callStatus === "active" && isSpeaking ? (
            <div className="flex items-end gap-0.5 h-8">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="wave-bar" style={{ animationDelay: `${i * 0.1}s` }} />
              ))}
            </div>
          ) : (
            <Mic className={`w-8 h-8 ${callStatus === "active" ? "text-primary-light" : "text-text-muted"}`} />
          )}
        </div>

        <p className="text-sm text-text-secondary mb-1">
          {callStatus === "idle" && "Start talking to your book"}
          {callStatus === "connecting" && "Connecting..."}
          {callStatus === "active" && isSpeaking && "AI is speaking..."}
          {callStatus === "active" && !isSpeaking && "Listening... ask your question"}
          {callStatus === "ended" && "Session ended"}
        </p>
        <p className="text-xs text-text-muted">Language: {language}</p>
      </div>

      {/* Controls */}
      <div className="flex justify-center gap-3 mb-6">
        {callStatus === "idle" || callStatus === "ended" ? (
          <button
            onClick={startCall}
            className="btn-gradient px-8 py-3 rounded-xl font-semibold flex items-center gap-2"
          >
            <Mic className="w-5 h-5" /> Start Voice Session
          </button>
        ) : (
          <>
            <button
              onClick={handleMute}
              className={`p-3 rounded-xl border transition-all ${
                muted
                  ? "bg-red-500/20 border-red-500/40 text-red-400"
                  : "border-border text-text-secondary hover:border-border-light"
              }`}
            >
              {muted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
            <button
              onClick={endCall}
              className="px-6 py-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-400 hover:bg-red-500/30 transition-all flex items-center gap-2 font-medium"
            >
              <PhoneOff className="w-5 h-5" /> End Call
            </button>
          </>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-400 text-center mb-4">{error}</p>
      )}

      {/* Transcript */}
      {transcript.length > 0 && (
        <div className="border-t border-border pt-4 max-h-48 overflow-y-auto space-y-3">
          <p className="text-xs text-text-muted font-medium uppercase tracking-wider">Transcript</p>
          {transcript.map((t, i) => (
            <div key={i} className={`flex gap-2 ${t.role === "assistant" ? "flex-row" : "flex-row-reverse"}`}>
              <div
                className={`max-w-[85%] px-3 py-2 rounded-xl text-sm ${
                  t.role === "assistant"
                    ? "bg-primary/10 text-text-primary border border-primary/20"
                    : "bg-surface-3 text-text-secondary ml-auto"
                }`}
              >
                {t.text}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
