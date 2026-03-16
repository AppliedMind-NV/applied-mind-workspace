import { useEffect, useRef } from "react";

interface AudioWaveformProps {
  stream: MediaStream | null;
  isRecording: boolean;
}

export function AudioWaveform({ stream, isRecording }: AudioWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const contextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (!stream || !isRecording || !canvasRef.current) return;

    const audioCtx = new AudioContext();
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.7;

    const source = audioCtx.createMediaStreamSource(stream);
    source.connect(analyser);

    contextRef.current = audioCtx;
    analyserRef.current = analyser;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d")!;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animFrameRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);

      const dpr = window.devicePixelRatio || 1;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.scale(dpr, dpr);

      ctx.clearRect(0, 0, w, h);

      // Draw bars from center
      const barCount = 40;
      const gap = 3;
      const totalBarWidth = (w - (barCount - 1) * gap) / barCount;
      const barWidth = Math.max(2, totalBarWidth);
      const centerY = h / 2;

      // Get primary color from CSS custom property
      const computedStyle = getComputedStyle(canvas);
      const primaryHsl = computedStyle.getPropertyValue("--primary").trim();

      for (let i = 0; i < barCount; i++) {
        // Sample from the frequency data
        const dataIndex = Math.floor((i / barCount) * bufferLength);
        const value = dataArray[dataIndex] / 255;
        const barHeight = Math.max(2, value * (h * 0.8));

        const x = i * (barWidth + gap);

        // Gradient opacity based on amplitude
        const alpha = 0.3 + value * 0.7;
        ctx.fillStyle = `hsla(${primaryHsl}, ${alpha})`;

        // Draw symmetrical bars from center
        const halfBar = barHeight / 2;
        ctx.beginPath();
        ctx.roundRect(x, centerY - halfBar, barWidth, barHeight, barWidth / 2);
        ctx.fill();
      }
    };

    draw();

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      source.disconnect();
      audioCtx.close();
      analyserRef.current = null;
      contextRef.current = null;
    };
  }, [stream, isRecording]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-16 rounded-lg"
      style={{ display: isRecording ? "block" : "none" }}
    />
  );
}
