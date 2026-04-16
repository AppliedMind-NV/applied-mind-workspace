import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Server-side curated prompts. Frontend only sends a sound key.
const SOUND_PROMPTS: Record<string, { prompt: string; duration: number }> = {
  Rain: {
    prompt:
      "Steady heavy rain on a rooftop with distant rolling thunder, calming and immersive ambience, no music, no voices, seamless loop",
    duration: 22,
  },
  "Café": {
    prompt:
      "Cozy coffee shop ambience, soft murmur of conversations, gentle clinking of cups and saucers, distant espresso machine, warm and focused, no music, no voices",
    duration: 22,
  },
  "White Noise": {
    prompt:
      "Smooth pure white noise, consistent broadband hiss, calming and uniform, perfect for focus and sleep, no variation, seamless loop",
    duration: 22,
  },
  Forest: {
    prompt:
      "Peaceful forest ambience, soft wind through leaves, distant gentle bird calls, light rustling foliage, deep nature feel, no music, no voices",
    duration: 22,
  },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // --- Auth ---
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      console.log("elevenlabs-sfx: missing auth header");
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      console.log("elevenlabs-sfx: invalid token", claimsError?.message);
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // --- Body ---
    const { sound } = await req.json().catch(() => ({}));
    console.log("elevenlabs-sfx: incoming sound =", sound);

    if (!sound || !SOUND_PROMPTS[sound]) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Invalid sound. Must be one of: ${Object.keys(SOUND_PROMPTS).join(", ")}`,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const apiKey = Deno.env.get("ELEVENLABS_API_KEY");
    if (!apiKey) {
      console.error("elevenlabs-sfx: ELEVENLABS_API_KEY not configured");
      return new Response(
        JSON.stringify({ success: false, error: "ElevenLabs not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { prompt, duration } = SOUND_PROMPTS[sound];
    console.log("elevenlabs-sfx: calling ElevenLabs", { sound, duration, promptPreview: prompt.slice(0, 60) });

    const elRes = await fetch("https://api.elevenlabs.io/v1/sound-generation", {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: prompt,
        duration_seconds: duration,
        prompt_influence: 0.5,
      }),
    });

    console.log("elevenlabs-sfx: ElevenLabs status", elRes.status);

    if (!elRes.ok) {
      const errText = await elRes.text();
      console.error("elevenlabs-sfx: ElevenLabs error", elRes.status, errText);
      return new Response(
        JSON.stringify({
          success: false,
          error: `ElevenLabs API error: ${elRes.status}`,
        }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const audioBuffer = await elRes.arrayBuffer();
    const base64Audio = base64Encode(audioBuffer);
    console.log("elevenlabs-sfx: success, bytes =", audioBuffer.byteLength);

    return new Response(
      JSON.stringify({ success: true, audioContent: base64Audio }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("elevenlabs-sfx: unhandled error", err);
    return new Response(
      JSON.stringify({
        success: false,
        error: err instanceof Error ? err.message : "Unknown error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
