import { Play, Pause, RotateCcw, CheckCircle } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import StudySounds from "@/components/StudySounds";

export default function Study() {
  const { user } = useAuth();
  
  const [isRunning, setIsRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [mode, setMode] = useState<"focus" | "break">("focus");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [todaySessions, setTodaySessions] = useState(0);
  const [todayMinutes, setTodayMinutes] = useState(0);
  const intervalRef = useRef<number | null>(null);
  const startTimeRef = useRef<string | null>(null);

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
    if (sessionId && elapsedSeconds >= 60) {
      completeSession();
    } else if (sessionId) {
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

  const progress = mode === "focus"
    ? ((25 * 60 - timeLeft) / (25 * 60)) * 100
    : ((5 * 60 - timeLeft) / (5 * 60)) * 100;

  return (
    <div className="max-w-lg mx-auto px-6 py-16 animate-fade-in text-center relative">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[300px] h-[300px] rounded-full bg-primary/5 blur-[100px] animate-pulse-glow" />
      </div>

      <div className="relative z-10">
        <h1 className="text-xl font-bold tracking-tight mb-1">Focus Session</h1>
        <p className="text-sm text-muted-foreground mb-10">Deep work, distraction-free.</p>

        {/* Mode Toggle */}
        <div className="inline-flex items-center gap-1 rounded-xl bg-muted/30 p-1 mb-8">
          {(["focus", "break"] as const).map((m) => (
            <button
              key={m}
              onClick={() => {
                if (isRunning) return;
                setMode(m);
                setTimeLeft(m === "focus" ? 25 * 60 : 5 * 60);
                setElapsedSeconds(0);
              }}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                mode === m ? "bg-primary text-primary-foreground shadow-sm btn-glow" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {m === "focus" ? "Focus (25m)" : "Break (5m)"}
            </button>
          ))}
        </div>

        {/* Timer Ring */}
        <div className="relative w-64 h-64 mx-auto mb-10">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 256 256">
            <circle
              cx="128" cy="128" r="116"
              fill="none"
              stroke="hsl(var(--muted))"
              strokeWidth="4"
              opacity="0.3"
            />
            <circle
              cx="128" cy="128" r="116"
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 116}
              strokeDashoffset={2 * Math.PI * 116 * (1 - progress / 100)}
              className="transition-all duration-1000"
              style={{ filter: "drop-shadow(0 0 6px hsl(var(--primary) / 0.4))" }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-6xl font-light tabular-nums tracking-tight font-mono">{formatTime(timeLeft)}</p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={reset}
            className="p-3.5 rounded-full glass-card hover:border-primary/30 transition-all"
          >
            <RotateCcw size={16} className="text-muted-foreground" />
          </button>
          <button
            onClick={toggleTimer}
            className="px-10 py-3.5 rounded-full bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-all btn-glow"
          >
            {isRunning ? (
              <span className="flex items-center gap-2"><Pause size={16} /> Pause</span>
            ) : (
              <span className="flex items-center gap-2"><Play size={16} /> Start</span>
            )}
          </button>
          {sessionId && elapsedSeconds >= 60 ? (
            <button
              onClick={completeSession}
              className="p-3.5 rounded-full glass-card hover:border-primary/30 transition-all"
              title="Finish & save session"
            >
              <CheckCircle size={16} className="text-primary" />
            </button>
          ) : (
            <div className="w-[52px]" />
          )}
        </div>

        {/* Today's Stats */}
        <div className="mt-12 flex items-center justify-center gap-6">
          <div className="glass-card px-6 py-4 text-center">
            <p className="text-2xl font-bold tabular-nums">{todaySessions}</p>
            <p className="text-xs text-muted-foreground">Sessions today</p>
          </div>
          <div className="glass-card px-6 py-4 text-center">
            <p className="text-2xl font-bold tabular-nums">
              {todayMinutes >= 60 ? `${(todayMinutes / 60).toFixed(1)}h` : `${todayMinutes}m`}
            </p>
            <p className="text-xs text-muted-foreground">Study time today</p>
          </div>
        </div>

        {/* Ambient Sounds */}
        <div className="mt-8">
          <StudySounds />
        </div>
      </div>
    </div>
  );
}
