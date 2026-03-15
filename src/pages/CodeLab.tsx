import { Play, Terminal, Plus, Save, Trash2, Sparkles, Lightbulb, Wrench, TrendingUp, X, Loader2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import Editor from "@monaco-editor/react";

interface CodeProject {
  id: string;
  title: string;
  code: string;
  language: string;
}

interface AIMessage {
  role: "user" | "assistant";
  content: string;
}

const NOTE_AI_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/note-ai`;

const AI_ACTIONS = [
  { key: "code_explain", label: "Explain Code", icon: Lightbulb, description: "Break down what this code does" },
  { key: "code_fix", label: "Suggest Fixes", icon: Wrench, description: "Find and fix potential bugs" },
  { key: "code_improve", label: "Improve Code", icon: TrendingUp, description: "Suggest best practices & optimizations" },
];

export default function CodeLab() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<CodeProject[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [title, setTitle] = useState("");
  const [output, setOutput] = useState("▸ Click Run to execute code.\n▸ Sandboxed execution is coming soon — output is simulated for now.");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState(false);

  // AI panel state
  const [aiOpen, setAiOpen] = useState(false);
  const [aiMessages, setAiMessages] = useState<AIMessage[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const aiScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase
        .from("code_projects")
        .select("id, title, code, language")
        .order("updated_at", { ascending: false });
      if (data) {
        setProjects(data);
        if (data.length > 0) {
          setSelectedId(data[0].id);
          setCode(data[0].code);
          setTitle(data[0].title);
        }
      }
      setLoading(false);
    };
    load();
  }, [user]);

  useEffect(() => {
    if (aiScrollRef.current) {
      aiScrollRef.current.scrollTop = aiScrollRef.current.scrollHeight;
    }
  }, [aiMessages]);

  const selectProject = (p: CodeProject) => {
    setSelectedId(p.id);
    setCode(p.code);
    setTitle(p.title);
    setOutput("▸ Click Run to execute code.");
    setAiMessages([]);
  };

  const createProject = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("code_projects")
      .insert({ user_id: user.id, title: "Untitled Project", code: "# Write your Python code here\nprint('Hello, world!')\n", language: "python" })
      .select("id, title, code, language")
      .single();
    if (data) {
      setProjects((prev) => [data, ...prev]);
      selectProject(data);
    }
  };

  const saveProject = async () => {
    if (!selectedId) return;
    setSaving(true);
    await supabase.from("code_projects").update({ title, code }).eq("id", selectedId);
    setProjects((prev) => prev.map((p) => (p.id === selectedId ? { ...p, title, code } : p)));
    setSaving(false);
    toast({ title: "Project saved" });
  };

  const deleteProject = async (id: string) => {
    await supabase.from("code_projects").delete().eq("id", id);
    setProjects((prev) => prev.filter((p) => p.id !== id));
    if (selectedId === id) {
      setSelectedId(null);
      setCode("");
      setTitle("");
    }
  };

  const runCode = () => {
    if (!code.trim()) return;
    setRunning(true);
    // Simulated execution — parse simple print statements
    const lines = code.split("\n");
    const outputLines: string[] = [];
    let hasOutput = false;

    for (const line of lines) {
      const printMatch = line.match(/^\s*print\s*\(\s*(['"])(.*?)\1\s*\)\s*$/);
      const printFMatch = line.match(/^\s*print\s*\(\s*f?(['"])(.*?)\1\s*\)\s*$/);
      if (printMatch) {
        outputLines.push(printMatch[2]);
        hasOutput = true;
      } else if (printFMatch && !printMatch) {
        outputLines.push(printFMatch[2]);
        hasOutput = true;
      }
    }

    setTimeout(() => {
      if (hasOutput) {
        setOutput(outputLines.join("\n") + "\n\n▸ Process finished (simulated).");
      } else {
        setOutput("▸ Code executed (simulated). No print output detected.\n▸ Full sandboxed execution coming soon.");
      }
      setRunning(false);
    }, 600);
  };

  // AI streaming
  const runAIAction = async (actionKey: string) => {
    if (!code.trim() || aiLoading) return;

    const actionLabel = AI_ACTIONS.find((a) => a.key === actionKey)?.label ?? actionKey;
    const userMsg: AIMessage = { role: "user", content: `[${actionLabel}]\n\`\`\`python\n${code}\n\`\`\`` };
    setAiMessages((prev) => [...prev, userMsg]);
    setAiLoading(true);

    try {
      const resp = await fetch(NOTE_AI_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [{ role: "user", content: code }],
          action: actionKey,
          noteContent: code,
          noteTitle: title || "Code Lab",
        }),
      });

      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}));
        throw new Error(data.error || `Request failed (${resp.status})`);
      }

      // Stream response
      const reader = resp.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let buffer = "";
      let assistantText = "";

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
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantText += content;
              setAiMessages((prev) => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant") {
                  return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantText } : m);
                }
                return [...prev, { role: "assistant", content: assistantText }];
              });
            }
          } catch { /* partial JSON */ }
        }
      }

      if (!assistantText) {
        setAiMessages((prev) => [...prev, { role: "assistant", content: "No response received." }]);
      }
    } catch (err: any) {
      setAiMessages((prev) => [...prev, { role: "assistant", content: `Error: ${err.message}` }]);
      toast({ title: "AI error", description: err.message, variant: "destructive" });
    } finally {
      setAiLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-full text-sm text-muted-foreground">Loading projects…</div>;
  }

  return (
    <div className="flex h-full animate-fade-in">
      {/* Project sidebar */}
      <div className="w-52 border-r flex flex-col shrink-0">
        <div className="p-2 border-b">
          <button
            onClick={createProject}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus size={12} /> New Project
          </button>
        </div>
        <div className="flex-1 overflow-auto scrollbar-thin p-1.5 space-y-0.5">
          {projects.length === 0 && (
            <p className="text-[11px] text-muted-foreground px-2 py-3 text-center">No projects yet</p>
          )}
          {projects.map((p) => (
            <div key={p.id} className="group relative">
              <button
                onClick={() => selectProject(p)}
                className={`w-full text-left px-2.5 py-2 rounded-md text-xs transition-colors ${
                  selectedId === p.id ? "bg-accent" : "hover:bg-accent/50"
                }`}
              >
                <p className="font-medium truncate">{p.title}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{p.language}</p>
              </button>
              <button
                onClick={() => deleteProject(p.id)}
                className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-destructive/10 transition-opacity"
              >
                <Trash2 size={10} className="text-muted-foreground" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Main editor area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 py-2 border-b shrink-0">
          <div className="flex items-center gap-3">
            {selectedId ? (
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-sm font-semibold bg-transparent outline-none"
                placeholder="Project name"
              />
            ) : (
              <span className="text-sm font-semibold">Code Lab</span>
            )}
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent text-muted-foreground font-mono">Python</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setAiOpen(!aiOpen)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs transition-colors ${
                aiOpen ? "bg-primary text-primary-foreground" : "border hover:bg-accent"
              }`}
            >
              <Sparkles size={12} />
              AI
            </button>
            {selectedId && (
              <button
                onClick={saveProject}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs hover:bg-accent transition-colors"
              >
                <Save size={12} /> {saving ? "Saving…" : "Save"}
              </button>
            )}
            <button
              onClick={runCode}
              disabled={!selectedId || running}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {running ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} />}
              {running ? "Running…" : "Run"}
            </button>
          </div>
        </div>

        {/* Editor + Output */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 min-h-0">
            {selectedId ? (
              <Editor
                height="100%"
                language="python"
                theme="vs-dark"
                value={code}
                onChange={(v) => setCode(v ?? "")}
                options={{
                  minimap: { enabled: false },
                  fontSize: 13,
                  lineNumbers: "on",
                  scrollBeyondLastLine: false,
                  wordWrap: "on",
                  padding: { top: 12 },
                  automaticLayout: true,
                  tabSize: 4,
                  renderLineHighlight: "line",
                  cursorBlinking: "smooth",
                }}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                Select or create a project to start coding
              </div>
            )}
          </div>

          {/* Output console */}
          <div className="h-36 border-t flex flex-col shrink-0">
            <div className="flex items-center gap-1.5 px-4 py-1.5 border-b bg-muted/30 shrink-0">
              <Terminal size={12} className="text-muted-foreground" />
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Output</span>
            </div>
            <pre className="flex-1 p-3 font-mono text-xs text-foreground/80 overflow-auto scrollbar-thin bg-muted/10 leading-5">
              {output}
            </pre>
          </div>
        </div>
      </div>

      {/* AI Panel */}
      {aiOpen && (
        <div className="w-80 border-l flex flex-col shrink-0 bg-background">
          <div className="flex items-center justify-between px-3 py-2 border-b shrink-0">
            <div className="flex items-center gap-1.5">
              <Sparkles size={13} className="text-primary" />
              <span className="text-xs font-medium">Code AI Assistant</span>
            </div>
            <button onClick={() => setAiOpen(false)} className="p-1 rounded hover:bg-accent transition-colors">
              <X size={13} className="text-muted-foreground" />
            </button>
          </div>

          {/* AI Actions */}
          <div className="px-3 py-2.5 border-b space-y-1.5 shrink-0">
            {AI_ACTIONS.map((action) => (
              <button
                key={action.key}
                onClick={() => runAIAction(action.key)}
                disabled={!code.trim() || aiLoading}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-left hover:bg-accent/50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                  <action.icon size={12} className="text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium">{action.label}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{action.description}</p>
                </div>
              </button>
            ))}
          </div>

          {/* AI Messages */}
          <div ref={aiScrollRef} className="flex-1 overflow-auto scrollbar-thin p-3 space-y-3">
            {aiMessages.length === 0 && (
              <p className="text-[11px] text-muted-foreground text-center py-8">
                Click an action above to get AI help with your code.
              </p>
            )}
            {aiMessages.map((msg, i) => (
              <div key={i} className={`text-xs leading-relaxed ${msg.role === "assistant" ? "text-foreground/90" : "text-muted-foreground"}`}>
                {msg.role === "user" ? (
                  <p className="text-[10px] text-primary font-medium mb-1">{msg.content.split("\n")[0]}</p>
                ) : (
                  <div className="prose prose-xs prose-invert max-w-none">
                    <pre className="whitespace-pre-wrap text-xs">{msg.content}</pre>
                  </div>
                )}
              </div>
            ))}
            {aiLoading && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Loader2 size={12} className="animate-spin" />
                Analyzing code…
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
