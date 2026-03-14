import { Plus, Search, FileText, Trash2 } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Note {
  id: string;
  title: string;
  content: { body: string } | null;
  updated_at: string;
}

export default function Notes() {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saveTimeout, setSaveTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);

  // Fetch notes
  useEffect(() => {
    if (!user) return;
    const fetchNotes = async () => {
      const { data } = await supabase
        .from("notes")
        .select("id, title, content, updated_at")
        .order("updated_at", { ascending: false });
      if (data) {
        setNotes(data as Note[]);
        if (!selectedNote && data.length > 0) {
          setSelectedNote(data[0].id);
          setTitle(data[0].title);
          setBody((data[0].content as any)?.body ?? "");
        }
      }
      setLoading(false);
    };
    fetchNotes();
  }, [user]);

  // When selecting a note
  const selectNote = (note: Note) => {
    setSelectedNote(note.id);
    setTitle(note.title);
    setBody((note.content as any)?.body ?? "");
  };

  // Auto-save with debounce
  const autoSave = useCallback(
    (noteId: string, newTitle: string, newBody: string) => {
      if (saveTimeout) clearTimeout(saveTimeout);
      const timeout = setTimeout(async () => {
        await supabase
          .from("notes")
          .update({ title: newTitle || "Untitled", content: { body: newBody } })
          .eq("id", noteId);
        // Update local state
        setNotes((prev) =>
          prev.map((n) =>
            n.id === noteId
              ? { ...n, title: newTitle || "Untitled", content: { body: newBody }, updated_at: new Date().toISOString() }
              : n
          )
        );
      }, 600);
      setSaveTimeout(timeout);
    },
    [saveTimeout]
  );

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (selectedNote) autoSave(selectedNote, val, body);
  };

  const handleBodyChange = (val: string) => {
    setBody(val);
    if (selectedNote) autoSave(selectedNote, title, val);
  };

  // Create note
  const createNote = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("notes")
      .insert({ user_id: user.id, title: "Untitled", content: { body: "" } })
      .select("id, title, content, updated_at")
      .single();
    if (data) {
      const note = data as Note;
      setNotes((prev) => [note, ...prev]);
      selectNote(note);
    }
  };

  // Delete note
  const deleteNote = async (id: string) => {
    await supabase.from("notes").delete().eq("id", id);
    setNotes((prev) => prev.filter((n) => n.id !== id));
    if (selectedNote === id) {
      setSelectedNote(null);
      setTitle("");
      setBody("");
    }
  };

  const filteredNotes = notes.filter((n) =>
    n.title.toLowerCase().includes(search.toLowerCase())
  );

  const formatTime = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  if (loading) {
    return <div className="flex items-center justify-center h-full text-sm text-muted-foreground">Loading notes…</div>;
  }

  return (
    <div className="flex h-full animate-fade-in">
      {/* Notes List */}
      <div className="w-64 border-r flex flex-col shrink-0">
        <div className="p-3 border-b space-y-2">
          <button
            onClick={createNote}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus size={14} />
            New Note
          </button>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md border bg-background">
            <Search size={13} className="text-muted-foreground" />
            <input
              type="text"
              placeholder="Search notes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 text-xs bg-transparent outline-none placeholder:text-muted-foreground"
            />
          </div>
        </div>
        <div className="flex-1 overflow-auto scrollbar-thin p-2 space-y-0.5">
          {filteredNotes.map((note) => (
            <div key={note.id} className="group relative">
              <button
                onClick={() => selectNote(note)}
                className={`w-full text-left px-3 py-2.5 rounded-md transition-colors ${
                  selectedNote === note.id
                    ? "bg-accent text-foreground"
                    : "hover:bg-accent/50 text-foreground"
                }`}
              >
                <p className="text-sm font-medium truncate">{note.title}</p>
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  {(note.content as any)?.body?.slice(0, 60) || "Empty note"}
                </p>
                <p className="text-[10px] text-muted-foreground mt-1">{formatTime(note.updated_at)}</p>
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); deleteNote(note.id); }}
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/10 transition-opacity"
              >
                <Trash2 size={12} className="text-muted-foreground" />
              </button>
            </div>
          ))}
          {filteredNotes.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-8">No notes found</p>
          )}
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 flex flex-col">
        {selectedNote ? (
          <div className="flex-1 p-8 max-w-3xl">
            <input
              type="text"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              className="w-full text-2xl font-semibold bg-transparent outline-none mb-4 placeholder:text-muted-foreground"
              placeholder="Untitled"
            />
            <textarea
              value={body}
              onChange={(e) => handleBodyChange(e.target.value)}
              className="w-full flex-1 min-h-[400px] text-base leading-relaxed text-foreground/90 bg-transparent outline-none resize-none"
              placeholder="Start typing your notes… Use ⌘K to invoke the AI assistant."
            />
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <FileText size={32} className="text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Select a note or create a new one</p>
            </div>
          </div>
        )}

        {/* Compact study sounds at bottom of editor */}
        <div className="border-t px-4 py-3 flex justify-center">
          <StudySounds compact />
        </div>
      </div>
    </div>
  );
}
