import { useState, useRef, useCallback, useEffect } from "react";
import { toast } from "@/hooks/use-toast";

export type SoundType = "Rain" | "Café" | "White Noise" | "Forest" | "Silence";

/**
 * ============================================================
 * AMBIENT SOUND SYSTEM — Pre-cached ElevenLabs audio from Storage
 * ============================================================
 *
 * Sounds are stored in the 'ambient-sounds' storage bucket as MP3 files.
 * On first load, the hook checks if files exist in storage.
 * If not, it triggers generation via the edge function.
 * Once generated, sounds load instantly from the public URL.
 *
 *   "Rain"        → ambient-sounds/rain.mp3
 *   "Café"        → ambient-sounds/cafe.mp3
 *   "White Noise"  → ambient-sounds/whitenoise.mp3
 *   "Forest"      → ambient-sounds/forest.mp3
 *   "Silence"      → No audio
 * ============================================================
 */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Maps each SoundType to its storage file key
const SOUND_FILE_MAP: Record<Exclude<SoundType, "Silence">, string> = {
  Rain: "rain.mp3",
  "Café": "cafe.mp3",
  "White Noise": "whitenoise.mp3",
  Forest: "forest.mp3",
};

// Reverse map: SoundType → edge function key
const SOUND_KEY_MAP: Record<Exclude<SoundType, "Silence">, string> = {
  Rain: "rain",
  "Café": "cafe",
  "White Noise": "whitenoise",
  Forest: "forest",
};

function getPublicUrl(file: string): string {
  return `${SUPABASE_URL}/storage/v1/object/public/ambient-sounds/${file}`;
}

/** Check if a sound file exists in storage by doing a HEAD request */
async function soundExists(file: string): Promise<boolean> {
  try {
    const res = await fetch(getPublicUrl(file), { method: "HEAD" });
    return res.ok;
  } catch {
    return false;
  }
}

/** Trigger generation of a single sound via edge function */
async function triggerGeneration(soundKey: string): Promise<string> {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/generate-ambient-sounds`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
    },
    body: JSON.stringify({ sound: soundKey }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(err.error || `Generation failed: ${res.status}`);
  }

  const data = await res.json();
  if (!data.success) throw new Error(data.error || "Generation failed");

  const result = data.results[soundKey];
  if (!result?.url) throw new Error("No URL returned");
  return result.url;
}

// ============================================================
// Hook
// ============================================================

export function useAmbientSound() {
  const [active, setActive] = useState<SoundType | null>(null);
  const [volume, setVolume] = useState(0.5);
  const [loading, setLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  /** Stop all currently playing audio */
  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
  }, []);

  /** Start a specific sound — loads from storage or generates if needed */
  const play = useCallback(
    async (sound: SoundType) => {
      stop();

      if (sound === "Silence") {
        setActive("Silence");
        return;
      }

      setLoading(true);
      try {
        const file = SOUND_FILE_MAP[sound];
        const key = SOUND_KEY_MAP[sound];
        let url = getPublicUrl(file);

        // Check if sound exists in storage
        const exists = await soundExists(file);

        if (!exists) {
          // Generate and upload to storage
          toast({
            title: "Generating sound…",
            description: `Creating ${sound} ambience. This only happens once.`,
          });
          try {
            url = await triggerGeneration(key);
          } catch (genErr) {
            console.error("Generation failed:", genErr);
            toast({
              title: "Generation failed",
              description: `Could not generate ${sound}. Try again from Settings.`,
              variant: "destructive",
            });
            setActive(null);
            setLoading(false);
            return;
          }
        }

        // Play from storage URL with error handling
        const audio = new Audio(url);
        audio.loop = true;
        audio.volume = volume;
        audio.crossOrigin = "anonymous";

        // Add error handler for load failures
        audio.addEventListener("error", () => {
          console.error("Audio load error for:", sound, audio.error);
          toast({
            title: "Playback failed",
            description: `Could not load ${sound} audio. Try regenerating in Settings.`,
            variant: "destructive",
          });
          setActive(null);
          audioRef.current = null;
        });

        audioRef.current = audio;
        await audio.play();
        setActive(sound);
      } catch (err) {
        console.error("Failed to play sound:", err);
        toast({
          title: "Sound failed",
          description: "Could not load ambient sound. Please try again.",
          variant: "destructive",
        });
        setActive(null);
      } finally {
        setLoading(false);
      }
    },
    [stop, volume],
  );

  /** Toggle a sound on/off */
  const toggle = useCallback(
    (sound: SoundType) => {
      if (loading) return;
      if (active === sound) {
        stop();
        setActive(null);
      } else {
        play(sound);
      }
    },
    [active, play, stop, loading],
  );

  // Sync volume changes to the live audio element
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // Cleanup on unmount
  useEffect(() => () => stop(), [stop]);

  return { active, toggle, volume, setVolume, loading };
}
