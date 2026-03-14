import { useState, useRef, useCallback, useEffect } from "react";

export type SoundType = "Rain" | "Café" | "White Noise" | "Silence";

/**
 * ============================================================
 * AMBIENT SOUND SYSTEM — Audio mapping & architecture
 * ============================================================
 *
 * Each sound type maps to a COMPLETELY DIFFERENT synthesis chain:
 *
 *   "Rain"        → buildRain()        — Deep brown noise, 150Hz LPF, slow LFO modulation
 *   "Café"        → buildCafe()        — Pink noise through vocal formant bands (400Hz, 1800Hz) + fast AM
 *   "White Noise"  → buildWhiteNoise()  — Flat white noise buffer, minimal filtering
 *   "Silence"      → No audio nodes created, all sources stopped
 *
 * Each builder returns its own independent set of AudioNodes.
 * Only ONE sound plays at a time — toggling stops all previous nodes.
 * ============================================================
 */

// -- Utility: generate a noise buffer --
function makeNoiseBuffer(ctx: AudioContext, seconds: number, type: "white" | "brown" | "pink") {
  const len = ctx.sampleRate * seconds;
  const buf = ctx.createBuffer(2, len, ctx.sampleRate);

  for (let ch = 0; ch < 2; ch++) {
    const data = buf.getChannelData(ch);

    if (type === "white") {
      // Pure white noise — every sample is independent uniform random
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    } else if (type === "brown") {
      // Brownian / red noise — integrated white noise, very bassy
      let last = 0;
      for (let i = 0; i < len; i++) {
        const white = Math.random() * 2 - 1;
        last = (last + 0.02 * white) / 1.02;
        data[i] = last * 3.5;
      }
    } else if (type === "pink") {
      // Pink noise — 1/f spectrum via Voss-McCartney algorithm
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < len; i++) {
        const w = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + w * 0.0555179;
        b1 = 0.99332 * b1 + w * 0.0750759;
        b2 = 0.96900 * b2 + w * 0.1538520;
        b3 = 0.86650 * b3 + w * 0.3104856;
        b4 = 0.55000 * b4 + w * 0.5329522;
        b5 = -0.7616 * b5 - w * 0.0168980;
        data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11;
        b6 = w * 0.115926;
      }
    }
  }
  return buf;
}

type SoundGraph = {
  nodes: (AudioBufferSourceNode | OscillatorNode)[];
  start: () => void;
};

/**
 * WHITE NOISE — Pure, flat, uniform "shhhh" static.
 * Intentionally unfiltered to sound like classic white noise / TV static.
 * Only a gentle high-shelf rolloff above 14kHz to prevent harshness.
 */
function buildWhiteNoise(ctx: AudioContext, master: GainNode): SoundGraph {
  const src = ctx.createBufferSource();
  src.buffer = makeNoiseBuffer(ctx, 4, "white");
  src.loop = true;

  const shelf = ctx.createBiquadFilter();
  shelf.type = "highshelf";
  shelf.frequency.value = 14000;
  shelf.gain.value = -6;

  src.connect(shelf);
  shelf.connect(master);

  return { nodes: [src], start: () => src.start() };
}

/**
 * RAIN — Deep, warm, enveloping rumble.
 * Uses BROWN noise (not white!) with aggressive low-pass at 150Hz
 * to create a bass-heavy "rain on a rooftop" sound.
 * A second layer adds faint high-frequency "droplet patter" at very low volume.
 * Slow LFO (0.06Hz) modulates the rumble gain for natural wave-like intensity.
 *
 * This sounds NOTHING like white noise — it's mostly sub-bass rumble.
 */
