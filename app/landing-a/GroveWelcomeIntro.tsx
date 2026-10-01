import React, { useCallback, useEffect, useRef, useState } from "react";

const PAGE_STYLES = `
    .grove-welcome-root {
      --cinema-ease: cubic-bezier(.16, 1, .3, 1);
      --cinema-wipe: cubic-bezier(.76, 0, .24, 1);
      isolation: isolate;
      background: #050606;
      transition: transform 1120ms var(--cinema-wipe), filter 760ms ease;
    }
    .grove-welcome-root.is-leaving {
      transform: translate3d(0, -105%, 0);
      filter: brightness(.8);
      pointer-events: none;
      will-change: transform;
    }
    .grove-welcome-atmosphere {
      position: absolute;
      inset: -9%;
      background:
        radial-gradient(circle at 50% 46%, rgba(110, 126, 126, .11), transparent 28%),
        radial-gradient(circle at 18% 16%, rgba(74, 88, 82, .1), transparent 32%),
        linear-gradient(118deg, #090b0b 0%, #020303 48%, #0a0c0c 100%);
      animation: grove-camera-drift 5.8s cubic-bezier(.2,.7,.2,1) both;
      transform-origin: 50% 48%;
      will-change: transform;
    }
    .grove-welcome-vignette {
      position: absolute;
      inset: 0;
      z-index: 2;
      pointer-events: none;
      background:
        linear-gradient(180deg, rgba(0,0,0,.42), transparent 24%, transparent 72%, rgba(0,0,0,.58)),
        radial-gradient(ellipse at center, transparent 36%, rgba(0,0,0,.62) 100%);
    }
    .grove-welcome-root::after {
      content: "";
      position: absolute;
      inset: 0;
      z-index: 3;
      pointer-events: none;
      opacity: .14;
      background-image: repeating-linear-gradient(0deg, rgba(255,255,255,.025) 0, rgba(255,255,255,.025) 1px, transparent 1px, transparent 4px);
      mix-blend-mode: soft-light;
    }
    @keyframes grove-camera-drift {
      0% { opacity: 0; transform: scale(1.075) translate3d(0, 1.2%, 0); }
      18% { opacity: 1; }
      100% { opacity: 1; transform: scale(1) translate3d(0, 0, 0); }
    }
    @keyframes grove-word-appear {
      0% { opacity: 0; clip-path: inset(100% 0 0 0); transform: translate3d(0, .72em, 0); filter: blur(8px); }
      35% { opacity: 1; }
      100% { opacity: 1; clip-path: inset(0 0 0 0); transform: translate3d(0, 0, 0); filter: blur(0); }
    }
    @keyframes grove-grid-draw {
      0% { stroke-dashoffset: 320; opacity: 0; }
      42% { opacity: .18; }
      100% { stroke-dashoffset: 0; opacity: .1; }
    }
    @keyframes grove-corner-in {
      0% { opacity: 0; transform: scale(.72); }
      100% { opacity: .62; transform: scale(1); }
    }
    .grove-word-animate {
      display: inline-block;
      margin: 0 .08em;
      opacity: 0;
      animation: grove-word-appear 1050ms var(--cinema-ease) var(--word-delay, 0ms) both;
    }
    .grove-title-row { display: block; overflow: visible; }
    .grove-grid-line {
      stroke: #9ba9a5;
      stroke-width: .5;
      stroke-dasharray: 5 7;
      stroke-dashoffset: 320;
      opacity: 0;
      animation: grove-grid-draw 1850ms cubic-bezier(.2,.7,.2,1) var(--line-delay, 0ms) both;
    }
    .grove-corner {
      position: absolute;
      width: 42px;
      height: 42px;
      border-color: rgba(205, 214, 210, .22);
      opacity: 0;
      animation: grove-corner-in 900ms var(--cinema-ease) var(--corner-delay, 0ms) both;
    }
    .grove-corner::after {
      content: "";
      position: absolute;
      width: 4px;
      height: 4px;
      border-radius: 50%;
      background: rgba(218, 225, 222, .75);
    }
    .grove-corner--tl { border-width: 1px 0 0 1px; }
    .grove-corner--tr { border-width: 1px 1px 0 0; }
    .grove-corner--bl { border-width: 0 0 1px 1px; }
    .grove-corner--br { border-width: 0 1px 1px 0; }
    .grove-corner--tl::after { left: -2px; top: -2px; }
    .grove-corner--tr::after { right: -2px; top: -2px; }
    .grove-corner--bl::after { left: -2px; bottom: -2px; }
    .grove-corner--br::after { right: -2px; bottom: -2px; }
    .grove-welcome-root.is-leaving .grove-intro-content {
      transform: translate3d(0, 24px, 0) scale(.992);
      opacity: 0;
      filter: blur(6px);
    }
    .grove-intro-content { transition: transform 760ms var(--cinema-ease), opacity 520ms ease, filter 620ms ease; }
    @media (max-width: 640px) { .grove-corner { width: 32px; height: 32px; } }
    @media (prefers-reduced-motion: reduce) {
      .grove-welcome-root { transition-duration: 120ms; }
      .grove-welcome-atmosphere, .grove-word-animate, .grove-grid-line, .grove-corner {
        animation: none !important;
        opacity: 1 !important;
        filter: none !important;
        transform: none !important;
        clip-path: none !important;
      }
    }
  `;

