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

    const update: any = { lastReadAt: new Date() };

    // Only touch reading position if this ping actually includes it.
    // This lets a pure time-tracking ping (no currentPage/totalPages) increment
    // timeSpentMinutes without accidentally resetting the user's page.
    if (typeof currentPage === "number" && typeof totalPages === "number" && totalPages > 0) {
      const percentComplete = Math.round((currentPage / totalPages) * 100);
      update.currentPage = currentPage;
      update.totalPages = totalPages;
      update.percentComplete = percentComplete;
      if (percentComplete >= 100) update.completedAt = new Date();
    }

    if (timeSpentMinutes) {
      update.$inc = { timeSpentMinutes };
    }

    const progress = await Progress.findOneAndUpdate(
      { userId, bookId },
      update,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    return NextResponse.json({ progress });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update progress" }, { status: 500 });
  }
}
