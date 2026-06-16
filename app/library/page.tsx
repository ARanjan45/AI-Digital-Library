"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useUser, UserButton } from "@clerk/nextjs";
import { Search, Upload, BookOpen, Filter, Globe, Clock, Star, Library, User } from "lucide-react";

interface Book {
  _id: string; title: string; author: string; description: string;
  language: string; category: string; coverUrl: string; totalPages: number; viewCount: number; createdAt: string;
}

const LANGUAGES = ["All","English","Hindi","Bengali","Telugu","Marathi","Tamil","Gujarati","Kannada","Malayalam","Punjabi","Odia","Urdu"];
const CATEGORIES = ["All","Academic","Fiction","Non-Fiction","Science","Technology","History","Literature","Mathematics","Engineering","Medical","Law"];

export default function LibraryPage() {
  const { user } = useUser();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [language, setLanguage] = useState("All");
  const [category, setCategory] = useState("All");
  const [myBooks, setMyBooks] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [recommendations, setRecommendations] = useState<Book[]>([]);

  const fetchBooks = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: "12", ...(search && { search }), ...(language !== "All" && { language }), ...(category !== "All" && { category }), ...(myBooks && { myBooks: "true" }) });
      const res = await fetch(`/api/books?${params}`);
      const data = await res.json();
      setBooks(data.books || []);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch { setBooks([]); } finally { setLoading(false); }
  }, [search, language, category, myBooks, page]);

  useEffect(() => { fetchBooks(); }, [fetchBooks]);
  useEffect(() => {
    fetch("/api/recommendations").then(r => r.json()).then(d => setRecommendations(d.recommendations || [])).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <nav className="glass sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl btn-gradient flex items-center justify-center">
            <Library className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold"><span className="text-text-primary">AI</span><span className="gradient-text"> Digital Library</span></span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/upload" className="btn-gradient px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2">
            <Upload className="w-4 h-4" /> Upload Book
          </Link>
          <UserButton afterSignOutUrl="/" />
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text-primary mb-1">Welcome back, <span className="gradient-text">{user?.firstName || "Reader"}</span> 👋</h1>
          <p className="text-text-secondary">Discover, read, and converse with books in your language.</p>
        </div>

        <div className="bg-surface-2 border border-border rounded-2xl p-5 mb-8">
          <div className="flex gap-3 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === "Enter" && fetchBooks()} placeholder="Search books, authors, topics..." className="w-full bg-surface-3 border border-border rounded-xl pl-10 pr-4 py-2.5 text-text-primary placeholder:text-text-muted text-sm focus:outline-none focus:border-primary" />
            </div>
            <button onClick={fetchBooks} className="btn-gradient px-5 py-2.5 rounded-xl text-sm font-semibold">Search</button>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-text-muted" />
              <select value={language} onChange={(e) => { setLanguage(e.target.value); setPage(1); }} className="bg-surface-3 border border-border rounded-lg px-3 py-1.5 text-text-secondary text-sm focus:outline-none focus:border-primary">
                {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-text-muted" />
              <select value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }} className="bg-surface-3 border border-border rounded-lg px-3 py-1.5 text-text-secondary text-sm focus:outline-none focus:border-primary">
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <button onClick={() => { setMyBooks(!myBooks); setPage(1); }} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${myBooks ? "btn-gradient text-white" : "bg-surface-3 border border-border text-text-secondary hover:border-primary"}`}>
              <User className="w-4 h-4" /> My Books
            </button>
          </div>
        </div>

        {recommendations.length > 0 && !myBooks && !search && (
          <div className="mb-10">
            <h2 className="text-xl font-bold text-text-primary mb-4 flex items-center gap-2"><Star className="w-5 h-5 text-primary-light" /> Recommended for You</h2>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {recommendations.slice(0, 4).map((book) => <BookCard key={book._id} book={book} compact />)}
            </div>
          </div>
        )}

        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-text-primary">{myBooks ? "My Books" : "All Books"}</h2>
          <span className="text-text-muted text-sm">{books.length} books</span>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => <div key={i} className="bg-surface-2 border border-border rounded-2xl h-64 animate-pulse" />)}
          </div>
        ) : books.length === 0 ? (
          <div className="text-center py-20">
            <BookOpen className="w-16 h-16 text-text-muted mx-auto mb-4" />
            <h3 className="text-text-primary text-xl font-semibold mb-2">No books found</h3>
            <p className="text-text-secondary mb-6">{myBooks ? "You haven't uploaded any books yet." : "Try a different search or filter."}</p>
            <Link href="/upload" className="btn-gradient px-6 py-3 rounded-xl font-semibold">Upload First Book</Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {books.map((book) => <BookCard key={book._id} book={book} />)}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-10">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button key={p} onClick={() => setPage(p)} className={`w-10 h-10 rounded-xl text-sm font-medium transition-all ${p === page ? "btn-gradient text-white" : "bg-surface-2 border border-border text-text-secondary hover:border-primary"}`}>{p}</button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function BookCard({ book, compact = false }: { book: Book; compact?: boolean }) {
  const langColors: Record<string, string> = { Hindi: "bg-orange-500/20 text-orange-300", Bengali: "bg-green-500/20 text-green-300", Tamil: "bg-red-500/20 text-red-300", Telugu: "bg-blue-500/20 text-blue-300", English: "bg-purple-500/20 text-purple-300" };
  const langColor = langColors[book.language] || "bg-primary/20 text-primary-light";
  return (
    <Link href={`/book/${book._id}`} className={`bg-surface-2 border border-border rounded-2xl overflow-hidden card-glow transition-all hover:border-primary/40 hover:-translate-y-1 group ${compact ? "min-w-[160px] max-w-[160px]" : ""}`}>
      <div className="relative bg-surface-3 aspect-[3/4] overflow-hidden">
        {book.coverUrl ? (
          <Image src={book.coverUrl} alt={book.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/10">
            <BookOpen className="w-12 h-12 text-primary-light opacity-60" />
          </div>
        )}
        <div className="absolute top-2 left-2"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${langColor}`}>{book.language}</span></div>
      </div>
      <div className="p-3">
        <h3 className="text-text-primary font-semibold text-sm line-clamp-2 mb-1">{book.title}</h3>
        <p className="text-text-muted text-xs line-clamp-1">{book.author}</p>
        <div className="flex items-center gap-2 mt-2 text-text-muted text-xs"><Clock className="w-3 h-3" /><span>{book.totalPages} pages</span></div>
      </div>
    </Link>
  );
}
