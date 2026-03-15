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
  Clock,
  CheckCircle2,
  Filter,
  Trophy,
  Rocket,
  Heart,
} from "lucide-react";
import { PRACTICE_BUILDS, PracticeBuild } from "@/data/practiceBuilds";
import { useBuildProgress } from "@/hooks/useBuildProgress";
import { Progress } from "@/components/ui/progress";

const difficultyColors = {
  beginner: "bg-green-500/10 text-green-400 border-green-500/20",
  intermediate: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  advanced: "bg-red-500/10 text-red-400 border-red-500/20",
};

const difficultyLabels = {
  beginner: "🌱 Beginner",
  intermediate: "🔥 Intermediate",
  advanced: "🚀 Advanced",
};

type DifficultyFilter = "all" | "beginner" | "intermediate" | "advanced";

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
  const [filter, setFilter] = useState<DifficultyFilter>("all");
  const { getProgress, markStepComplete, updateProgress, loading: progressLoading } = useBuildProgress();

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

  const openBuild = (build: PracticeBuild) => {
    const prog = getProgress(build.id);
    setSelectedBuild(build);
    setActiveStep(prog?.current_step ?? 0);
    setRevealedSolutions(new Set());
    setRevealedHints(new Set());
  };

  const handleStepComplete = (build: PracticeBuild, stepIndex: number) => {
    markStepComplete(build.id, stepIndex, build.steps.length);
  };

  const filteredBuilds = PRACTICE_BUILDS.filter(
    (b) => filter === "all" || b.difficulty === filter
  );

  const completedCount = PRACTICE_BUILDS.filter(
    (b) => getProgress(b.id)?.completed
  ).length;

  const inProgressCount = PRACTICE_BUILDS.filter((b) => {
    const p = getProgress(b.id);
    return p && !p.completed && (p.completed_steps?.length ?? 0) > 0;
  }).length;

  // Build library view
  if (!selectedBuild) {
    return (
      <div className="p-4 space-y-3">
        {/* Header */}
        <div className="mb-2">
          <h2 className="text-sm font-semibold flex items-center gap-1.5">
            <Rocket size={14} className="text-primary" />
            Let's Build Together
          </h2>
          <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
            Learn by building real projects, step by step. Your coding tutor is right here with you.
          </p>
        </div>

        {/* Progress summary */}
        {(completedCount > 0 || inProgressCount > 0) && (
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-primary/5 border border-primary/10">
            <Trophy size={14} className="text-primary shrink-0" />
            <div className="text-[10px]">
              <span className="font-medium text-primary">{completedCount} completed</span>
              {inProgressCount > 0 && (
                <span className="text-muted-foreground"> · {inProgressCount} in progress</span>
              )}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex items-center gap-1">
          <Filter size={10} className="text-muted-foreground mr-1" />
          {(["all", "beginner", "intermediate", "advanced"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-2 py-1 rounded-full text-[9px] font-medium transition-colors ${
                filter === f
                  ? "bg-primary text-primary-foreground"
                  : "bg-accent/50 text-muted-foreground hover:bg-accent"
              }`}
            >
              {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Build cards */}
        {filteredBuilds.map((build) => {
          const prog = getProgress(build.id);
          const isCompleted = prog?.completed ?? false;
          const stepsCompleted = prog?.completed_steps?.length ?? 0;
          const progressPct = (stepsCompleted / build.steps.length) * 100;
          const isInProgress = !isCompleted && stepsCompleted > 0;

          return (
            <button
              key={build.id}
              onClick={() => openBuild(build)}
              className={`w-full text-left rounded-lg border p-3.5 transition-colors group relative ${
                isCompleted
                  ? "bg-primary/5 border-primary/20 hover:bg-primary/10"
                  : "bg-card hover:bg-accent/30"
              }`}
            >
              {/* Completion badge */}
              {isCompleted && (
                <div className="absolute top-2.5 right-2.5">
                  <CheckCircle2 size={16} className="text-primary" />
                </div>
              )}

              <div className="min-w-0 pr-6">
                <p className="text-xs font-medium mb-1 flex items-center gap-1.5">
                  {build.title}
                  {isInProgress && (
                    <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 font-medium">
                      Resume
                    </span>
                  )}
                </p>
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  {build.description}
                </p>
              </div>

              {/* Meta row */}
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span
                  className={`text-[9px] font-medium px-1.5 py-0.5 rounded border ${difficultyColors[build.difficulty]}`}
                >
                  {difficultyLabels[build.difficulty]}
                </span>
                <span className="text-[9px] text-muted-foreground flex items-center gap-0.5">
                  <Clock size={8} /> ~{build.estimatedMinutes} min
                </span>
                <span className="text-[9px] text-muted-foreground">
                  {build.steps.length} steps
                </span>
              </div>

              {/* Skills */}
              <div className="flex flex-wrap gap-1 mt-2">
                {build.skills.map((skill) => (
                  <span
                    key={skill}
                    className="text-[8px] px-1.5 py-0.5 rounded bg-accent text-muted-foreground"
                  >
                    {skill}
                  </span>
                ))}
              </div>

              {/* Progress bar */}
              {(isInProgress || isCompleted) && (
                <div className="mt-2.5">
                  <Progress value={progressPct} className="h-1.5" />
                  <p className="text-[8px] text-muted-foreground mt-1">
                    {stepsCompleted}/{build.steps.length} steps completed
                  </p>
                </div>
              )}
            </button>
          );
        })}

        {filteredBuilds.length === 0 && (
          <p className="text-[11px] text-muted-foreground text-center py-4">
            No builds match this filter.
          </p>
        )}
      </div>
    );
  }

  // Build detail view
  const step = selectedBuild.steps[activeStep];
  const prog = getProgress(selectedBuild.id);
  const isStepCompleted = prog?.completed_steps?.includes(activeStep) ?? false;
  const isBuildCompleted = prog?.completed ?? false;
  const stepsCompleted = prog?.completed_steps?.length ?? 0;
  const progressPct = (stepsCompleted / selectedBuild.steps.length) * 100;

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
        <p className="text-xs font-semibold flex items-center gap-1.5">
          {selectedBuild.title}
          {isBuildCompleted && <CheckCircle2 size={12} className="text-primary" />}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <span
            className={`text-[9px] font-medium px-1.5 py-0.5 rounded border ${difficultyColors[selectedBuild.difficulty]}`}
          >
            {difficultyLabels[selectedBuild.difficulty]}
          </span>
          <span className="text-[9px] text-muted-foreground flex items-center gap-0.5">
            <Clock size={8} /> ~{selectedBuild.estimatedMinutes} min
          </span>
        </div>
        {/* Progress */}
        <div className="mt-2">
          <Progress value={progressPct} className="h-1.5" />
          <p className="text-[8px] text-muted-foreground mt-1">
            {stepsCompleted}/{selectedBuild.steps.length} steps completed
          </p>
        </div>
      </div>

      {/* Learning goals */}
      <div className="px-3 py-2 border-b shrink-0">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mb-1.5">
          What you'll learn
        </p>
        <div className="flex flex-wrap gap-1">
          {selectedBuild.learningGoals.map((goal) => (
            <span
              key={goal}
              className="text-[10px] px-1.5 py-0.5 rounded bg-accent text-muted-foreground"
            >
              {goal}
            </span>
          ))}
        </div>
      </div>

      {/* Step tabs */}
      <div className="flex items-center gap-1 px-3 py-2 border-b shrink-0 overflow-x-auto">
        {selectedBuild.steps.map((s, i) => {
          const stepDone = prog?.completed_steps?.includes(i) ?? false;
          return (
            <button
              key={i}
              onClick={() => {
                setActiveStep(i);
                updateProgress(selectedBuild.id, { current_step: i });
              }}
              className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium whitespace-nowrap transition-colors ${
                activeStep === i
                  ? "bg-primary text-primary-foreground"
                  : stepDone
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:bg-accent"
              }`}
            >
              {stepDone ? (
                <CheckCircle2 size={9} />
              ) : (
                <span className="tabular-nums">{i + 1}</span>
              )}
              <span className="max-w-[80px] truncate">{s.title}</span>
            </button>
          );
        })}
      </div>

      {/* Step content */}
      <div className="flex-1 overflow-auto scrollbar-thin p-3 space-y-3">
        <div>
          <p className="text-xs font-medium mb-1 flex items-center gap-1.5">
            Step {activeStep + 1}: {step.title}
            {isStepCompleted && <CheckCircle2 size={11} className="text-primary" />}
          </p>
          <p className="text-[11px] text-muted-foreground leading-relaxed">{step.description}</p>
        </div>

        {/* Encouragement banner for completed step */}
        {isStepCompleted && step.encouragement && (
          <div className="px-3 py-2 rounded-lg bg-primary/5 border border-primary/10 flex items-start gap-2">
            <Heart size={12} className="text-primary shrink-0 mt-0.5" />
            <p className="text-[11px] text-foreground/80 leading-relaxed">{step.encouragement}</p>
          </div>
        )}

        {/* Hint */}
        <button
          onClick={() => toggleHint(activeStep)}
          className="w-full flex items-center gap-1.5 px-2.5 py-2 rounded-md border text-left text-[11px] hover:bg-accent/30 transition-colors"
        >
          <Lightbulb size={12} className="text-amber-400 shrink-0" />
          <span className="font-medium">
            {revealedHints.has(activeStep) ? "Hide Hint" : "Need a hint?"}
          </span>
        </button>
        {revealedHints.has(activeStep) && (
          <div className="px-3 py-2 rounded-md bg-amber-500/5 border border-amber-500/20">
            <p className="text-[11px] text-foreground/80 leading-relaxed">{step.hint}</p>
          </div>
        )}

        {/* Load starter code */}
        {step.starterCode && (
          <button
            onClick={() =>
              onLoadCode(
                step.starterCode!,
                `${selectedBuild.title} - Step ${activeStep + 1}`,
                selectedBuild.language
              )
            }
            className="w-full flex items-center gap-1.5 px-2.5 py-2 rounded-md bg-primary/10 text-primary text-[11px] font-medium hover:bg-primary/20 transition-colors"
          >
            <Code2 size={12} />
            Load Starter Code
          </button>
        )}

        {/* Ask AI for help */}
        <button
          onClick={() =>
            onAskAI(
              `I'm working on "${selectedBuild.title}", Step ${activeStep + 1}: "${step.title}". ${step.description}\n\nHelp me think through this step. Don't give me the full answer — guide me with questions and small hints. Be encouraging!`
            )
          }
          disabled={aiLoading}
          className="w-full flex items-center gap-1.5 px-2.5 py-2 rounded-md border text-[11px] font-medium hover:bg-accent/30 transition-colors disabled:opacity-40"
        >
          {aiLoading ? (
            <Loader2 size={12} className="animate-spin" />
          ) : (
            <Sparkles size={12} className="text-primary" />
          )}
          Walk me through this step
        </button>

        {/* Mark step complete */}
        {!isStepCompleted && (
          <button
            onClick={() => handleStepComplete(selectedBuild, activeStep)}
            className="w-full flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-md bg-primary/10 text-primary text-[11px] font-medium hover:bg-primary/20 transition-colors"
          >
            <CheckCircle2 size={12} />
            I've completed this step!
          </button>
        )}

        {/* Solution reveal */}
        <button
          onClick={() => toggleSolution(activeStep)}
          className="w-full flex items-center gap-1.5 px-2.5 py-2 rounded-md border text-[11px] hover:bg-accent/30 transition-colors"
        >
          {revealedSolutions.has(activeStep) ? <EyeOff size={12} /> : <Eye size={12} />}
          <span className="font-medium">
            {revealedSolutions.has(activeStep) ? "Hide Solution" : "Reveal Solution"}
          </span>
        </button>
        {revealedSolutions.has(activeStep) && (
          <div className="rounded-md border overflow-hidden">
            <div className="px-2.5 py-1.5 bg-muted/30 border-b">
              <span className="text-[9px] font-medium text-muted-foreground uppercase tracking-wider">
                Solution
              </span>
            </div>
            <pre className="p-3 text-[11px] font-mono leading-5 overflow-x-auto bg-muted/10">
              {step.solution}
            </pre>
            <button
              onClick={() =>
                onLoadCode(
                  step.solution,
                  `${selectedBuild.title} - Solution ${activeStep + 1}`,
                  selectedBuild.language
                )
              }
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
              onClick={() => {
                setActiveStep(activeStep - 1);
                updateProgress(selectedBuild.id, { current_step: activeStep - 1 });
              }}
              className="flex-1 px-2.5 py-2 rounded-md border text-[11px] font-medium hover:bg-accent transition-colors"
            >
              ← Previous
            </button>
          )}
          {activeStep < selectedBuild.steps.length - 1 && (
            <button
              onClick={() => {
                const next = activeStep + 1;
                setActiveStep(next);
                updateProgress(selectedBuild.id, { current_step: next });
              }}
              className="flex-1 px-2.5 py-2 rounded-md bg-primary text-primary-foreground text-[11px] font-medium hover:bg-primary/90 transition-colors"
            >
              Next Step →
            </button>
          )}
          {activeStep === selectedBuild.steps.length - 1 && !isBuildCompleted && (
            <button
              onClick={() => {
                // Mark all remaining steps as complete
                for (let i = 0; i < selectedBuild.steps.length; i++) {
                  if (!prog?.completed_steps?.includes(i)) {
                    markStepComplete(selectedBuild.id, i, selectedBuild.steps.length);
                  }
                }
              }}
              className="flex-1 px-2.5 py-2 rounded-md bg-primary text-primary-foreground text-[11px] font-medium hover:bg-primary/90 transition-colors"
            >
              <Star size={12} className="inline mr-1" />
              Complete Build!
            </button>
          )}
          {activeStep === selectedBuild.steps.length - 1 && isBuildCompleted && (
            <button
              onClick={() => setSelectedBuild(null)}
              className="flex-1 px-2.5 py-2.5 rounded-md bg-primary/10 text-primary text-[11px] font-semibold transition-colors flex items-center justify-center gap-1.5"
            >
              <Trophy size={13} />
              Completed! Back to Library
            </button>
          )}
        </div>

        {/* Completion celebration */}
        {isBuildCompleted && activeStep === selectedBuild.steps.length - 1 && (
          <div className="mt-2 px-3 py-3 rounded-lg bg-primary/5 border border-primary/10 text-center space-y-1">
            <p className="text-sm font-semibold">🎉 Amazing work!</p>
            <p className="text-[11px] text-muted-foreground">
              You completed "{selectedBuild.title}". Every project you build makes you a stronger developer.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
