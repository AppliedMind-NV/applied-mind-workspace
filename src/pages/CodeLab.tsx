import { Play, Terminal, Plus, Save, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface CodeProject {
  id: string;
  title: string;
  code: string;
  language: string;
}

export default function CodeLab() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<CodeProject[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [title, setTitle] = useState("");
  const [output, setOutput] = useState("▸ Click Run to execute code");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
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
    fetch();
  }, [user]);

  const selectProject = (p: CodeProject) => {
    setSelectedId(p.id);
    setCode(p.code);
    setTitle(p.title);
    setOutput("▸ Click Run to execute code");
  };

  const createProject = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("code_projects")
      .insert({ user_id: user.id, title: "Untitled Project", code: "# Write your code here\n", language: "python" })
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
    await supabase
      .from("code_projects")
      .update({ title, code })
      .eq("id", selectedId);
    setProjects((prev) =>
      prev.map((p) => (p.id === selectedId ? { ...p, title, code } : p))
    );
    setSaving(false);
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

  if (loading) {
    return <div className="flex items-center justify-center h-full text-sm text-muted-foreground">Loading projects…</div>;
  }

  return (
    <div className="flex h-full animate-fade-in">
      {/* Sidebar */}
      <div className="w-52 border-r flex flex-col shrink-0">
        <div className="p-2 border-b">
          <button
            onClick={createProject}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus size={12} />
            New Project
          </button>
        </div>
        <div className="flex-1 overflow-auto scrollbar-thin p-1.5 space-y-0.5">
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

      {/* Main area */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 py-2 border-b">
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
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent text-muted-foreground font-mono">
              Python
            </span>
          </div>
          <div className="flex items-center gap-2">
            {selectedId && (
              <button
                onClick={saveProject}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs hover:bg-accent transition-colors"
              >
                <Save size={12} />
                {saving ? "Saving…" : "Save"}
              </button>
            )}
            <button
              onClick={() => setOutput("▸ Code execution is not yet connected to a sandbox.")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
            >
              <Play size={12} />
              Run
            </button>
          </div>
        </div>

        {/* Editor + Output */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 min-h-0">
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full h-full p-4 font-mono text-sm bg-background resize-none outline-none leading-6 scrollbar-thin"
              spellCheck={false}
              placeholder="Select or create a project to start coding…"
              disabled={!selectedId}
            />
          </div>
          <div className="h-32 border-t">
            <div className="flex items-center gap-1.5 px-4 py-1.5 border-b bg-chrome">
              <Terminal size={12} className="text-muted-foreground" />
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Output</span>
            </div>
            <pre className="p-4 font-mono text-sm text-foreground/80 overflow-auto scrollbar-thin">
              {output}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
