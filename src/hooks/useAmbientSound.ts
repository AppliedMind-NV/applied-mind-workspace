import { useState, useRef, useCallback, useEffect } from "react";
import { toast } from "@/hooks/use-toast";

export type SoundType = "Rain" | "Café" | "White Noise" | "Forest" | "Silence";

/**
 * ============================================================
 * AMBIENT SOUND SYSTEM — ElevenLabs AI-generated audio
 * ============================================================
 *
 * Each sound type maps to a specific ElevenLabs SFX prompt:
 *
 *   "Rain"        → Realistic rain with distant thunder
 *   "Café"        → Coffee shop ambience with voices & cups
 *   "White Noise" → Smooth static noise
 *   "Silence"     → No audio
 *
 * Generated audio is cached in memory so each sound is only
 * generated once per session. Audio loops seamlessly.
 * ============================================================
 */

// -- Prompt definitions for each sound type --
// Each sound maps to a completely different ElevenLabs prompt
const SOUND_PROMPTS: Record<Exclude<SoundType, "Silence">, { prompt: string; duration: number }> = {
  Rain: {
    prompt: "Heavy rain falling on a rooftop with occasional distant thunder rumbles and water dripping, soothing rain ambience for studying",
    duration: 22,
  },
  "Café": {
    prompt: "Busy coffee shop ambience with multiple people talking in background, espresso machine sounds, cups clinking on saucers, warm indoor cafe atmosphere",
    duration: 22,
  },
  "White Noise": {
    prompt: "Pure smooth white noise static, consistent and even, like a fan or air conditioner humming steadily",
    duration: 15,
  },
};

// In-memory cache: sound type → base64 audio data URL
const audioCache = new Map<string, string>();

async function generateSound(soundType: Exclude<SoundType, "Silence">): Promise<string> {
  // Check cache first
  const cached = audioCache.get(soundType);
  if (cached) return cached;

  const config = SOUND_PROMPTS[soundType];

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-sfx`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ prompt: config.prompt, duration: config.duration }),
    }
  );

  if (!response.ok) {
    throw new Error(`SFX generation failed: ${response.status}`);
  }

  const data = await response.json();
  if (!data.success || !data.audioContent) {
    throw new Error(data.error || "No audio returned");
  }

  const audioUrl = `data:audio/mpeg;base64,${data.audioContent}`;
  audioCache.set(soundType, audioUrl);
  return audioUrl;
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

  /** Start a specific sound */
  const play = useCallback(
    async (sound: SoundType) => {
      stop();

      if (sound === "Silence") {
        setActive("Silence");
        return;
      }

      setLoading(true);
      try {
        const audioUrl = await generateSound(sound);
        const audio = new Audio(audioUrl);
        audio.loop = true;
        audio.volume = volume;
        audioRef.current = audio;
        await audio.play();
        setActive(sound);
      } catch (err) {
        console.error("Failed to generate/play sound:", err);
        toast({
          title: "Sound generation failed",
          description: "Could not generate ambient sound. Please try again.",
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
      if (loading) return; // Prevent double-clicks while loading
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
