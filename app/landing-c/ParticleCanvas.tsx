"use client";

import { useEffect, useRef } from "react";

type Particle = { ox: number; oy: number; x: number; y: number; vx: number; vy: number };

export default function ParticleCanvas({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d", { alpha: false });
    if (!canvas || !context) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const mouse = { x: -99999, y: -99999 };
    const particles: Particle[] = [];
    const density = 5;
    const radius = 140;
    const strength = 20;
    const ease = 0.09;
    const damping = 0.82;
    const dotSize = 2;
    let width = 0;
    let height = 0;
    let frame = 0;
    let buildVersion = 0;
    let disposed = false;

    const draw = (animate: boolean) => {
      context.fillStyle = "#080907";
      context.fillRect(0, 0, width, height);
      context.fillStyle = "#eeeae2";
      particles.forEach(p => {
        if (animate) {
          const dx = p.x - mouse.x;
          const dy = p.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          if (dist < radius) {
            const force = (1 - dist / radius) * strength;
            p.vx += (dx / dist) * force;
            p.vy += (dy / dist) * force;
          }
          p.vx += (p.ox - p.x) * ease;
          p.vy += (p.oy - p.y) * ease;
          p.vx *= damping;
          p.vy *= damping;
          p.x += p.vx;
          p.y += p.vy;
        }
        context.fillRect(Math.round(p.x), Math.round(p.y), dotSize, dotSize);
      });
    };

    const loop = () => { draw(true); frame = window.requestAnimationFrame(loop); };

    const buildParticles = () => {
      const version = ++buildVersion;
      if (width <= 0 || height <= 0) {
        particles.length = 0;
        return;
      }
      const off = document.createElement("canvas");
      off.width = width; off.height = height;
      const ctx = off.getContext("2d");
      if (!ctx) return;
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, width, height);

      const sample = () => {
        if (disposed || version !== buildVersion || width <= 0 || height <= 0) return;
        const pixels = ctx.getImageData(0, 0, width, height).data;
        particles.length = 0;
        for (let y = 0; y < height; y += density) {
          for (let x = 0; x < width; x += density) {
            const i = (y * width + x) * 4;
            const lum = (pixels[i] * 0.299 + pixels[i + 1] * 0.587 + pixels[i + 2] * 0.114) / 255;
            if (pixels[i + 3] > 128 && lum < 0.55) particles.push({ ox: x, oy: y, x, y, vx: 0, vy: 0 });
          }
        }
        draw(false);
      };

      const logo = new Image();
      logo.onload = () => {
        const scale = Math.min((width * 0.78) / logo.naturalWidth, (height * 0.5) / logo.naturalHeight);
        const iw = logo.naturalWidth * scale;
        const ih = logo.naturalHeight * scale;
        ctx.drawImage(logo, (width - iw) / 2, (height - ih) / 2, iw, ih);
        sample();
      };
      logo.onerror = () => {
        ctx.fillStyle = "#000";
        ctx.font = `650 ${Math.round(Math.min(width * 0.45, height * 0.5))}px Pretendard, Arial, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("GROVE", width / 2, height / 2);
        sample();
      };
      logo.src = "/grove-logo.png";
    };

    const resize = () => {
      width = canvas.width = Math.max(0, Math.round(canvas.offsetWidth));
      height = canvas.height = Math.max(0, Math.round(canvas.offsetHeight));
      buildParticles();
    };

    const move = (e: PointerEvent) => {
      const b = canvas.getBoundingClientRect();
      mouse.x = e.clientX - b.left;
      mouse.y = e.clientY - b.top;
    };
    const leave = () => { mouse.x = -99999; mouse.y = -99999; };

    const observer = new ResizeObserver(resize);
    canvas.addEventListener("pointermove", move, { passive: true });
    canvas.addEventListener("pointerleave", leave, { passive: true });
    observer.observe(canvas);
    resize();
    if (!reduceMotion) loop();

    return () => {
      disposed = true;
      buildVersion += 1;
      observer.disconnect();
      window.cancelAnimationFrame(frame);
      canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerleave", leave);
    };
  }, []);

  return <canvas ref={canvasRef} className={className} aria-label="GROVE" />;
}