function buildRain(ctx: AudioContext, master: GainNode): SoundGraph {
  const nodes: (AudioBufferSourceNode | OscillatorNode)[] = [];

  // === Layer 1: Deep bass rumble (brown noise → 150Hz lowpass) ===
  const rumble = ctx.createBufferSource();
  rumble.buffer = makeNoiseBuffer(ctx, 6, "brown");
  rumble.loop = true;

  const rumbleLP = ctx.createBiquadFilter();
  rumbleLP.type = "lowpass";
  rumbleLP.frequency.value = 150;
  rumbleLP.Q.value = 0.7;

  const rumbleGain = ctx.createGain();
  rumbleGain.gain.value = 0.85;

  rumble.connect(rumbleLP);
  rumbleLP.connect(rumbleGain);
  rumbleGain.connect(master);
  nodes.push(rumble);

  // === Layer 2: Mid-low body (brown noise → 400Hz lowpass) ===
  const body = ctx.createBufferSource();
  body.buffer = makeNoiseBuffer(ctx, 5, "brown");
  body.loop = true;

  const bodyLP = ctx.createBiquadFilter();
  bodyLP.type = "lowpass";
  bodyLP.frequency.value = 400;
  bodyLP.Q.value = 0.5;

  const bodyGain = ctx.createGain();
  bodyGain.gain.value = 0.25;

  body.connect(bodyLP);
  bodyLP.connect(bodyGain);
  bodyGain.connect(master);
  nodes.push(body);

  // === Layer 3: Faint high patter (white noise → narrow bandpass at 3kHz) ===
  const patter = ctx.createBufferSource();
  patter.buffer = makeNoiseBuffer(ctx, 3, "white");
  patter.loop = true;

  const patterBP = ctx.createBiquadFilter();
  patterBP.type = "bandpass";
  patterBP.frequency.value = 3000;
  patterBP.Q.value = 2;

  const patterGain = ctx.createGain();
  patterGain.gain.value = 0.04;

  patter.connect(patterBP);
  patterBP.connect(patterGain);
  patterGain.connect(master);
  nodes.push(patter);

  // === Layer 4: THUNDER — Brown noise with very low pass, modulated by ultra-slow LFO ===
  // Creates periodic distant thunder rumbles that swell and fade
  const thunder = ctx.createBufferSource();
  thunder.buffer = makeNoiseBuffer(ctx, 8, "brown");
  thunder.loop = true;

  const thunderLP = ctx.createBiquadFilter();
  thunderLP.type = "lowpass";
  thunderLP.frequency.value = 80; // Sub-bass — deep, distant thunder
  thunderLP.Q.value = 1.2;

  const thunderGain = ctx.createGain();
  thunderGain.gain.value = 0; // Starts silent, LFO brings it in

  thunder.connect(thunderLP);
  thunderLP.connect(thunderGain);
  thunderGain.connect(master);
  nodes.push(thunder);

  // Thunder LFO — very slow (0.03Hz ≈ 33s cycle) so thunder swells in/out naturally
  const thunderLFO = ctx.createOscillator();
  thunderLFO.type = "sine";
  thunderLFO.frequency.value = 0.03;
  const thunderLFOGain = ctx.createGain();
  thunderLFOGain.gain.value = 0.6; // Thunder peaks at 0.6 volume
  thunderLFO.connect(thunderLFOGain);
  thunderLFOGain.connect(thunderGain.gain);
  nodes.push(thunderLFO);

  // === Layer 5: Secondary thunder crack — higher band for "crack" texture ===
  const crack = ctx.createBufferSource();
  crack.buffer = makeNoiseBuffer(ctx, 4, "brown");
  crack.loop = true;

  const crackBP = ctx.createBiquadFilter();
  crackBP.type = "bandpass";
  crackBP.frequency.value = 200;
  crackBP.Q.value = 1.5;

  const crackGain = ctx.createGain();
  crackGain.gain.value = 0;

  crack.connect(crackBP);
  crackBP.connect(crackGain);
  crackGain.connect(master);
  nodes.push(crack);

  // Crack LFO — slightly offset frequency so thunder layers don't peak together
  const crackLFO = ctx.createOscillator();
  crackLFO.type = "sine";
  crackLFO.frequency.value = 0.022; // ~45s cycle, out of phase with main thunder
  const crackLFOGain = ctx.createGain();
  crackLFOGain.gain.value = 0.15;
  crackLFO.connect(crackLFOGain);
  crackLFOGain.connect(crackGain.gain);
  nodes.push(crackLFO);

  // === Rain intensity LFO ===
  const lfo = ctx.createOscillator();
  lfo.type = "sine";
  lfo.frequency.value = 0.06;
  const lfoGain = ctx.createGain();
  lfoGain.gain.value = 0.2;
  lfo.connect(lfoGain);
  lfoGain.connect(rumbleGain.gain);
  nodes.push(lfo);

  return {
    nodes,
    start: () => {
      rumble.start();
      body.start();
      patter.start();
      thunder.start();
      crack.start();
      thunderLFO.start();
      crackLFO.start();
      lfo.start();
    },
  };
}

