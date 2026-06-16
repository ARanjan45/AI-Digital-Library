import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/mongodb";
import Progress from "@/models/Progress";

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const { searchParams } = new URL(req.url);
    const bookId = searchParams.get("bookId");

    if (bookId) {
      const progress = await Progress.findOne({ userId, bookId }).lean();
      return NextResponse.json({ progress });
    }

    const allProgress = await Progress.find({ userId })
      .populate("bookId", "title author coverUrl")
      .sort({ lastReadAt: -1 })
      .lean();

    return NextResponse.json({ progress: allProgress });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch progress" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { bookId, currentPage, totalPages, timeSpentMinutes } = await req.json();
    await connectDB();

    const percentComplete = totalPages > 0 ? Math.round((currentPage / totalPages) * 100) : 0;

    const progress = await Progress.findOneAndUpdate(
      { userId, bookId },
      {
        currentPage,
        totalPages,
        percentComplete,
        $inc: { timeSpentMinutes: timeSpentMinutes || 0 },
        lastReadAt: new Date(),
        ...(percentComplete >= 100 ? { completedAt: new Date() } : {}),
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({ progress });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update progress" }, { status: 500 });
  }
}
