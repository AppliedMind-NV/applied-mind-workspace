import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles, BookOpen, Brain, Zap } from "lucide-react";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden">
      <div className="absolute inset-0 gradient-mesh" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse-glow" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-lavender/5 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: '1.5s' }} />

      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 mb-8 animate-fade-up">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-medium text-primary">AI-Powered Learning Platform</span>
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold font-heading leading-[1.1] mb-6 animate-fade-up" style={{ animationDelay: '0.1s' }}>
            <span className="text-foreground">Study Smarter.</span>
            <br />
            <span className="text-gradient-hero">Learn Deeper.</span>
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-up" style={{ animationDelay: '0.2s' }}>
            Your AI study partner that turns notes into flashcards, generates practice questions, and helps you actually retain what you learn.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 animate-fade-up" style={{ animationDelay: '0.3s' }}>
            <Link to="/auth">
              <Button variant="hero" size="xl" className="gap-2">
                Start Learning Free
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <a href="#features">
              <Button variant="outline" size="xl">See How It Works</Button>
            </a>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 animate-fade-up" style={{ animationDelay: '0.4s' }}>
            {[
              { icon: Brain, label: "AI Study Coach" },
              { icon: BookOpen, label: "Smart Notes" },
              { icon: Zap, label: "Instant Flashcards" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="glass-card flex items-center gap-2 px-4 py-2.5">
                <Icon className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-foreground">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
