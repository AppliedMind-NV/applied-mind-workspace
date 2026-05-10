import { useState, useEffect, useCallback } from "react";
import { Outlet } from "react-router-dom";
import { AppSidebar } from "@/components/AppSidebar";
import { AIPanel } from "@/components/AIPanel";
import { NoteProvider } from "@/contexts/NoteContext";
import { PanelRight, PanelRightClose } from "lucide-react";

export function AppLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [aiPanelOpen, setAiPanelOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setAiPanelOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <NoteProvider>
      <div className="flex h-screen w-full overflow-hidden bg-background">
        <AppSidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />

        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <header className="h-12 flex items-center justify-between border-b border-border/50 px-4 shrink-0 bg-sidebar">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-1.5 rounded-md hover:bg-accent text-muted-foreground transition-colors"
              aria-label="Toggle sidebar"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>

            <button
              onClick={() => setAiPanelOpen(!aiPanelOpen)}
              className="flex items-center gap-1.5 p-1.5 rounded-md hover:bg-accent text-muted-foreground transition-colors"
              aria-label="Toggle AI panel"
              title="Toggle AI panel (Ctrl+K)"
            >
              {aiPanelOpen ? <PanelRightClose size={16} /> : <PanelRight size={16} />}
              <kbd className="hidden sm:inline text-[9px] px-1 py-0.5 rounded border bg-muted text-muted-foreground font-mono">⌘K</kbd>
            </button>
          </header>

          <div className="flex-1 overflow-auto scrollbar-thin">
            <Outlet />
          </div>
        </main>

        {aiPanelOpen && <AIPanel onClose={() => setAiPanelOpen(false)} />}
      </div>
    </NoteProvider>
  );
}