/**
 * CAFÉ — Warm vocal murmur with conversation-like modulation.
 * Uses PINK noise (not white or brown!) through multiple vocal formant bandpass filters
 * centered at 400Hz and 1800Hz to mimic human speech murmur.
 * Fast amplitude modulation (0.3Hz, 0.7Hz) creates conversation-like rhythm.
 * A faint metallic "clink" layer at 5kHz adds cup/spoon texture.
 *
 * This sounds like distant muffled conversation, not static or rain.
 */
function buildCafe(ctx: AudioContext, master: GainNode): SoundGraph {
  const nodes: (AudioBufferSourceNode | OscillatorNode)[] = [];

  // === Layer 1: Vocal murmur — pink noise through chest-voice formant (400Hz) ===
  const murmur = ctx.createBufferSource();
  murmur.buffer = makeNoiseBuffer(ctx, 6, "pink");
  murmur.loop = true;

  const f1 = ctx.createBiquadFilter();
  f1.type = "bandpass";
  f1.frequency.value = 400;
  f1.Q.value = 2.5;

  const f1Gain = ctx.createGain();
  f1Gain.gain.value = 0.5;

  murmur.connect(f1);
  f1.connect(f1Gain);
  f1Gain.connect(master);
  nodes.push(murmur);

  // === Layer 2: Speech clarity — pink noise through sibilance formant (1800Hz) ===
  const speech = ctx.createBufferSource();
  speech.buffer = makeNoiseBuffer(ctx, 5, "pink");
  speech.loop = true;

  const f2 = ctx.createBiquadFilter();
  f2.type = "bandpass";
  f2.frequency.value = 1800;
  f2.Q.value = 3;

  const f2Gain = ctx.createGain();
  f2Gain.gain.value = 0.18;

  speech.connect(f2);
  f2.connect(f2Gain);
  f2Gain.connect(master);
  nodes.push(speech);

  // === Layer 3: Distinct Voice A — "oo" vowel formant (male voice, ~300Hz + 700Hz) ===
  // Simulates a deeper male voice in the background
  const voiceA = ctx.createBufferSource();
  voiceA.buffer = makeNoiseBuffer(ctx, 7, "pink");
  voiceA.loop = true;

  const voiceAF1 = ctx.createBiquadFilter();
  voiceAF1.type = "bandpass";
  voiceAF1.frequency.value = 300; // Male chest fundamental
  voiceAF1.Q.value = 4;

  const voiceAF2 = ctx.createBiquadFilter();
  voiceAF2.type = "bandpass";
  voiceAF2.frequency.value = 700; // First formant for "oo"
  voiceAF2.Q.value = 3;

  const voiceAGain = ctx.createGain();
  voiceAGain.gain.value = 0.12;

  voiceA.connect(voiceAF1);
  voiceAF1.connect(voiceAGain);
  voiceA.connect(voiceAF2);
  voiceAF2.connect(voiceAGain);
  voiceAGain.connect(master);
  nodes.push(voiceA);

  // === Layer 4: Distinct Voice B — "ah" vowel formant (female voice, ~500Hz + 2500Hz) ===
  // Simulates a higher female voice, creating conversation contrast
  const voiceB = ctx.createBufferSource();
  voiceB.buffer = makeNoiseBuffer(ctx, 4, "pink");
  voiceB.loop = true;

  const voiceBF1 = ctx.createBiquadFilter();
  voiceBF1.type = "bandpass";
  voiceBF1.frequency.value = 500; // Female chest fundamental
  voiceBF1.Q.value = 4;

  const voiceBF2 = ctx.createBiquadFilter();
  voiceBF2.type = "bandpass";
  voiceBF2.frequency.value = 2500; // "ah" presence formant
  voiceBF2.Q.value = 3.5;

  const voiceBGain = ctx.createGain();
  voiceBGain.gain.value = 0.08;

  voiceB.connect(voiceBF1);
  voiceBF1.connect(voiceBGain);
  voiceB.connect(voiceBF2);
  voiceBF2.connect(voiceBGain);
  voiceBGain.connect(master);
  nodes.push(voiceB);

  // === Layer 5: Cup clinks — white noise through very narrow 5kHz band ===
  const clink = ctx.createBufferSource();
  clink.buffer = makeNoiseBuffer(ctx, 2, "white");
  clink.loop = true;

  const clinkBP = ctx.createBiquadFilter();
  clinkBP.type = "bandpass";
  clinkBP.frequency.value = 5000;
  clinkBP.Q.value = 6;

  const clinkGain = ctx.createGain();
  clinkGain.gain.value = 0.015;

  clink.connect(clinkBP);
  clinkBP.connect(clinkGain);
  clinkGain.connect(master);
  nodes.push(clink);

  // === LFO 1: Slow conversation swell on vocal murmur ===
  const lfo1 = ctx.createOscillator();
  lfo1.type = "sine";
  lfo1.frequency.value = 0.3;
  const lfo1G = ctx.createGain();
  lfo1G.gain.value = 0.2;
  lfo1.connect(lfo1G);
  lfo1G.connect(f1Gain.gain);
  nodes.push(lfo1);

  // === LFO 2: Faster cross-talk rhythm on speech layer ===
  const lfo2 = ctx.createOscillator();
  lfo2.type = "sine";
  lfo2.frequency.value = 0.7;
  const lfo2G = ctx.createGain();
  lfo2G.gain.value = 0.1;
  lfo2.connect(lfo2G);
  lfo2G.connect(f2Gain.gain);
  nodes.push(lfo2);

  // === LFO 3: Voice A rhythm — slower "talking pace" modulation ===
  const lfo3 = ctx.createOscillator();
  lfo3.type = "sine";
  lfo3.frequency.value = 0.15; // ~6.5s cycle — slow sentence cadence
  const lfo3G = ctx.createGain();
  lfo3G.gain.value = 0.08;
  lfo3.connect(lfo3G);
  lfo3G.connect(voiceAGain.gain);
  nodes.push(lfo3);

  // === LFO 4: Voice B rhythm — offset "response" cadence ===
  const lfo4 = ctx.createOscillator();
  lfo4.type = "sine";
  lfo4.frequency.value = 0.45; // ~2.2s cycle — quicker interjections
  const lfo4G = ctx.createGain();
  lfo4G.gain.value = 0.06;
  lfo4.connect(lfo4G);
  lfo4G.connect(voiceBGain.gain);
  nodes.push(lfo4);

  return {
    nodes,
    start: () => {
      murmur.start();
      speech.start();
      voiceA.start();
      voiceB.start();
      clink.start();
      lfo1.start();
      lfo2.start();
      lfo3.start();
      lfo4.start();
    },
  };
}

