import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/mongodb";
import { uploadPDF, uploadCover } from "@/lib/cloudinary";
import Book from "@/models/Book";
import pdfParse from "pdf-parse";

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const language = searchParams.get("language") || "";
    const category = searchParams.get("category") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");
    const myBooks = searchParams.get("myBooks") === "true";

    const { userId } = await auth();

    const query: Record<string, unknown> = {};

    if (myBooks && userId) {
      query.uploadedBy = userId;
    } else {
      query.isPublic = true;
    }

    if (search) {
      query.$text = { $search: search };
    }
    if (language) query.language = language;
    if (category) query.category = category;

    const skip = (page - 1) * limit;
    const total = await Book.countDocuments(query);
    const books = await Book.find(query)
      .select("-extractedText")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return NextResponse.json({
      books,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("GET /api/books error:", error);
    return NextResponse.json({ error: "Failed to fetch books" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const formData = await req.formData();
    const pdfFile = formData.get("pdf") as File;
    const coverFile = formData.get("cover") as File | null;
    const title = formData.get("title") as string;
    const author = formData.get("author") as string;
    const description = formData.get("description") as string;
    const language = formData.get("language") as string;
    const category = formData.get("category") as string;
    const tags = (formData.get("tags") as string || "").split(",").map((t) => t.trim()).filter(Boolean);
    const isPublic = formData.get("isPublic") !== "false";

    if (!pdfFile || !title || !author) {
      return NextResponse.json({ error: "PDF, title and author are required" }, { status: 400 });
    }

    const pdfBuffer = Buffer.from(await pdfFile.arrayBuffer());

    // Extract text from PDF
    let extractedText = "";
    let totalPages = 0;
    try {
      const parsed = await pdfParse(pdfBuffer);
      extractedText = parsed.text;
      totalPages = parsed.numpages;
    } catch {
      console.warn("PDF text extraction failed, continuing without text");
    }

    // Upload PDF to Cloudinary
    const { url: pdfUrl, publicId: pdfPublicId } = await uploadPDF(pdfBuffer, title);

    // Upload cover if provided
    let coverUrl = "";
    if (coverFile) {
      const coverBuffer = Buffer.from(await coverFile.arrayBuffer());
      const { url } = await uploadCover(coverBuffer, title);
      coverUrl = url;
    }

    const book = await Book.create({
      title,
      author,
      description,
      language: language || "English",
      category: category || "Other",
      tags,
      pdfUrl,
      coverUrl,
      pdfPublicId,
      extractedText,
      totalPages,
      uploadedBy: userId,
      isPublic,
    });

    return NextResponse.json({ book, message: "Book uploaded successfully" }, { status: 201 });
  } catch (error) {
    console.error("POST /api/books error:", error);
    return NextResponse.json({ error: "Failed to upload book" }, { status: 500 });
  }
}
