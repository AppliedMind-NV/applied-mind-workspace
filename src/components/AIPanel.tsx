import { X, Send, Loader2, Trash2, Sparkles } from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";
import { useNoteContext } from "@/contexts/NoteContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
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
  onDelta,
  onDone,
  onError,
}: {
  messages: Msg[];
  action: string;
  noteContent: string;
  noteTitle: string;
  onDelta: (text: string) => void;
  onDone: () => void;
  onError: (msg: string) => void;
}) {
  const resp = await fetch(NOTE_AI_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({ messages, action, noteContent, noteTitle }),
  });

  if (!resp.ok) {
    const data = await resp.json().catch(() => ({}));
    onError(data.error || `Request failed (${resp.status})`);
    return;
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

export function AIPanel({ onClose }: AIPanelProps) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { activeNoteTitle, activeNoteText } = useNoteContext();
  const { user } = useAuth();
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const hasNote = activeNoteText.length > 0;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = useCallback(
    async (text: string, action: string = "chat") => {
      if (isLoading) return;
      const userMsg: Msg = { role: "user", content: text };
      const updatedMessages = [...messages, userMsg];
      setMessages(updatedMessages);
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

      await streamChat({
        messages: [userMsg],
        action,
        noteContent: activeNoteText,
        noteTitle: activeNoteTitle,
        onDelta: upsertAssistant,
        onDone: () => setIsLoading(false),
        onError: (msg) => {
          toast({ title: "AI Error", description: msg, variant: "destructive" });
          setIsLoading(false);
        },
      });
    },
    [messages, isLoading, activeNoteText, activeNoteTitle]
  );

  const handleAction = async (action: string, label: string) => {
    if (!hasNote) {
      toast({
        title: "No note selected",
        description: "Open a note first to use this action.",
        variant: "destructive",
      });
      return;
    }

    if (action === "flashcards") {
      await generateFlashcards();
      return;
    }

    if (action === "practice") {
      await generatePracticeQuestions();
      return;
    }

    sendMessage(label, action);
  };

  const generateFlashcards = async () => {
    if (!user) return;
    setIsLoading(true);
    setMessages((prev) => [
      ...prev,
      { role: "user", content: "Generate flashcards from this note" },
    ]);

    try {
      const resp = await fetch(NOTE_AI_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [{ role: "user", content: "Generate flashcards from this note" }],
          action: "flashcards",
          noteContent: activeNoteText,
          noteTitle: activeNoteTitle,
        }),
      });

      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}));
        throw new Error(data.error || "Failed to generate flashcards");
      }

      const data = await resp.json();
      let cards: Array<{ front: string; back: string }> = [];

      try {
        const raw = data.content.trim();
        // Extract JSON array from possible markdown code fences
        const match = raw.match(/\[[\s\S]*\]/);
        if (match) cards = JSON.parse(match[0]);
      } catch {
        throw new Error("Failed to parse flashcard response");
      }

      if (cards.length === 0) {
        throw new Error("No flashcards generated");
      }

      // Save flashcards to database
      const inserts = cards.map((c) => ({
        user_id: user.id,
        front: c.front,
        back: c.back,
      }));

      const { error } = await supabase.from("flashcards").insert(inserts);
      if (error) throw error;

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `✅ **${cards.length} flashcards created!**\n\nHere's a preview:\n\n${cards
            .slice(0, 3)
            .map((c, i) => `**${i + 1}.** ${c.front}\n> ${c.back}`)
            .join("\n\n")}${cards.length > 3 ? `\n\n…and ${cards.length - 3} more. View them all in **Flashcards**.` : ""}`,
        },
      ]);

      toast({
        title: "Flashcards created",
        description: `${cards.length} flashcards saved from "${activeNoteTitle}"`,
      });
    } catch (err: any) {
      toast({
        title: "Generation failed",
        description: err.message,
        variant: "destructive",
      });
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `❌ ${err.message}` },
      ]);
    } finally {
      setIsLoading(false);
    }
  };
  const generatePracticeQuestions = async () => {
    if (!user) return;
    setIsLoading(true);
    setMessages((prev) => [
      ...prev,
      { role: "user", content: "Generate practice questions from this note" },
    ]);

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
        throw new Error(data.error || "Failed to generate practice questions");
      }

      const data = await resp.json();
      let questions: Array<{ question: string; answer: string }> = [];

      try {
        const raw = data.content.trim();
        const match = raw.match(/\[[\s\S]*\]/);
        if (match) questions = JSON.parse(match[0]);
      } catch {
        throw new Error("Failed to parse practice questions response");
      }

      if (questions.length === 0) throw new Error("No questions generated");

      const inserts = questions.map((q) => ({
        user_id: user.id,
        question: q.question,
        answer: q.answer,
      }));

      const { error } = await supabase.from("practice_questions").insert(inserts);
      if (error) throw error;

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `✅ **${questions.length} practice questions created!**\n\n${questions
            .slice(0, 3)
            .map((q, i) => `**${i + 1}.** ${q.question}\n> ${q.answer}`)
            .join("\n\n")}${questions.length > 3 ? `\n\n…and ${questions.length - 3} more. View them all in **Practice**.` : ""}`,
        },
      ]);

      toast({
        title: "Practice questions created",
        description: `${questions.length} questions saved from "${activeNoteTitle}"`,
      });
    } catch (err: any) {
      toast({
        title: "Generation failed",
        description: err.message,
        variant: "destructive",
      });
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `❌ ${err.message}` },
      ]);
    } finally {
      setIsLoading(false);
    }
  };


    e.preventDefault();
    if (!input.trim()) return;
    sendMessage(input.trim());
  };

  const clearChat = () => {
    setMessages([]);
  };

  const actions = [
    { key: "summarize", label: "Summarize note", emoji: "📝" },
    { key: "explain", label: "Explain concepts", emoji: "💡" },
    { key: "flashcards", label: "Generate flashcards", emoji: "🗂️" },
    { key: "practice", label: "Practice questions", emoji: "❓" },
  ];

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
            <button
              onClick={clearChat}
              className="p-1 rounded-md hover:bg-accent text-muted-foreground"
              title="Clear chat"
            >
              <Trash2 size={13} />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-accent text-muted-foreground"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Note context indicator */}
      {hasNote && (
        <div className="px-4 py-2 border-b bg-primary/5 shrink-0">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Context</p>
          <p className="text-xs font-medium truncate text-foreground">{activeNoteTitle}</p>
        </div>
      )}

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-auto scrollbar-thin p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-3">
              <span className="text-primary text-lg">✦</span>
            </div>
            <p className="text-sm text-muted-foreground mb-1">
              {hasNote
                ? `Ready to help with "${activeNoteTitle}"`
                : "Select a note to get contextual help"}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {hasNote
                ? "Use an action below or ask a question"
                : "Or ask a general question"}
            </p>

            {/* Action buttons */}
            <div className="mt-4 space-y-1.5">
              {actions.map((a) => (
                <button
                  key={a.key}
                  onClick={() => handleAction(a.key, a.label)}
                  disabled={isLoading || (!hasNote && a.key !== "chat")}
                  className="w-full text-left text-xs px-3 py-2 rounded-md border hover:bg-accent transition-colors text-foreground flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <span>{a.emoji}</span>
                  {a.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div
              key={i}
              className={`text-sm ${
                msg.role === "user"
                  ? "bg-accent rounded-lg px-3 py-2 ml-6"
                  : "pr-2"
              }`}
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
          {actions.map((a) => (
            <button
              key={a.key}
              onClick={() => handleAction(a.key, a.label)}
              disabled={isLoading}
              className="text-[10px] px-2 py-1 rounded-md border hover:bg-accent transition-colors disabled:opacity-40"
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
