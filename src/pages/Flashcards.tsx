import { RotateCcw, Check, Zap, Plus } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Flashcard {
  id: string;
  front: string;
  back: string;
  next_review: string;
}

export default function Flashcards() {
  const { user } = useAuth();
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newFront, setNewFront] = useState("");
  const [newBack, setNewBack] = useState("");

  // Fetch due cards
  useEffect(() => {
    if (!user) return;
    const fetchCards = async () => {
      const { data } = await supabase
        .from("flashcards")
        .select("id, front, back, next_review")
        .lte("next_review", new Date().toISOString())
        .order("next_review", { ascending: true });
      if (data) setCards(data);
      setLoading(false);
    };
    fetchCards();
  }, [user]);

  const card = cards[currentIndex];

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
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // Remove reviewed card from list
      setCards((prev) => prev.filter((c) => c.id !== card.id));
      setCurrentIndex(0);
    }
  };

  const createCard = async () => {
    if (!user || !newFront.trim() || !newBack.trim()) return;
    const { data } = await supabase
      .from("flashcards")
      .insert({ user_id: user.id, front: newFront.trim(), back: newBack.trim() })
      .select("id, front, back, next_review")
      .single();
    if (data) {
      setCards((prev) => [...prev, data]);
      setNewFront("");
      setNewBack("");
      setShowCreate(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-full text-sm text-muted-foreground">Loading flashcards…</div>;
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-8 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold tracking-tight mb-1">Flashcards</h1>
          <p className="text-sm text-muted-foreground">
            {cards.length} card{cards.length !== 1 ? "s" : ""} due for review
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
          <button
            onClick={createCard}
            className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Create Card
          </button>
        </div>
      )}

      {card ? (
        <div className="space-y-4">
          {/* Progress */}
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground tabular-nums">
              {currentIndex + 1}/{cards.length}
            </span>
          </div>

          {/* Card */}
          <button
            onClick={() => setFlipped(!flipped)}
            className="w-full min-h-[240px] rounded-lg border bg-card p-8 text-left transition-all hover:border-primary/30 cursor-pointer"
          >
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-4">
              {flipped ? "Answer" : "Question"}
            </p>
            <p className={`text-lg leading-relaxed ${flipped ? "font-serif" : "font-sans font-medium"}`}>
              {flipped ? card.back : card.front}
            </p>
            {!flipped && (
              <p className="text-xs text-muted-foreground mt-6">Click to reveal answer</p>
            )}
          </button>

          {/* Rating buttons */}
          {flipped && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleRate("again")}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md border hover:bg-destructive/10 hover:border-destructive/30 transition-colors text-sm"
              >
                <RotateCcw size={14} />
                Again
              </button>
              <button
                onClick={() => handleRate("good")}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md border hover:bg-accent transition-colors text-sm"
              >
                <Check size={14} />
                Good
              </button>
              <button
                onClick={() => handleRate("easy")}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md border hover:bg-primary/10 hover:border-primary/30 transition-colors text-sm"
              >
                <Zap size={14} />
                Easy
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-16">
          <p className="text-muted-foreground text-sm">No cards due for review. Great job!</p>
        </div>
      )}
    </div>
  );
}
