import { useState } from "react";
import { BookOpen, Brain, Code, Sparkles, Zap, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const steps = [
  {
    icon: Sparkles,
    title: "Welcome to AppliedMind",
    description: "Your AI-powered study workspace built for technical learners. One place to take notes, study, code, and retain knowledge.",
  },
  {
    icon: BookOpen,
    title: "Smart Notes",
    description: "Organize notes by subject with folders. Upload lectures, record audio, and let AI help you summarize and understand complex material.",
  },
  {
    icon: Brain,
    title: "Flashcards & Practice",
    description: "Generate flashcards and practice questions from your notes. Use spaced repetition to retain what you learn — not just memorize it.",
  },
  {
    icon: Code,
    title: "Code Lab",
    description: "Write and explore code alongside your notes. Get AI explanations and work through guided coding exercises.",
  },
  {
    icon: Zap,
    title: "AI Study Coach",
    description: "Your dashboard tracks due flashcards, suggests review topics, and builds a daily study plan — so you always know what to study next.",
  },
];

interface OnboardingProps {
  onComplete: () => void;
}

export function Onboarding({ onComplete }: OnboardingProps) {
  const [current, setCurrent] = useState(0);
  const step = steps[current];
  const isLast = current === steps.length - 1;
  const Icon = step.icon;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 relative overflow-hidden">
      <div className="absolute inset-0 gradient-mesh" />
      <div className="absolute top-1/3 left-1/4 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-pulse-glow" />
      <div className="absolute bottom-1/3 right-1/4 w-64 h-64 bg-lavender/15 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: "1s" }} />

      <div className="w-full max-w-md space-y-8 relative z-10 animate-fade-up">
        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2">
          {steps.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                i === current ? "w-8 bg-primary" : i < current ? "w-2 bg-primary/50" : "w-2 bg-muted-foreground/20"
              )}
              aria-label={`Go to step ${i + 1}`}
            />
          ))}
        </div>

        {/* Card */}
        <div className="glass-card border border-border/30 glow-sm p-8 text-center space-y-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl gradient-primary glow-sm">
            <Icon className="h-8 w-8 text-primary-foreground" />
          </div>

          <div className="space-y-3">
            <h2 className="text-2xl font-bold font-heading text-gradient-hero">{step.title}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
          </div>

          <div className="flex gap-3 pt-2">
            {current > 0 && (
              <Button
                variant="outline"
                onClick={() => setCurrent(current - 1)}
                className="flex-1"
              >
                Back
              </Button>
            )}
            <Button
              variant="hero"
              onClick={() => (isLast ? onComplete() : setCurrent(current + 1))}
              className={cn("flex-1 gap-2", current === 0 && "w-full")}
            >
              {isLast ? (
                <>
                  Get Started <Check className="h-4 w-4" />
                </>
              ) : (
                <>
                  Next <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Skip */}
        {!isLast && (
          <button
            onClick={onComplete}
            className="block mx-auto text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Skip intro
          </button>
        )}
      </div>
    </div>
  );
}
