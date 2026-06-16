import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { BookOpen, Mic, Globe, Brain, TrendingUp, Sparkles, ArrowRight, Library } from "lucide-react";

export default async function HomePage() {
  const { userId } = await auth();

  const features = [
    { icon: "BookOpen", title: "Upload Any Book", desc: "Upload PDFs in any language. Our AI extracts and indexes the content instantly." },
    { icon: "Mic", title: "Voice Conversations", desc: "Talk to your book using Vapi-powered voice AI. Ask questions, get explanations — naturally." },
    { icon: "Globe", title: "22 Indian Languages", desc: "Read summaries, take quizzes, and converse in Hindi, Bengali, Tamil, Telugu & more." },
    { icon: "Brain", title: "Auto Quiz Generation", desc: "AI generates MCQs from any book. Perfect for exam prep — UPSC, JEE, NEET, B.Tech." },
    { icon: "TrendingUp", title: "Progress Tracking", desc: "Track pages read, time spent, quiz scores and comprehension across all books." },
    { icon: "Sparkles", title: "Smart Recommendations", desc: "AI recommends books based on your reading history and syllabus goals." },
  ];

  const stats = [
    { value: "22+", label: "Indian Languages" },
    { value: "AI", label: "Voice Conversations" },
    { value: "∞", label: "Books Supported" },
    { value: "100%", label: "Free to Use" },
  ];

  return (
    <main className="min-h-screen bg-background">
      <nav className="glass sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl btn-gradient flex items-center justify-center">
            <Library className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold">
            <span className="text-text-primary">AI</span>
            <span className="gradient-text"> Digital Library</span>
          </span>
        </div>
        <div className="flex items-center gap-3">
          {userId ? (
            <Link href="/library" className="btn-gradient px-5 py-2 rounded-xl text-sm font-semibold">
              Go to Library
            </Link>
          ) : (
            <>
              <Link href="/sign-in" className="text-text-secondary hover:text-text-primary text-sm font-medium transition-colors">Sign In</Link>
              <Link href="/sign-up" className="btn-gradient px-5 py-2 rounded-xl text-sm font-semibold">Get Started</Link>
            </>
          )}
        </div>
      </nav>

      <section className="relative px-6 pt-24 pb-20 text-center overflow-hidden">
        <div className="absolute top-20 left-1/4 w-72 h-72 bg-primary opacity-10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-32 right-1/4 w-64 h-64 bg-accent opacity-5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-surface-2 border border-border px-4 py-2 rounded-full text-sm text-text-secondary mb-8">
            <Sparkles className="w-4 h-4 text-primary-light" />
            Part of SPECTRUM Educational Platform
          </div>
          <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-6">
            <span className="text-text-primary">Talk to Your</span>
            <br />
            <span className="gradient-text">Books with AI</span>
          </h1>
          <p className="text-text-secondary text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            Upload any PDF, converse with it in your language, generate quizzes, listen to summaries — all powered by AI.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href={userId ? "/library" : "/sign-up"} className="btn-gradient px-8 py-3.5 rounded-2xl font-semibold text-lg flex items-center gap-2">
              Start Reading Free <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/library" className="border border-border-light text-text-secondary hover:text-text-primary hover:border-primary transition-all px-8 py-3.5 rounded-2xl font-semibold text-lg">
              Browse Library
            </Link>
          </div>
        </div>
      </section>

      <section className="px-6 py-12 max-w-4xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-surface-2 border border-border rounded-2xl p-6 text-center card-glow">
              <div className="text-3xl font-bold gradient-text mb-1">{stat.value}</div>
              <div className="text-text-muted text-sm">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="px-6 py-16 max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">
            Everything You Need to <span className="gradient-text">Learn Deeply</span>
          </h2>
          <p className="text-text-secondary text-lg max-w-xl mx-auto">Not just a PDF viewer — a complete AI-powered reading companion.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <div key={f.title} className="bg-surface-2 border border-border rounded-2xl p-6 card-glow transition-all hover:border-primary/40">
              <div className="w-12 h-12 btn-gradient rounded-xl flex items-center justify-center mb-4 text-white">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="text-text-primary font-semibold text-lg mb-2">{f.title}</h3>
              <p className="text-text-secondary text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-6 py-20">
        <div className="max-w-3xl mx-auto bg-surface-2 border border-border rounded-3xl p-12 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-hero opacity-50 pointer-events-none rounded-3xl" />
          <div className="relative">
            <h2 className="text-3xl font-bold text-text-primary mb-4">Ready to transform how you read?</h2>
            <p className="text-text-secondary mb-8">Join thousands of students learning smarter with AI-powered books.</p>
            <Link href={userId ? "/library" : "/sign-up"} className="btn-gradient px-10 py-4 rounded-2xl font-bold text-lg inline-flex items-center gap-2">
              Get Started Free <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-border px-6 py-8 text-center text-text-muted text-sm">
        <p>AI Digital Library — Part of <span className="text-primary-light font-medium">SPECTRUM</span> by VIT Bhopal</p>
      </footer>
    </main>
  );
}
