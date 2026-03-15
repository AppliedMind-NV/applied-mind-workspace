import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import {
  Sparkles,
  X,
  Lightbulb,
  Wrench,
  TrendingUp,
  AlertTriangle,
  Wand2,
  HelpCircle,
  Footprints,
  Send,
  Loader2,
  Layers,
  BookOpen,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { toast } from "@/hooks/use-toast";

interface AIMessage {
  role: "user" | "assistant";
  content: string;
}

const NOTE_AI_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/note-ai`;

const AI_ACTIONS = [
  { key: "code_explain", label: "Explain Code", icon: Lightbulb, description: "What does this code do?" },
  { key: "code_explain_lines", label: "Line by Line", icon: Footprints, description: "Walk through each line" },
  { key: "code_fix", label: "Debug / Fix", icon: Wrench, description: "Find and fix bugs" },
  { key: "code_improve", label: "Improve", icon: TrendingUp, description: "Better practices & performance" },
  { key: "code_error", label: "Explain Error", icon: AlertTriangle, description: "What does this error mean?" },
  { key: "code_pseudocode", label: "Idea → Code", icon: Wand2, description: "Turn description into code" },
  { key: "code_hint", label: "Give Hint", icon: HelpCircle, description: "Nudge without full answer" },
];

interface CodeAIPanelProps {
  code: string;
  title: string;
  language: string;
  onClose: () => void;
  onGenerateFlashcards?: () => void;
  onGeneratePractice?: () => void;
}

export interface CodeAIPanelRef {
  sendMessage: (prompt: string) => void;
}

const CodeAIPanel = forwardRef<CodeAIPanelRef, CodeAIPanelProps>(
  ({ code, title, language, onClose, onGenerateFlashcards, onGeneratePractice }, ref) => {
    const [messages, setMessages] = useState<AIMessage[]>([]);
    const [loading, setLoading] = useState(false);
    const [chatInput, setChatInput] = useState("");
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, [messages]);

    const streamAI = async (actionKey: string, userContent?: string) => {
      if (loading) return;
      const displayContent = userContent || `[${AI_ACTIONS.find((a) => a.key === actionKey)?.label ?? actionKey}]`;
      setMessages((prev) => [...prev, { role: "user", content: displayContent }]);
      setLoading(true);

      try {
        const resp = await fetch(NOTE_AI_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            messages: [{ role: "user", content: userContent || code }],
            action: actionKey,
            noteContent: code,
            noteTitle: title || "Code Lab",
          }),
        });

        if (!resp.ok) {
          const data = await resp.json().catch(() => ({}));
          throw new Error(data.error || `Request failed (${resp.status})`);
        }

        const reader = resp.body?.getReader();
        if (!reader) throw new Error("No stream");

        const decoder = new TextDecoder();
        let buffer = "";
        let text = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          let idx: number;
          while ((idx = buffer.indexOf("\n")) !== -1) {
            let line = buffer.slice(0, idx);
            buffer = buffer.slice(idx + 1);
            if (line.endsWith("\r")) line = line.slice(0, -1);
            if (!line.startsWith("data: ")) continue;
            const json = line.slice(6).trim();
            if (json === "[DONE]") break;
            try {
              const parsed = JSON.parse(json);
              const c = parsed.choices?.[0]?.delta?.content;
              if (c) {
                text += c;
                setMessages((prev) => {
                  const last = prev[prev.length - 1];
                  if (last?.role === "assistant")
                    return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: text } : m));
                  return [...prev, { role: "assistant", content: text }];
                });
              }
            } catch {}
          }
        }

        if (!text) setMessages((prev) => [...prev, { role: "assistant", content: "No response received." }]);
      } catch (err: any) {
        setMessages((prev) => [...prev, { role: "assistant", content: `Error: ${err.message}` }]);
        toast({ title: "AI error", description: err.message, variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };

    const sendChat = () => {
      if (!chatInput.trim()) return;
      const msg = chatInput;
      setChatInput("");
      streamAI("chat", `About my ${language} code:\n\n\`\`\`${language}\n${code}\n\`\`\`\n\n${msg}`);
    };

    useImperativeHandle(ref, () => ({
      sendMessage: (prompt: string) => streamAI("code_hint", prompt),
    }));

    return (
      <div className="w-80 border-l flex flex-col shrink-0 bg-background">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b shrink-0">
          <div className="flex items-center gap-1.5">
            <Sparkles size={13} className="text-primary" />
            <span className="text-xs font-semibold">AI Coding Tutor</span>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-accent transition-colors">
            <X size={13} className="text-muted-foreground" />
          </button>
        </div>

        {/* Quick Actions */}
        <div className="px-2 py-2 border-b shrink-0 grid grid-cols-2 gap-1">
          {AI_ACTIONS.map((action) => (
            <button
              key={action.key}
              onClick={() => streamAI(action.key)}
              disabled={!code.trim() || loading}
              className="flex items-center gap-1.5 px-2 py-1.5 rounded-md text-left hover:bg-accent/50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <action.icon size={11} className="text-primary shrink-0" />
              <span className="text-[10px] font-medium truncate">{action.label}</span>
            </button>
          ))}
        </div>

        {/* Connect actions */}
        <div className="px-2 py-1.5 border-b shrink-0 flex gap-1">
          {onGenerateFlashcards && (
            <button
              onClick={onGenerateFlashcards}
              disabled={!code.trim() || loading}
              className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-md border text-[10px] font-medium hover:bg-accent/30 transition-colors disabled:opacity-30"
            >
              <Layers size={10} /> Flashcards
            </button>
          )}
          {onGeneratePractice && (
            <button
              onClick={onGeneratePractice}
              disabled={!code.trim() || loading}
              className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-md border text-[10px] font-medium hover:bg-accent/30 transition-colors disabled:opacity-30"
            >
              <BookOpen size={10} /> Questions
            </button>
          )}
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-auto scrollbar-thin p-3 space-y-3">
          {messages.length === 0 && (
            <div className="text-center py-6">
              <Sparkles size={20} className="mx-auto text-muted-foreground mb-2" />
              <p className="text-[11px] text-muted-foreground">
                I'm your coding tutor. Click an action above or ask me anything about your code.
              </p>
            </div>
          )}
          {messages.map((msg, i) => (
            <div key={i}>
              {msg.role === "user" ? (
                <p className="text-[10px] text-primary font-medium mb-1 truncate">{msg.content.split("\n")[0]}</p>
              ) : (
                <div className="prose prose-xs prose-invert max-w-none text-[11px] leading-relaxed">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <Loader2 size={12} className="animate-spin" /> Thinking…
            </div>
          )}
        </div>

        {/* Chat input */}
        <div className="px-2 py-2 border-t shrink-0">
          <div className="flex items-center gap-1.5">
            <input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendChat()}
              placeholder="Ask about your code…"
              className="flex-1 text-xs bg-muted/30 rounded-md px-2.5 py-2 outline-none placeholder:text-muted-foreground/60"
            />
            <button
              onClick={sendChat}
              disabled={!chatInput.trim() || loading}
              className="p-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-30"
            >
              <Send size={12} />
            </button>
          </div>
        </div>
      </div>
    );
  }
);

CodeAIPanel.displayName = "CodeAIPanel";
export default CodeAIPanel;
