import { X, Send, Loader2, Trash2, Sparkles } from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";
import { useNoteContext } from "@/contexts/NoteContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { callAI } from "@/lib/aiRequest";
import ReactMarkdown from "react-markdown";

type Msg = { role: "user" | "assistant"; content: string };

const NOTE_AI_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/note-ai`;

interface AIPanelProps {
  onClose: () => void;
}

async function streamChat({
  messages,
  action,
  noteContent,
  noteTitle,
  selectedText,
  onDelta,
  onDone,
  onError,
}: {
  messages: Msg[];
  action: string;
  noteContent: string;
  noteTitle: string;
  selectedText?: string;
  onDelta: (text: string) => void;
  onDone: () => void;
  onError: (msg: string) => void;
}) {
  const resp = await callAI({
    endpoint: NOTE_AI_URL,
    body: { messages, action, noteContent, noteTitle, selectedText },
  }).catch((err) => {
    onError(err.message);
    return null;
  });

  if (!resp) return;
  }

  if (!resp.body) {
    onError("No response body");
    return;
  }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let newlineIdx: number;
    while ((newlineIdx = buffer.indexOf("\n")) !== -1) {
      let line = buffer.slice(0, newlineIdx);
      buffer = buffer.slice(newlineIdx + 1);
      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (!line.startsWith("data: ")) continue;
      const jsonStr = line.slice(6).trim();
      if (jsonStr === "[DONE]") {
        onDone();
        return;
      }
      try {
        const parsed = JSON.parse(jsonStr);
        const content = parsed.choices?.[0]?.delta?.content;
        if (content) onDelta(content);
      } catch {
        buffer = line + "\n" + buffer;
        break;
      }
    }
  }
  onDone();
}

async function fetchNonStreaming({
  messages,
  action,
  noteContent,
  noteTitle,
  selectedText,
}: {
  messages: Msg[];
  action: string;
  noteContent: string;
  noteTitle: string;
  selectedText?: string;
}) {
  const resp = await callAI({
    endpoint: NOTE_AI_URL,
    body: { messages, action, noteContent, noteTitle, selectedText },
  });

  return resp.json();

  return resp.json();
}

interface ActionDef {
  key: string;
  label: string;
  emoji: string;
  needsNote: boolean;
  needsSelection?: boolean;
  description: string;
}

const ALL_ACTIONS: ActionDef[] = [
  { key: "summarize", label: "Summarize note", emoji: "📝", needsNote: true, description: "Get concise bullet-point summary" },
  { key: "explain", label: "Explain concepts", emoji: "💡", needsNote: true, description: "Break down key ideas simply" },
  { key: "simplify", label: "Simplify selected text", emoji: "🔄", needsNote: true, needsSelection: true, description: "Rewrite in simpler terms" },
  { key: "explain_code", label: "Explain code block", emoji: "🧑‍💻", needsNote: true, needsSelection: true, description: "Line-by-line code explanation" },
  { key: "related", label: "Related concepts", emoji: "🔗", needsNote: true, description: "Discover connected topics" },
  { key: "flashcards", label: "Generate flashcards", emoji: "🗂️", needsNote: true, description: "Create spaced repetition cards" },
  { key: "practice", label: "Practice questions", emoji: "❓", needsNote: true, description: "Generate exam-style questions" },
];

export function AIPanel({ onClose }: AIPanelProps) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { activeNoteTitle, activeNoteText, selectedText } = useNoteContext();
  const { user } = useAuth();
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const hasNote = activeNoteText.length > 0;
  const hasSelection = selectedText.length > 0;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = useCallback(
    async (text: string, action: string = "chat", extraSelectedText?: string) => {
      if (isLoading) return;
      const userMsg: Msg = { role: "user", content: text };
      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setIsLoading(true);

      let assistantSoFar = "";

      const upsertAssistant = (chunk: string) => {
        assistantSoFar += chunk;
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant") {
            return prev.map((m, i) =>
              i === prev.length - 1 ? { ...m, content: assistantSoFar } : m
            );
          }
          return [...prev, { role: "assistant", content: assistantSoFar }];
        });
      };

      try {
        await streamChat({
          messages: [userMsg],
          action,
          noteContent: activeNoteText,
          noteTitle: activeNoteTitle,
          selectedText: extraSelectedText,
          onDelta: upsertAssistant,
          onDone: () => setIsLoading(false),
          onError: (msg) => {
            toast({ title: "AI Error", description: msg, variant: "destructive" });
            setIsLoading(false);
          },
        });
      } catch (err: any) {
        const msg = err?.message || "Failed to connect to AI service";
        setMessages((prev) => [...prev, { role: "assistant", content: `❌ ${msg}` }]);
        toast({ title: "AI Error", description: msg, variant: "destructive" });
        setIsLoading(false);
      }
    },
    [isLoading, activeNoteText, activeNoteTitle]
  );

  const handleAction = async (action: ActionDef) => {
    if (action.needsNote && !hasNote) {
      toast({ title: "No note selected", description: "Open a note first.", variant: "destructive" });
      return;
    }
    if (action.needsSelection && !hasSelection) {
      toast({ title: "No text selected", description: "Select text in the editor first.", variant: "destructive" });
      return;
    }

    if (action.key === "flashcards") {
      await generateFlashcards();
      return;
    }
    if (action.key === "practice") {
      await generatePracticeQuestions();
      return;
    }

    // For selection-based actions, include selected text context
    const sel = action.needsSelection ? selectedText : undefined;
    const label = action.needsSelection
      ? `${action.label}: "${selectedText.slice(0, 80)}${selectedText.length > 80 ? "…" : ""}"`
      : action.label;
    sendMessage(label, action.key, sel);
  };

  const generateFlashcards = async () => {
    if (!user) return;
    setIsLoading(true);
    setMessages((prev) => [...prev, { role: "user", content: "Generate flashcards from this note" }]);

    try {
      const data = await fetchNonStreaming({
        messages: [{ role: "user", content: "Generate flashcards from this note" }],
        action: "flashcards",
        noteContent: activeNoteText,
        noteTitle: activeNoteTitle,
      });

      let cards: Array<{ front: string; back: string }> = [];
      try {
        const match = data.content.trim().match(/\[[\s\S]*\]/);
        if (match) cards = JSON.parse(match[0]);
      } catch { throw new Error("Failed to parse flashcard response"); }

      if (cards.length === 0) throw new Error("No flashcards generated");

      const { error } = await supabase.from("flashcards").insert(
        cards.map((c) => ({ user_id: user.id, front: c.front, back: c.back }))
      );
      if (error) throw error;

      setMessages((prev) => [...prev, {
        role: "assistant",
        content: `✅ **${cards.length} flashcards created!**\n\n${cards.slice(0, 3).map((c, i) => `**${i + 1}.** ${c.front}\n> ${c.back}`).join("\n\n")}${cards.length > 3 ? `\n\n…and ${cards.length - 3} more. View them all in **Flashcards**.` : ""}`,
      }]);
      toast({ title: "Flashcards created", description: `${cards.length} flashcards saved from "${activeNoteTitle}"` });
    } catch (err: any) {
      toast({ title: "Generation failed", description: err.message, variant: "destructive" });
      setMessages((prev) => [...prev, { role: "assistant", content: `❌ ${err.message}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  const generatePracticeQuestions = async () => {
    if (!user) return;
    setIsLoading(true);
    setMessages((prev) => [...prev, { role: "user", content: "Generate practice questions from this note" }]);

    try {
      const data = await fetchNonStreaming({
        messages: [{ role: "user", content: "Generate practice questions from this note" }],
        action: "practice_json",
        noteContent: activeNoteText,
        noteTitle: activeNoteTitle,
      });

      let questions: Array<{ question: string; answer: string }> = [];
      try {
        const match = data.content.trim().match(/\[[\s\S]*\]/);
        if (match) questions = JSON.parse(match[0]);
      } catch { throw new Error("Failed to parse practice questions response"); }

      if (questions.length === 0) throw new Error("No questions generated");

      const { error } = await supabase.from("practice_questions").insert(
        questions.map((q) => ({ user_id: user.id, question: q.question, answer: q.answer }))
      );
      if (error) throw error;

      setMessages((prev) => [...prev, {
        role: "assistant",
        content: `✅ **${questions.length} practice questions created!**\n\n${questions.slice(0, 3).map((q, i) => `**${i + 1}.** ${q.question}\n> ${q.answer}`).join("\n\n")}${questions.length > 3 ? `\n\n…and ${questions.length - 3} more. View them all in **Practice**.` : ""}`,
      }]);
      toast({ title: "Practice questions created", description: `${questions.length} questions saved from "${activeNoteTitle}"` });
    } catch (err: any) {
      toast({ title: "Generation failed", description: err.message, variant: "destructive" });
      setMessages((prev) => [...prev, { role: "assistant", content: `❌ ${err.message}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    sendMessage(input.trim());
  };

  const clearChat = () => setMessages([]);

  // Filter actions based on context
  const visibleActions = ALL_ACTIONS.filter((a) => {
    if (a.needsSelection) return hasNote && hasSelection;
    return true;
  });

  const quickActions = ALL_ACTIONS.filter((a) => !a.needsSelection);

  return (
    <aside className="w-80 border-l bg-sidebar flex flex-col shrink-0 animate-slide-in-right">
      {/* Header */}
      <div className="h-12 flex items-center justify-between px-4 border-b shrink-0">
        <div className="flex items-center gap-2">
          <Sparkles size={14} className="text-primary" />
          <span className="text-sm font-medium text-sidebar-foreground">AI Assistant</span>
        </div>
        <div className="flex items-center gap-1">
          {messages.length > 0 && (
            <button onClick={clearChat} className="p-1 rounded-md hover:bg-accent text-muted-foreground" title="Clear chat">
              <Trash2 size={13} />
            </button>
          )}
          <button onClick={onClose} className="p-1 rounded-md hover:bg-accent text-muted-foreground">
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Note context indicator */}
      {hasNote && (
        <div className="px-4 py-2 border-b bg-primary/5 shrink-0">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Context</p>
          <p className="text-xs font-medium truncate text-foreground">{activeNoteTitle}</p>
          {hasSelection && (
            <p className="text-[10px] text-primary mt-0.5 truncate">
              Selected: "{selectedText.slice(0, 60)}{selectedText.length > 60 ? "…" : ""}"
            </p>
          )}
        </div>
      )}

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-auto scrollbar-thin p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="py-4">
            <div className="text-center mb-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <span className="text-primary text-lg">✦</span>
              </div>
              <p className="text-sm text-muted-foreground mb-1">
                {hasNote ? `Ready to help with "${activeNoteTitle}"` : "Select a note to get contextual help"}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {hasNote ? "Use an action below or ask a question" : "Or ask a general question"}
              </p>
            </div>

            {/* Action buttons */}
            <div className="space-y-1">
              {visibleActions.map((a) => (
                <button
                  key={a.key}
                  onClick={() => handleAction(a)}
                  disabled={isLoading || (a.needsNote && !hasNote)}
                  className="w-full text-left text-xs px-3 py-2 rounded-md border hover:bg-accent transition-colors text-foreground flex items-center gap-2.5 disabled:opacity-40 disabled:cursor-not-allowed group"
                >
                  <span className="text-sm">{a.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{a.label}</p>
                    <p className="text-[10px] text-muted-foreground">{a.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div
              key={i}
              className={`text-sm ${msg.role === "user" ? "bg-accent rounded-lg px-3 py-2 ml-6" : "pr-2"}`}
            >
              {msg.role === "assistant" ? (
                <div className="prose prose-sm dark:prose-invert max-w-none text-foreground [&_p]:my-1 [&_li]:my-0.5 [&_h1]:text-base [&_h2]:text-sm [&_h3]:text-sm [&_pre]:text-xs [&_pre]:bg-muted [&_pre]:rounded [&_pre]:p-2 [&_code]:text-xs [&_code]:bg-muted [&_code]:px-1 [&_code]:rounded [&_blockquote]:border-l-2 [&_blockquote]:border-primary/40 [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground [&_blockquote]:italic">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              ) : (
                <p>{msg.content}</p>
              )}
            </div>
          ))
        )}

        {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 size={12} className="animate-spin" />
            Thinking…
          </div>
        )}
      </div>

      {/* Quick actions when chat is active */}
      {messages.length > 0 && hasNote && (
        <div className="px-3 py-2 border-t flex gap-1 flex-wrap shrink-0">
          {quickActions.map((a) => (
            <button
              key={a.key}
              onClick={() => handleAction(a)}
              disabled={isLoading || (a.needsNote && !hasNote)}
              className="text-[10px] px-2 py-1 rounded-md border hover:bg-accent transition-colors disabled:opacity-40"
            >
              {a.emoji} {a.label.split(" ")[0]}
            </button>
          ))}
          {hasSelection && ALL_ACTIONS.filter((a) => a.needsSelection).map((a) => (
            <button
              key={a.key}
              onClick={() => handleAction(a)}
              disabled={isLoading}
              className="text-[10px] px-2 py-1 rounded-md border border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors disabled:opacity-40 text-primary"
            >
              {a.emoji} {a.label.split(" ")[0]}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="border-t p-3 shrink-0">
        <form onSubmit={handleSubmit} className="flex items-center gap-2 bg-background rounded-lg border px-3 py-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={hasNote ? "Ask about this note…" : "Ask anything…"}
            className="flex-1 text-sm bg-transparent outline-none placeholder:text-muted-foreground"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="text-muted-foreground hover:text-primary transition-colors disabled:opacity-40"
          >
            {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          </button>
        </form>
      </div>
    </aside>
  );
}
