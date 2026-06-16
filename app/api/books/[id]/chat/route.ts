import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/mongodb";
import Book from "@/models/Book";
import Progress from "@/models/Progress";
import { chatWithBook } from "@/lib/groq";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { message, language = "English", history = [] } = await req.json();

    await connectDB();
    const book = await Book.findById(params.id).select("extractedText title language");
    if (!book) return NextResponse.json({ error: "Book not found" }, { status: 404 });

    const reply = await chatWithBook(
      book.extractedText,
      book.title,
      language,
      history,
      message
    );

    // Save to conversation history
    await Progress.findOneAndUpdate(
      { userId, bookId: params.id },
      {
        $push: {
          conversationHistory: {
            $each: [
              { role: "user", content: message, timestamp: new Date() },
              { role: "assistant", content: reply, timestamp: new Date() },
            ],
          },
        },
        lastReadAt: new Date(),
      },
      { upsert: true }
    );

    return NextResponse.json({ reply });
  } catch (error) {
    console.error("Chat error:", error);
    return NextResponse.json({ error: "Failed to process chat" }, { status: 500 });
  }
}
