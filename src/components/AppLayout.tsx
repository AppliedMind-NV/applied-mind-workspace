import { useState, useEffect, useCallback } from "react";
import { Outlet } from "react-router-dom";
import { AppSidebar } from "@/components/AppSidebar";
import { AIPanel } from "@/components/AIPanel";
import { NoteProvider } from "@/contexts/NoteContext";
import { PanelRight, PanelRightClose } from "lucide-react";

export function AppLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [aiPanelOpen, setAiPanelOpen] = useState(false);

  return (
    <NoteProvider>
      <div className="flex h-screen w-full overflow-hidden bg-background">
        <AppSidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />

        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <header className="h-12 flex items-center justify-between border-b px-4 shrink-0">
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
              className="p-1.5 rounded-md hover:bg-accent text-muted-foreground transition-colors"
              aria-label="Toggle AI panel"
            >
              {aiPanelOpen ? <PanelRightClose size={16} /> : <PanelRight size={16} />}
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
