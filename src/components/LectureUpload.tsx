import { useState, useRef, useCallback } from "react";
import { Upload, FileText, X, Loader2, Sparkles, CheckCircle2, AlertCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const NOTE_AI_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/note-ai`;
const ACCEPTED_EXTS = ["pdf", "txt", "md", "markdown", "docx", "pptx"];
const ACCEPTED_TYPES = [
  "application/pdf", "text/plain", "text/markdown", "text/x-markdown",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
];
const MAX_SIZE = 10 * 1024 * 1024;
const MAX_FILES = 10;

interface LectureUploadProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folderId: string | null;
  onNoteCreated: (noteId: string) => void;
}

type FileStatus = "queued" | "reading" | "generating" | "saving" | "done" | "error";

interface QueuedFile {
  file: File;
  status: FileStatus;
  progress: number;
  error?: string;
  noteId?: string;
}

export function LectureUpload({ open, onOpenChange, folderId, onNoteCreated }: LectureUploadProps) {
  const { user } = useAuth();
  const [files, setFiles] = useState<QueuedFile[]>([]);
  const [processing, setProcessing] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastCreatedId = useRef<string | null>(null);

  const reset = () => {
    setFiles([]);
    setProcessing(false);
    setDragOver(false);
    lastCreatedId.current = null;
  };

  const handleClose = (v: boolean) => {
    if (processing) return; // prevent closing while processing
    if (!v) reset();
    onOpenChange(v);
  };

  const validateFile = (f: File): string | null => {
    const ext = f.name.split(".").pop()?.toLowerCase();
    const ok = ACCEPTED_TYPES.includes(f.type) || ACCEPTED_EXTS.includes(ext || "");
    if (!ok) return "Unsupported type";
    if (f.size > MAX_SIZE) return "Too large (max 10MB)";
    return null;
  };

  const addFiles = useCallback((incoming: FileList | File[]) => {
    const arr = Array.from(incoming);
    const valid: QueuedFile[] = [];
    let skipped = 0;

    for (const f of arr) {
      const err = validateFile(f);
      if (err) {
        skipped++;
        continue;
      }
      valid.push({ file: f, status: "queued", progress: 0 });
    }

    setFiles((prev) => {
      const combined = [...prev, ...valid].slice(0, MAX_FILES);
      if (combined.length < prev.length + valid.length) {
        toast({ title: "Limit reached", description: `Maximum ${MAX_FILES} files at once.` });
      }
      return combined;
    });

    if (skipped > 0) {
      toast({ title: `${skipped} file(s) skipped`, description: "Only PDF, TXT, and Markdown files are supported.", variant: "destructive" });
    }
  }, []);

  const removeFile = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    addFiles(e.dataTransfer.files);
  }, [addFiles]);

  const extractTextFromPdf = async (file: File): Promise<string> => {
    const pdfjsLib = await import("pdfjs-dist");
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const pages: string[] = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      pages.push(content.items.map((item: any) => item.str).join(" "));
    }
    return pages.join("\n\n");
  };

  const extractTextFromDocx = async (file: File): Promise<string> => {
    const mammoth = await import("mammoth");
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
  };

  const extractTextFromPptx = async (file: File): Promise<string> => {
    const JSZip = (await import("jszip")).default;
    const arrayBuffer = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);
    const slideFiles = Object.keys(zip.files)
      .filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name))
      .sort((a, b) => {
        const numA = parseInt(a.match(/slide(\d+)/)?.[1] || "0");
        const numB = parseInt(b.match(/slide(\d+)/)?.[1] || "0");
        return numA - numB;
      });

    const pages: string[] = [];
    for (const slidePath of slideFiles) {
      const xml = await zip.files[slidePath].async("text");
      const textContent = xml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
      if (textContent) pages.push(textContent);
    }
    return pages.join("\n\n");
  };

  const extractText = async (file: File): Promise<string> => {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext === "pdf" || file.type === "application/pdf") {
      return extractTextFromPdf(file);
    }
    if (ext === "docx" || file.type.includes("wordprocessingml")) {
      return extractTextFromDocx(file);
    }
    if (ext === "pptx" || file.type.includes("presentationml")) {
      return extractTextFromPptx(file);
    }
    return file.text();
  };

  const updateFile = (idx: number, patch: Partial<QueuedFile>) => {
    setFiles((prev) => prev.map((f, i) => (i === idx ? { ...f, ...patch } : f)));
  };

  const processOne = async (idx: number, qf: QueuedFile): Promise<string | null> => {
    if (!user) return null;

    try {
      updateFile(idx, { status: "reading", progress: 10 });
      const rawText = await extractText(qf.file);

      if (rawText.trim().length < 50) {
        throw new Error("Not enough text to generate notes.");
      }

      updateFile(idx, { status: "generating", progress: 40 });

      const resp = await fetch(NOTE_AI_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [{ role: "user", content: `Transform this lecture content into structured study notes:\n\n${rawText.slice(0, 60000)}` }],
          action: "generate_notes",
          noteContent: "",
          noteTitle: "",
        }),
      });

      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}));
        throw new Error(data.error || `AI request failed (${resp.status})`);
      }

      updateFile(idx, { progress: 75 });
      const data = await resp.json();
      const raw = data.content?.trim() || "";
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("Failed to parse AI response.");

      let noteContent: any;
      try {
        noteContent = JSON.parse(jsonMatch[0]);
      } catch {
        throw new Error("AI returned invalid JSON.");
      }

      let title = qf.file.name.replace(/\.[^.]+$/, "");
      const firstHeading = noteContent.content?.find((n: any) => n.type === "heading");
      if (firstHeading?.content?.[0]?.text) title = firstHeading.content[0].text;

      updateFile(idx, { status: "saving", progress: 90 });

      const { data: note, error } = await supabase
        .from("notes")
        .insert({ user_id: user.id, title, content: noteContent, folder_id: folderId })
        .select("id")
        .single();

      if (error) throw error;

      updateFile(idx, { status: "done", progress: 100, noteId: note?.id });
      return note?.id || null;
    } catch (err: any) {
      updateFile(idx, { status: "error", error: err.message || "Failed" });
      return null;
    }
  };

  const processAll = async () => {
    if (files.length === 0 || !user) return;
    setProcessing(true);

    let successCount = 0;
    let lastId: string | null = null;

    for (let i = 0; i < files.length; i++) {
      if (files[i].status === "done") continue;
      const id = await processOne(i, files[i]);
      if (id) {
        successCount++;
        lastId = id;
      }
    }

    setProcessing(false);

    if (successCount > 0) {
      toast({
        title: `${successCount} note${successCount > 1 ? "s" : ""} generated!`,
        description: `From ${files.length} uploaded file${files.length > 1 ? "s" : ""}.`,
      });
      if (lastId) {
        lastCreatedId.current = lastId;
      }
    }
  };

  const handleDone = () => {
    const id = lastCreatedId.current;
    handleClose(false);
    if (id) onNoteCreated(id);
  };

  const allDone = files.length > 0 && files.every((f) => f.status === "done" || f.status === "error");
  const hasQueued = files.some((f) => f.status === "queued");
  const successCount = files.filter((f) => f.status === "done").length;

  const statusIcon = (s: FileStatus) => {
    switch (s) {
      case "done": return <CheckCircle2 size={14} className="text-primary shrink-0" />;
      case "error": return <AlertCircle size={14} className="text-destructive shrink-0" />;
      case "queued": return <FileText size={14} className="text-muted-foreground shrink-0" />;
      default: return <Loader2 size={14} className="animate-spin text-primary shrink-0" />;
    }
  };

  const statusLabel = (s: FileStatus) => {
    const map: Record<FileStatus, string> = {
      queued: "Queued",
      reading: "Extracting…",
      generating: "Generating…",
      saving: "Saving…",
      done: "Done",
      error: "Failed",
    };
    return map[s];
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles size={16} className="text-primary" />
            Import Lectures
          </DialogTitle>
          <DialogDescription>
            Upload up to {MAX_FILES} files (PDF, TXT, Markdown) to auto-generate study notes.
          </DialogDescription>
        </DialogHeader>

        {/* Drop zone — always visible when not processing */}
        {!processing && !allDone && (
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
              dragOver
                ? "border-primary bg-primary/5"
                : files.length > 0
                ? "border-muted-foreground/20 hover:border-primary/40"
                : "border-muted-foreground/25 hover:border-primary/40 hover:bg-accent/50"
            }`}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".pdf,.txt,.md,.markdown"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files) addFiles(e.target.files);
                e.target.value = "";
              }}
            />
            <Upload size={20} className="mx-auto text-muted-foreground mb-1.5" />
            <p className="text-sm text-muted-foreground">
              Drop files here or <span className="text-primary font-medium">browse</span>
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              PDF, TXT, or Markdown • Max 10MB each • Up to {MAX_FILES} files
            </p>
          </div>
        )}

        {/* File list */}
        {files.length > 0 && (
          <div className="space-y-1.5 max-h-[280px] overflow-auto scrollbar-thin">
            {files.map((qf, idx) => (
              <div
                key={`${qf.file.name}-${idx}`}
                className="flex items-center gap-2.5 px-3 py-2 rounded-md border bg-background"
              >
                {statusIcon(qf.status)}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{qf.file.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-muted-foreground">
                      {(qf.file.size / 1024).toFixed(0)} KB
                    </span>
                    <span className={`text-[10px] ${qf.status === "error" ? "text-destructive" : "text-muted-foreground"}`}>
                      {qf.error || statusLabel(qf.status)}
                    </span>
                  </div>
                  {qf.status !== "queued" && qf.status !== "done" && qf.status !== "error" && (
                    <Progress value={qf.progress} className="h-1 mt-1" />
                  )}
                </div>
                {qf.status === "queued" && !processing && (
                  <button
                    onClick={() => removeFile(idx)}
                    className="p-0.5 rounded hover:bg-accent shrink-0"
                  >
                    <X size={12} className="text-muted-foreground" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          {allDone ? (
            <button
              onClick={handleDone}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <CheckCircle2 size={14} />
              {successCount > 0 ? `View ${successCount === 1 ? "Note" : "Notes"}` : "Close"}
            </button>
          ) : (
            <button
              onClick={processAll}
              disabled={files.length === 0 || processing}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {processing ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Processing…
                </>
              ) : (
                <>
                  <Sparkles size={14} />
                  Generate {files.length > 1 ? `${files.length} Notes` : "Notes"}
                </>
              )}
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
