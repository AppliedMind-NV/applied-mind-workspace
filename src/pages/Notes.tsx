import { Plus, Search, FileText } from "lucide-react";
import { useState } from "react";

const mockNotes = [
  { id: "1", title: "Binary Search Trees", preview: "A BST is a node-based binary tree data structure...", updated: "2h ago" },
  { id: "2", title: "React Server Components", preview: "RSCs allow rendering components on the server...", updated: "Yesterday" },
  { id: "3", title: "TCP/IP Protocol Stack", preview: "The TCP/IP model consists of four layers...", updated: "2 days ago" },
  { id: "4", title: "Dynamic Programming Patterns", preview: "Common patterns include memoization and tabulation...", updated: "3 days ago" },
];

export default function Notes() {
  const [selectedNote, setSelectedNote] = useState(mockNotes[0]?.id);

  return (
    <div className="flex h-full animate-fade-in">
      {/* Notes List */}
      <div className="w-64 border-r flex flex-col shrink-0">
        <div className="p-3 border-b space-y-2">
          <button className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
            <Plus size={14} />
            New Note
          </button>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md border bg-background">
            <Search size={13} className="text-muted-foreground" />
            <input
              type="text"
              placeholder="Search notes..."
              className="flex-1 text-xs bg-transparent outline-none placeholder:text-muted-foreground"
            />
          </div>
        </div>
        <div className="flex-1 overflow-auto scrollbar-thin p-2 space-y-0.5">
          {mockNotes.map((note) => (
            <button
              key={note.id}
              onClick={() => setSelectedNote(note.id)}
              className={`w-full text-left px-3 py-2.5 rounded-md transition-colors ${
                selectedNote === note.id
                  ? "bg-accent text-foreground"
                  : "hover:bg-accent/50 text-foreground"
              }`}
            >
              <p className="text-sm font-medium truncate">{note.title}</p>
              <p className="text-xs text-muted-foreground truncate mt-0.5">{note.preview}</p>
              <p className="text-[10px] text-muted-foreground mt-1">{note.updated}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 flex flex-col">
        {selectedNote ? (
          <div className="flex-1 p-8 max-w-3xl">
            <input
              type="text"
              defaultValue={mockNotes.find((n) => n.id === selectedNote)?.title}
              className="w-full text-2xl font-semibold bg-transparent outline-none mb-4 placeholder:text-muted-foreground"
              placeholder="Untitled"
            />
            <div className="prose-body text-base leading-relaxed text-foreground/90">
              <p>
                {mockNotes.find((n) => n.id === selectedNote)?.preview}
              </p>
              <p className="text-muted-foreground mt-4 text-sm">
                Start typing to continue your notes. Use ⌘K to invoke the AI assistant.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <FileText size={32} className="text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Select a note or create a new one</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
