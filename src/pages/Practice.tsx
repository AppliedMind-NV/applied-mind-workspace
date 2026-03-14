import { ChevronDown, ChevronUp, Lightbulb, Trash2, Layers, BookOpen, Sparkles, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNoteContext } from "@/contexts/NoteContext";
import { toast } from "@/hooks/use-toast";

interface PracticeQuestion {
  id: string;
  question: string;
  answer: string;
  note_id: string | null;
  created_at: string;
}

const NOTE_AI_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/note-ai`;

export default function Practice() {
  const { user } = useAuth();
  const { activeNoteTitle, activeNoteText } = useNoteContext();
  const [questions, setQuestions] = useState<PracticeQuestion[]>([]);
  const [revealedAnswers, setRevealedAnswers] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data } = await supabase
        .from("practice_questions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setQuestions(data ?? []);
      setLoading(false);
    };
    fetch();
  }, [user]);

  const toggleAnswer = (id: string) => {
    setRevealedAnswers((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const deleteQuestion = async (id: string) => {
    await supabase.from("practice_questions").delete().eq("id", id);
    setQuestions((prev) => prev.filter((q) => q.id !== id));
    toast({ title: "Question deleted" });
  };

  const generateFromNote = async () => {
    if (!user || !activeNoteText || generating) return;
    setGenerating(true);

    try {
      const resp = await fetch(NOTE_AI_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [{ role: "user", content: "Generate practice questions from this note" }],
          action: "practice_json",
          noteContent: activeNoteText,
          noteTitle: activeNoteTitle,
        }),
      });

      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}));
        throw new Error(data.error || `Request failed (${resp.status})`);
      }

      const data = await resp.json();
      const raw = data.content?.trim() || "";
      const match = raw.match(/\[[\s\S]*\]/);
      if (!match) throw new Error("Failed to parse AI response.");

      let parsed: Array<{ question: string; answer: string }> = [];
      try {
        parsed = JSON.parse(match[0]);
      } catch {
        throw new Error("AI returned invalid JSON.");
      }

      if (parsed.length === 0) throw new Error("No questions generated.");

      const inserts = parsed.map((q) => ({
        user_id: user.id,
        question: q.question,
        answer: q.answer,
      }));

      const { data: inserted, error } = await supabase
        .from("practice_questions")
        .insert(inserts)
        .select("*");

      if (error) throw error;

      setQuestions((prev) => [...(inserted ?? []), ...prev]);
      toast({
        title: "Questions generated!",
        description: `${parsed.length} practice questions created from "${activeNoteTitle}".`,
      });
    } catch (err: any) {
      toast({ title: "Generation failed", description: err.message, variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const hasNote = activeNoteText.length > 0;
  const totalCount = questions.length;
  const revealedCount = revealedAnswers.size;

  if (loading) {
    return <div className="flex items-center justify-center h-full text-sm text-muted-foreground">Loading questions…</div>;
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold tracking-tight mb-1">Practice Questions</h1>
          <p className="text-sm text-muted-foreground">
            {totalCount > 0
              ? `${totalCount} question${totalCount !== 1 ? "s" : ""} • ${revealedCount} revealed`
              : "Generate questions from your notes to test your understanding."}
          </p>
        </div>
        {hasNote && (
          <button
            onClick={generateFromNote}
            disabled={generating}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors disabled:opacity-60"
          >
            {generating ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
            {generating ? "Generating…" : `Generate from "${activeNoteTitle}"`}
          </button>
        )}
      </div>

      {/* Stats */}
      {totalCount > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="rounded-lg border bg-card p-3 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-0.5">
              <Layers size={12} className="text-primary" />
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Total</span>
            </div>
            <p className="text-xl font-semibold tabular-nums">{totalCount}</p>
          </div>
          <div className="rounded-lg border bg-card p-3 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-0.5">
              <Lightbulb size={12} className="text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Revealed</span>
            </div>
            <p className="text-xl font-semibold tabular-nums">{revealedCount}</p>
          </div>
          <div className="rounded-lg border bg-card p-3 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-0.5">
              <BookOpen size={12} className="text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Remaining</span>
            </div>
            <p className="text-xl font-semibold tabular-nums">{totalCount - revealedCount}</p>
          </div>
        </div>
      )}

      {totalCount === 0 ? (
        <div className="text-center py-16 rounded-lg border bg-card">
          <BookOpen size={28} className="mx-auto text-muted-foreground mb-3" />
          <p className="text-sm font-medium mb-1">No practice questions yet</p>
          <p className="text-xs text-muted-foreground mb-4">
            {hasNote
              ? `Click "Generate" above to create questions from "${activeNoteTitle}".`
              : "Open a note first, then use the AI panel or come here to generate questions."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {questions.map((q, idx) => (
            <div key={q.id} className="rounded-lg border bg-card overflow-hidden group">
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <span className="text-[10px] text-muted-foreground tabular-nums mr-2">Q{idx + 1}</span>
                    <span className="text-sm font-medium leading-relaxed">{q.question}</span>
                  </div>
                  <button
                    onClick={() => deleteQuestion(q.id)}
                    className="p-1 rounded hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                  >
                    <Trash2 size={12} className="text-destructive" />
                  </button>
                </div>
              </div>

              <div className="border-t">
                <button
                  onClick={() => toggleAnswer(q.id)}
                  className="w-full flex items-center justify-between px-4 py-2.5 text-xs text-muted-foreground hover:bg-accent/50 transition-colors"
                >
                  <span className="flex items-center gap-1.5">
                    <Lightbulb size={12} />
                    {revealedAnswers.has(q.id) ? "Hide answer" : "Reveal answer"}
                  </span>
                  {revealedAnswers.has(q.id) ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                </button>
                {revealedAnswers.has(q.id) && (
                  <div className="px-4 pb-4">
                    <p className="text-sm leading-relaxed text-foreground/90">{q.answer}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
