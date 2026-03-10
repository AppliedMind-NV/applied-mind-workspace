import { Play, Pause, RotateCcw, Volume2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";

export default function Study() {
  const [isRunning, setIsRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [mode, setMode] = useState<"focus" | "break">("focus");
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = window.setInterval(() => {
        setTimeLeft((t) => t - 1);
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, timeLeft]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  const reset = () => {
    setIsRunning(false);
    setTimeLeft(mode === "focus" ? 25 * 60 : 5 * 60);
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
              setMode(m);
              setIsRunning(false);
              setTimeLeft(m === "focus" ? 25 * 60 : 5 * 60);
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
          onClick={() => setIsRunning(!isRunning)}
          className="px-8 py-3 rounded-full bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors"
        >
          {isRunning ? (
            <span className="flex items-center gap-2"><Pause size={16} /> Pause</span>
          ) : (
            <span className="flex items-center gap-2"><Play size={16} /> Start</span>
          )}
        </button>
        <button className="p-3 rounded-full border hover:bg-accent transition-colors">
          <Volume2 size={16} className="text-muted-foreground" />
        </button>
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
