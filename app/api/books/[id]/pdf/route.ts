import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/mongodb";
import Book from "@/models/Book";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const book = await Book.findById(params.id).select("pdfPublicId pdfUrl uploadedBy isPublic");
    if (!book) return NextResponse.json({ error: "Book not found" }, { status: 404 });

    // Generate signed URL valid for 1 hour
    const signedUrl = cloudinary.utils.private_download_url(
      book.pdfPublicId,
      "pdf",
      {
        resource_type: "raw",
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        attachment: false,
      }
    );

    // Fetch PDF from Cloudinary and stream it
    const pdfRes = await fetch(signedUrl);
    if (!pdfRes.ok) {
      // fallback to direct URL
      return NextResponse.redirect(book.pdfUrl);
    }

    const pdfBuffer = await pdfRes.arrayBuffer();

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "inline",
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error) {
    console.error("PDF proxy error:", error);
    return NextResponse.json({ error: "Failed to fetch PDF" }, { status: 500 });
  }
}