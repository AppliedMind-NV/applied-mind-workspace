import {
  Plus,
  Search,
  FileText,
  Trash2,
  FolderOpen,
  FolderClosed,
  ChevronRight,
  ChevronDown,
  Pencil,
  FolderPlus,
  MoreHorizontal,
  ArrowRightLeft,
  ArrowLeft,
  Upload,
  Sparkles,
  Loader2,
  Code2,
  ExternalLink,
  Mic,
} from "lucide-react";
import StudySounds from "@/components/StudySounds";
import NoteEditor from "@/components/NoteEditor";
import { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNoteContext } from "@/contexts/NoteContext";
import { toast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LectureUpload } from "@/components/LectureUpload";
import { LectureRecorder } from "@/components/LectureRecorder";

interface Folder {
  id: string;
  name: string;
  created_at: string;
}

interface Note {
  id: string;
  title: string;
  content: any;
  updated_at: string;
  folder_id: string | null;
}

export default function Notes() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { setActiveNote, setSelectedText } = useNoteContext();
  const [linkedProjects, setLinkedProjects] = useState<{ id: string; title: string; language: string }[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [editorContent, setEditorContent] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saveTimeout, setSaveTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingFolderName, setEditingFolderName] = useState("");
  const [draggedNoteId, setDraggedNoteId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [showRecorder, setShowRecorder] = useState(false);
  const [generatingFolderId, setGeneratingFolderId] = useState<string | null>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);
  const [pendingDeleteNote, setPendingDeleteNote] = useState<{ id: string; title: string } | null>(null);
  const [pendingDeleteFolder, setPendingDeleteFolder] = useState<{ id: string; name: string; noteCount: number } | null>(null);

  // Fetch folders and notes
  useEffect(() => {
    if (!user) return;
    const fetchAll = async () => {
      const [foldersRes, notesRes] = await Promise.all([
        supabase.from("folders").select("id, name, created_at").order("name"),
        supabase
          .from("notes")
          .select("id, title, content, updated_at, folder_id")
          .order("updated_at", { ascending: false }),
      ]);
      if (foldersRes.data) {
        setFolders(foldersRes.data as Folder[]);
        // Expand all folders by default
        setExpandedFolders(new Set(foldersRes.data.map((f: any) => f.id)));
      }
      if (notesRes.data) {
        setNotes(notesRes.data as Note[]);
        if (!selectedNote && notesRes.data.length > 0) {
          const first = notesRes.data[0] as Note;
          selectNote(first);
        }
      }
      setLoading(false);
    };
    fetchAll();
  }, [user]);

  // Focus rename input
  useEffect(() => {
    if (editingFolderId && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [editingFolderId]);

  // Migrate old { body: string } format to TipTap JSON
  const migrateContent = (content: any): any => {
    if (!content) return { type: "doc", content: [] };
    // Already TipTap JSON
    if (content.type === "doc") return content;
    // Old format: { body: "text" }
    if (typeof content.body === "string" && content.body) {
      return {
        type: "doc",
        content: content.body.split("\n").filter(Boolean).map((line: string) => ({
          type: "paragraph",
          content: [{ type: "text", text: line }],
        })),
      };
    }
    return { type: "doc", content: [] };
  };

  // Extract plain text from TipTap JSON for AI context
  const extractText = (node: any): string => {
    if (!node) return "";
    if (node.text) return node.text;
    if (node.content) return node.content.map(extractText).join(node.type === "doc" ? "\n\n" : "\n");
    return "";
  };

  const selectNote = async (note: Note) => {
    setSelectedNote(note.id);
    setTitle(note.title);
    const migrated = migrateContent(note.content);
    setEditorContent(migrated);
    setActiveNote(note.title, extractText(migrated));
    // Fetch linked code projects
    const { data } = await supabase
      .from("code_projects")
      .select("id, title, language")
      .eq("note_id", note.id);
    setLinkedProjects(data || []);
  };

  const autoSave = useCallback(
    (noteId: string, newTitle: string, newContent: any) => {
      if (saveTimeout) clearTimeout(saveTimeout);
      const timeout = setTimeout(async () => {
        await supabase
          .from("notes")
          .update({ title: newTitle || "Untitled", content: newContent })
          .eq("id", noteId);
        setNotes((prev) =>
          prev.map((n) =>
            n.id === noteId
              ? { ...n, title: newTitle || "Untitled", content: newContent, updated_at: new Date().toISOString() }
              : n
          )
        );
      }, 800);
      setSaveTimeout(timeout);
    },
    [saveTimeout]
  );

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (selectedNote) {
      autoSave(selectedNote, val, editorContent);
      setActiveNote(val, extractText(editorContent));
    }
  };

  const handleEditorUpdate = (json: any) => {
    setEditorContent(json);
    if (selectedNote) {
      autoSave(selectedNote, title, json);
      setActiveNote(title, extractText(json));
    }
  };

  // Folder CRUD
  const createFolder = async () => {
    if (!user) {
      toast({ title: "Please sign in", description: "You must be logged in to create a folder.", variant: "destructive" });
      return;
    }
    try {
      const { data, error } = await supabase
        .from("folders")
        .insert({ user_id: user.id, name: "New Folder" })
        .select("id, name, created_at")
        .single();
      if (error) {
        console.error("Failed to create folder:", error);
        toast({ title: "Failed to create folder", description: error.message, variant: "destructive" });
        return;
      }
      if (data) {
        const folder = data as Folder;
        setFolders((prev) => [...prev, folder].sort((a, b) => a.name.localeCompare(b.name)));
        setExpandedFolders((prev) => new Set([...prev, folder.id]));
        setEditingFolderId(folder.id);
        setEditingFolderName(folder.name);
        toast({ title: "Folder created" });
      }
    } catch (err: any) {
      console.error("Create folder error:", err);
      toast({ title: "Error", description: err.message || "Could not create folder", variant: "destructive" });
    }
  };

  const renameFolder = async (id: string, name: string) => {
    const trimmed = name.trim() || "Untitled Folder";
    await supabase.from("folders").update({ name: trimmed }).eq("id", id);
    setFolders((prev) =>
      prev.map((f) => (f.id === id ? { ...f, name: trimmed } : f)).sort((a, b) => a.name.localeCompare(b.name))
    );
    setEditingFolderId(null);
  };

  const deleteFolder = async (id: string) => {
    // Notes in folder get folder_id set to null (ON DELETE SET NULL)
    await supabase.from("folders").delete().eq("id", id);
    setFolders((prev) => prev.filter((f) => f.id !== id));
    setNotes((prev) => prev.map((n) => (n.folder_id === id ? { ...n, folder_id: null } : n)));
  };

  // Note CRUD
  const createNote = async (folderId: string | null = null) => {
    if (!user) {
      toast({ title: "Please sign in", description: "You must be logged in to create a note.", variant: "destructive" });
      return;
    }
    try {
      const insert: any = {
        user_id: user.id,
        title: "Untitled",
        content: { type: "doc", content: [{ type: "paragraph" }] },
      };
      if (folderId) insert.folder_id = folderId;
      const { data, error } = await supabase
        .from("notes")
        .insert(insert)
        .select("id, title, content, updated_at, folder_id")
        .single();
      if (error) {
        console.error("Failed to create note:", error);
        toast({ title: "Failed to create note", description: error.message, variant: "destructive" });
        return;
      }
      if (data) {
        const note = data as Note;
        setNotes((prev) => [note, ...prev]);
        selectNote(note);
        if (folderId) setExpandedFolders((prev) => new Set([...prev, folderId]));
      }
    } catch (err: any) {
      console.error("Create note error:", err);
      toast({ title: "Error", description: err.message || "Could not create note", variant: "destructive" });
    }
  };

  const deleteNote = async (id: string) => {
    await supabase.from("notes").delete().eq("id", id);
    setNotes((prev) => prev.filter((n) => n.id !== id));
    if (selectedNote === id) {
      setSelectedNote(null);
      setTitle("");
      setEditorContent(null);
    }
  };

  const moveNote = async (noteId: string, folderId: string | null) => {
    await supabase.from("notes").update({ folder_id: folderId }).eq("id", noteId);
    setNotes((prev) => prev.map((n) => (n.id === noteId ? { ...n, folder_id: folderId } : n)));
    if (folderId) setExpandedFolders((prev) => new Set([...prev, folderId]));
  };

  const toggleFolder = (id: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Derived data
  const uncategorizedNotes = notes.filter((n) => !n.folder_id);
  const notesInFolder = (folderId: string) => notes.filter((n) => n.folder_id === folderId);

  const matchesSearch = (note: Note) =>
    !search || note.title.toLowerCase().includes(search.toLowerCase());

  const folderMatchesSearch = (folder: Folder) => {
    if (!search) return true;
    if (folder.name.toLowerCase().includes(search.toLowerCase())) return true;
    return notesInFolder(folder.id).some(matchesSearch);
  };

  const formatTime = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  const handleDragStart = (e: React.DragEvent, noteId: string) => {
    setDraggedNoteId(noteId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", noteId);
  };

  const handleDragEnd = () => {
    setDraggedNoteId(null);
    setDropTargetId(null);
  };

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDropTargetId(targetId);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Only clear if leaving the drop zone entirely
    const related = e.relatedTarget as HTMLElement | null;
    if (!e.currentTarget.contains(related)) {
      setDropTargetId(null);
    }
  };

  const handleDrop = (e: React.DragEvent, folderId: string | null) => {
    e.preventDefault();
    if (draggedNoteId) {
      moveNote(draggedNoteId, folderId);
    }
    setDraggedNoteId(null);
    setDropTargetId(null);
  };

  const NOTE_AI_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/note-ai`;

  const generateFolderFlashcards = async (folderId: string) => {
    if (!user || generatingFolderId) return;
    const folderNotes = notesInFolder(folderId);
    if (folderNotes.length === 0) {
      toast({ title: "No notes", description: "This folder has no notes to generate flashcards from.", variant: "destructive" });
      return;
    }

    setGeneratingFolderId(folderId);
    let totalCards = 0;

    try {
      for (const note of folderNotes) {
        const migrated = migrateContent(note.content);
        const text = extractText(migrated);
        if (text.trim().length < 20) continue;

        const resp = await fetch(NOTE_AI_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            messages: [{ role: "user", content: "Generate flashcards from this note" }],
            action: "flashcards",
            noteContent: text,
            noteTitle: note.title,
          }),
        });

        if (!resp.ok) continue;

        const data = await resp.json();
        let cards: Array<{ front: string; back: string }> = [];
        try {
          const raw = data.content.trim();
          const match = raw.match(/\[[\s\S]*\]/);
          if (match) cards = JSON.parse(match[0]);
        } catch {
          continue;
        }

        if (cards.length > 0) {
          const inserts = cards.map((c) => ({
            user_id: user.id,
            front: c.front,
            back: c.back,
            note_id: note.id,
          }));
          await supabase.from("flashcards").insert(inserts);
          totalCards += cards.length;
        }
      }

      if (totalCards > 0) {
        toast({ title: "Flashcards generated!", description: `${totalCards} flashcards created from ${folderNotes.length} note${folderNotes.length > 1 ? "s" : ""}.` });
      } else {
        toast({ title: "No flashcards", description: "Notes didn't have enough content to generate flashcards.", variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "Generation failed", description: err.message, variant: "destructive" });
    } finally {
      setGeneratingFolderId(null);
    }
  };

  const NoteItem = ({ note }: { note: Note }) => (
    <div
      className={`group relative ${draggedNoteId === note.id ? "opacity-40" : ""}`}
      draggable
      onDragStart={(e) => handleDragStart(e, note.id)}
      onDragEnd={handleDragEnd}
    >
      <button
        onClick={() => selectNote(note)}
        className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
          selectedNote === note.id
            ? "bg-accent text-foreground"
            : "hover:bg-accent/50 text-foreground"
        }`}
      >
        <div className="flex items-start gap-2">
          <FileText size={13} className="text-muted-foreground mt-0.5 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate">{note.title}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{formatTime(note.updated_at)}</p>
          </div>
        </div>
      </button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-accent transition-opacity">
            <MoreHorizontal size={12} className="text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          {folders.length > 0 && (
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="text-xs">
                <ArrowRightLeft size={12} className="mr-2" />
                Move to…
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="w-40">
                {note.folder_id && (
                  <DropdownMenuItem className="text-xs" onClick={() => moveNote(note.id, null)}>
                    Uncategorized
                  </DropdownMenuItem>
                )}
                {folders
                  .filter((f) => f.id !== note.folder_id)
                  .map((f) => (
                    <DropdownMenuItem key={f.id} className="text-xs" onClick={() => moveNote(note.id, f.id)}>
                      {f.name}
                    </DropdownMenuItem>
                  ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          )}
          <DropdownMenuItem className="text-xs text-destructive" onClick={() => deleteNote(note.id)}>
            <Trash2 size={12} className="mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
        Loading notes…
      </div>
    );
  }

  return (
    <div className="flex h-full animate-fade-in">
      {/* Sidebar */}
      <div className="w-64 border-r flex flex-col shrink-0">
        <div className="p-3 border-b space-y-2">
          <Link
            to="/"
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-1"
          >
            <ArrowLeft size={12} />
            Back to Dashboard
          </Link>
          <div className="flex gap-1.5">
            <button
              onClick={() => createNote(null)}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
            >
              <Plus size={13} />
              New Note
            </button>
            <button
              onClick={() => setShowUpload(true)}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-md border text-xs font-medium hover:bg-accent transition-colors"
              title="Import Lecture"
            >
              <Upload size={13} />
            </button>
            <button
              onClick={() => setShowRecorder(true)}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-md border text-xs font-medium hover:bg-accent transition-colors"
              title="Record Lecture"
            >
              <Mic size={13} />
            </button>
            <button
              onClick={createFolder}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-md border text-xs font-medium hover:bg-accent transition-colors"
              title="New Folder"
            >
              <FolderPlus size={13} />
            </button>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md border bg-background">
            <Search size={13} className="text-muted-foreground" />
            <input
              type="text"
              placeholder="Search…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 text-xs bg-transparent outline-none placeholder:text-muted-foreground"
            />
          </div>
        </div>

        <div className="flex-1 overflow-auto scrollbar-thin p-2 space-y-1">
          {/* Folders */}
          {folders.filter(folderMatchesSearch).map((folder) => {
            const isExpanded = expandedFolders.has(folder.id);
            const folderNotes = notesInFolder(folder.id).filter(matchesSearch);
            const isEditing = editingFolderId === folder.id;

            return (
              <div key={folder.id}>
              <div
                className={`group flex items-center gap-1 rounded-md transition-colors pr-1 ${
                  dropTargetId === folder.id
                    ? "bg-primary/10 ring-1 ring-primary/30"
                    : "hover:bg-accent/50"
                }`}
                onDragOver={(e) => handleDragOver(e, folder.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, folder.id)}
              >
                  <button
                    onClick={() => toggleFolder(folder.id)}
                    className="flex items-center gap-1.5 flex-1 px-2 py-1.5 min-w-0"
                  >
                    {isExpanded ? (
                      <ChevronDown size={12} className="text-muted-foreground shrink-0" />
                    ) : (
                      <ChevronRight size={12} className="text-muted-foreground shrink-0" />
                    )}
                    {isExpanded ? (
                      <FolderOpen size={14} className="text-primary shrink-0" />
                    ) : (
                      <FolderClosed size={14} className="text-muted-foreground shrink-0" />
                    )}
                    {isEditing ? (
                      <input
                        ref={renameInputRef}
                        value={editingFolderName}
                        onChange={(e) => setEditingFolderName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") renameFolder(folder.id, editingFolderName);
                          if (e.key === "Escape") setEditingFolderId(null);
                        }}
                        onBlur={() => renameFolder(folder.id, editingFolderName)}
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs font-medium bg-transparent outline-none border-b border-primary flex-1 min-w-0"
                      />
                    ) : (
                      <span className="text-xs font-medium truncate">{folder.name}</span>
                    )}
                    <span className="text-[10px] text-muted-foreground ml-auto tabular-nums shrink-0">
                      {notesInFolder(folder.id).length}
                    </span>
                  </button>

                  {!isEditing && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-accent transition-opacity">
                          <MoreHorizontal size={12} className="text-muted-foreground" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem
                          className="text-xs"
                          onClick={() => createNote(folder.id)}
                        >
                          <Plus size={12} className="mr-2" />
                          New Note
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-xs"
                          onClick={() => {
                            setEditingFolderId(folder.id);
                            setEditingFolderName(folder.name);
                          }}
                        >
                          <Pencil size={12} className="mr-2" />
                          Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-xs"
                          disabled={generatingFolderId === folder.id}
                          onClick={() => generateFolderFlashcards(folder.id)}
                        >
                          {generatingFolderId === folder.id ? (
                            <Loader2 size={12} className="mr-2 animate-spin" />
                          ) : (
                            <Sparkles size={12} className="mr-2" />
                          )}
                          {generatingFolderId === folder.id ? "Generating…" : "Generate Flashcards"}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-xs text-destructive"
                          onClick={() => deleteFolder(folder.id)}
                        >
                          <Trash2 size={12} className="mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>

                {/* Notes in folder */}
                {isExpanded && (
                  <div className="ml-5 mt-0.5 space-y-0.5">
                    {folderNotes.map((note) => (
                      <NoteItem key={note.id} note={note} />
                    ))}
                    {folderNotes.length === 0 && !search && (
                      <p className="text-[10px] text-muted-foreground px-3 py-1.5">Empty folder</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Uncategorized notes */}
          {uncategorizedNotes.filter(matchesSearch).length > 0 && (
            <div
              className={`mt-2 rounded-md transition-colors ${
                dropTargetId === "uncategorized"
                  ? "bg-primary/10 ring-1 ring-primary/30"
                  : ""
              }`}
              onDragOver={(e) => handleDragOver(e, "uncategorized")}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, null)}
            >
              {folders.length > 0 && (
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider px-2 py-1 font-medium">
                  Uncategorized
                </p>
              )}
              <div className="space-y-0.5">
                {uncategorizedNotes.filter(matchesSearch).map((note) => (
                  <NoteItem key={note.id} note={note} />
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {folders.length === 0 && notes.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-8">
              Create a folder or note to get started
            </p>
          )}
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 flex flex-col min-w-0">
        {selectedNote ? (
          <div className="flex-1 flex flex-col p-8 max-w-3xl overflow-hidden">
            <input
              type="text"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              className="w-full text-2xl font-semibold bg-transparent outline-none mb-4 placeholder:text-muted-foreground shrink-0"
              placeholder="Untitled"
            />
            {/* Linked code projects */}
            {linkedProjects.length > 0 && (
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <Code2 size={12} className="text-muted-foreground shrink-0" />
                {linkedProjects.map((proj) => (
                  <button
                    key={proj.id}
                    onClick={() => navigate("/codelab")}
                    className="flex items-center gap-1 px-2 py-1 rounded-md bg-accent text-xs hover:bg-accent/80 transition-colors"
                  >
                    <span className="font-medium">{proj.title}</span>
                    <span className="text-[10px] text-muted-foreground">{proj.language}</span>
                    <ExternalLink size={9} className="text-muted-foreground" />
                  </button>
                ))}
              </div>
            )}
            <div className="flex-1 min-h-0">
              <NoteEditor
                content={editorContent}
                onUpdate={handleEditorUpdate}
                onSelectionChange={setSelectedText}
              />
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

        {/* Compact study sounds at bottom of editor */}
        <div className="border-t px-4 py-3 flex justify-center shrink-0">
          <StudySounds compact />
        </div>
      </div>
      <LectureUpload
        open={showUpload}
        onOpenChange={setShowUpload}
        folderId={null}
        onNoteCreated={async (noteId) => {
          // Reload notes and select the new one
          const { data } = await supabase
            .from("notes")
            .select("*")
            .eq("user_id", user!.id)
            .order("updated_at", { ascending: false });
          if (data) {
            setNotes(data);
            const created = data.find((n: any) => n.id === noteId);
            if (created) selectNote(created);
          }
        }}
      />
      <LectureRecorder
        open={showRecorder}
        onOpenChange={setShowRecorder}
        folderId={null}
        onNoteCreated={async (noteId) => {
          const { data } = await supabase
            .from("notes")
            .select("*")
            .eq("user_id", user!.id)
            .order("updated_at", { ascending: false });
          if (data) {
            setNotes(data);
            const created = data.find((n: any) => n.id === noteId);
            if (created) selectNote(created);
          }
        }}
      />
    </div>
  );
}
