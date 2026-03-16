import { useState, useRef, useCallback, useEffect } from "react";
import { Mic, Square, Loader2, Sparkles, CheckCircle2, AlertCircle, Pause, Play, Clock } from "lucide-react";
import { AudioWaveform } from "@/components/AudioWaveform";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const NOTE_AI_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/note-ai`;
const TRANSCRIBE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-transcribe`;
const MAX_DURATION = 25 * 60; // 25 minutes in seconds
const WARN_THRESHOLD = 20 * 60; // warn at 20 minutes

type RecordingState = "idle" | "recording" | "paused" | "transcribing" | "generating" | "saving" | "done" | "error";

interface LectureRecorderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folderId: string | null;
  onNoteCreated: (noteId: string) => void;
}

export function LectureRecorder({ open, onOpenChange, folderId, onNoteCreated }: LectureRecorderProps) {
  const { user } = useAuth();
  const [state, setState] = useState<RecordingState>("idle");
  const [progress, setProgress] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const [noteId, setNoteId] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const reset = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    mediaRecorderRef.current = null;
    chunksRef.current = [];
    setState("idle");
    setProgress(0);
    setElapsed(0);
    setErrorMsg("");
    setNoteId(null);
  }, []);

  const handleClose = (v: boolean) => {
    if (state === "transcribing" || state === "generating" || state === "saving") return;
    if (state === "recording" || state === "paused") stopRecording();
    if (!v) reset();
    onOpenChange(v);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: mimeType });
        processRecording(blob);
      };

      recorder.start(1000);
      setState("recording");
      setElapsed(0);

      timerRef.current = setInterval(() => {
        setElapsed((prev) => {
          const next = prev + 1;
          if (next >= MAX_DURATION) {
            // Auto-stop at limit
            if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
              mediaRecorderRef.current.stop();
            }
          }
          return next;
        });
      }, 1000);
    } catch (err: any) {
      toast({
        title: "Microphone access denied",
        description: "Please allow microphone access to record lectures.",
        variant: "destructive",
      });
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.pause();
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setState("paused");
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current?.state === "paused") {
      mediaRecorderRef.current.resume();
      timerRef.current = setInterval(() => {
        setElapsed((prev) => prev + 1);
      }, 1000);
      setState("recording");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
  };

  const processRecording = async (blob: Blob) => {
    if (!user) return;

    try {
      setState("transcribing");
      setProgress(15);

      const formData = new FormData();
      formData.append("audio", blob, "recording.webm");

      const resp = await fetch(TRANSCRIBE_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: formData,
      });

      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}));
        throw new Error(data.error || `Transcription failed (${resp.status})`);
      }

      const transcriptionData = await resp.json();
      const rawText = transcriptionData.text || "";

      if (rawText.trim().length < 50) {
        throw new Error("Not enough speech detected. Try recording a longer lecture.");
      }

      setProgress(40);
      setState("generating");

      const aiResp = await fetch(NOTE_AI_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content: `Transform this lecture recording transcript into structured study notes:\n\n${rawText.slice(0, 60000)}`,
            },
          ],
          action: "generate_notes",
          noteContent: "",
          noteTitle: "",
        }),
      });

      if (!aiResp.ok) {
        const data = await aiResp.json().catch(() => ({}));
        throw new Error(data.error || `AI request failed (${aiResp.status})`);
      }

      setProgress(75);
      const aiData = await aiResp.json();
      const raw = aiData.content?.trim() || "";
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("Failed to parse AI response.");

      let noteContent: any;
      try {
        noteContent = JSON.parse(jsonMatch[0]);
      } catch {
        throw new Error("AI returned invalid JSON.");
      }

      let noteTitle = "Lecture Recording";
      const firstHeading = noteContent.content?.find((n: any) => n.type === "heading");
      if (firstHeading?.content?.[0]?.text) noteTitle = firstHeading.content[0].text;

      setState("saving");
      setProgress(90);

      const { data: note, error } = await supabase
        .from("notes")
        .insert({ user_id: user.id, title: noteTitle, content: noteContent, folder_id: folderId })
        .select("id")
        .single();

      if (error) throw error;

      setNoteId(note?.id || null);
      setState("done");
      setProgress(100);

      toast({ title: "Lecture notes generated!", description: "Your recording has been transcribed and converted to study notes." });
    } catch (err: any) {
      setState("error");
      setErrorMsg(err.message || "Something went wrong");
    }
  };

  const handleDone = () => {
    const id = noteId;
    handleClose(false);
    if (id) onNoteCreated(id);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const isProcessing = state === "transcribing" || state === "generating" || state === "saving";

  const statusText: Record<RecordingState, string> = {
    idle: "Ready to record",
    recording: "Recording…",
    paused: "Paused",
    transcribing: "Transcribing audio…",
    generating: "Generating notes…",
    saving: "Saving…",
    done: "Notes created!",
    error: errorMsg || "Something went wrong",
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mic size={16} className="text-primary" />
            Record Lecture
          </DialogTitle>
          <DialogDescription>
            Record a lecture from your microphone. The audio will be transcribed and converted into study notes.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-4">
          {/* Recording visualizer / button */}
          {state === "idle" && (
            <button
              onClick={startRecording}
              className="w-20 h-20 rounded-full bg-destructive/10 hover:bg-destructive/20 flex items-center justify-center transition-colors group"
            >
              <Mic size={32} className="text-destructive group-hover:scale-110 transition-transform" />
            </button>
          )}

          {(state === "recording" || state === "paused") && (
            <div className="flex flex-col items-center gap-3 w-full">
              <AudioWaveform stream={streamRef.current} isRecording={state === "recording"} />
              {state === "paused" && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted">
                  <Pause size={12} className="text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground">Paused</span>
                </div>
              )}
              <div className="flex items-center gap-3">
                <div className="text-2xl font-mono font-semibold tabular-nums text-foreground">
                  {formatTime(elapsed)}
                </div>
                <button
                  onClick={state === "recording" ? pauseRecording : resumeRecording}
                  className="w-10 h-10 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors"
                  title={state === "recording" ? "Pause" : "Resume"}
                >
                  {state === "recording" ? (
                    <Pause size={16} className="text-foreground" />
                  ) : (
                    <Play size={16} className="text-foreground ml-0.5" />
                  )}
                </button>
                <button
                  onClick={stopRecording}
                  className="w-10 h-10 rounded-full bg-destructive flex items-center justify-center transition-colors hover:bg-destructive/90"
                  title="Stop recording"
                >
                  <Square size={16} className="text-destructive-foreground" />
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                {state === "recording" ? "Pause to skip breaks, stop to finish" : "Resume when ready, or stop to finish"}
              </p>
            </div>
          )}

          {isProcessing && (
            <div className="flex flex-col items-center gap-3 w-full">
              <Loader2 size={32} className="animate-spin text-primary" />
              <Progress value={progress} className="w-full h-1.5" />
            </div>
          )}

          {state === "done" && (
            <CheckCircle2 size={40} className="text-primary" />
          )}

          {state === "error" && (
            <AlertCircle size={40} className="text-destructive" />
          )}

          {/* Status text */}
          <p className={`text-sm font-medium ${state === "error" ? "text-destructive" : "text-muted-foreground"}`}>
            {statusText[state]}
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {state === "done" ? (
            <button
              onClick={handleDone}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <CheckCircle2 size={14} />
              View Notes
            </button>
          ) : state === "error" ? (
            <div className="flex gap-2 w-full">
              <button
                onClick={reset}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md border text-sm font-medium hover:bg-accent transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={() => handleClose(false)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md border text-sm font-medium hover:bg-accent transition-colors"
              >
                Close
              </button>
            </div>
          ) : state === "idle" ? (
            <p className="text-[10px] text-muted-foreground text-center w-full">
              Tip: For best results, record in a quiet environment and speak clearly.
            </p>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
