"use client";

import { useState } from "react";
import { FileText, Volume2, Loader2, Play, Square } from "lucide-react";
import { SUPPORTED_LANGUAGES } from "@/lib/sarvam";

interface SummaryProps {
  bookId: string;
  defaultLanguage?: string;
}

export default function VoiceSummary({ bookId, defaultLanguage = "English" }: SummaryProps) {
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [language, setLanguage] = useState(defaultLanguage);
  const [langCode, setLangCode] = useState("en-IN");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioEl, setAudioEl] = useState<HTMLAudioElement | null>(null);

  const handleLanguageChange = (name: string) => {
    setLanguage(name);
    const found = SUPPORTED_LANGUAGES.find((l) => l.name === name);
    if (found) setLangCode(found.code);
    setSummary("");
    setAudioUrl(null);
  };

  const fetchSummary = async () => {
    setLoading(true);
    setAudioUrl(null);
    try {
      const res = await fetch("/api/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookId, targetLanguage: langCode, languageName: language }),
      });
      const data = await res.json();
      setSummary(data.summary || "Could not generate summary.");
    } catch {
      setSummary("Failed to generate summary. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchAudio = async () => {
    setAudioLoading(true);
    try {
      const res = await fetch("/api/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookId, targetLanguage: langCode, languageName: language, audio: true }),
      });
      if (!res.ok) throw new Error("Audio failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);
      const audio = new Audio(url);
      setAudioEl(audio);
      audio.onended = () => setPlaying(false);
      audio.play();
      setPlaying(true);
    } catch {
      alert("Audio not available for this language. Try Hindi or another supported language.");
    } finally {
      setAudioLoading(false);
    }
  };

  const toggleAudio = () => {
    if (!audioEl) return;
    if (playing) {
      audioEl.pause();
      setPlaying(false);
    } else {
      audioEl.play();
      setPlaying(true);
    }
  };

  return (
    <div className="bg-surface-2 border border-border rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-semibold text-text-primary flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary-light" />
          AI Summary
        </h3>
        <select
          value={language}
          onChange={(e) => handleLanguageChange(e.target.value)}
          className="bg-surface border border-border rounded-xl px-3 py-1.5 text-xs text-text-secondary focus:outline-none focus:border-primary"
        >
          {SUPPORTED_LANGUAGES.map((l) => (
            <option key={l.code} value={l.name}>{l.name}</option>
          ))}
        </select>
      </div>

      {!summary && !loading && (
        <div className="text-center py-4">
          <p className="text-sm text-text-secondary mb-4">Get a concise AI summary of this book in your preferred language.</p>
          <button onClick={fetchSummary} className="btn-gradient px-6 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 mx-auto">
            <FileText className="w-4 h-4" /> Generate Summary
          </button>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center gap-2 py-6 text-text-secondary text-sm">
          <Loader2 className="w-5 h-5 animate-spin" /> Generating in {language}...
        </div>
      )}

      {summary && (
        <div>
          <p className="text-sm text-text-secondary leading-relaxed mb-5 whitespace-pre-line">{summary}</p>

          <div className="flex gap-3">
            {!audioUrl ? (
              <button
                onClick={fetchAudio}
                disabled={audioLoading}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm text-text-secondary hover:border-primary hover:text-primary-light transition-all disabled:opacity-50"
              >
                {audioLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Volume2 className="w-4 h-4" />}
                {audioLoading ? "Generating audio..." : "Listen in " + language}
              </button>
            ) : (
              <button
                onClick={toggleAudio}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 border border-primary/30 text-sm text-primary-light hover:bg-primary/20 transition-all"
              >
                {playing ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                {playing ? "Pause" : "Play"} Audio
              </button>
            )}
            <button
              onClick={fetchSummary}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm text-text-muted hover:border-border-light transition-all"
            >
              Regenerate
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
