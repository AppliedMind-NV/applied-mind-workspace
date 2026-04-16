import { useState, useRef, useCallback, useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export type SoundType = "Rain" | "Café" | "White Noise" | "Forest" | "Silence";

/**
 * ============================================================
 * AMBIENT SOUND SYSTEM — Direct ElevenLabs via edge function
 * ============================================================
 *
 * Frontend → /functions/v1/elevenlabs-sfx → ElevenLabs.
 * Returns base64 audio that we play as a data: URL on loop.
 * Cached in-memory per session (Map<SoundType, string>).
 * No Supabase Storage, no pre-cached MP3s, no fallback chain.
 * ============================================================
 */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

// In-memory cache: SoundType → data URL. Lives for the page session.
const audioCache = new Map<Exclude<SoundType, "Silence">, string>();

// localStorage key prefix for persisted base64 audio
const STORAGE_PREFIX = "appliedmind:ambient-sound:";
const STORAGE_VERSION = "v1"; // bump to invalidate all cached sounds

function storageKey(sound: Exclude<SoundType, "Silence">): string {
  return `${STORAGE_PREFIX}${STORAGE_VERSION}:${sound}`;
}

function loadFromStorage(sound: Exclude<SoundType, "Silence">): string | null {
  try {
    const raw = localStorage.getItem(storageKey(sound));
    if (!raw) return null;
    return `data:audio/mpeg;base64,${raw}`;
  } catch (err) {
    console.warn("[useAmbientSound] localStorage read failed:", err);
    return null;
  }
}

function saveToStorage(sound: Exclude<SoundType, "Silence">, base64: string): void {
  try {
    localStorage.setItem(storageKey(sound), base64);
    console.log("[useAmbientSound] persisted to localStorage:", sound, `${Math.round(base64.length / 1024)}KB`);
  } catch (err) {
    // Likely QuotaExceededError — clear old sound entries and retry once
    console.warn("[useAmbientSound] localStorage write failed, attempting cleanup:", err);
    try {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const k = localStorage.key(i);
        if (k && k.startsWith(STORAGE_PREFIX) && k !== storageKey(sound)) {
          localStorage.removeItem(k);
        }
      }
      localStorage.setItem(storageKey(sound), base64);
      console.log("[useAmbientSound] persisted after cleanup:", sound);
    } catch (retryErr) {
      console.error("[useAmbientSound] localStorage persist gave up:", retryErr);
    }
  }
}

async function generateSound(sound: Exclude<SoundType, "Silence">): Promise<string> {
  // 1) In-memory cache (fastest)
  const cached = audioCache.get(sound);
  if (cached) {
    console.log("[useAmbientSound] memory cache hit:", sound);
    return cached;
  }

  // 2) localStorage cache (survives reloads)
  const persisted = loadFromStorage(sound);
  if (persisted) {
    console.log("[useAmbientSound] localStorage cache hit:", sound);
    audioCache.set(sound, persisted);
    return persisted;
  }

  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error("Not authenticated");
  }

  const payload = { sound };
  console.log("[useAmbientSound] request payload:", payload);

  const res = await fetch(`${SUPABASE_URL}/functions/v1/elevenlabs-sfx`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify(payload),
  });

  console.log("[useAmbientSound] response status:", res.status);

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    console.error("[useAmbientSound] backend error:", errBody);
    throw new Error(errBody.error || `Sound generation failed (${res.status})`);
  }

  const data = await res.json();
  if (!data.success || !data.audioContent) {
    console.error("[useAmbientSound] invalid response shape:", data);
    throw new Error(data.error || "No audio returned");
  }

  const url = `data:audio/mpeg;base64,${data.audioContent}`;
  audioCache.set(sound, url);
  saveToStorage(sound, data.audioContent);
  return url;
}

export function useAmbientSound() {
  const [active, setActive] = useState<SoundType | null>(null);
  const [volume, setVolume] = useState(0.5);
  const [loading, setLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
  }, []);

  const play = useCallback(
    async (sound: SoundType) => {
      stop();
      console.log("[useAmbientSound] selected sound:", sound);

      if (sound === "Silence") {
        setActive("Silence");
        return;
      }

      setLoading(true);
      try {
        const url = await generateSound(sound);
        const audio = new Audio(url);
        audio.loop = true;
        audio.volume = volume;

        audio.addEventListener("error", () => {
          console.error("[useAmbientSound] playback error:", sound, audio.error);
          toast({
            title: "Playback failed",
            description: `Could not play ${sound}. Please try again.`,
            variant: "destructive",
          });
          setActive(null);
          audioRef.current = null;
        });

        audioRef.current = audio;
        await audio.play();
        setActive(sound);
      } catch (err) {
        console.error("[useAmbientSound] generation/playback failed:", err);
        toast({
          title: "Sound unavailable",
          description:
            err instanceof Error ? err.message : "Could not generate ambient sound.",
          variant: "destructive",
        });
        setActive(null);
      } finally {
        setLoading(false);
      }
    },
    [stop, volume],
  );

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

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  useEffect(() => () => stop(), [stop]);

  return { active, toggle, volume, setVolume, loading };
}
