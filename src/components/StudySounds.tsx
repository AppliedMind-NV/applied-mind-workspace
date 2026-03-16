import { CloudRain, Coffee, AudioLines, VolumeX, Volume2, Loader2, TreePine } from "lucide-react";
import { useAmbientSound } from "@/hooks/useAmbientSound";
import { Slider } from "@/components/ui/slider";

type SoundOption = {
  id: "Rain" | "Café" | "White Noise" | "Forest" | "Silence";
  label: string;
  icon: typeof CloudRain;
  activeLabel: string;
};

const sounds: SoundOption[] = [
  { id: "Rain", label: "Rain", icon: CloudRain, activeLabel: "Playing Rain" },
  { id: "Café", label: "Cafe", icon: Coffee, activeLabel: "Playing Cafe" },
  { id: "White Noise", label: "White Noise", icon: AudioLines, activeLabel: "Playing White Noise" },
  { id: "Forest", label: "Forest", icon: TreePine, activeLabel: "Playing Forest" },
  { id: "Silence", label: "Silence", icon: VolumeX, activeLabel: "Silence selected" },
];

interface StudySoundsProps {
  compact?: boolean;
}

export default function StudySounds({ compact = false }: StudySoundsProps) {
  const { active, toggle, volume, setVolume, loading } = useAmbientSound();

  const activeSound = sounds.find((s) => s.id === active);

  return (
    <div className={compact ? "" : "mt-12"}>
      {!compact && (
        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-4 font-medium">
          Study Sounds
        </p>
      )}

      <div className={`flex items-center justify-center gap-2 ${compact ? "gap-1.5" : "gap-2"}`}>
        {sounds.map((sound) => {
          const Icon = sound.icon;
          const isActive = active === sound.id;
          const isLoading = loading && sound.id !== "Silence";
          return (
            <button
              key={sound.id}
              onClick={() => toggle(sound.id)}
              disabled={loading}
              className={`
                flex flex-col items-center gap-1.5 rounded-xl transition-all duration-200
                ${compact ? "px-3 py-2" : "px-4 py-3 min-w-[72px]"}
                ${isActive
                  ? "bg-primary/10 text-primary border border-primary/20 shadow-sm"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground border border-transparent"
                }
                ${loading ? "opacity-60 cursor-wait" : ""}
              `}
              title={sound.label}
            >
              <Icon size={compact ? 16 : 18} strokeWidth={1.8} />
              <span className={`font-medium leading-none ${compact ? "text-[10px]" : "text-[11px]"}`}>
                {sound.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Loading indicator */}
      {loading && (
        <div className="flex items-center justify-center gap-2 mt-3 animate-fade-in">
          <Loader2 size={14} className="text-primary animate-spin" />
          <p className="text-xs text-muted-foreground">Generating sound…</p>
        </div>
      )}

      {/* Active label */}
      {activeSound && !loading && (
        <p className="text-xs text-muted-foreground text-center mt-3 animate-fade-in">
          {activeSound.activeLabel}
        </p>
      )}

      {/* Volume slider */}
      {active && active !== "Silence" && !loading && (
        <div className="flex items-center justify-center gap-3 mt-4 animate-fade-in">
          <Volume2 size={14} className="text-muted-foreground shrink-0" />
          <Slider
            value={[volume * 100]}
            onValueChange={([v]) => setVolume(v / 100)}
            max={100}
            step={1}
            className="w-32"
          />
          <span className="text-xs text-muted-foreground tabular-nums w-8 text-right">
            {Math.round(volume * 100)}%
          </span>
        </div>
      )}
    </div>
  );
}