// ============================================================
// Hook
// ============================================================

export function useAmbientSound() {
  const [active, setActive] = useState<SoundType | null>(null);
  const [volume, setVolume] = useState(0.5);
  const ctxRef = useRef<AudioContext | null>(null);
  const nodesRef = useRef<(AudioBufferSourceNode | OscillatorNode)[]>([]);
  const masterRef = useRef<GainNode | null>(null);

  /** Stop all currently playing audio nodes */
  const stop = useCallback(() => {
    nodesRef.current.forEach((n) => {
      try { n.stop(); } catch { /* already stopped */ }
    });
    nodesRef.current = [];
    masterRef.current = null;
  }, []);

  /** Start a specific sound — creates fresh AudioContext nodes */
  const play = useCallback(
    (sound: SoundType) => {
      stop();

      if (sound === "Silence") {
        setActive("Silence");
        return;
      }

      if (!ctxRef.current) ctxRef.current = new AudioContext();
      const ctx = ctxRef.current;
      if (ctx.state === "suspended") ctx.resume();

      const master = ctx.createGain();
      master.gain.value = volume;
      master.connect(ctx.destination);
      masterRef.current = master;

      // Each sound type maps to its own distinct builder function
      let graph: SoundGraph | null = null;
      switch (sound) {
        case "Rain":        graph = buildRain(ctx, master); break;
        case "Café":        graph = buildCafe(ctx, master); break;
        case "White Noise": graph = buildWhiteNoise(ctx, master); break;
      }

      if (graph) {
        nodesRef.current = graph.nodes;
        graph.start();
      }

      setActive(sound);
    },
    [stop, volume],
  );

  /** Toggle a sound on/off */
  const toggle = useCallback(
    (sound: SoundType) => {
      if (active === sound) {
        stop();
        setActive(null);
      } else {
        play(sound);
      }
    },
    [active, play, stop],
  );

  // Sync volume changes to the live master gain node
  useEffect(() => {
    if (masterRef.current) {
      masterRef.current.gain.setValueAtTime(volume, masterRef.current.context.currentTime);
    }
  }, [volume]);

  // Cleanup on unmount
  useEffect(() => () => stop(), [stop]);

  return { active, toggle, volume, setVolume };
}
