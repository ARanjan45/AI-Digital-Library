"use client";
import { useState, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Loader2 } from "lucide-react";
import "react-pdf/dist/Page/AnnotationLayer.js";
import "react-pdf/dist/Page/TextLayer.js";

const Document = dynamic(() => import("react-pdf").then(m => m.Document), { ssr: false });
const Page = dynamic(() => import("react-pdf").then(m => m.Page), { ssr: false });

interface PDFViewerProps {
  pdfUrl: string;
  bookId: string;
  onPageChange?: (page: number, total: number) => void;
}

export default function PDFViewer({ pdfUrl, bookId, onPageChange }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [workerReady, setWorkerReady] = useState(false);

  // pdfjs is imported and configured ONLY here, inside a client-only effect.
  // Nothing pdfjs-related exists at module top-level, so the server never touches it.
  useEffect(() => {
    let cancelled = false;
    import("react-pdf").then(({ pdfjs }) => {
      if (cancelled) return;
      pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
      setWorkerReady(true);
    });
    return () => { cancelled = true; };
  }, []);

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setLoading(false);
    onPageChange?.(1, numPages);
  }, [onPageChange]);

  const onDocumentLoadError = useCallback((err: Error) => {
    console.error("PDF load error:", err);
    setError(true);
    setLoading(false);
  }, []);

  const goToPage = (page: number) => {
    const p = Math.max(1, Math.min(page, numPages));
    setCurrentPage(p);
    onPageChange?.(p, numPages);
    fetch("/api/progress", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookId, currentPage: p, totalPages: numPages }),
    }).catch(() => {});
  };

  if (error) return (
    <div className="flex flex-col items-center justify-center h-64 bg-surface-3 rounded-2xl border border-border">
      <p className="text-red-400 mb-3">Failed to load PDF</p>
      <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="btn-gradient px-4 py-2 rounded-xl text-sm font-semibold">
        Open in New Tab
      </a>
    </div>
  );

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center gap-3 bg-surface-3 border border-border rounded-2xl px-4 py-2 w-full justify-between">
        <div className="flex items-center gap-2">
          <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage <= 1}
            className="w-8 h-8 rounded-lg bg-surface-2 border border-border flex items-center justify-center text-text-secondary hover:border-primary disabled:opacity-40 transition-all">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-1">
            <input type="number" value={currentPage} min={1} max={numPages}
              onChange={(e) => goToPage(parseInt(e.target.value) || 1)}
              className="w-12 text-center bg-surface-2 border border-border rounded-lg px-1 py-1 text-text-primary text-sm focus:outline-none focus:border-primary" />
            <span className="text-text-muted text-sm">/ {numPages}</span>
          </div>
          <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage >= numPages}
            className="w-8 h-8 rounded-lg bg-surface-2 border border-border flex items-center justify-center text-text-secondary hover:border-primary disabled:opacity-40 transition-all">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 mx-4">
          <div className="h-1.5 bg-surface-2 rounded-full overflow-hidden">
            <div className="h-full btn-gradient rounded-full transition-all duration-300"
              style={{ width: numPages ? `${(currentPage / numPages) * 100}%` : "0%" }} />
          </div>
          <p className="text-text-muted text-xs mt-1 text-center">
            {numPages ? Math.round((currentPage / numPages) * 100) : 0}% read
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => setScale(s => Math.max(0.5, s - 0.2))}
            className="w-8 h-8 rounded-lg bg-surface-2 border border-border flex items-center justify-center text-text-secondary hover:border-primary transition-all">
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-text-muted text-xs w-10 text-center">{Math.round(scale * 100)}%</span>
          <button onClick={() => setScale(s => Math.min(2.5, s + 0.2))}
            className="w-8 h-8 rounded-lg bg-surface-2 border border-border flex items-center justify-center text-text-secondary hover:border-primary transition-all">
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="w-full overflow-auto rounded-2xl border border-border bg-white flex justify-center p-4 min-h-[600px]">
        {(loading || !workerReady) && (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        )}
        {workerReady && (
          <Document
            file={pdfUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading=""
          >
            <Page
              pageNumber={currentPage}
              scale={scale}
              loading=""
              renderTextLayer={true}
              renderAnnotationLayer={true}
            />
          </Document>
        )}
      </div>
    </div>
  );
}