type GroveWelcomeIntroProps = {
  onExitStart?: () => void;
  onComplete?: () => void;
  autoCompleteMs?: number;
};

const EXIT_DURATION_MS = 1120;
const PRELOAD_LEAD_MS = 0;

const GroveWelcomeIntro = ({
  onExitStart,
  onComplete,
  autoCompleteMs = 2200,
}: GroveWelcomeIntroProps) => {
  const [isLeaving, setIsLeaving] = useState(false);
  const completionTimerRef = useRef<number | null>(null);
  const completedRef = useRef(false);

  const startExit = useCallback(() => {
    setIsLeaving(true);
    completionTimerRef.current = window.setTimeout(
      () => onComplete?.(),
      EXIT_DURATION_MS,
    );
  }, [onComplete]);

  useEffect(() => {
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reducedMotion) {
      const t = window.setTimeout(() => { onExitStart?.(); startExit(); }, 900);
      return () => window.clearTimeout(t);
    }
    // 2초 전에 iframe 미리 로드, 이후 exit 애니메이션 시작
    const preloadDelay = Math.max(0, autoCompleteMs - PRELOAD_LEAD_MS);
    const t1 = window.setTimeout(() => {
      if (!completedRef.current) onExitStart?.();
    }, preloadDelay);
    const t2 = window.setTimeout(() => {
      if (completedRef.current) return;
      completedRef.current = true;
      startExit();
    }, autoCompleteMs);
    return () => { window.clearTimeout(t1); window.clearTimeout(t2); };
  }, [autoCompleteMs, onExitStart, startExit]);

  useEffect(
    () => () => {
      if (completionTimerRef.current) {
        window.clearTimeout(completionTimerRef.current);
      }
    },
    [],
  );

  return (
    <>
      <style>{PAGE_STYLES}</style>

      <div className={`grove-welcome-root ${isLeaving ? "is-leaving" : ""} fixed inset-0 z-[9998] min-h-screen overflow-hidden text-slate-100`}>
        <div className="grove-welcome-atmosphere" aria-hidden="true" />

        <svg className="absolute inset-0 z-[1] h-full w-full pointer-events-none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <defs>
            <pattern id="groveGrid" width="72" height="72" patternUnits="userSpaceOnUse">
              <path d="M 72 0 L 0 0 0 72" fill="none" stroke="rgba(118, 132, 127, 0.055)" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#groveGrid)" />
          <line x1="0" y1="20%" x2="100%" y2="20%" className="grove-grid-line" style={{ "--line-delay": "260ms" } as React.CSSProperties} />
          <line x1="0" y1="80%" x2="100%" y2="80%" className="grove-grid-line" style={{ "--line-delay": "420ms" } as React.CSSProperties} />
          <line x1="20%" y1="0" x2="20%" y2="100%" className="grove-grid-line" style={{ "--line-delay": "580ms" } as React.CSSProperties} />
          <line x1="80%" y1="0" x2="80%" y2="100%" className="grove-grid-line" style={{ "--line-delay": "740ms" } as React.CSSProperties} />
          <line x1="50%" y1="0" x2="50%" y2="100%" className="grove-grid-line" style={{ "--line-delay": "900ms" } as React.CSSProperties} />
          <line x1="0" y1="50%" x2="100%" y2="50%" className="grove-grid-line" style={{ "--line-delay": "1060ms" } as React.CSSProperties} />
        </svg>

        <div className="grove-welcome-vignette" aria-hidden="true" />
        <div className="grove-corner grove-corner--tl left-4 top-4 sm:left-6 sm:top-6 md:left-8 md:top-8" style={{ "--corner-delay": "360ms" } as React.CSSProperties} aria-hidden="true" />
        <div className="grove-corner grove-corner--tr right-4 top-4 sm:right-6 sm:top-6 md:right-8 md:top-8" style={{ "--corner-delay": "500ms" } as React.CSSProperties} aria-hidden="true" />
        <div className="grove-corner grove-corner--bl bottom-4 left-4 sm:bottom-6 sm:left-6 md:bottom-8 md:left-8" style={{ "--corner-delay": "640ms" } as React.CSSProperties} aria-hidden="true" />
        <div className="grove-corner grove-corner--br bottom-4 right-4 sm:bottom-6 sm:right-6 md:bottom-8 md:right-8" style={{ "--corner-delay": "780ms" } as React.CSSProperties} aria-hidden="true" />

        <div className="grove-intro-content relative z-10 min-h-screen px-6 py-10 sm:px-8 sm:py-12 md:px-16 md:py-20">
          <p className="relative z-[1] text-center text-[10px] font-mono font-light uppercase tracking-[0.22em] text-slate-300/75 sm:text-xs md:text-sm">
            <span className="grove-word-animate" style={{ "--word-delay": "260ms" } as React.CSSProperties}>GROVE</span>
            <span className="grove-word-animate" style={{ "--word-delay": "350ms" } as React.CSSProperties}>/</span>
            <span className="grove-word-animate" style={{ "--word-delay": "440ms" } as React.CSSProperties}>IT</span>
            <span className="grove-word-animate" style={{ "--word-delay": "530ms" } as React.CSSProperties}>CONSULTANCY</span>
          </p>

          <div className="absolute inset-0 mx-auto flex w-full max-w-6xl flex-col items-center justify-center px-6 text-center sm:px-8">
            <h1 className="font-extralight leading-[0.93] tracking-[-0.052em] text-slate-50">
              <span className="grove-title-row text-[clamp(2.7rem,7vw,7.4rem)]">
                <span className="grove-word-animate" style={{ "--word-delay": "720ms" } as React.CSSProperties}>WHERE</span>
                <span className="grove-word-animate" style={{ "--word-delay": "850ms" } as React.CSSProperties}>SHOULD</span>
              </span>
              <span className="grove-title-row text-[clamp(2.7rem,7vw,7.4rem)]">
                <span className="grove-word-animate" style={{ "--word-delay": "1040ms" } as React.CSSProperties}>CHANGE</span>
                <span className="grove-word-animate" style={{ "--word-delay": "1170ms" } as React.CSSProperties}>REALLY</span>
                <span className="grove-word-animate" style={{ "--word-delay": "1300ms" } as React.CSSProperties}>BEGIN?</span>
              </span>
            </h1>

            <p className="mt-7 text-base font-light leading-relaxed tracking-[-0.02em] text-slate-300 sm:mt-8 sm:text-lg md:text-xl">
              <span className="grove-word-animate" style={{ "--word-delay": "1740ms" } as React.CSSProperties}>변화는</span>
              <span className="grove-word-animate" style={{ "--word-delay": "1840ms" } as React.CSSProperties}>어디에서부터</span>
              <br className="sm:hidden" />
              <span className="grove-word-animate" style={{ "--word-delay": "1950ms" } as React.CSSProperties}>시작되어야</span>
              <span className="grove-word-animate" style={{ "--word-delay": "2060ms" } as React.CSSProperties}>할까요?</span>
            </p>
          </div>

        </div>
      </div>
    </>
  );
};

export default GroveWelcomeIntro;
