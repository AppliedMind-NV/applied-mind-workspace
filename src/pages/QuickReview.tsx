import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import {
  Layers,
  HelpCircle,
  ChevronRight,
  CheckCircle2,
  RotateCcw,
  ArrowLeft,
  Sparkles,
  Eye,
  Loader2,
} from "lucide-react";

interface ReviewCard {
  type: "flashcard" | "practice";
  id: string;
  front: string;
  back: string;
}

export default function QuickReview() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [cards, setCards] = useState<ReviewCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [completed, setCompleted] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [startTime] = useState(Date.now());
  const [stats, setStats] = useState({ reviewed: 0, total: 0 });

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const now = new Date().toISOString();
      const [flashRes, practiceRes] = await Promise.all([
        supabase
          .from("flashcards")
          .select("id, front, back")
          .eq("user_id", user.id)
          .lte("next_review", now)
          .order("next_review", { ascending: true })
          .limit(10),
        supabase
          .from("practice_questions")
          .select("id, question, answer")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(5),
      ]);

      const items: ReviewCard[] = [
        ...(flashRes.data ?? []).map((f) => ({
          type: "flashcard" as const,
          id: f.id,
          front: f.front,
          back: f.back,
        })),
        ...(practiceRes.data ?? []).map((p) => ({
          type: "practice" as const,
          id: p.id,
          front: p.question,
          back: p.answer,
        })),
      ];

      setCards(items);
      setStats({ reviewed: 0, total: items.length });
      setLoading(false);

      // Start a study session
      if (items.length > 0) {
        const { data } = await supabase
          .from("study_sessions")
          .insert({ user_id: user.id, started_at: new Date().toISOString() })
          .select("id")
          .single();
        if (data) setSessionId(data.id);
      }
    };
    load();
  }, [user]);

  const currentCard = cards[currentIndex];

  const handleNext = async (difficulty?: "again" | "good" | "easy") => {
    // Update flashcard next_review if it's a flashcard
    if (currentCard?.type === "flashcard" && difficulty) {
      const daysMap = { again: 1, good: 3, easy: 7 };
      const nextReview = new Date();
      nextReview.setDate(nextReview.getDate() + daysMap[difficulty]);
      await supabase
        .from("flashcards")
        .update({ next_review: nextReview.toISOString() })
        .eq("id", currentCard.id);
    }

    setRevealed(false);
    setStats((s) => ({ ...s, reviewed: s.reviewed + 1 }));

    if (currentIndex + 1 >= cards.length) {
      setCompleted(true);
      await finishSession();
    } else {
      setCurrentIndex((i) => i + 1);
    }
  };

  const finishSession = async () => {
    if (!sessionId) return;
    const minutes = Math.max(1, Math.round((Date.now() - startTime) / 60000));
    await supabase
      .from("study_sessions")
      .update({ ended_at: new Date().toISOString(), duration_minutes: minutes })
      .eq("id", sessionId);
    toast({ title: "Quick review complete!", description: `${minutes}m session saved.` });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 size={20} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="max-w-lg mx-auto px-6 py-16 text-center animate-fade-in">
        <CheckCircle2 size={32} className="mx-auto text-primary mb-4" />
        <h1 className="text-xl font-semibold mb-2">Nothing to review!</h1>
        <p className="text-sm text-muted-foreground mb-6">
          You're all caught up. Create notes and generate flashcards to build your review queue.
        </p>
        <button
          onClick={() => navigate("/")}
          className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  if (completed) {
    return (
      <div className="max-w-lg mx-auto px-6 py-16 text-center animate-fade-in">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Sparkles size={24} className="text-primary" />
        </div>
        <h1 className="text-xl font-semibold mb-2">Session Complete!</h1>
        <p className="text-sm text-muted-foreground mb-2">
          You reviewed {stats.total} item{stats.total !== 1 ? "s" : ""} in{" "}
          {Math.max(1, Math.round((Date.now() - startTime) / 60000))} minute
          {Math.round((Date.now() - startTime) / 60000) !== 1 ? "s" : ""}.
        </p>
        <div className="flex items-center justify-center gap-3 mt-6">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-1.5 px-4 py-2 rounded-md border text-sm font-medium hover:bg-accent transition-colors"
          >
            <ArrowLeft size={14} /> Dashboard
          </button>
          <button
            onClick={() => navigate("/flashcards")}
            className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Continue studying
          </button>
        </div>
      </div>
    );
  }

  const progress = ((currentIndex) / cards.length) * 100;

  return (
    <div className="max-w-xl mx-auto px-6 py-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={14} /> Back
        </button>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground tabular-nums">
            {currentIndex + 1} / {cards.length}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 rounded-full bg-muted mb-8 overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Card */}
      <div className="rounded-xl border bg-card p-8 min-h-[280px] flex flex-col">
        <div className="flex items-center gap-1.5 mb-4">
          {currentCard.type === "flashcard" ? (
            <Layers size={13} className="text-primary" />
          ) : (
            <HelpCircle size={13} className="text-primary" />
          )}
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
            {currentCard.type === "flashcard" ? "Flashcard" : "Practice Question"}
          </span>
        </div>

        <div className="flex-1 flex items-center justify-center">
          <p className="text-lg font-medium text-center leading-relaxed">
            {currentCard.front}
          </p>
        </div>

        {revealed && (
          <div className="mt-6 pt-6 border-t">
            <p className="text-sm leading-relaxed text-foreground/85">{currentCard.back}</p>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="mt-6 flex items-center justify-center gap-3">
        {!revealed ? (
          <button
            onClick={() => setRevealed(true)}
            className="flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Eye size={16} /> Reveal Answer
          </button>
        ) : currentCard.type === "flashcard" ? (
          <>
            <button
              onClick={() => handleNext("again")}
              className="px-4 py-2.5 rounded-lg border text-sm font-medium hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-colors"
            >
              <div className="flex items-center gap-1.5">
                <RotateCcw size={13} />
                Again
              </div>
              <span className="text-[10px] text-muted-foreground">1d</span>
            </button>
            <button
              onClick={() => handleNext("good")}
              className="px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <div className="flex items-center gap-1.5">
                <CheckCircle2 size={13} />
                Good
              </div>
              <span className="text-[10px] text-primary-foreground/70">3d</span>
            </button>
            <button
              onClick={() => handleNext("easy")}
              className="px-4 py-2.5 rounded-lg border text-sm font-medium hover:bg-accent transition-colors"
            >
              <div className="flex items-center gap-1.5">
                <ChevronRight size={13} />
                Easy
              </div>
              <span className="text-[10px] text-muted-foreground">7d</span>
            </button>
          </>
        ) : (
          <button
            onClick={() => handleNext()}
            className="flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Next <ChevronRight size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
