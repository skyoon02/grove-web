"use client";

import { useLayoutEffect, useRef, type CSSProperties, type RefObject } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import s from "./ai-card-orbit.module.css";

gsap.registerPlugin(ScrollTrigger);

const CAPABILITIES = [
  { name: "CONSULTING", description: "현황을 진단하고 변화의 우선순위를 정합니다." },
  { name: "RESEARCH", description: "사용자·현업·시장을 조사해 판단의 근거를 만듭니다." },
  { name: "STRATEGY", description: "목표에 맞는 방향·범위·우선순위를 설계합니다." },
  { name: "PLANNING", description: "전략을 기능·정책·프로세스로 구체화합니다." },
  { name: "WORKFLOW", description: "업무 단계와 규칙을 효율적인 흐름으로 재설계합니다." },
  { name: "PRODUCT", description: "사용자 가치와 목표를 제품 구조로 연결합니다." },
  { name: "UX", description: "업무 맥락을 읽고 사용자 여정을 설계합니다." },
  { name: "UI", description: "정보와 기능을 명확한 화면과 인터랙션으로 구현합니다." },
  { name: "DESIGN SYSTEM", description: "컴포넌트 기준으로 일관성과 확장성을 만듭니다." },
  { name: "PROTOTYPE", description: "핵심 시나리오를 빠르게 시각화하고 검증합니다." },
  { name: "ARCHITECTURE", description: "연동·확장·운영을 고려한 시스템 구조를 설계합니다." },
  { name: "PLATFORM", description: "서비스·기능·데이터를 잇는 기반을 설계합니다." },
  { name: "DEVELOPMENT", description: "정의된 요구사항을 실제 서비스로 구현합니다." },
  { name: "INTEGRATION", description: "시스템과 데이터를 연결해 업무 흐름을 통합합니다." },
  { name: "DATA", description: "데이터를 정리·분석해 운영과 판단에 연결합니다." },
  { name: "AI", description: "목적에 맞는 AI 적용 범위를 정의하고 연결합니다." },
  { name: "AUTOMATION", description: "반복 업무를 자동화 가능한 프로세스로 바꿉니다." },
  { name: "OPERATIONS", description: "운영·이슈 대응·개선 과제를 지속 관리합니다." },
  { name: "OPTIMIZATION", description: "운영 데이터로 개선 지점을 찾고 반영합니다." },
] as const;

export const AI_QUESTION = "고민이 서비스가 되기까지, 무엇이 필요할까요?";
const CENTER_LINES = ["변화의 방향부터", "다시 정의하는", "IT × AI 컨설턴시"] as const;
const CENTER_MESSAGE = CENTER_LINES.join(" ");

const clamp01 = (value: number) => Math.min(Math.max(value, 0), 1);
const lerp = (from: number, to: number, progress: number) => from + (to - from) * progress;
const smootherstep = (value: number) => {
  const progress = clamp01(value);
  return progress * progress * progress * (progress * (progress * 6 - 15) + 10);
};
const cinematicUnfold = (value: number) => {
  const progress = clamp01(value);
  if (progress < 0.18) return 0.08 * smootherstep(progress / 0.18);
  const release = (progress - 0.18) / 0.82;
  return 0.08 + 0.92 * (1 - (1 - release) ** 4);
};

