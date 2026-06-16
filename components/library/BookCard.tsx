import Link from "next/link";
import { BookOpen, Eye, Globe } from "lucide-react";

interface BookCardProps {
  book: {
    _id: string;
    title: string;
    author: string;
    coverUrl?: string;
    language: string;
    category: string;
    viewCount: number;
    totalPages?: number;
  };
  compact?: boolean;
}

const CATEGORY_COLORS: Record<string, string> = {
  Academic: "bg-blue-500/20 text-blue-300",
  Science: "bg-green-500/20 text-green-300",
  Technology: "bg-cyan-500/20 text-cyan-300",
  Literature: "bg-yellow-500/20 text-yellow-300",
  History: "bg-orange-500/20 text-orange-300",
  Mathematics: "bg-purple-500/20 text-purple-300",
  Medical: "bg-red-500/20 text-red-300",
  Fiction: "bg-pink-500/20 text-pink-300",
};

export default function BookCard({ book, compact = false }: BookCardProps) {
  const categoryColor = CATEGORY_COLORS[book.category] || "bg-primary/20 text-primary-light";

  return (
    <Link href={`/book/${book._id}`}>
      <div className={`bg-surface-2 border border-border rounded-2xl overflow-hidden card-glow hover:border-border-light transition-all group cursor-pointer ${compact ? "h-56" : "h-72"}`}>
        {/* Cover */}
        <div className={`relative bg-gradient-card overflow-hidden ${compact ? "h-32" : "h-44"}`}>
          {book.coverUrl ? (
            <img
              src={book.coverUrl}
              alt={book.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-surface-3 to-surface-2">
              <BookOpen className="w-10 h-10 text-text-muted group-hover:text-primary-light transition-colors" />
            </div>
          )}
          <div className="absolute top-2 left-2">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${categoryColor}`}>
              {book.category}
            </span>
          </div>
        </div>

        {/* Info */}
        <div className="p-3">
          <h3 className="font-semibold text-text-primary text-sm leading-tight mb-1 line-clamp-2 group-hover:text-primary-light transition-colors">
            {book.title}
          </h3>
          <p className="text-xs text-text-muted mb-2 truncate">{book.author}</p>
          <div className="flex items-center justify-between text-xs text-text-muted">
            <span className="flex items-center gap-1">
              <Globe className="w-3 h-3" /> {book.language}
            </span>
            <span className="flex items-center gap-1">
              <Eye className="w-3 h-3" /> {book.viewCount}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
