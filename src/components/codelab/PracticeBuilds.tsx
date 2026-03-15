import { useState } from "react";
import {
  ArrowLeft,
  ChevronRight,
  Code2,
  Eye,
  EyeOff,
  Lightbulb,
  Sparkles,
  Star,
  Loader2,
} from "lucide-react";
import { PRACTICE_BUILDS, PracticeBuild, BuildStep } from "@/data/practiceBuilds";

const difficultyColors = {
  beginner: "bg-green-500/10 text-green-400",
  intermediate: "bg-amber-500/10 text-amber-400",
  advanced: "bg-red-500/10 text-red-400",
};

interface PracticeBuildsProps {
  onLoadCode: (code: string, title: string, language: string) => void;
  onAskAI: (prompt: string) => void;
  aiLoading: boolean;
}

export default function PracticeBuilds({ onLoadCode, onAskAI, aiLoading }: PracticeBuildsProps) {
  const [selectedBuild, setSelectedBuild] = useState<PracticeBuild | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [revealedSolutions, setRevealedSolutions] = useState<Set<number>>(new Set());
  const [revealedHints, setRevealedHints] = useState<Set<number>>(new Set());

  const toggleSolution = (idx: number) => {
    setRevealedSolutions((prev) => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  };

  const toggleHint = (idx: number) => {
    setRevealedHints((prev) => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  };

  if (!selectedBuild) {
    return (
      <div className="p-4 space-y-3">
        <div className="mb-4">
          <h2 className="text-sm font-semibold flex items-center gap-1.5">
            <Code2 size={14} className="text-primary" />
            Practice Builds
          </h2>
          <p className="text-[11px] text-muted-foreground mt-1">
            Learn by building real projects step by step.
          </p>
        </div>

        {PRACTICE_BUILDS.map((build) => (
          <button
            key={build.id}
            onClick={() => {
              setSelectedBuild(build);
              setActiveStep(0);
              setRevealedSolutions(new Set());
              setRevealedHints(new Set());
            }}
            className="w-full text-left rounded-lg border bg-card p-3.5 hover:bg-accent/30 transition-colors group"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs font-medium mb-1">{build.title}</p>
                <p className="text-[10px] text-muted-foreground leading-relaxed">{build.description}</p>
              </div>
              <ChevronRight size={14} className="text-muted-foreground shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded ${difficultyColors[build.difficulty]}`}>
                {build.difficulty}
              </span>
              <span className="text-[9px] text-muted-foreground">
                {build.steps.length} step{build.steps.length !== 1 ? "s" : ""}
              </span>
            </div>
          </button>
        ))}
      </div>
    );
  }

  const step = selectedBuild.steps[activeStep];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-3 py-2 border-b shrink-0">
        <button
          onClick={() => setSelectedBuild(null)}
          className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors mb-1.5"
        >
          <ArrowLeft size={11} /> All Builds
        </button>
        <p className="text-xs font-semibold">{selectedBuild.title}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded ${difficultyColors[selectedBuild.difficulty]}`}>
            {selectedBuild.difficulty}
          </span>
        </div>
      </div>

      {/* Learning goals */}
      <div className="px-3 py-2 border-b shrink-0">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mb-1.5">What you'll learn</p>
        <div className="flex flex-wrap gap-1">
          {selectedBuild.learningGoals.map((goal) => (
            <span key={goal} className="text-[10px] px-1.5 py-0.5 rounded bg-accent text-muted-foreground">
              {goal}
            </span>
          ))}
        </div>
      </div>

      {/* Step tabs */}
      <div className="flex items-center gap-1 px-3 py-2 border-b shrink-0 overflow-x-auto">
        {selectedBuild.steps.map((s, i) => (
          <button
            key={i}
            onClick={() => setActiveStep(i)}
            className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium whitespace-nowrap transition-colors ${
              activeStep === i ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"
            }`}
          >
            <span className="tabular-nums">{i + 1}</span>
            <span className="max-w-[80px] truncate">{s.title}</span>
          </button>
        ))}
      </div>

      {/* Step content */}
      <div className="flex-1 overflow-auto scrollbar-thin p-3 space-y-3">
        <div>
          <p className="text-xs font-medium mb-1">{step.title}</p>
          <p className="text-[11px] text-muted-foreground leading-relaxed">{step.description}</p>
        </div>

        {/* Hint */}
        <button
          onClick={() => toggleHint(activeStep)}
          className="w-full flex items-center gap-1.5 px-2.5 py-2 rounded-md border text-left text-[11px] hover:bg-accent/30 transition-colors"
        >
          <Lightbulb size={12} className="text-amber-400 shrink-0" />
          <span className="font-medium">{revealedHints.has(activeStep) ? "Hide Hint" : "Show Hint"}</span>
        </button>
        {revealedHints.has(activeStep) && (
          <div className="px-3 py-2 rounded-md bg-amber-500/5 border border-amber-500/20">
            <p className="text-[11px] text-foreground/80 leading-relaxed">{step.hint}</p>
          </div>
        )}

        {/* Load starter code */}
        {step.starterCode && (
          <button
            onClick={() => onLoadCode(step.starterCode!, `${selectedBuild.title} - Step ${activeStep + 1}`, selectedBuild.language)}
            className="w-full flex items-center gap-1.5 px-2.5 py-2 rounded-md bg-primary/10 text-primary text-[11px] font-medium hover:bg-primary/20 transition-colors"
          >
            <Code2 size={12} />
            Load Starter Code
          </button>
        )}

        {/* Ask AI for help */}
        <button
          onClick={() => onAskAI(`I'm working on "${selectedBuild.title}", Step ${activeStep + 1}: "${step.title}". ${step.description}\n\nHelp me think through this step. Don't give me the full answer — guide me with questions and small hints.`)}
          disabled={aiLoading}
          className="w-full flex items-center gap-1.5 px-2.5 py-2 rounded-md border text-[11px] font-medium hover:bg-accent/30 transition-colors disabled:opacity-40"
        >
          {aiLoading ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} className="text-primary" />}
          Walk me through this step
        </button>

        {/* Solution reveal */}
        <button
          onClick={() => toggleSolution(activeStep)}
          className="w-full flex items-center gap-1.5 px-2.5 py-2 rounded-md border text-[11px] hover:bg-accent/30 transition-colors"
        >
          {revealedSolutions.has(activeStep) ? <EyeOff size={12} /> : <Eye size={12} />}
          <span className="font-medium">{revealedSolutions.has(activeStep) ? "Hide Solution" : "Reveal Solution"}</span>
        </button>
        {revealedSolutions.has(activeStep) && (
          <div className="rounded-md border overflow-hidden">
            <div className="px-2.5 py-1.5 bg-muted/30 border-b">
              <span className="text-[9px] font-medium text-muted-foreground uppercase tracking-wider">Solution</span>
            </div>
            <pre className="p-3 text-[11px] font-mono leading-5 overflow-x-auto bg-muted/10">{step.solution}</pre>
            <button
              onClick={() => onLoadCode(step.solution, `${selectedBuild.title} - Solution ${activeStep + 1}`, selectedBuild.language)}
              className="w-full px-2.5 py-1.5 text-[10px] font-medium text-primary border-t hover:bg-accent/30 transition-colors"
            >
              Load into Editor
            </button>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center gap-2 pt-2">
          {activeStep > 0 && (
            <button
              onClick={() => setActiveStep(activeStep - 1)}
              className="flex-1 px-2.5 py-2 rounded-md border text-[11px] font-medium hover:bg-accent transition-colors"
            >
              ← Previous Step
            </button>
          )}
          {activeStep < selectedBuild.steps.length - 1 && (
            <button
              onClick={() => setActiveStep(activeStep + 1)}
              className="flex-1 px-2.5 py-2 rounded-md bg-primary text-primary-foreground text-[11px] font-medium hover:bg-primary/90 transition-colors"
            >
              Next Step →
            </button>
          )}
          {activeStep === selectedBuild.steps.length - 1 && (
            <button
              onClick={() => setSelectedBuild(null)}
              className="flex-1 px-2.5 py-2 rounded-md bg-primary text-primary-foreground text-[11px] font-medium hover:bg-primary/90 transition-colors"
            >
              <Star size={12} className="inline mr-1" />
              Complete Build!
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
