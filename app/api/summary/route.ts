import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/mongodb";
import Book from "@/models/Book";
import { generateSummary } from "@/lib/groq";

const SARVAM_API_KEY = process.env.SARVAM_API_KEY!;

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { bookId, targetLanguage = "hi-IN", languageName = "Hindi", audio = false } = await req.json();

    await connectDB();
    const book = await Book.findById(bookId).select("extractedText title");
    if (!book) return NextResponse.json({ error: "Book not found" }, { status: 404 });

    // Generate text summary
    const summary = await generateSummary(book.extractedText, book.title, languageName);

    if (audio) {
      try {
        // Call Sarvam TTS directly and handle base64 response
        const sarvamRes = await fetch("https://api.sarvam.ai/text-to-speech", {
          method: "POST",
          headers: {
            "api-subscription-key": SARVAM_API_KEY,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            inputs: [summary.slice(0, 500)], // Sarvam limit per request
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

        if (!sarvamRes.ok) {
          // If TTS fails, return just the text summary
          return NextResponse.json({ summary, audioFailed: true });
        }

        const sarvamData = await sarvamRes.json();
        
        // Sarvam returns base64 audio in audios array
        if (sarvamData.audios && sarvamData.audios[0]) {
          const audioBase64 = sarvamData.audios[0];
          const audioBuffer = Buffer.from(audioBase64, "base64");
          
          return new NextResponse(audioBuffer, {
            headers: {
              "Content-Type": "audio/wav",
              "Content-Length": audioBuffer.length.toString(),
              "Cache-Control": "no-cache",
            },
          });
        }
        
        return NextResponse.json({ summary, audioFailed: true });
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