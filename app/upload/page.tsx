"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Upload, FileText, Image as ImageIcon, X, ArrowLeft, Check, Loader2, Library } from "lucide-react";

const LANGUAGES = ["English","Hindi","Bengali","Telugu","Marathi","Tamil","Gujarati","Kannada","Malayalam","Punjabi","Odia","Assamese","Urdu"];
const CATEGORIES = ["Academic","Fiction","Non-Fiction","Science","Technology","History","Literature","Mathematics","Engineering","Medical","Law","Arts","Religion","Self-Help","Other"];

export default function UploadPage() {
  const router = useRouter();
  const pdfRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);

  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string>("");
  const [form, setForm] = useState({ title: "", author: "", description: "", language: "English", category: "Academic", tags: "", isPublic: true });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);

  const handlePdf = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === "application/pdf") {
      setPdfFile(file);
      if (!form.title) setForm(f => ({ ...f, title: file.name.replace(".pdf", "").replace(/-|_/g, " ") }));
    }
  };

  const handleCover = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { setCoverFile(file); setCoverPreview(URL.createObjectURL(file)); }
  };

  const handleSubmit = async () => {
    if (!pdfFile || !form.title || !form.author) { setError("PDF, title, and author are required."); return; }
    setLoading(true); setError(""); setUploadProgress(10);
    try {
      const fd = new FormData();
      fd.append("pdf", pdfFile);
      if (coverFile) fd.append("cover", coverFile);
      Object.entries(form).forEach(([k, v]) => fd.append(k, String(v)));
      setUploadProgress(40);
      const res = await fetch("/api/books", { method: "POST", body: fd });
      setUploadProgress(90);
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Upload failed"); }
      setUploadProgress(100); setSuccess(true);
      setTimeout(() => router.push("/library"), 1500);
    } catch (e: any) { setError(e.message || "Upload failed"); setUploadProgress(0); } finally { setLoading(false); }
  };

  if (success) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="w-20 h-20 btn-gradient rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
          <Check className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-text-primary mb-2">Book Uploaded!</h2>
        <p className="text-text-secondary">Redirecting to your library...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <nav className="glass sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl btn-gradient flex items-center justify-center"><Library className="w-5 h-5 text-white" /></div>
          <span className="text-lg font-bold"><span className="text-text-primary">AI</span><span className="gradient-text"> Digital Library</span></span>
        </div>
        <Link href="/library" className="flex items-center gap-2 text-text-secondary hover:text-text-primary text-sm transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Library
        </Link>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text-primary mb-2">Upload a <span className="gradient-text">Book</span></h1>
          <p className="text-text-secondary">Add a PDF to your library. AI will extract text and enable voice conversations.</p>
        </div>

        {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl p-4 mb-6 text-sm">{error}</div>}

        <div className="space-y-6">
          {/* PDF Upload */}
          <div className="bg-surface-2 border border-border rounded-2xl p-6">
            <h3 className="text-text-primary font-semibold mb-4 flex items-center gap-2"><FileText className="w-5 h-5 text-primary-light" /> PDF File *</h3>
            <div onClick={() => pdfRef.current?.click()} className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${pdfFile ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}>
              {pdfFile ? (
                <div className="flex items-center justify-center gap-3">
                  <FileText className="w-8 h-8 text-primary-light" />
                  <div className="text-left">
                    <p className="text-text-primary font-medium">{pdfFile.name}</p>
                    <p className="text-text-muted text-sm">{(pdfFile.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); setPdfFile(null); }} className="ml-2 text-text-muted hover:text-red-400"><X className="w-5 h-5" /></button>
                </div>
              ) : (
                <>
                  <Upload className="w-10 h-10 text-text-muted mx-auto mb-3" />
                  <p className="text-text-secondary mb-1">Click to upload PDF</p>
                  <p className="text-text-muted text-sm">Max 50MB</p>
                </>
              )}
            </div>
            <input ref={pdfRef} type="file" accept=".pdf" onChange={handlePdf} className="hidden" />
          </div>

          {/* Cover Upload */}
          <div className="bg-surface-2 border border-border rounded-2xl p-6">
            <h3 className="text-text-primary font-semibold mb-4 flex items-center gap-2"><ImageIcon className="w-5 h-5 text-primary-light" /> Cover Image (optional)</h3>
            <div className="flex items-center gap-4">
              <div onClick={() => coverRef.current?.click()} className="w-28 h-36 border-2 border-dashed border-border rounded-xl overflow-hidden cursor-pointer hover:border-primary/50 transition-all flex items-center justify-center bg-surface-3">
                {coverPreview ? <img src={coverPreview} alt="Cover" className="w-full h-full object-cover" /> : <ImageIcon className="w-8 h-8 text-text-muted" />}
              </div>
              <div>
                <p className="text-text-secondary text-sm mb-2">Upload a book cover image</p>
                <button onClick={() => coverRef.current?.click()} className="border border-border text-text-secondary hover:border-primary hover:text-text-primary px-4 py-2 rounded-lg text-sm transition-all">Choose Image</button>
                {coverFile && <button onClick={() => { setCoverFile(null); setCoverPreview(""); }} className="ml-2 text-red-400 text-sm">Remove</button>}
              </div>
            </div>
            <input ref={coverRef} type="file" accept="image/*" onChange={handleCover} className="hidden" />
          </div>

          {/* Book Details */}
          <div className="bg-surface-2 border border-border rounded-2xl p-6 space-y-4">
            <h3 className="text-text-primary font-semibold flex items-center gap-2"><FileText className="w-5 h-5 text-primary-light" /> Book Details</h3>
            {[{ label: "Title *", key: "title", placeholder: "Book title" }, { label: "Author *", key: "author", placeholder: "Author name" }].map(({ label, key, placeholder }) => (
              <div key={key}>
                <label className="text-text-secondary text-sm mb-1.5 block">{label}</label>
                <input value={(form as any)[key]} onChange={(e) => setForm(f => ({ ...f, [key]: e.target.value }))} placeholder={placeholder} className="w-full bg-surface-3 border border-border rounded-xl px-4 py-2.5 text-text-primary placeholder:text-text-muted text-sm focus:outline-none focus:border-primary" />
              </div>
            ))}
            <div>
              <label className="text-text-secondary text-sm mb-1.5 block">Description</label>
              <textarea value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Brief description of the book..." rows={3} className="w-full bg-surface-3 border border-border rounded-xl px-4 py-2.5 text-text-primary placeholder:text-text-muted text-sm focus:outline-none focus:border-primary resize-none" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-text-secondary text-sm mb-1.5 block">Language</label>
                <select value={form.language} onChange={(e) => setForm(f => ({ ...f, language: e.target.value }))} className="w-full bg-surface-3 border border-border rounded-xl px-4 py-2.5 text-text-primary text-sm focus:outline-none focus:border-primary">
                  {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="text-text-secondary text-sm mb-1.5 block">Category</label>
                <select value={form.category} onChange={(e) => setForm(f => ({ ...f, category: e.target.value }))} className="w-full bg-surface-3 border border-border rounded-xl px-4 py-2.5 text-text-primary text-sm focus:outline-none focus:border-primary">
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="text-text-secondary text-sm mb-1.5 block">Tags (comma-separated)</label>
              <input value={form.tags} onChange={(e) => setForm(f => ({ ...f, tags: e.target.value }))} placeholder="e.g. physics, JEE, NCERT" className="w-full bg-surface-3 border border-border rounded-xl px-4 py-2.5 text-text-primary placeholder:text-text-muted text-sm focus:outline-none focus:border-primary" />
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => setForm(f => ({ ...f, isPublic: !f.isPublic }))} className={`w-12 h-6 rounded-full transition-all relative ${form.isPublic ? "btn-gradient" : "bg-surface-3 border border-border"}`}>
                <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all ${form.isPublic ? "left-6" : "left-0.5"}`} />
              </button>
              <span className="text-text-secondary text-sm">{form.isPublic ? "Public — visible to everyone" : "Private — only you can see"}</span>
            </div>
          </div>

          {/* Progress bar */}
          {loading && (
            <div className="bg-surface-2 border border-border rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-text-secondary text-sm">Uploading & processing PDF...</span>
                <span className="text-primary-light text-sm">{uploadProgress}%</span>
              </div>
              <div className="h-2 bg-surface-3 rounded-full overflow-hidden">
                <div className="h-full btn-gradient rounded-full transition-all duration-500" style={{ width: `${uploadProgress}%` }} />
              </div>
            </div>
          )}

          <button onClick={handleSubmit} disabled={loading || !pdfFile} className="w-full btn-gradient py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</> : <><Upload className="w-5 h-5" /> Upload Book</>}
          </button>
        </div>
      </div>
    </div>
  );
}
