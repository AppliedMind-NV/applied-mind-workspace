import { useState, useRef, useCallback, useEffect } from "react";

export type SoundType = "Rain" | "Café" | "White Noise" | "Silence";

function createNoiseBuffer(ctx: AudioContext, seconds: number = 4, channels = 2) {
  const size = ctx.sampleRate * seconds;
  const buffer = ctx.createBuffer(channels, size, ctx.sampleRate);
  for (let ch = 0; ch < channels; ch++) {
    const data = buffer.getChannelData(ch);
    for (let i = 0; i < size; i++) {
      data[i] = Math.random() * 2 - 1;
    }
  }
  return buffer;
}

/**
 * WHITE NOISE — Classic flat, uniform "shhhh" static.
 * Minimal filtering so it stays distinctly different from rain/café.
 */
function buildWhiteNoise(ctx: AudioContext, masterGain: GainNode) {
  const src = ctx.createBufferSource();
  src.buffer = createNoiseBuffer(ctx, 4);
  src.loop = true;
  // Just a very gentle top-end rolloff to avoid harshness
  const shelf = ctx.createBiquadFilter();
  shelf.type = "highshelf";
  shelf.frequency.value = 12000;
  shelf.gain.value = -3;
  src.connect(shelf);
  shelf.connect(masterGain);
  return { sources: [src] as (AudioBufferSourceNode | OscillatorNode)[], start: () => src.start() };
}

/**
 * RAIN — Deep, warm rumble with occasional high-frequency patter.
 * Heavy low-pass to sound like rain on a roof, NOT like white noise.
 */
function buildRain(ctx: AudioContext, masterGain: GainNode) {
  const nodes: (AudioBufferSourceNode | OscillatorNode)[] = [];

  // Layer 1: Deep rumble (heavily low-passed brown noise)
  const rumbleSrc = ctx.createBufferSource();
  const rumbleBuf = ctx.createBuffer(2, ctx.sampleRate * 5, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const data = rumbleBuf.getChannelData(ch);
    let last = 0;
    for (let i = 0; i < data.length; i++) {
      last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
      data[i] = last * 3.5;
    }
  }
  rumbleSrc.buffer = rumbleBuf;
  rumbleSrc.loop = true;
  const rumbleLP = ctx.createBiquadFilter();
  rumbleLP.type = "lowpass";
  rumbleLP.frequency.value = 300; // Very low — deep thunder/roof rumble
  rumbleLP.Q.value = 0.5;
  const rumbleGain = ctx.createGain();
  rumbleGain.gain.value = 0.7;
  rumbleSrc.connect(rumbleLP);
  rumbleLP.connect(rumbleGain);
  rumbleGain.connect(masterGain);
  nodes.push(rumbleSrc);

  // Layer 2: Mid-range patter (bandpassed noise, narrower than white noise)
  const patterSrc = ctx.createBufferSource();
  patterSrc.buffer = createNoiseBuffer(ctx, 3);
  patterSrc.loop = true;
  const patterBP = ctx.createBiquadFilter();
  patterBP.type = "bandpass";
  patterBP.frequency.value = 2000;
  patterBP.Q.value = 1.5; // Narrow band — sounds like droplets
  const patterGain = ctx.createGain();
  patterGain.gain.value = 0.12;
  patterSrc.connect(patterBP);
  patterBP.connect(patterGain);
  patterGain.connect(masterGain);
  nodes.push(patterSrc);

  // Layer 3: Very subtle high sparkle for drip texture
  const dripSrc = ctx.createBufferSource();
  dripSrc.buffer = createNoiseBuffer(ctx, 2);
  dripSrc.loop = true;
  const dripHP = ctx.createBiquadFilter();
  dripHP.type = "highpass";
  dripHP.frequency.value = 7000;
  const dripGain = ctx.createGain();
  dripGain.gain.value = 0.03;
  dripSrc.connect(dripHP);
  dripHP.connect(dripGain);
  dripGain.connect(masterGain);
  nodes.push(dripSrc);

  // Slow modulation for natural wave-like rain intensity
  const lfo = ctx.createOscillator();
  lfo.type = "sine";
  lfo.frequency.value = 0.1;
  const lfoGain = ctx.createGain();
  lfoGain.gain.value = 0.15;
  lfo.connect(lfoGain);
  lfoGain.connect(rumbleGain.gain);
  lfo.start();
  nodes.push(lfo);

  return {
    sources: nodes,
    start: () => {
      (nodes[0] as AudioBufferSourceNode).start();
      (nodes[1] as AudioBufferSourceNode).start();
      (nodes[2] as AudioBufferSourceNode).start();
    },
  };
}

/**
 * CAFÉ — Warm vocal-range murmur with clinks and distinct "chatter" texture.
 * Uses formant-like bands (300-3000Hz) and amplitude modulation to mimic conversation.
 */
