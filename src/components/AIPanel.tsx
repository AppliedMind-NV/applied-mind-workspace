import { X, Send } from "lucide-react";
import { useState } from "react";

interface AIPanelProps {
  onClose: () => void;
}

export function AIPanel({ onClose }: AIPanelProps) {
  const [input, setInput] = useState("");

  return (
    <aside className="w-80 border-l bg-sidebar flex flex-col shrink-0 animate-slide-in-right">
      <div className="h-12 flex items-center justify-between px-4 border-b">
        <span className="text-sm font-medium text-sidebar-foreground">AI Assistant</span>
        <button
          onClick={onClose}
          className="p-1 rounded-md hover:bg-accent text-muted-foreground"
        >
          <X size={14} />
        </button>
      </div>

      <div className="flex-1 overflow-auto scrollbar-thin p-4">
        <div className="text-center py-12">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <span className="text-primary text-lg">✦</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Select text in your notes or ask a question to get started.
          </p>
          <div className="mt-4 space-y-2">
            {["Summarize note", "Generate flashcards", "Explain concept", "Practice questions"].map(
              (action) => (
                <button
                  key={action}
                  className="w-full text-left text-xs px-3 py-2 rounded-md border hover:bg-accent transition-colors text-foreground"
                >
                  {action}
                </button>
              )
            )}
          </div>
        </div>
      </div>

      <div className="border-t p-3">
        <div className="flex items-center gap-2 bg-background rounded-lg border px-3 py-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything..."
            className="flex-1 text-sm bg-transparent outline-none placeholder:text-muted-foreground"
          />
          <button className="text-muted-foreground hover:text-primary transition-colors">
            <Send size={14} />
          </button>
        </div>
        <p className="text-[10px] text-muted-foreground mt-2 text-center">⌘K to open anywhere</p>
      </div>
    </aside>
  );
}
