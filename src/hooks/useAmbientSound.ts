import { useState, useRef, useCallback, useEffect } from "react";

type SoundType = "Rain" | "Café" | "White Noise" | "Silence";

function createNoiseBuffer(ctx: AudioContext, type: "white" | "pink" | "brown") {
  const size = ctx.sampleRate * 2;
  const buffer = ctx.createBuffer(1, size, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  if (type === "white") {
    for (let i = 0; i < size; i++) data[i] = Math.random() * 2 - 1;
  } else if (type === "brown") {
    let last = 0;
    for (let i = 0; i < size; i++) {
      const white = Math.random() * 2 - 1;
      last = (last + 0.02 * white) / 1.02;
      data[i] = last * 3.5;
    }
  } else {
    // pink
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < size; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    }
  }
  return buffer;
}

function buildGraph(ctx: AudioContext, sound: SoundType) {
  const gain = ctx.createGain();
  gain.gain.value = 0.3;
  gain.connect(ctx.destination);

  if (sound === "White Noise") {
    const src = ctx.createBufferSource();
    src.buffer = createNoiseBuffer(ctx, "white");
    src.loop = true;
    src.connect(gain);
    return { source: src, gain };
  }

  if (sound === "Rain") {
    const src = ctx.createBufferSource();
    src.buffer = createNoiseBuffer(ctx, "brown");
    src.loop = true;
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 800;
    src.connect(lp);
    lp.connect(gain);
    return { source: src, gain };
  }

  if (sound === "Café") {
    const src = ctx.createBufferSource();
    src.buffer = createNoiseBuffer(ctx, "pink");
    src.loop = true;
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 500;
    bp.Q.value = 0.5;
    src.connect(bp);
    bp.connect(gain);
    gain.gain.value = 0.2;
    return { source: src, gain };
  }

  return null;
}

export function useAmbientSound() {
  const [active, setActive] = useState<SoundType | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);

  const stop = useCallback(() => {
    try { sourceRef.current?.stop(); } catch {}
    sourceRef.current = null;
    gainRef.current = null;
  }, []);

  const play = useCallback((sound: SoundType) => {
    stop();
    if (sound === "Silence") {
      setActive("Silence");
      return;
    }

    if (!ctxRef.current) ctxRef.current = new AudioContext();
    const ctx = ctxRef.current;
    if (ctx.state === "suspended") ctx.resume();

    const graph = buildGraph(ctx, sound);
    if (graph) {
      sourceRef.current = graph.source;
      gainRef.current = graph.gain;
      graph.source.start();
    }
    setActive(sound);
  }, [stop]);

  const toggle = useCallback((sound: SoundType) => {
    if (active === sound) {
      stop();
      setActive(null);
    } else {
      play(sound);
    }
  }, [active, play, stop]);

  useEffect(() => () => stop(), [stop]);

  return { active, toggle };
}
