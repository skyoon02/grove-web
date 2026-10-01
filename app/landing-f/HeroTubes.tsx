"use client";

import { useEffect, useRef } from "react";

type TubesApp = { dispose: () => void };
type TubesOptions = {
  tubes: { colors: string[]; lights: { intensity: number; colors: string[] } };
  sleepRadiusX?: number;
  sleepRadiusY?: number;
  sleepTimeScale1: number;
  sleepTimeScale2: number;
};

declare global {
  interface Window {
    TubesCursor?: (canvas: HTMLCanvasElement, options: TubesOptions) => TubesApp;
    __groveTubesLoader?: Promise<void>;
  }
}

function loadTubes() {
  if (window.TubesCursor) return Promise.resolve();
  if (window.__groveTubesLoader) return window.__groveTubesLoader;

  window.__groveTubesLoader = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "/landing-f/source/assets/tubes1.min.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Hero visual could not be loaded"));
    document.head.appendChild(script);
  });

  return window.__groveTubesLoader;
}

const TUBES_OPTIONS: TubesOptions = {
  tubes: {
    colors: ["#d84b2a", "#e8794f", "#c8b8a6"],
    lights: { intensity: 180, colors: ["#ffb08a", "#e2512e", "#f2d7c7", "#a93920"] },
  },
  sleepRadiusX: 680,
  sleepRadiusY: 360,
  sleepTimeScale1: 0.32,
  sleepTimeScale2: 0.44,
};

export default function HeroTubes({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!canvas || reduced.matches) return;

    let disposed = false;
    let app: TubesApp | undefined;
    let lastW = 0;
    let lastH = 0;

    const init = () => {
      if (disposed || !window.TubesCursor) return;
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      if (!w || !h) return;
      if (w === lastW && h === lastH && app) return;
      lastW = w;
      lastH = h;
      app?.dispose();
      app = window.TubesCursor(canvas, TUBES_OPTIONS);
    };

    loadTubes()
      .then(() => { if (!disposed) init(); })
      .catch(() => { canvas.dataset.failed = "true"; });

    const observer = new ResizeObserver(() => { if (!disposed) init(); });
    observer.observe(canvas);

    return () => {
      disposed = true;
      app?.dispose();
      observer.disconnect();
    };
  }, []);

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
}
