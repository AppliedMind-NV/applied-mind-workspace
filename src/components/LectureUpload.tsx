import { useState, useRef, useCallback } from "react";
import { Upload, FileText, X, Loader2, Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const NOTE_AI_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/note-ai`;
const ACCEPTED_TYPES = [
  "application/pdf",
  "text/plain",
  "text/markdown",
  "text/x-markdown",
];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

interface LectureUploadProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folderId: string | null;
  onNoteCreated: (noteId: string) => void;
}

type Stage = "idle" | "reading" | "generating" | "saving" | "done" | "error";

export function LectureUpload({ open, onOpenChange, folderId, onNoteCreated }: LectureUploadProps) {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [stage, setStage] = useState<Stage>("idle");
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setFile(null);
    setStage("idle");
    setProgress(0);
    setErrorMsg("");
    setDragOver(false);
  };

  const handleClose = (v: boolean) => {
    if (!v) reset();
    onOpenChange(v);
  };

  const validateFile = (f: File): string | null => {
    const ext = f.name.split(".").pop()?.toLowerCase();
    const isAccepted = ACCEPTED_TYPES.includes(f.type) || ["pdf", "txt", "md", "markdown"].includes(ext || "");
    if (!isAccepted) return "Unsupported file type. Please upload a PDF, TXT, or Markdown file.";
    if (f.size > MAX_SIZE) return "File is too large. Maximum size is 10MB.";
    return null;
  };

  const pickFile = (f: File) => {
    const err = validateFile(f);
    if (err) {
      toast({ title: "Invalid file", description: err, variant: "destructive" });
      return;
    }
    setFile(f);
    setErrorMsg("");
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) pickFile(f);
  }, []);

  const extractTextFromPdf = async (file: File): Promise<string> => {
    const pdfjsLib = await import("pdfjs-dist");
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const pages: string[] = [];

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const text = content.items
        .map((item: any) => item.str)
        .join(" ");
      pages.push(text);
      setProgress(Math.round((i / pdf.numPages) * 50));
    }

    return pages.join("\n\n");
  };

  const extractText = async (file: File): Promise<string> => {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext === "pdf" || file.type === "application/pdf") {
      return extractTextFromPdf(file);
    }
    // Plain text / markdown
    setProgress(30);
    const text = await file.text();
    setProgress(50);
    return text;
  };

  const generate = async () => {
    if (!file || !user) return;

    try {
      setStage("reading");
      setProgress(5);
      const rawText = await extractText(file);

      if (rawText.trim().length < 50) {
        throw new Error("The file doesn't contain enough text to generate notes.");
      }

      setStage("generating");
      setProgress(55);

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

      setProgress(80);
      const data = await resp.json();
      const raw = data.content?.trim() || "";

      // Extract JSON from possible markdown fences
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("Failed to parse AI response into notes format.");

      let noteContent: any;
      try {
        noteContent = JSON.parse(jsonMatch[0]);
      } catch {
        throw new Error("AI returned invalid JSON. Please try again.");
      }

      // Extract title from first heading
      let title = file.name.replace(/\.[^.]+$/, "");
      const firstHeading = noteContent.content?.find((n: any) => n.type === "heading");
      if (firstHeading?.content?.[0]?.text) {
        title = firstHeading.content[0].text;
      }

      setStage("saving");
      setProgress(90);

      const { data: note, error } = await supabase
        .from("notes")
        .insert({
          user_id: user.id,
          title,
          content: noteContent,
          folder_id: folderId,
        })
        .select("id")
        .single();

      if (error) throw error;

      setProgress(100);
      setStage("done");

      toast({
        title: "Notes generated!",
        description: `"${title}" has been created from your upload.`,
      });

      setTimeout(() => {
        handleClose(false);
        if (note) onNoteCreated(note.id);
      }, 600);
    } catch (err: any) {
      setStage("error");
      setErrorMsg(err.message || "Something went wrong.");
      toast({ title: "Generation failed", description: err.message, variant: "destructive" });
    }
  };

  const stageLabels: Record<Stage, string> = {
    idle: "",
    reading: "Extracting text from document…",
    generating: "AI is generating structured notes…",
    saving: "Saving to your notebook…",
    done: "Done!",
    error: "Something went wrong.",
  };

  const isProcessing = ["reading", "generating", "saving"].includes(stage);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles size={16} className="text-primary" />
            Import Lecture
          </DialogTitle>
          <DialogDescription>
            Upload a PDF, transcript, or text file to auto-generate structured study notes.
          </DialogDescription>
        </DialogHeader>

        {stage === "idle" || stage === "error" ? (
          <div className="space-y-4">
            {/* Drop zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              onClick={() => inputRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                dragOver
                  ? "border-primary bg-primary/5"
                  : file
                  ? "border-primary/40 bg-primary/5"
                  : "border-muted-foreground/25 hover:border-primary/40 hover:bg-accent/50"
              }`}
            >
              <input
                ref={inputRef}
                type="file"
                accept=".pdf,.txt,.md,.markdown"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) pickFile(f);
                  e.target.value = "";
                }}
              />
              {file ? (
                <div className="flex items-center justify-center gap-3">
                  <FileText size={20} className="text-primary" />
                  <div className="text-left">
                    <p className="text-sm font-medium truncate max-w-[200px]">{file.name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {(file.size / 1024).toFixed(0)} KB
                    </p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); setFile(null); }}
                    className="p-1 rounded-md hover:bg-accent"
                  >
                    <X size={14} className="text-muted-foreground" />
                  </button>
                </div>
              ) : (
                <>
                  <Upload size={24} className="mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Drop a file here or <span className="text-primary font-medium">browse</span>
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    PDF, TXT, or Markdown • Max 10MB
                  </p>
                </>
              )}
            </div>

            {stage === "error" && (
              <p className="text-xs text-destructive">{errorMsg}</p>
            )}

            <button
              onClick={generate}
              disabled={!file}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Sparkles size={14} />
              Generate Notes
            </button>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-3">
              {stage === "done" ? (
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-primary text-sm">✓</span>
                </div>
              ) : (
                <Loader2 size={20} className="animate-spin text-primary" />
              )}
              <div>
                <p className="text-sm font-medium">{stageLabels[stage]}</p>
                <p className="text-[10px] text-muted-foreground">{file?.name}</p>
              </div>
            </div>
            <Progress value={progress} className="h-1.5" />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
