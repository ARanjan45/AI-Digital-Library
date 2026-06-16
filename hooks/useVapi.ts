"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Vapi from "@vapi-ai/web";
import { getVapiAssistantConfig } from "@/lib/vapi";

type CallStatus = "idle" | "connecting" | "active" | "ended";

interface UseVapiProps {
  bookTitle: string;
  bookText: string;
  language: string;
}

export function useVapi({ bookTitle, bookText, language }: UseVapiProps) {
  const vapiRef = useRef<Vapi | null>(null);
  const [callStatus, setCallStatus] = useState<CallStatus>("idle");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState<{ role: string; text: string }[]>([]);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY;
    if (!key) return;

    vapiRef.current = new Vapi(key);
    const vapi = vapiRef.current;

    vapi.on("call-start", () => {
      setCallStatus("active");
      setError("");
    });

    vapi.on("call-end", () => {
      setCallStatus("ended");
      setIsSpeaking(false);
      setTimeout(() => setCallStatus("idle"), 2000);
    });

    vapi.on("speech-start", () => setIsSpeaking(true));
    vapi.on("speech-end", () => setIsSpeaking(false));

    vapi.on("message", (msg: any) => {
      if (msg.type === "transcript" && msg.transcriptType === "final") {
        setTranscript((prev) => [
          ...prev,
          { role: msg.role, text: msg.transcript },
        ]);
      }
    });

    vapi.on("error", (err: any) => {
      console.error("Vapi error:", err);
      setError("Voice connection error. Please try again.");
      setCallStatus("idle");
    });

    return () => {
      vapi.stop();
    };
  }, []);

  const startCall = useCallback(async () => {
    if (!vapiRef.current) return;
    setCallStatus("connecting");
    setTranscript([]);

    const config = getVapiAssistantConfig(bookTitle, bookText, language);
    try {
      await vapiRef.current.start(config as any);
    } catch (err) {
      setError("Failed to start voice session.");
      setCallStatus("idle");
    }
  }, [bookTitle, bookText, language]);

  const endCall = useCallback(() => {
    vapiRef.current?.stop();
  }, []);

  const toggleMute = useCallback(() => {
    if (vapiRef.current) {
      const muted = vapiRef.current.isMuted();
      vapiRef.current.setMuted(!muted);
    }
  }, []);

  return { callStatus, isSpeaking, transcript, error, startCall, endCall, toggleMute };
}