function buildCafe(ctx: AudioContext, masterGain: GainNode) {
  const nodes: (AudioBufferSourceNode | OscillatorNode)[] = [];

  // Layer 1: Warm murmur — brown noise through vocal-range bandpass
  const murmurSrc = ctx.createBufferSource();
  const murmurBuf = ctx.createBuffer(2, ctx.sampleRate * 6, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const data = murmurBuf.getChannelData(ch);
    let last = 0;
    for (let i = 0; i < data.length; i++) {
      last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
      data[i] = last * 3.5;
    }
  }
  murmurSrc.buffer = murmurBuf;
  murmurSrc.loop = true;

  // Vocal formant 1 (~400Hz — chest voice)
  const f1 = ctx.createBiquadFilter();
  f1.type = "bandpass";
  f1.frequency.value = 400;
  f1.Q.value = 1.5;
  const f1Gain = ctx.createGain();
  f1Gain.gain.value = 0.4;
  murmurSrc.connect(f1);
  f1.connect(f1Gain);
  f1Gain.connect(masterGain);
  nodes.push(murmurSrc);

  // Layer 2: Higher chatter — pink noise through speech formants
  const chatterSrc = ctx.createBufferSource();
  const chatterBuf = ctx.createBuffer(2, ctx.sampleRate * 4, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const data = chatterBuf.getChannelData(ch);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < data.length; i++) {
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
  chatterSrc.buffer = chatterBuf;
  chatterSrc.loop = true;

  // Vocal formant 2 (~2200Hz — sibilance/clarity)
  const f2 = ctx.createBiquadFilter();
  f2.type = "bandpass";
  f2.frequency.value = 2200;
  f2.Q.value = 2;
  const f2Gain = ctx.createGain();
  f2Gain.gain.value = 0.15;
  chatterSrc.connect(f2);
  f2.connect(f2Gain);
  f2Gain.connect(masterGain);
  nodes.push(chatterSrc);

  // Layer 3: Clink/clatter — narrow high band with amplitude wobble
  const clinkSrc = ctx.createBufferSource();
  clinkSrc.buffer = createNoiseBuffer(ctx, 2);
  clinkSrc.loop = true;
  const clinkBP = ctx.createBiquadFilter();
  clinkBP.type = "bandpass";
  clinkBP.frequency.value = 4500;
  clinkBP.Q.value = 4; // Very narrow — metallic clink character
  const clinkGain = ctx.createGain();
  clinkGain.gain.value = 0.025;
  clinkSrc.connect(clinkBP);
  clinkBP.connect(clinkGain);
  clinkGain.connect(masterGain);
  nodes.push(clinkSrc);

  // Conversation ebb and flow — multiple LFOs at different speeds
  const lfo1 = ctx.createOscillator();
  lfo1.type = "sine";
  lfo1.frequency.value = 0.07; // Slow swell
  const lfo1G = ctx.createGain();
  lfo1G.gain.value = 0.15;
  lfo1.connect(lfo1G);
  lfo1G.connect(f1Gain.gain);
  lfo1.start();
  nodes.push(lfo1);

  const lfo2 = ctx.createOscillator();
  lfo2.type = "sine";
  lfo2.frequency.value = 0.13; // Faster — cross-talk rhythm
  const lfo2G = ctx.createGain();
  lfo2G.gain.value = 0.08;
  lfo2.connect(lfo2G);
  lfo2G.connect(f2Gain.gain);
  lfo2.start();
  nodes.push(lfo2);

  return {
    sources: nodes,
    start: () => {
      (nodes[0] as AudioBufferSourceNode).start();
      (nodes[1] as AudioBufferSourceNode).start();
      (nodes[2] as AudioBufferSourceNode).start();
    },
  };
}


export function useAmbientSound() {
  const [active, setActive] = useState<SoundType | null>(null);
  const [volume, setVolume] = useState(0.5);
  const ctxRef = useRef<AudioContext | null>(null);
  const sourcesRef = useRef<(AudioBufferSourceNode | OscillatorNode)[]>([]);
  const masterGainRef = useRef<GainNode | null>(null);

  const stop = useCallback(() => {
    sourcesRef.current.forEach((s) => {
      try { s.stop(); } catch {}
    });
    sourcesRef.current = [];
    masterGainRef.current = null;
  }, []);

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

      const masterGain = ctx.createGain();
      masterGain.gain.value = volume;
      masterGain.connect(ctx.destination);
      masterGainRef.current = masterGain;

      let graph: { sources: (AudioBufferSourceNode | OscillatorNode)[]; start: () => void } | null = null;

      if (sound === "Rain") graph = buildRain(ctx, masterGain);
      else if (sound === "Café") graph = buildCafe(ctx, masterGain);
      else if (sound === "White Noise") graph = buildWhiteNoise(ctx, masterGain);
      else if (sound === "Lo-Fi") graph = buildLoFi(ctx, masterGain);

      if (graph) {
        sourcesRef.current = graph.sources;
        graph.start();
      }
      setActive(sound);
    },
    [stop, volume]
  );

  const toggle = useCallback(
    (sound: SoundType) => {
      if (active === sound) {
        stop();
        setActive(null);
      } else {
        play(sound);
      }
    },
    [active, play, stop]
  );

  useEffect(() => {
    if (masterGainRef.current) {
      masterGainRef.current.gain.setValueAtTime(volume, masterGainRef.current.context.currentTime);
    }
  }, [volume]);

  useEffect(() => () => stop(), [stop]);

  return { active, toggle, volume, setVolume };
}
