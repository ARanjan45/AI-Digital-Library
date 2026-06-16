import mongoose, { Schema, Document } from "mongoose";

export interface IBook extends Document {
  title: string;
  author: string;
  description: string;
  language: string;
  category: string;
  tags: string[];
  pdfUrl: string;
  coverUrl: string;
  pdfPublicId: string;
  extractedText: string;
  totalPages: number;
  uploadedBy: string; // Clerk userId
  isPublic: boolean;
  viewCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const BookSchema = new Schema<IBook>(
  {
    title: { type: String, required: true, trim: true },
    author: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    language: { type: String, required: true, default: "English" },
    category: {
      type: String,
      enum: [
        "Academic", "Fiction", "Non-Fiction", "Science", "Technology",
        "History", "Literature", "Mathematics", "Engineering", "Medical",
        "Law", "Arts", "Religion", "Self-Help", "Other"
      ],
      default: "Other",
    },
    tags: [{ type: String }],
    pdfUrl: { type: String, required: true },
    coverUrl: { type: String, default: "" },
    pdfPublicId: { type: String, required: true },
    extractedText: { type: String, default: "" },
    totalPages: { type: Number, default: 0 },
    uploadedBy: { type: String, required: true },
    isPublic: { type: Boolean, default: true },
    viewCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

BookSchema.index({ title: "text", author: "text", description: "text", tags: "text" });
BookSchema.index({ language: 1, category: 1 });
BookSchema.index({ uploadedBy: 1 });

export default mongoose.models.Book || mongoose.model<IBook>("Book", BookSchema);