export default function AICardOrbit({ promptRef }: { promptRef: RefObject<HTMLDivElement | null> }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const centerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const root = rootRef.current;
    const stage = stageRef.current;
    const prompt = promptRef.current;
    const center = centerRef.current;
    if (!root || !stage || !prompt || !center) return;

    const cards = gsap.utils.toArray<HTMLElement>(`[data-orbit-card]`, root);
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const heroScene = root.parentElement;
    const heroCopy = root.parentElement?.querySelector<HTMLElement>("[data-hero-copy]");
    const scrollSection = root.closest<HTMLElement>("[data-ai-scroll-section]");
    const scroller = root.closest<HTMLElement>("[data-b-scroll-root]");
    let scrollTrigger: ReturnType<typeof ScrollTrigger.create> | undefined;
    let progressTween: gsap.core.Tween | undefined;
    let unfoldTween: gsap.core.Tween | undefined;
    let centerTween: gsap.core.Timeline | undefined;
    let orbitTween: gsap.core.Tween | undefined;
    let intro: gsap.core.Timeline | undefined;
    let resumeFrame: number | undefined;
    let introCompleted = false;
    let previousLayout = "";
    const typeProxy = { count: 0 };
    gsap.set(center, { xPercent: -50, yPercent: -50 });
    // The hero plays once. Scrolling can finish the current reveal, but cannot
    // rewind it or start a second reveal. Resizing only remeasures geometry.
    const scene = { value: 0 };
    const unfolding = { value: 0 };
    const orbitRotation = { value: 0 };
    let render = () => {};
    const promptLine = prompt.querySelector<HTMLElement>("[data-ai-prompt-line]");
    const centerLines = gsap.utils.toArray<HTMLElement>("[data-orbit-center-line]", center);
    let centerRevealed = reduceMotion.matches;
    const setPromptText = (count: number) => {
      if (promptLine) promptLine.textContent = AI_QUESTION.slice(0, Math.max(0, Math.round(count))).replace(", ", ",\n");
    };
    gsap.set(centerLines, {
      autoAlpha: reduceMotion.matches ? 1 : 0,
      y: reduceMotion.matches ? 0 : 16,
      clipPath: reduceMotion.matches ? "inset(0 0 0% 0)" : "inset(0 0 100% 0)",
    });
    const revealCenterMessage = () => {
      if (!centerLines.length || centerRevealed) return;
      centerRevealed = true;
      centerTween = gsap.timeline().to(centerLines, {
        autoAlpha: 1,
        y: 0,
        clipPath: "inset(0 0 0% 0)",
        duration: 0.72,
        ease: "power3.out",
        stagger: 0.16,
      });
    };
    const startOrbitRolling = () => {
      if (reduceMotion.matches || unfolding.value > 0.005) return;
      if (orbitTween) {
        orbitTween.resume();
        return;
      }
      orbitTween = gsap.to(orbitRotation, {
        value: 360,
        duration: 180,
        ease: "none",
        repeat: -1,
        onUpdate: () => render(),
      });
    };
    const pauseOrbitRolling = () => {
      if (resumeFrame !== undefined) cancelAnimationFrame(resumeFrame);
      resumeFrame = undefined;
      orbitTween?.pause();
    };
    const resumeOrbitRolling = () => {
      if (resumeFrame !== undefined) cancelAnimationFrame(resumeFrame);
      resumeFrame = requestAnimationFrame(() => {
        resumeFrame = undefined;
        const cardIsBeingRead = cards.some(card => card.matches(":hover"));
        if (!cardIsBeingRead && introCompleted && unfolding.value <= 0.005) startOrbitRolling();
      });
    };
    cards.forEach(card => {
      card.addEventListener("pointerenter", pauseOrbitRolling);
      card.addEventListener("pointerleave", resumeOrbitRolling);
    });
    setPromptText(reduceMotion.matches ? AI_QUESTION.length : 0);
    const followScroll = (progress: number) => {
      if (reduceMotion.matches) return;
      if (progress > 0.005) orbitTween?.pause();
      else if (introCompleted) startOrbitRolling();
      unfoldTween?.kill();
      unfoldTween = gsap.to(unfolding, {
        value: progress,
        duration: window.matchMedia("(max-width: 720px)").matches ? 0.5 : 0.42,
        ease: "power3.out",
        overwrite: true,
        onUpdate: () => render(),
      });
      if (introCompleted || progress <= 0.005) return;
      introCompleted = true;
      intro?.kill();
      setPromptText(AI_QUESTION.length);
      prompt.removeAttribute("data-typing");
      progressTween?.kill();
      progressTween = gsap.to(scene, {
        value: 1,
        duration: Math.max(0.45, 1.45 * (1 - scene.value)),
        ease: "power3.out",
        onUpdate: () => render(),
        onComplete: () => {
          revealCenterMessage();
          if (unfolding.value <= 0.005) startOrbitRolling();
        },
      });
    };

    const layout = () => {
      const rect = root.getBoundingClientRect();
      const layoutKey = `${rect.width}:${rect.height}:${reduceMotion.matches}`;
      if (layoutKey === previousLayout) return;
      previousLayout = layoutKey;
      const mobile = window.matchMedia("(max-width: 720px)").matches;
      const radius = reduceMotion.matches ? Math.min(rect.width * 0.37, rect.height * 0.36) : mobile
        ? Math.min(rect.width * 0.37, rect.height * 0.235)
        : Math.min(rect.width * 0.205, rect.height * 0.30, 340);
      const lineWidth = mobile ? Math.min(rect.width * 0.58, 245) : Math.min(rect.width * 0.26, 360);
      const originX = rect.width * (mobile ? 0.5 : 0.72);
      const originY = rect.height * (mobile ? 0.60 : 0.5);
      const cardWidth = cards[0]?.offsetWidth ?? 80;
      const ribbonWidth = mobile ? rect.width * 2.65 : rect.width * 0.90;
      const ribbonScale = Math.min(1, ribbonWidth / (cards.length - 1) / (cardWidth + (mobile ? 5 : 7)));
      // Every transform uses the card's centre, including the static fallback.
      gsap.set(cards, { xPercent: -50, yPercent: -50 });

      if (reduceMotion.matches) {
        intro?.kill();
        progressTween?.kill();
        unfoldTween?.kill();
        centerTween?.kill();
        orbitTween?.kill();
        orbitTween = undefined;
        orbitRotation.value = 0;
        scrollTrigger?.kill();
        scrollTrigger = undefined;
        introCompleted = true;
        scene.value = 1;
        unfolding.value = 0;
        setPromptText(AI_QUESTION.length);
        prompt.removeAttribute("data-typing");
        centerRevealed = true;
        gsap.set(centerLines, { autoAlpha: 1, y: 0, clipPath: "inset(0 0 0% 0)" });
        gsap.set(prompt, { autoAlpha: 1, y: 0 });
        gsap.set(center, { autoAlpha: 1, scale: 1 });
        if (heroCopy) gsap.set(heroCopy, { autoAlpha: 1, y: 0 });
        if (heroScene) gsap.set(heroScene, { opacity: 1 });
        cards.forEach((card, index) => {
          const angle = (index / cards.length) * Math.PI * 2 - Math.PI / 2;
          gsap.set(card, {
            x: Math.cos(angle) * radius,
            y: Math.sin(angle) * radius,
            rotation: index <= cards.length / 2 ? index / cards.length * 360 : index / cards.length * 360 - 360,
            scale: 1,
            autoAlpha: 1,
          });
        });
        return;
      }

      render = () => {
        const progress = scene.value;
        const questionFade = smootherstep(progress / 0.14);
        const lineProgress = smootherstep((progress - 0.18) / 0.18);
        const circleProgress = cinematicUnfold((progress - 0.30) / 0.56);
        const centerProgress = smootherstep((progress - 0.78) / 0.18);
        const orbitAngle = orbitRotation.value * Math.PI / 180;
        // One reversible, eased scroll transformation of the existing 19 cards.
        // The cards release with a quiet centre-out wave, settle into the ribbon,
        // hold long enough to be read, then disappear before the next section.
        const copyFade = smootherstep((unfolding.value - 0.10) / 0.26);
        const mobileTravel = mobile ? smootherstep((unfolding.value - 0.54) / 0.30) : 0;
        // Finish the card fade first, hold briefly on black, then reveal the
        // next section. The two scenes never compete in the same frame.
        const handoff = smootherstep((unfolding.value - 0.94) / 0.06);
        if (heroScene) gsap.set(heroScene, { opacity: 1 - handoff });
        if (heroCopy) gsap.set(heroCopy, { autoAlpha: 1 - copyFade, y: -24 * copyFade });

        gsap.set(prompt, {
          autoAlpha: 1 - questionFade,
          y: lerp(0, -8, questionFade),
        });
        gsap.set(center, {
          autoAlpha: centerProgress * (1 - copyFade),
          scale: lerp(0.96, 1, centerProgress),
        });

        cards.forEach((card, index) => {
          const offset = index - (cards.length - 1) / 2;
          const stackX = offset * (mobile ? 1.5 : 2.4);
          const stackY = Math.abs(offset) * (mobile ? 0.38 : 0.6);
          const stackRotation = offset * (mobile ? 0.8 : 1.15);
          const lineX = ((index / (cards.length - 1)) - 0.5) * lineWidth;
          const angle = (index / cards.length) * Math.PI * 2 - Math.PI / 2 + orbitAngle;
          const circleX = Math.cos(angle) * radius;
          const circleY = Math.sin(angle) * radius;
          // Open both sides from the top. Avoid a full-turn spin on the last cards.
          const baseCircleRotation = index <= cards.length / 2
            ? index / cards.length * 360
            : index / cards.length * 360 - 360;
          const circleRotation = ((baseCircleRotation + orbitRotation.value + 180) % 360) - 180;

          const gatheredX = lerp(stackX, lineX, lineProgress);
          const gatheredY = lerp(stackY, 0, lineProgress);
          const gatheredRotation = lerp(stackRotation, 0, lineProgress);
          const order = (index + 5) % cards.length;
          const u = order / (cards.length - 1);
          const wave = Math.abs(index - (cards.length - 1) / 2) / ((cards.length - 1) / 2);
          const stackReveal = smootherstep((progress - (0.05 + u * 0.045)) / 0.16);
          const spread = smootherstep(
            (unfolding.value - (0.08 + wave * 0.035)) / (mobile ? 0.48 : 0.52),
          );
          const fadeStart = mobile ? 0.78 + u * 0.015 : 0.69 + u * 0.02;
          const cardFade = smootherstep(
            (unfolding.value - fadeStart) / (mobile ? 0.12 : 0.16),
          );
          const ribbonLift = Math.sin(spread * Math.PI) * lerp(18, 8, wave);
          const settleScale = 1 + Math.sin(spread * Math.PI) * 0.028;
          // Keep every image upright on one shared horizontal baseline.
          const ribbonX = mobile
            ? rect.width * 0.12 + u * ribbonWidth - mobileTravel * (ribbonWidth - rect.width * 0.76)
            : rect.width * 0.05 + u * ribbonWidth;
          const ribbonY = rect.height * 0.5;

          gsap.set(card, {
            x: lerp(lerp(gatheredX, circleX, circleProgress), ribbonX - originX, spread),
            y: lerp(lerp(gatheredY, circleY, circleProgress), ribbonY - originY, spread) - ribbonLift,
            rotation: lerp(lerp(gatheredRotation, circleRotation, circleProgress), 0, spread),
            scale: lerp(lerp(0.92, 1, circleProgress), ribbonScale, spread) * settleScale,
            autoAlpha: stackReveal * (1 - cardFade),
            pointerEvents: stackReveal > 0.9 && cardFade < 0.05 ? "auto" : "none",
            zIndex: index,
          });
        });
      };

      render();
      if (!scrollTrigger && scrollSection && scroller) scrollTrigger = ScrollTrigger.create({
        trigger: scrollSection,
        scroller,
        start: "top top",
        end: "bottom bottom",
        invalidateOnRefresh: true,
        onUpdate: (self) => followScroll(self.progress),
        onRefresh: (self) => followScroll(self.progress),
      });
      scrollTrigger?.refresh();
      if (!intro && !introCompleted) {
        prompt.setAttribute("data-typing", "true");
        intro = gsap.timeline({ delay: 0.18 });
        intro.to(typeProxy, {
          count: AI_QUESTION.length, duration: 1.65, ease: "none", snap: { count: 1 },
          onUpdate: () => setPromptText(typeProxy.count),
          onComplete: () => {
            setPromptText(AI_QUESTION.length);
            prompt.removeAttribute("data-typing");
          },
        }).to(scene, {
          value: 1, duration: 2.45, ease: "power2.inOut", onUpdate: () => render(),
          onComplete: () => {
            introCompleted = true;
            startOrbitRolling();
          },
        }, "+=0.06").call(revealCenterMessage, [], "+=0.08");
      }
    };

    const resizeObserver = new ResizeObserver(layout);
    resizeObserver.observe(root);
    reduceMotion.addEventListener("change", layout);
    layout();

    return () => {
      scrollTrigger?.kill();
      progressTween?.kill();
      unfoldTween?.kill();
      centerTween?.kill();
      orbitTween?.kill();
      intro?.kill();
      if (resumeFrame !== undefined) cancelAnimationFrame(resumeFrame);
      resizeObserver.disconnect();
      reduceMotion.removeEventListener("change", layout);
      cards.forEach(card => {
        card.removeEventListener("pointerenter", pauseOrbitRolling);
        card.removeEventListener("pointerleave", resumeOrbitRolling);
      });
      gsap.killTweensOf([stage, prompt, center, ...centerLines, ...cards]);
      if (heroCopy) gsap.set(heroCopy, { clearProps: "opacity,visibility,transform" });
      if (heroScene) gsap.set(heroScene, { clearProps: "opacity" });
    };
  }, [promptRef]);

  return (
    <div className={s.root} ref={rootRef} id="ai-orbit">
      <div className={s.stage} ref={stageRef}>
        <div className={s.center} ref={centerRef} aria-hidden="true">
          {CENTER_LINES.map(line => <span data-orbit-center-line key={line}>{line}</span>)}
        </div>
        {CAPABILITIES.map((capability, index) => (
          <article
            className={s.card}
            data-orbit-card
            key={capability.name}
            aria-label={`${capability.name}: ${capability.description}`}
            style={{
              "--card-image": `url("/landing-b-media/orbit-editorial-v2/${capability.name.toLowerCase().replaceAll(" ", "-")}.webp")`,
            } as CSSProperties}
          >
            <span className={s.cardInner} aria-hidden="true">
              <span className={`${s.cardFace} ${s.cardFront}`}>
                <span className={s.cardImage} aria-hidden="true" />
                <span className={s.cardLabel}>{capability.name}</span>
              </span>
              <span className={`${s.cardFace} ${s.cardBack}`}>
                <span className={s.cardNumber}>{String(index + 1).padStart(2, "0")}</span>
                <strong className={s.cardBackTitle}>{capability.name}</strong>
                <span className={s.cardDescription}>{capability.description}</span>
              </span>
            </span>
          </article>
        ))}
      </div>
      <p className={s.srOnly}>{CENTER_MESSAGE}</p>
    </div>
  );
}
