import { Link } from "react-router-dom";
import {
  Sparkles,
  FileText,
  Layers,
  Code2,
  Brain,
  Clock,
  HelpCircle,
  ArrowRight,
  Zap,
  BookOpen,
} from "lucide-react";

const features = [
  {
    icon: FileText,
    title: "Smart Notes",
    description: "Organize notes by subject with folders, autosave, and AI-powered summaries.",
  },
  {
    icon: Layers,
    title: "Flashcards",
    description: "Generate flashcards from your notes with spaced repetition for maximum retention.",
  },
  {
    icon: HelpCircle,
    title: "Practice Questions",
    description: "AI-generated quiz questions that test your understanding of every topic.",
  },
  {
    icon: Code2,
    title: "Code Lab",
    description: "Write, run, and learn code with an integrated editor and AI coding tutor.",
  },
  {
    icon: Brain,
    title: "AI Study Coach",
    description: "Get a personalized daily study plan based on what you need to review.",
  },
  {
    icon: Clock,
    title: "Study Timer",
    description: "Focus sessions with ambient sounds, streaks, and study analytics.",
  },
];

const highlights = [
  { icon: Zap, label: "AI-Powered", detail: "Smart assistance across every feature" },
  { icon: BookOpen, label: "Active Recall", detail: "Built for real learning, not just storage" },
  { icon: Sparkles, label: "All-in-One", detail: "Notes, flashcards, code, and practice in one place" },
];

const Index = () => {
  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
      {/* Background glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/3 left-1/4 w-[700px] h-[700px] rounded-full bg-primary/5 blur-[150px]" />
        <div className="absolute top-1/2 -right-1/4 w-[500px] h-[500px] rounded-full bg-accent/8 blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-primary/3 blur-[100px]" />
      </div>

      {/* Nav */}
      <nav className="relative z-20 flex items-center justify-between px-6 lg:px-12 py-4 border-b border-border/50">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Sparkles size={16} className="text-primary" />
          </div>
          <span className="font-bold text-lg tracking-tight">AppliedMind</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/auth"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5"
          >
            Sign in
          </Link>
          <Link
            to="/auth"
            className="text-sm font-semibold bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-all btn-glow"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 max-w-4xl mx-auto text-center pt-20 pb-16 px-6">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium mb-6 animate-fade-in">
          <Sparkles size={12} />
          AI-powered study workspace
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] mb-5">
          Study smarter with{" "}
          <span className="gradient-text">AppliedMind</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed">
          The all-in-one study platform built for technical students. Take notes, generate flashcards, practice with AI, write code, and build real retention — all in one place.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/auth"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-semibold px-6 py-3 rounded-xl text-sm hover:bg-primary/90 transition-all btn-glow"
          >
            Start learning free
            <ArrowRight size={16} />
          </Link>
          <a
            href="#features"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground font-medium px-6 py-3 rounded-xl border border-border hover:bg-accent/50 transition-all"
          >
            See features
          </a>
        </div>
      </section>

      {/* Highlights */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 pb-16">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {highlights.map((h) => (
            <div key={h.label} className="glass-card flex items-center gap-3 p-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <h.icon size={18} className="text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold">{h.label}</p>
                <p className="text-xs text-muted-foreground">{h.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="relative z-10 max-w-5xl mx-auto px-6 pb-24">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">
            Everything you need to <span className="gradient-text">learn deeply</span>
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto text-sm">
            Stop juggling five apps. AppliedMind combines notes, flashcards, code, practice, and AI into one seamless workflow.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f) => (
            <div
              key={f.title}
              className="glass-card p-5 group hover:border-primary/30 transition-all duration-300"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/15 transition-colors">
                <f.icon size={18} className="text-primary" />
              </div>
              <h3 className="text-sm font-semibold mb-1.5">{f.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 max-w-3xl mx-auto text-center px-6 pb-24">
        <div className="glass-card glow-border p-10">
          <h2 className="text-2xl font-bold tracking-tight mb-3">
            Ready to study smarter?
          </h2>
          <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
            Join students who are using AI to understand deeper, retain longer, and learn faster.
          </p>
          <Link
            to="/auth"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-semibold px-6 py-3 rounded-xl text-sm hover:bg-primary/90 transition-all btn-glow"
          >
            Get started — it's free
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border/50 py-6 text-center">
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} AppliedMind. Built for students who want to learn, not just memorize.
        </p>
      </footer>
    </div>
  );
};

export default Index;
