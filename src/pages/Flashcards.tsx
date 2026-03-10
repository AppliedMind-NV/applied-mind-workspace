import { RotateCcw, ThumbsDown, Check, Zap } from "lucide-react";
import { useState } from "react";

const mockCards = [
  { id: "1", front: "What is the time complexity of binary search?", back: "O(log n) — it halves the search space with each comparison.", due: true },
  { id: "2", front: "What is a closure in JavaScript?", back: "A closure is a function that retains access to its lexical scope even when executed outside that scope.", due: true },
  { id: "3", front: "Explain the CAP theorem.", back: "In a distributed system, you can only guarantee two of three: Consistency, Availability, and Partition tolerance.", due: false },
];

export default function Flashcards() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const dueCards = mockCards.filter((c) => c.due);
  const card = dueCards[currentIndex];

  const handleRate = () => {
    setFlipped(false);
    if (currentIndex < dueCards.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-6 py-8 animate-fade-in">
      <div className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight mb-1">Flashcards</h1>
        <p className="text-sm text-muted-foreground">
          {dueCards.length} cards due for review
        </p>
      </div>

      {card ? (
        <div className="space-y-4">
          {/* Progress */}
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${((currentIndex + 1) / dueCards.length) * 100}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground tabular-nums">
              {currentIndex + 1}/{dueCards.length}
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
                onClick={handleRate}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md border hover:bg-destructive/10 hover:border-destructive/30 transition-colors text-sm"
              >
                <RotateCcw size={14} />
                Again
              </button>
              <button
                onClick={handleRate}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md border hover:bg-accent transition-colors text-sm"
              >
                <Check size={14} />
                Good
              </button>
              <button
                onClick={handleRate}
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
