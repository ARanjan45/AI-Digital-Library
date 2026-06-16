export function getVapiAssistantConfig(
  bookTitle: string,
  bookText: string,
  language: string
) {
  const langInstruction =
    language !== "English"
      ? `Always respond in ${language} language.`
      : "Respond in English.";

  return {
    name: `${bookTitle} Assistant`,
    firstMessage: `Hello! I'm your AI reading companion for "${bookTitle}". Ask me anything about this book — its themes, characters, key concepts, or any part you'd like explained. ${language !== "English" ? `I'll respond in ${language}.` : ""}`,
    transcriber: {
      provider: "deepgram",
      model: "nova-2",
      language: "en",
    },
    voice: {
      provider: "11labs",
      voiceId: "paula",
    },
    model: {
      provider: "groq",
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `You are an intelligent reading companion for the book "${bookTitle}". 
${langInstruction}
Your role is to help the reader understand, analyze, and engage deeply with this book.

You can:
- Explain concepts and passages from the book
- Discuss themes, characters, and plot points
- Answer comprehension questions
- Provide context and background information
- Help with difficult vocabulary or ideas

Book Content (use this as your primary reference):
${bookText.slice(0, 6000)}

Keep responses concise (2-4 sentences for simple questions, up to a paragraph for complex ones).
Be encouraging and make reading an enjoyable experience.`,
        },
      ],
      maxTokens: 512,
      temperature: 0.7,
    },
    endCallFunctionEnabled: false,
    recordingEnabled: true,
    silenceTimeoutSeconds: 30,
    maxDurationSeconds: 1800,
  };
}

export const VAPI_CALL_STATUSES = {
  IDLE: "idle",
  CONNECTING: "connecting",
  ACTIVE: "active",
  ENDED: "ended",
} as const;
