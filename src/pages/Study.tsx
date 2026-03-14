import { Play, Pause, RotateCcw, Volume2, CheckCircle } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useAmbientSound } from "@/hooks/useAmbientSound";

export default function Study() {
  const { user } = useAuth();
  const { active: activeSound, toggle: toggleSound } = useAmbientSound();
  const [isRunning, setIsRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [mode, setMode] = useState<"focus" | "break">("focus");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [todaySessions, setTodaySessions] = useState(0);
  const [todayMinutes, setTodayMinutes] = useState(0);
  const intervalRef = useRef<number | null>(null);
  const startTimeRef = useRef<string | null>(null);

  // Load today's stats
  useEffect(() => {
    if (!user) return;
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    supabase
      .from("study_sessions")
      .select("duration_minutes")
      .eq("user_id", user.id)
      .gte("started_at", todayStart.toISOString())
      .then(({ data }) => {
        if (data) {
          setTodaySessions(data.length);
          setTodayMinutes(data.reduce((s, r) => s + (r.duration_minutes ?? 0), 0));
        }
      });
  }, [user]);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = window.setInterval(() => {
        setTimeLeft((t) => t - 1);
        setElapsedSeconds((e) => e + 1);
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
      // Auto-complete when timer hits 0
      if (timeLeft === 0 && sessionId && mode === "focus") {
        completeSession();
      }
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, timeLeft]);

  const startSession = async () => {
    if (mode === "focus" && user && !sessionId) {
      const now = new Date().toISOString();
      startTimeRef.current = now;
      const { data } = await supabase
        .from("study_sessions")
        .insert({ user_id: user.id, started_at: now })
        .select("id")
        .single();
      if (data) setSessionId(data.id);
    }
    setIsRunning(true);
  };

  const completeSession = async () => {
    if (!sessionId || !user) return;
    const minutes = Math.max(1, Math.round(elapsedSeconds / 60));
    await supabase
      .from("study_sessions")
      .update({ ended_at: new Date().toISOString(), duration_minutes: minutes })
      .eq("id", sessionId);

    setTodaySessions((s) => s + 1);
    setTodayMinutes((m) => m + minutes);
    toast({ title: "Session saved", description: `${minutes} minute${minutes !== 1 ? "s" : ""} recorded.` });

    setSessionId(null);
    setElapsedSeconds(0);
    startTimeRef.current = null;
    setIsRunning(false);
    setTimeLeft(25 * 60);
  };

  const toggleTimer = () => {
    if (isRunning) {
      setIsRunning(false);
    } else {
      startSession();
    }
  };

  const reset = () => {
    setIsRunning(false);
    setTimeLeft(mode === "focus" ? 25 * 60 : 5 * 60);
    // If there was an active focus session, save it if meaningful time passed
    if (sessionId && elapsedSeconds >= 60) {
      completeSession();
    } else if (sessionId) {
      // Discard very short sessions
      supabase.from("study_sessions").delete().eq("id", sessionId).then(() => {});
      setSessionId(null);
      setElapsedSeconds(0);
      startTimeRef.current = null;
    }
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div className="max-w-lg mx-auto px-6 py-16 animate-fade-in text-center">
      <h1 className="text-xl font-semibold tracking-tight mb-1">Focus Session</h1>
      <p className="text-sm text-muted-foreground mb-12">Deep work, distraction-free.</p>

      {/* Mode Toggle */}
      <div className="flex items-center justify-center gap-1 mb-8">
        {(["focus", "break"] as const).map((m) => (
          <button
            key={m}
            onClick={() => {
              if (isRunning) return;
              setMode(m);
              setTimeLeft(m === "focus" ? 25 * 60 : 5 * 60);
              setElapsedSeconds(0);
            }}
            className={`px-4 py-1.5 rounded-md text-sm transition-colors ${
              mode === m ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"
            }`}
          >
            {m === "focus" ? "Focus (25m)" : "Break (5m)"}
          </button>
        ))}
      </div>

      {/* Timer */}
      <div className="mb-10">
        <p className="text-7xl font-light tabular-nums tracking-tight font-mono">{formatTime(timeLeft)}</p>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={reset}
          className="p-3 rounded-full border hover:bg-accent transition-colors"
        >
          <RotateCcw size={16} className="text-muted-foreground" />
        </button>
        <button
          onClick={toggleTimer}
          className="px-8 py-3 rounded-full bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors"
        >
          {isRunning ? (
            <span className="flex items-center gap-2"><Pause size={16} /> Pause</span>
          ) : (
            <span className="flex items-center gap-2"><Play size={16} /> Start</span>
          )}
        </button>
        {sessionId && elapsedSeconds >= 60 && (
          <button
            onClick={completeSession}
            className="p-3 rounded-full border hover:bg-accent transition-colors"
            title="Finish & save session"
          >
            <CheckCircle size={16} className="text-primary" />
          </button>
        )}
        {!sessionId && (
          <button className="p-3 rounded-full border hover:bg-accent transition-colors">
            <Volume2 size={16} className="text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Today's Stats */}
      <div className="mt-12 flex items-center justify-center gap-8">
        <div>
          <p className="text-2xl font-semibold tabular-nums">{todaySessions}</p>
          <p className="text-xs text-muted-foreground">Sessions today</p>
        </div>
        <div>
          <p className="text-2xl font-semibold tabular-nums">
            {todayMinutes >= 60 ? `${(todayMinutes / 60).toFixed(1)}h` : `${todayMinutes}m`}
          </p>
          <p className="text-xs text-muted-foreground">Study time today</p>
        </div>
      </div>

      {/* Ambient Sounds */}
      <div className="mt-12">
        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Ambient</p>
        <div className="flex items-center justify-center gap-2">
          {["Rain", "Café", "White Noise", "Silence"].map((sound) => (
            <button
              key={sound}
              className="px-3 py-1.5 rounded-md border text-xs hover:bg-accent transition-colors text-muted-foreground"
            >
              {sound}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
