import { RotateCcw, Check, Zap, Plus, Trash2, Layers, Clock, BookOpen, ChevronLeft } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";

interface Flashcard {
  id: string;
  front: string;
  back: string;
  next_review: string;
  note_id: string | null;
  created_at: string;
}

type View = "dashboard" | "review" | "browse";

export default function Flashcards() {
  const { user } = useAuth();
  const [allCards, setAllCards] = useState<Flashcard[]>([]);
  const [dueCards, setDueCards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>("dashboard");
  const [reviewedCount, setReviewedCount] = useState(0);
  const [showCreate, setShowCreate] = useState(false);
  const [newFront, setNewFront] = useState("");
  const [newBack, setNewBack] = useState("");

  const fetchCards = async () => {
    if (!user) return;
    try {
      const now = new Date().toISOString();
      const [allRes, dueRes] = await Promise.all([
        supabase.from("flashcards").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("flashcards").select("*").eq("user_id", user.id).lte("next_review", now).order("next_review", { ascending: true }),
      ]);
      if (allRes.error) console.error("Failed to load flashcards:", allRes.error);
      if (dueRes.error) console.error("Failed to load due cards:", dueRes.error);
      setAllCards(allRes.data ?? []);
      setDueCards(dueRes.data ?? []);
    } catch (err: any) {
      console.error("Flashcards fetch error:", err);
      toast({ title: "Failed to load flashcards", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCards(); }, [user]);

  const card = dueCards[currentIndex];

  const handleRate = async (quality: "again" | "good" | "easy") => {
    if (!card) return;
    const intervals = { again: 1, good: 3, easy: 7 };
    const days = intervals[quality];
    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + days);

    await supabase
      .from("flashcards")
      .update({ next_review: nextReview.toISOString() })
      .eq("id", card.id);

    setFlipped(false);
    setReviewedCount((c) => c + 1);

    const remaining = dueCards.filter((c) => c.id !== card.id);
    setDueCards(remaining);

    if (remaining.length === 0) {
      // Session complete
      setCurrentIndex(0);
    } else {
      setCurrentIndex(Math.min(currentIndex, remaining.length - 1));
    }
  };

  const deleteCard = async (id: string) => {
    await supabase.from("flashcards").delete().eq("id", id);
    setAllCards((prev) => prev.filter((c) => c.id !== id));
    setDueCards((prev) => prev.filter((c) => c.id !== id));
    toast({ title: "Card deleted" });
  };

  const createCard = async () => {
    if (!user || !newFront.trim() || !newBack.trim()) return;
    const { data, error } = await supabase
      .from("flashcards")
      .insert({ user_id: user.id, front: newFront.trim(), back: newBack.trim() })
      .select("*")
      .single();
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    if (data) {
      setAllCards((prev) => [data, ...prev]);
      // If due now, add to due list
      if (new Date(data.next_review) <= new Date()) {
        setDueCards((prev) => [...prev, data]);
      }
      setNewFront("");
      setNewBack("");
      setShowCreate(false);
      toast({ title: "Card created" });
    }
  };

  const startReview = () => {
    setCurrentIndex(0);
    setFlipped(false);
    setReviewedCount(0);
    setView("review");
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diff = d.getTime() - now.getTime();
    if (diff < 0) return "Now";
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return "Today";
    if (days === 1) return "Tomorrow";
    return `In ${days}d`;
  };

  if (loading) {
    return <div className="flex items-center justify-center h-full text-sm text-muted-foreground">Loading flashcards…</div>;
  }

  // Review view
  if (view === "review") {
    if (dueCards.length === 0) {
      return (
        <div className="max-w-lg mx-auto px-6 py-16 text-center animate-fade-in">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Check size={28} className="text-primary" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Session Complete!</h2>
          <p className="text-sm text-muted-foreground mb-1">
            You reviewed <span className="font-medium text-foreground">{reviewedCount}</span> card{reviewedCount !== 1 ? "s" : ""}.
          </p>
          <p className="text-xs text-muted-foreground mb-6">Cards will reappear based on your ratings.</p>
          <button
            onClick={() => { setView("dashboard"); fetchCards(); }}
            className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Back to Flashcards
          </button>
        </div>
      );
    }

    return (
      <div className="max-w-2xl mx-auto px-6 py-8 animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => { setView("dashboard"); fetchCards(); }}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft size={14} />
            Back
          </button>
          <span className="text-xs text-muted-foreground tabular-nums">
            {reviewedCount} reviewed • {dueCards.length} remaining
          </span>
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-2 mb-6">
          <Progress
            value={dueCards.length + reviewedCount > 0 ? (reviewedCount / (dueCards.length + reviewedCount)) * 100 : 0}
            className="h-1.5 flex-1"
          />
          <span className="text-[10px] text-muted-foreground tabular-nums w-12 text-right">
            {currentIndex + 1}/{dueCards.length}
          </span>
        </div>

        {/* Card */}
        {card && (
          <div className="space-y-4">
            <button
              onClick={() => setFlipped(!flipped)}
              className="w-full min-h-[260px] rounded-xl border-2 bg-card p-8 text-left transition-all hover:border-primary/30 cursor-pointer relative overflow-hidden"
            >
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-4">
                {flipped ? "Answer" : "Question"}
              </p>
              <p className={`text-lg leading-relaxed ${flipped ? "" : "font-medium"}`}>
                {flipped ? card.back : card.front}
              </p>
              {!flipped && (
                <p className="text-xs text-muted-foreground mt-8 opacity-60">Tap to reveal answer</p>
              )}
            </button>

            {flipped && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleRate("again")}
                  className="flex-1 flex flex-col items-center gap-1 py-3 rounded-lg border hover:bg-destructive/10 hover:border-destructive/30 transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <RotateCcw size={14} />
                    <span className="text-sm font-medium">Again</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">1 day</span>
                </button>
                <button
                  onClick={() => handleRate("good")}
                  className="flex-1 flex flex-col items-center gap-1 py-3 rounded-lg border hover:bg-accent transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <Check size={14} />
                    <span className="text-sm font-medium">Good</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">3 days</span>
                </button>
                <button
                  onClick={() => handleRate("easy")}
                  className="flex-1 flex flex-col items-center gap-1 py-3 rounded-lg border hover:bg-primary/10 hover:border-primary/30 transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <Zap size={14} />
                    <span className="text-sm font-medium">Easy</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">7 days</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Browse view
  if (view === "browse") {
    return (
      <div className="max-w-2xl mx-auto px-6 py-8 animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => setView("dashboard")}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft size={14} />
            Back
          </button>
          <span className="text-xs text-muted-foreground">{allCards.length} total cards</span>
        </div>

        <div className="space-y-2">
          {allCards.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No flashcards yet.</p>
          ) : (
            allCards.map((c) => (
              <div key={c.id} className="rounded-lg border bg-card p-4 group">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium mb-1">{c.front}</p>
                    <p className="text-xs text-muted-foreground">{c.back}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                      new Date(c.next_review) <= new Date()
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground"
                    }`}>
                      {formatDate(c.next_review)}
                    </span>
                    <button
                      onClick={() => deleteCard(c.id)}
                      className="p-1 rounded hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={12} className="text-destructive" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  // Dashboard view
  const masteredCount = allCards.filter((c) => {
    const daysUntil = (new Date(c.next_review).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return daysUntil >= 7;
  }).length;

  return (
    <div className="max-w-2xl mx-auto px-6 py-8 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold tracking-tight mb-1">Flashcards</h1>
          <p className="text-sm text-muted-foreground">
            {dueCards.length > 0
              ? `${dueCards.length} card${dueCards.length !== 1 ? "s" : ""} due for review`
              : "You're all caught up!"}
          </p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-sm hover:bg-accent transition-colors"
        >
          <Plus size={14} />
          New Card
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="rounded-lg border bg-card p-4 text-center">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <Clock size={12} className="text-primary" />
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Due</span>
          </div>
          <p className="text-2xl font-semibold tabular-nums">{dueCards.length}</p>
        </div>
        <div className="rounded-lg border bg-card p-4 text-center">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <Layers size={12} className="text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Total</span>
          </div>
          <p className="text-2xl font-semibold tabular-nums">{allCards.length}</p>
        </div>
        <div className="rounded-lg border bg-card p-4 text-center">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <Zap size={12} className="text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Mastered</span>
          </div>
          <p className="text-2xl font-semibold tabular-nums">{masteredCount}</p>
        </div>
      </div>

      {/* Progress bar */}
      {allCards.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1.5">
            <span>Progress</span>
            <span>{allCards.length > 0 ? Math.round((masteredCount / allCards.length) * 100) : 0}% mastered</span>
          </div>
          <Progress value={allCards.length > 0 ? (masteredCount / allCards.length) * 100 : 0} className="h-2" />
        </div>
      )}

      {/* Create card form */}
      {showCreate && (
        <div className="mb-6 p-4 rounded-lg border bg-card space-y-3">
          <input
            value={newFront}
            onChange={(e) => setNewFront(e.target.value)}
            placeholder="Question (front)"
            className="w-full px-3 py-2 rounded-md border bg-background text-sm outline-none focus:ring-2 focus:ring-primary"
          />
          <textarea
            value={newBack}
            onChange={(e) => setNewBack(e.target.value)}
            placeholder="Answer (back)"
            rows={3}
            className="w-full px-3 py-2 rounded-md border bg-background text-sm outline-none resize-none focus:ring-2 focus:ring-primary"
          />
          <div className="flex gap-2">
            <button
              onClick={createCard}
              disabled={!newFront.trim() || !newBack.trim()}
              className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-40"
            >
              Create Card
            </button>
            <button
              onClick={() => setShowCreate(false)}
              className="px-4 py-2 rounded-md border text-sm hover:bg-accent transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={startReview}
          disabled={dueCards.length === 0}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <RotateCcw size={14} />
          {dueCards.length > 0 ? `Review ${dueCards.length} Card${dueCards.length !== 1 ? "s" : ""}` : "No Cards Due"}
        </button>
        <button
          onClick={() => setView("browse")}
          className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg border text-sm hover:bg-accent transition-colors"
        >
          <BookOpen size={14} />
          Browse All
        </button>
      </div>

      {/* Due cards preview */}
      {dueCards.length > 0 && (
        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Due Now</p>
          <div className="space-y-2">
            {dueCards.slice(0, 5).map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between px-3 py-2.5 rounded-md bg-background"
              >
                <p className="text-sm truncate flex-1 mr-3">{c.front}</p>
                <span className="text-[10px] text-primary shrink-0">Due</span>
              </div>
            ))}
            {dueCards.length > 5 && (
              <p className="text-xs text-muted-foreground text-center py-1">
                +{dueCards.length - 5} more
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
