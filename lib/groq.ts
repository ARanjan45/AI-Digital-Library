const GROQ_API_KEY = process.env.GROQ_API_KEY!;
const GROQ_BASE_URL = "https://api.groq.com/openai/v1";

interface GroqMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export async function groqChat(
  messages: GroqMessage[],
  model = "llama-3.3-70b-versatile",
  maxTokens = 2048
): Promise<string> {
  const response = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model, messages, max_tokens: maxTokens }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Groq API error: ${error}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

export async function generateQuiz(
  bookText: string,
  language: string,
  numQuestions = 5
): Promise<QuizQuestion[]> {
  const prompt = `You are an expert educator. Based on this book content, generate ${numQuestions} multiple choice questions in ${language} language.

Book Content (first 3000 chars):
${bookText.slice(0, 3000)}

Return ONLY a valid JSON array (no markdown, no explanation) in this exact format:
[
  {
    "question": "question text",
    "options": ["A) option1", "B) option2", "C) option3", "D) option4"],
    "correctAnswer": "A",
    "explanation": "brief explanation"
  }
]`;

  const result = await groqChat([{ role: "user", content: prompt }], "llama-3.3-70b-versatile", 1500);
  
  try {
    const cleaned = result.replace(/```json|```/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    return [];
  }
}

export async function generateSummary(
  bookText: string,
  language: string,
  targetLanguage: string
): Promise<string> {
  const prompt = `You are a book summarizer. Create a concise 3-paragraph summary of this book content in ${targetLanguage} language. Focus on key themes, main arguments, and important takeaways.

Book Content:
${bookText.slice(0, 5000)}

Respond only with the summary in ${targetLanguage}.`;

  return groqChat([{ role: "user", content: prompt }], "llama-3.3-70b-versatile", 800);
}

export async function getRecommendations(
  userBooks: string[],
  allBooks: { id: string; title: string; category: string; language: string }[]
): Promise<string[]> {
  const prompt = `Based on user's reading history: ${userBooks.join(", ")}

Available books: ${JSON.stringify(allBooks.slice(0, 20))}

Recommend 3-5 book IDs that the user would most likely enjoy. Return ONLY a JSON array of book IDs like: ["id1", "id2", "id3"]`;

  const result = await groqChat([{ role: "user", content: prompt }], "llama-3.3-70b-versatile", 200);
  try {
    const cleaned = result.replace(/```json|```/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    return [];
  }
}

export async function chatWithBook(
  bookText: string,
  bookTitle: string,
  language: string,
  conversationHistory: { role: string; content: string }[],
  userMessage: string
): Promise<string> {
  const systemPrompt = `You are an AI assistant helping a reader understand the book "${bookTitle}". 
Answer questions based on the book content provided below. 
Respond in ${language} language.
Be conversational, helpful, and cite specific parts of the book when relevant.

Book Content:
${bookText.slice(0, 8000)}`;

  const messages: GroqMessage[] = [
    { role: "system", content: systemPrompt },
    ...conversationHistory.slice(-6).map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    { role: "user", content: userMessage },
  ];

  return groqChat(messages, "llama-3.3-70b-versatile", 1024);
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}
