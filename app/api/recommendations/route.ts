import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/mongodb";
import Book from "@/models/Book";
import Progress from "@/models/Progress";
import { getRecommendations } from "@/lib/groq";

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ recommendations: [] });

    await connectDB();

    const userProgress = await Progress.find({ userId })
      .populate("bookId", "title category language")
      .lean();

    const readBooks = userProgress
      .map((p: any) => p.bookId?.title)
      .filter(Boolean) as string[];

    const allBooks = await Book.find({ isPublic: true })
      .select("_id title category language")
      .limit(50)
      .lean();

    const mappedBooks = allBooks.map((b: any) => ({
      id: b._id.toString(),
      title: b.title,
      category: b.category,
      language: b.language,
    }));

    const recommendedIds = await getRecommendations(readBooks, mappedBooks);

    const recommendedBooks = await Book.find({
      _id: { $in: recommendedIds },
    })
      .select("-extractedText")
      .lean();

    return NextResponse.json({ recommendations: recommendedBooks });
  } catch (error) {
    return NextResponse.json({ error: "Failed to get recommendations" }, { status: 500 });
  }
}
