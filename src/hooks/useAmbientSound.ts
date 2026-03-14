import { useState, useRef, useCallback, useEffect } from "react";

type SoundType = "Rain" | "Café" | "White Noise" | "Silence";

function createNoiseBuffer(ctx: AudioContext, seconds: number = 4) {
  const size = ctx.sampleRate * seconds;
  const buffer = ctx.createBuffer(2, size, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const data = buffer.getChannelData(ch);
    for (let i = 0; i < size; i++) {
      data[i] = Math.random() * 2 - 1;
    }
  }
  return buffer;
}

function buildRain(ctx: AudioContext, masterGain: GainNode) {
  const nodes: AudioNode[] = [];

  // Layer 1: Heavy rain — brown noise through low-pass
  const heavySrc = ctx.createBufferSource();
  heavySrc.buffer = createNoiseBuffer(ctx, 4);
  heavySrc.loop = true;
  const heavyLP = ctx.createBiquadFilter();
  heavyLP.type = "lowpass";
  heavyLP.frequency.value = 600;
  heavyLP.Q.value = 0.7;
  const heavyGain = ctx.createGain();
  heavyGain.gain.value = 0.6;
  heavySrc.connect(heavyLP);
  heavyLP.connect(heavyGain);
  heavyGain.connect(masterGain);
  nodes.push(heavySrc);

  // Layer 2: Light drizzle — highpass filtered noise
  const lightSrc = ctx.createBufferSource();
  lightSrc.buffer = createNoiseBuffer(ctx, 3);
  lightSrc.loop = true;
  const lightHP = ctx.createBiquadFilter();
  lightHP.type = "highpass";
  lightHP.frequency.value = 4000;
  const lightLP = ctx.createBiquadFilter();
  lightLP.type = "lowpass";
  lightLP.frequency.value = 8000;
  const lightGain = ctx.createGain();
  lightGain.gain.value = 0.15;
  lightSrc.connect(lightHP);
  lightHP.connect(lightLP);
  lightLP.connect(lightGain);
  lightGain.connect(masterGain);
  nodes.push(lightSrc);

  // Layer 3: Mid-frequency rain texture
  const midSrc = ctx.createBufferSource();
  midSrc.buffer = createNoiseBuffer(ctx, 5);
  midSrc.loop = true;
  const midBP = ctx.createBiquadFilter();
  midBP.type = "bandpass";
  midBP.frequency.value = 1500;
  midBP.Q.value = 0.4;
  const midGain = ctx.createGain();
  midGain.gain.value = 0.3;
  midSrc.connect(midBP);
  midBP.connect(midGain);
  midGain.connect(masterGain);
  nodes.push(midSrc);

  // Layer 4: Slow amplitude modulation for natural variation
  const lfo = ctx.createOscillator();
  lfo.type = "sine";
  lfo.frequency.value = 0.15;
  const lfoGain = ctx.createGain();
  lfoGain.gain.value = 0.08;
  lfo.connect(lfoGain);
  lfoGain.connect(heavyGain.gain);
  lfo.start();
  nodes.push(lfo);

  return {
    sources: nodes as (AudioBufferSourceNode | OscillatorNode)[],
    start: () => {
      (nodes[0] as AudioBufferSourceNode).start();
      (nodes[1] as AudioBufferSourceNode).start();
      (nodes[2] as AudioBufferSourceNode).start();
    },
  };
}

function buildCafe(ctx: AudioContext, masterGain: GainNode) {
  const nodes: (AudioBufferSourceNode | OscillatorNode)[] = [];

  // Layer 1: Low murmur — filtered brown noise
  const murmurSrc = ctx.createBufferSource();
  const murmurBuf = ctx.createBuffer(2, ctx.sampleRate * 4, ctx.sampleRate);
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
  const murmurBP = ctx.createBiquadFilter();
  murmurBP.type = "bandpass";
  murmurBP.frequency.value = 350;
  murmurBP.Q.value = 0.6;
  const murmurGain = ctx.createGain();
  murmurGain.gain.value = 0.5;
  murmurSrc.connect(murmurBP);
  murmurBP.connect(murmurGain);
  murmurGain.connect(masterGain);
  nodes.push(murmurSrc);

  // Layer 2: Chatter simulation — pink noise with formant-like filtering
  const chatterSrc = ctx.createBufferSource();
  const chatterBuf = ctx.createBuffer(2, ctx.sampleRate * 6, ctx.sampleRate);
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

  // Formant 1 (~800Hz — vowel-like)
  const f1 = ctx.createBiquadFilter();
  f1.type = "bandpass";
  f1.frequency.value = 800;
  f1.Q.value = 2;
  // Formant 2 (~2500Hz)
  const f2 = ctx.createBiquadFilter();
  f2.type = "bandpass";
  f2.frequency.value = 2500;
  f2.Q.value = 2;

  const chatterGain = ctx.createGain();
  chatterGain.gain.value = 0.25;

  const merger = ctx.createChannelMerger(2);
  chatterSrc.connect(f1);
  chatterSrc.connect(f2);
  f1.connect(merger, 0, 0);
  f2.connect(merger, 0, 1);
  merger.connect(chatterGain);
  chatterGain.connect(masterGain);
  nodes.push(chatterSrc);

  // Layer 3: Subtle clinks / high frequency sparkle
  const clinkSrc = ctx.createBufferSource();
  clinkSrc.buffer = createNoiseBuffer(ctx, 3);
  clinkSrc.loop = true;
  const clinkHP = ctx.createBiquadFilter();
  clinkHP.type = "highpass";
  clinkHP.frequency.value = 6000;
  const clinkGain = ctx.createGain();
  clinkGain.gain.value = 0.04;
  clinkSrc.connect(clinkHP);
  clinkHP.connect(clinkGain);
  clinkGain.connect(masterGain);
  nodes.push(clinkSrc);

  // Amplitude modulation for natural ebb and flow of conversation
  const lfo1 = ctx.createOscillator();
  lfo1.type = "sine";
  lfo1.frequency.value = 0.08;
  const lfo1Gain = ctx.createGain();
  lfo1Gain.gain.value = 0.12;
  lfo1.connect(lfo1Gain);
  lfo1Gain.connect(chatterGain.gain);
  lfo1.start();
  nodes.push(lfo1);

  const lfo2 = ctx.createOscillator();
  lfo2.type = "sine";
  lfo2.frequency.value = 0.03;
  const lfo2Gain = ctx.createGain();
  lfo2Gain.gain.value = 0.1;
  lfo2.connect(lfo2Gain);
  lfo2Gain.connect(murmurGain.gain);
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

function buildWhiteNoise(ctx: AudioContext, masterGain: GainNode) {
  const src = ctx.createBufferSource();
  src.buffer = createNoiseBuffer(ctx, 4);
  src.loop = true;

  // Gentle high-shelf rolloff so it's not harsh
  const shelf = ctx.createBiquadFilter();
  shelf.type = "highshelf";
  shelf.frequency.value = 8000;
  shelf.gain.value = -6;

  src.connect(shelf);
  shelf.connect(masterGain);

  return {
    sources: [src] as AudioBufferSourceNode[],
    start: () => src.start(),
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

  // Update volume in real-time
  useEffect(() => {
    if (masterGainRef.current) {
      masterGainRef.current.gain.setValueAtTime(volume, masterGainRef.current.context.currentTime);
    }
  }, [volume]);

  useEffect(() => () => stop(), [stop]);

  return { active, toggle, volume, setVolume };
}
