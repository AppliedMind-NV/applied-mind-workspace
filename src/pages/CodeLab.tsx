import { Play, Terminal, Plus, Save, Trash2, Sparkles, RotateCcw, Loader2, Code2, Layers, BookOpen, Link2, Unlink } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import Editor from "@monaco-editor/react";
import CodeAIPanel, { CodeAIPanelRef } from "@/components/codelab/CodeAIPanel";
import PracticeBuilds from "@/components/codelab/PracticeBuilds";

interface CodeProject {
  id: string;
  title: string;
  code: string;
  language: string;
  note_id: string | null;
}

interface NoteOption {
  id: string;
  title: string;
}

const LANGUAGES = [
  { value: "python", label: "Python", starter: "# Write your Python code here\nprint('Hello, world!')\n" },
  { value: "javascript", label: "JavaScript", starter: "// Write your JavaScript code here\nconsole.log('Hello, world!');\n" },
];

const NOTE_AI_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/note-ai`;

type SidebarTab = "projects" | "builds";

export default function CodeLab() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<CodeProject[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [title, setTitle] = useState("");
  const [language, setLanguage] = useState("python");
  const [output, setOutput] = useState("▸ Click Run to execute code.\n▸ Sandboxed execution is coming soon — output is simulated for now.");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>("projects");
  const [noteId, setNoteId] = useState<string | null>(null);
  const [notes, setNotes] = useState<NoteOption[]>([]);
  const [showNoteLinkMenu, setShowNoteLinkMenu] = useState(false);
  const aiRef = useRef<CodeAIPanelRef>(null);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const [projRes, notesRes] = await Promise.all([
        supabase.from("code_projects").select("id, title, code, language, note_id").order("updated_at", { ascending: false }),
        supabase.from("notes").select("id, title").order("updated_at", { ascending: false }),
      ]);
      if (projRes.data) {
        setProjects(projRes.data);
        if (projRes.data.length > 0) {
          setSelectedId(projRes.data[0].id);
          setCode(projRes.data[0].code);
          setTitle(projRes.data[0].title);
          setLanguage(projRes.data[0].language || "python");
          setNoteId(projRes.data[0].note_id);
        }
      }
      if (notesRes.data) setNotes(notesRes.data);
      setLoading(false);
    };
    load();
  }, [user]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        saveProject();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selectedId, title, code]);

  // Autosave
  const triggerAutosave = useCallback((id: string, newCode: string) => {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(async () => {
      await supabase.from("code_projects").update({ code: newCode }).eq("id", id);
    }, 2000);
  }, []);

  const handleCodeChange = (value: string | undefined) => {
    const v = value ?? "";
    setCode(v);
    if (selectedId) triggerAutosave(selectedId, v);
  };

  const selectProject = (p: CodeProject) => {
    setSelectedId(p.id);
    setCode(p.code);
    setTitle(p.title);
    setLanguage(p.language || "python");
    setNoteId(p.note_id);
    setOutput("▸ Click Run to execute code.");
  };

  const createProject = async (lang?: string, initialCode?: string, initialTitle?: string) => {
    if (!user) return;
    const selectedLang = lang || language;
    const starter = initialCode || LANGUAGES.find((l) => l.value === selectedLang)?.starter || "";
    const { data } = await supabase
      .from("code_projects")
      .insert({
        user_id: user.id,
        title: initialTitle || "Untitled Project",
        code: starter,
        language: selectedLang,
      })
      .select("id, title, code, language")
      .single();
    if (data) {
      setProjects((prev) => [data, ...prev]);
      selectProject(data);
      setSidebarTab("projects");
    }
  };

  const saveProject = async () => {
    if (!selectedId) return;
    setSaving(true);
    await supabase.from("code_projects").update({ title, code, language }).eq("id", selectedId);
    setProjects((prev) => prev.map((p) => (p.id === selectedId ? { ...p, title, code, language } : p)));
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
    const lines = code.split("\n");
    const outputLines: string[] = [];
    let hasOutput = false;

    for (const line of lines) {
      // Python print
      const pyPrint = line.match(/^\s*print\s*\(\s*(?:f?(['"])(.*?)\1|(.*?))\s*\)\s*$/);
      // JS console.log
      const jsLog = line.match(/^\s*console\.log\s*\(\s*(['"])(.*?)\1\s*\)\s*;?\s*$/);

      if (pyPrint) {
        outputLines.push(pyPrint[2] || pyPrint[3] || "");
        hasOutput = true;
      } else if (jsLog) {
        outputLines.push(jsLog[2]);
        hasOutput = true;
      }
    }

    setTimeout(() => {
      if (hasOutput) {
        setOutput(outputLines.join("\n") + "\n\n▸ Process finished (simulated).");
      } else {
        setOutput("▸ Code executed (simulated). No output detected.\n▸ Full sandboxed execution coming soon.");
      }
      setRunning(false);
    }, 500);
  };

  const clearOutput = () => setOutput("▸ Ready.");

  // Practice Builds callbacks
  const loadBuildCode = (buildCode: string, buildTitle: string, buildLang: string) => {
    if (selectedId) {
      setCode(buildCode);
      setTitle(buildTitle);
      setLanguage(buildLang);
    } else {
      createProject(buildLang, buildCode, buildTitle);
    }
  };

  const askAIFromBuild = (prompt: string) => {
    setAiOpen(true);
    setTimeout(() => aiRef.current?.sendMessage(prompt), 100);
  };

  // Generate flashcards from code
  const generateFlashcardsFromCode = async () => {
    if (!code.trim() || !user) return;
    try {
      const resp = await fetch(NOTE_AI_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [{ role: "user", content: "Generate flashcards from this code" }],
          action: "flashcards",
          noteContent: code,
          noteTitle: title || "Code Lab",
        }),
      });
      if (!resp.ok) throw new Error("Failed to generate");
      const data = await resp.json();
      const match = data.content?.match(/\[[\s\S]*\]/);
      if (!match) throw new Error("No flashcards generated");
      const parsed = JSON.parse(match[0]);
      const inserts = parsed.map((c: any) => ({ user_id: user.id, front: c.front, back: c.back }));
      await supabase.from("flashcards").insert(inserts);
      toast({ title: "Flashcards created!", description: `${parsed.length} flashcards from your code.` });
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    }
  };

  const generatePracticeFromCode = async () => {
    if (!code.trim() || !user) return;
    try {
      const resp = await fetch(NOTE_AI_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [{ role: "user", content: "Generate practice questions from this code" }],
          action: "practice_json",
          noteContent: code,
          noteTitle: title || "Code Lab",
        }),
      });
      if (!resp.ok) throw new Error("Failed to generate");
      const data = await resp.json();
      const match = data.content?.match(/\[[\s\S]*\]/);
      if (!match) throw new Error("No questions generated");
      const parsed = JSON.parse(match[0]);
      const inserts = parsed.map((q: any) => ({ user_id: user.id, question: q.question, answer: q.answer }));
      await supabase.from("practice_questions").insert(inserts);
      toast({ title: "Questions created!", description: `${parsed.length} practice questions from your code.` });
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-full text-sm text-muted-foreground">Loading Code Lab…</div>;
  }

  return (
    <div className="flex h-full animate-fade-in">
      {/* Left sidebar */}
      <div className="w-56 border-r flex flex-col shrink-0">
        {/* Sidebar tabs */}
        <div className="flex items-center border-b shrink-0">
          <button
            onClick={() => setSidebarTab("projects")}
            className={`flex-1 py-2 text-[10px] font-medium uppercase tracking-wider text-center transition-colors ${
              sidebarTab === "projects" ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Projects
          </button>
          <button
            onClick={() => setSidebarTab("builds")}
            className={`flex-1 py-2 text-[10px] font-medium uppercase tracking-wider text-center transition-colors ${
              sidebarTab === "builds" ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Practice Builds
          </button>
        </div>

        {sidebarTab === "projects" ? (
          <>
            <div className="p-2 border-b shrink-0">
              <button
                onClick={() => createProject()}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
              >
                <Plus size={12} /> New Project
              </button>
            </div>
            <div className="flex-1 overflow-auto scrollbar-thin p-1.5 space-y-0.5">
              {projects.length === 0 && (
                <p className="text-[11px] text-muted-foreground px-2 py-4 text-center">
                  No projects yet. Create one or try a Practice Build!
                </p>
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
          </>
        ) : (
          <div className="flex-1 overflow-auto scrollbar-thin">
            <PracticeBuilds
              onLoadCode={loadBuildCode}
              onAskAI={askAIFromBuild}
              aiLoading={false}
            />
          </div>
        )}
      </div>

      {/* Main editor */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-3 py-2 border-b shrink-0 gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {selectedId ? (
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-sm font-semibold bg-transparent outline-none min-w-0"
                placeholder="Project name"
              />
            ) : (
              <span className="text-sm font-semibold">Code Lab</span>
            )}
            {/* Language selector */}
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="text-[10px] px-1.5 py-1 rounded bg-accent text-foreground font-mono outline-none cursor-pointer border-none"
            >
              {LANGUAGES.map((l) => (
                <option key={l.value} value={l.value}>{l.label}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setAiOpen(!aiOpen)}
              className={`flex items-center gap-1 px-2 py-1.5 rounded-md text-xs transition-colors ${
                aiOpen ? "bg-primary text-primary-foreground" : "border hover:bg-accent"
              }`}
            >
              <Sparkles size={11} /> Tutor
            </button>
            <button
              onClick={clearOutput}
              className="flex items-center gap-1 px-2 py-1.5 rounded-md border text-xs hover:bg-accent transition-colors"
              title="Clear output"
            >
              <RotateCcw size={11} />
            </button>
            {selectedId && (
              <button
                onClick={saveProject}
                className="flex items-center gap-1 px-2 py-1.5 rounded-md border text-xs hover:bg-accent transition-colors"
              >
                <Save size={11} /> {saving ? "…" : "Save"}
              </button>
            )}
            <button
              onClick={runCode}
              disabled={!selectedId || running}
              className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {running ? <Loader2 size={11} className="animate-spin" /> : <Play size={11} />}
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
                language={language}
                theme="vs-dark"
                value={code}
                onChange={handleCodeChange}
                options={{
                  minimap: { enabled: false },
                  fontSize: 13,
                  lineNumbers: "on",
                  scrollBeyondLastLine: false,
                  wordWrap: "on",
                  padding: { top: 12 },
                  automaticLayout: true,
                  tabSize: language === "python" ? 4 : 2,
                  renderLineHighlight: "line",
                  cursorBlinking: "smooth",
                  bracketPairColorization: { enabled: true },
                }}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center px-8">
                <Code2 size={32} className="text-muted-foreground mb-3" />
                <p className="text-sm font-medium mb-1">Welcome to Code Lab</p>
                <p className="text-xs text-muted-foreground mb-4 max-w-xs">
                  Create a new project or try a Practice Build to start coding with AI guidance.
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => createProject()}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
                  >
                    <Plus size={12} /> New Project
                  </button>
                  <button
                    onClick={() => setSidebarTab("builds")}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-md border text-xs font-medium hover:bg-accent transition-colors"
                  >
                    <BookOpen size={12} /> Practice Builds
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Output console */}
          <div className="h-36 border-t flex flex-col shrink-0">
            <div className="flex items-center justify-between px-3 py-1 border-b bg-muted/20 shrink-0">
              <div className="flex items-center gap-1.5">
                <Terminal size={11} className="text-muted-foreground" />
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Output</span>
              </div>
              <button onClick={clearOutput} className="text-[10px] text-muted-foreground hover:text-foreground transition-colors">
                Clear
              </button>
            </div>
            <pre className="flex-1 p-3 font-mono text-[11px] text-foreground/80 overflow-auto scrollbar-thin bg-muted/5 leading-5">
              {output}
            </pre>
          </div>
        </div>
      </div>

      {/* AI Coding Tutor Panel */}
      {aiOpen && (
        <CodeAIPanel
          ref={aiRef}
          code={code}
          title={title}
          language={language}
          onClose={() => setAiOpen(false)}
          onGenerateFlashcards={generateFlashcardsFromCode}
          onGeneratePractice={generatePracticeFromCode}
        />
      )}
    </div>
  );
}
