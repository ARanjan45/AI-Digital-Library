import mongoose, { Schema, Document } from "mongoose";

export interface IProgress extends Document {
  userId: string;
  bookId: string;
  currentPage: number;
  totalPages: number;
  percentComplete: number;
  timeSpentMinutes: number;
  lastReadAt: Date;
  completedAt?: Date;
  quizScores: { score: number; total: number; date: Date }[];
  notes: string;
  conversationHistory: { role: string; content: string; timestamp: Date }[];
}

const ProgressSchema = new Schema<IProgress>(
  {
    userId: { type: String, required: true },
    bookId: { type: Schema.Types.ObjectId as any, ref: "Book", required: true },
    currentPage: { type: Number, default: 1 },
    totalPages: { type: Number, default: 0 },
    percentComplete: { type: Number, default: 0 },
    timeSpentMinutes: { type: Number, default: 0 },
    lastReadAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
    quizScores: [
      {
        score: Number,
        total: Number,
        date: { type: Date, default: Date.now },
      },
    ],
    notes: { type: String, default: "" },
    conversationHistory: [
      {
        role: { type: String, enum: ["user", "assistant"] },
        content: String,
        timestamp: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

ProgressSchema.index({ userId: 1, bookId: 1 }, { unique: true });

export default mongoose.models.Progress || mongoose.model<IProgress>("Progress", ProgressSchema);
