import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

/**
 * Sound prompts — each maps to a unique ElevenLabs SFX generation prompt.
 * Files are stored in the 'ambient-sounds' bucket as: rain.mp3, cafe.mp3, etc.
 */
const SOUNDS: Record<string, { prompt: string; duration: number; file: string }> = {
  rain: {
    prompt: "Heavy rain falling on a rooftop with occasional distant thunder rumbles and water dripping, soothing rain ambience for studying",
    duration: 22,
    file: "rain.mp3",
  },
  cafe: {
    prompt: "Busy coffee shop ambience with multiple people talking in background, espresso machine sounds, cups clinking on saucers, warm indoor cafe atmosphere",
    duration: 22,
    file: "cafe.mp3",
  },
  whitenoise: {
    prompt: "Pure smooth white noise static, consistent and even, like a fan or air conditioner humming steadily",
    duration: 15,
    file: "whitenoise.mp3",
  },
  forest: {
    prompt: "Peaceful forest ambience with birds singing and chirping, gentle wind rustling through leaves and trees, calm nature sounds for relaxation and studying",
    duration: 22,
    file: "forest.mp3",
  },
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const supabaseAuth = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } });
    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { sound, force } = await req.json();

    // If "all" is passed, generate all sounds
    const soundKeys = sound === "all" ? Object.keys(SOUNDS) : [sound];

    const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');
    if (!ELEVENLABS_API_KEY) {
      return new Response(
        JSON.stringify({ success: false, error: 'ElevenLabs not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const results: Record<string, { status: string; url?: string; error?: string }> = {};

    for (const key of soundKeys) {
      const config = SOUNDS[key];
      if (!config) {
        results[key] = { status: 'error', error: 'Unknown sound type' };
        continue;
      }

      // Check if already exists in storage (skip if force regenerate)
      if (!force) {
        const { data: existing } = await supabase.storage
          .from('ambient-sounds')
          .createSignedUrl(config.file, 60);
        if (existing?.signedUrl) {
          const publicUrl = `${supabaseUrl}/storage/v1/object/public/ambient-sounds/${config.file}`;
          results[key] = { status: 'exists', url: publicUrl };
          console.log(`${key}: already exists, skipping`);
          continue;
        }
      }

      console.log(`Generating ${key}...`);

      // Generate via ElevenLabs
      const response = await fetch('https://api.elevenlabs.io/v1/sound-generation', {
        method: 'POST',
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: config.prompt,
          duration_seconds: config.duration,
          prompt_influence: 0.5,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error(`ElevenLabs error for ${key}:`, response.status, errText);
        results[key] = { status: 'error', error: `Generation failed: ${response.status}` };
        continue;
      }

      const audioBuffer = await response.arrayBuffer();
      const audioBytes = new Uint8Array(audioBuffer);

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('ambient-sounds')
        .upload(config.file, audioBytes, {
          contentType: 'audio/mpeg',
          upsert: true,
        });

      if (uploadError) {
        console.error(`Upload error for ${key}:`, uploadError);
        results[key] = { status: 'error', error: uploadError.message };
        continue;
      }

      const publicUrl = `${supabaseUrl}/storage/v1/object/public/ambient-sounds/${config.file}`;
      results[key] = { status: 'generated', url: publicUrl };
      console.log(`${key}: generated and uploaded successfully`);
    }

    return new Response(
      JSON.stringify({ success: true, results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
