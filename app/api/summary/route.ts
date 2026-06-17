import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/mongodb";
import Book from "@/models/Book";
import { generateSummary } from "@/lib/groq";

const SARVAM_API_KEY = process.env.SARVAM_API_KEY!;

async function ttsChunk(text: string, targetLanguage: string): Promise<Buffer | null> {
  const res = await fetch("https://api.sarvam.ai/text-to-speech", {
    method: "POST",
    headers: {
      "api-subscription-key": SARVAM_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      inputs: [text],
      target_language_code: targetLanguage,
      speaker: "meera",
      pitch: 0,
      pace: 1.0,
      loudness: 1.5,
      speech_sample_rate: 22050,
      enable_preprocessing: true,
      model: "bulbul:v2",
    }),
  });

  if (!res.ok) return null;
  const data = await res.json();
  if (!data.audios?.[0]) return null;
  return Buffer.from(data.audios[0], "base64");
}

function splitIntoChunks(text: string, maxLen = 400): string[] {
  const sentences = text.match(/[^।.!?]+[।.!?]+/g) || [text];
  const chunks: string[] = [];
  let current = "";

  for (const sentence of sentences) {
    if ((current + sentence).length > maxLen) {
      if (current) chunks.push(current.trim());
      current = sentence;
    } else {
      current += sentence;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

// Merge multiple WAV buffers into one (strips headers from all but first)
function mergeWavBuffers(buffers: Buffer[]): Buffer {
  if (buffers.length === 1) return buffers[0];
  
  const header = buffers[0].slice(0, 44);
  const audioData = buffers.map((b, i) => b.slice(i === 0 ? 44 : 44));
  const totalDataLength = audioData.reduce((sum, b) => sum + b.length, 0);
  
  const result = Buffer.alloc(44 + totalDataLength);
  header.copy(result, 0);
  
  // Update chunk size in header
  result.writeUInt32LE(36 + totalDataLength, 4);
  result.writeUInt32LE(totalDataLength, 40);
  
  let offset = 44;
  for (const data of audioData) {
    data.copy(result, offset);
    offset += data.length;
  }
  
  return result;
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { bookId, targetLanguage = "hi-IN", languageName = "Hindi", audio = false } = await req.json();

    await connectDB();
    const book = await Book.findById(bookId).select("extractedText title");
    if (!book) return NextResponse.json({ error: "Book not found" }, { status: 404 });

    const summary = await generateSummary(book.extractedText, book.title, languageName);

    if (audio) {
      try {
        const chunks = splitIntoChunks(summary, 400);
        const audioBuffers: Buffer[] = [];

        for (const chunk of chunks) {
          const buf = await ttsChunk(chunk, targetLanguage);
          if (buf) audioBuffers.push(buf);
        }

        if (audioBuffers.length === 0) {
          return NextResponse.json({ summary, audioFailed: true });
        }

        const merged = mergeWavBuffers(audioBuffers);

        return new NextResponse(new Uint8Array(merged), {
          headers: {
            "Content-Type": "audio/wav",
            "Content-Length": merged.length.toString(),
            "Cache-Control": "no-cache",
          },
        });
      } catch (ttsError) {
        console.error("TTS error:", ttsError);
        return NextResponse.json({ summary, audioFailed: true });
      }
    }

    return NextResponse.json({ summary, bookTitle: book.title });
  } catch (error) {
    console.error("Summary error:", error);
    return NextResponse.json({ error: "Failed to generate summary" }, { status: 500 });
  }
}