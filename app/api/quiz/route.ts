import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/mongodb";
import Book from "@/models/Book";
import Progress from "@/models/Progress";
import { generateQuiz } from "@/lib/groq";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { bookId, language = "English", numQuestions = 5 } = await req.json();

    await connectDB();
    const book = await Book.findById(bookId).select("extractedText title language");
    if (!book) return NextResponse.json({ error: "Book not found" }, { status: 404 });

    const targetLanguage = language || book.language;
    const questions = await generateQuiz(book.extractedText, targetLanguage, numQuestions);

    return NextResponse.json({ questions, bookTitle: book.title });
  } catch (error) {
    console.error("Quiz generation error:", error);
    return NextResponse.json({ error: "Failed to generate quiz" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { bookId, score, total } = await req.json();
    await connectDB();

    await Progress.findOneAndUpdate(
      { userId, bookId },
      { $push: { quizScores: { score, total, date: new Date() } } },
      { upsert: true, new: true }
    );

    return NextResponse.json({ message: "Score saved" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to save score" }, { status: 500 });
  }
}
