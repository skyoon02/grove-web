"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import dynamic from "next/dynamic";
import s from "./conversation.module.css";

const GeometricStudy = dynamic(() => import("./GeometricStudy"), {
  ssr: false,
  loading: () => <div className={s.storyModelLoading} aria-hidden="true"><span /></div>,
});

const ParticleCanvas = dynamic(() => import("./ParticleCanvas"), { ssr: false });

const stages = [
  {
    mode: "고민에서 핵심으로",
    title: ["고민에서,", "핵심으로."],
    lead: "무엇이 필요한지 분명해지도록",
    text: "서비스의 본질부터 다시 정의하는",
    brandAfter: true,
    items: ["Consulting", "Strategy", "Planning"],
    object: "core",
    theme: "find",
  },
  {
    mode: "생각에서 실행으로",
    title: ["생각에서,", "실행으로."],
    lead: "전략이 현실이 되도록",
    text: "기획부터 개발까지 전 과정을 책임지는",
    brandAfter: true,
    items: ["Planning", "Development", "AI"],
    object: "build",
    theme: "build",
  },
  {
    mode: "운영에서 확장으로",
    title: ["운영에서,", "확장으로."],
    lead: "변화가 일하는 방식이 되도록",
    text: "서비스의 다음 단계까지 설계하는",
    brandAfter: true,
    items: ["Operations", "Optimization", "AX"],
    object: "evolve",
    theme: "keep",
  },
] as const;

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);
const lerp = (from: number, to: number, amount: number) => from + (to - from) * amount;
const smoothstep = (value: number) => value * value * (3 - 2 * value);

export default function StoryFlow() {
  const flowRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const panels = useRef<(HTMLElement | null)[]>([]);
  const drawerRef = useRef<HTMLElement>(null);
  const drawerCloseRef = useRef<HTMLButtonElement>(null);
  const drawerTriggerRef = useRef<HTMLButtonElement>(null);
  const drawerWasOpen = useRef(false);
  const [activeStage, setActiveStage] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const panelCount = stages.length + 1;

  useEffect(() => {
    const flow = flowRef.current;
    const viewport = viewportRef.current;
    const track = trackRef.current;
    if (!flow || !viewport || !track) return;

    const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const compactLayout = window.matchMedia("(max-width: 900px)");
    let reduceMotion = motionPreference.matches;
    let target = 0;
    let current = 0;
    let frame = 0;
    let alignmentFrame = 0;
    let visible = false;
    let lastActiveStage = 0;
    let serviceAnchorPending = window.location.hash === "#services";

    const updateTarget = () => {
      const rect = flow.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const travel = Math.max(flow.offsetHeight - viewportHeight, 1);
      const progress = clamp(-rect.top / travel, 0, 1);
      const nextTarget = progress * panelCount;
      if (serviceAnchorPending && nextTarget < 1) {
        target = 1;
        return;
      }
      serviceAnchorPending = false;
      target = nextTarget;
    };

    const render = () => {
      current = reduceMotion ? target : lerp(current, target, 0.07);
      if (Math.abs(target - current) < 0.0005) current = target;
      const entrance = clamp(current, 0, 1);
      const easedEntrance = 1 - Math.pow(1 - entrance, 3);
      const rawChapter = clamp(current - 1, 0, panelCount - 1);
      const chapterIndex = Math.floor(rawChapter);
      const chapterFraction = rawChapter - chapterIndex;
      const chapterTransition = smoothstep(clamp((chapterFraction - 0.48) / 0.52, 0, 1));
      const chapterPosition = Math.min(chapterIndex + chapterTransition, panelCount - 1);
      const nextActiveStage = Math.min(Math.round(chapterPosition), panelCount - 1);
      if (nextActiveStage !== lastActiveStage) {
        lastActiveStage = nextActiveStage;
        setActiveStage(nextActiveStage);
      }

      if (compactLayout.matches || reduceMotion) {
        track.style.transform = "none";
      } else {
        const y = (1 - easedEntrance) * 100;
        track.style.transform = `translate3d(0, ${y.toFixed(3)}%, 0)`;
      }

      panels.current.forEach((panel, index) => {
        if (!panel) return;
        if (compactLayout.matches || reduceMotion) {
          panel.style.opacity = "1";
          panel.style.pointerEvents = "auto";
          panel.style.removeProperty("z-index");
          panel.style.removeProperty("clip-path");
          panel.style.removeProperty("--story-content-y");
          panel.style.removeProperty("--story-copy-opacity");
          panel.style.removeProperty("--story-visual-opacity");
          panel.style.removeProperty("--story-visual-x");
          panel.style.removeProperty("--story-object-scale");
          panel.removeAttribute("aria-hidden");
          panel.inert = false;
          return;
        }

        const reveal = index === 0
          ? 1
          : smoothstep(clamp(chapterPosition - (index - 1), 0, 1));
        const isActive = index === nextActiveStage;
        const visibleServiceIndex = Math.min(nextActiveStage, stages.length - 1);
        panel.style.zIndex = String(index + 1);
        if (index === panelCount - 1) {
          panel.style.opacity = "1";
          panel.style.clipPath = `inset(${((1 - reveal) * 100).toFixed(3)}% 0 0 0)`;
          panel.style.setProperty("--story-copy-opacity", "1");
          panel.style.setProperty("--story-visual-opacity", "1");
          panel.style.setProperty("--story-visual-x", "0px");
        } else {
          const switchDistance = Math.min(Math.abs(chapterPosition - visibleServiceIndex), 0.5);
          const copyOpacity = smoothstep(clamp(1 - switchDistance / 0.5, 0, 1));
          const visualDistance = Math.abs(chapterPosition - index);
          const visualOpacity = smoothstep(clamp(1 - visualDistance, 0, 1));
          const visualX = (index - chapterPosition) * window.innerWidth * 0.18;
          panel.style.opacity = "1";
          panel.style.clipPath = "none";
          panel.style.setProperty(
            "--story-copy-opacity",
            index === visibleServiceIndex ? copyOpacity.toFixed(4) : "0",
          );
          panel.style.setProperty("--story-visual-opacity", visualOpacity.toFixed(4));
          panel.style.setProperty("--story-visual-x", `${visualX.toFixed(2)}px`);
        }
        panel.style.pointerEvents = isActive ? "auto" : "none";
        panel.style.setProperty("--story-content-y", `${((1 - reveal) * 14).toFixed(2)}px`);
        panel.style.setProperty(
          "--story-object-scale",
          index < stages.length
            ? (1 + Math.min(Math.abs(chapterPosition - index), 1) * 0.012).toFixed(4)
            : "1",
        );
        panel.setAttribute("aria-hidden", isActive ? "false" : "true");
        panel.inert = !isActive;
      });
    };

    const loop = () => {
      if (!visible) return;
      updateTarget();
      render();
      frame = window.requestAnimationFrame(loop);
    };
    const start = () => {
      if (visible) return;
      visible = true;
      frame = window.requestAnimationFrame(loop);
    };
    const stop = () => {
      visible = false;
      window.cancelAnimationFrame(frame);
    };
    const updatePreference = () => {
      reduceMotion = motionPreference.matches;
      updateTarget();
      current = target;
      render();
    };

    const scrollRoot = flow.closest("[class*=page]");
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) start();
      else stop();
    }, { root: scrollRoot, rootMargin: "15% 0px" });

    observer.observe(viewport);
    motionPreference.addEventListener("change", updatePreference);
    compactLayout.addEventListener("change", updatePreference);
    updateTarget();
    current = target;
    render();
    start();
    alignmentFrame = window.requestAnimationFrame(() => {
      alignmentFrame = window.requestAnimationFrame(() => {
        updateTarget();
        current = target;
        render();
        const viewportRect = viewport.getBoundingClientRect();
        if (viewportRect.bottom > 0 && viewportRect.top < window.innerHeight) start();
      });
    });

    return () => {
      stop();
      window.cancelAnimationFrame(alignmentFrame);
      observer.disconnect();
      motionPreference.removeEventListener("change", updatePreference);
      compactLayout.removeEventListener("change", updatePreference);
    };
  }, [panelCount]);

  useEffect(() => {
    const page = flowRef.current?.closest<HTMLElement>('[class*=page]');
    if (!page) return;
    if (drawerOpen) {
      const saved = page.scrollTop;
      page.style.overflow = 'hidden';
      drawerCloseRef.current?.focus();
      return () => { page.style.overflow = ''; page.scrollTop = saved; };
    }
  }, [drawerOpen]);

  useEffect(() => {
    if (drawerWasOpen.current && !drawerOpen) {
      drawerTriggerRef.current?.focus({ preventScroll: true });
    }
    drawerWasOpen.current = drawerOpen;
  }, [drawerOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!drawerOpen) return;
      if (e.key === 'Escape') { setDrawerOpen(false); return; }
      if (e.key === 'Tab') {
        const drawer = drawerRef.current;
        if (!drawer) return;
        const focusable = [...drawer.querySelectorAll<HTMLElement>('button:not([disabled]),a[href]')];
        if (!focusable.length) return;
        const first = focusable[0], last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [drawerOpen]);

  return (
  <>
    <div
      ref={flowRef}
      className={s.storyFlow}
      style={{ "--story-flow-height": `${(panelCount + 1) * 100}dvh` } as CSSProperties}
    >
      <span id="services" className={s.storyAnchor} aria-hidden="true" />
      <div ref={viewportRef} className={s.storyViewport}>
        <div ref={trackRef} className={s.storyTrack}>
          {stages.map((stage, index) => (
            <section
              className={`${s.storyPanel} ${s.servicePanel} ${s[`story${stage.theme[0].toUpperCase()}${stage.theme.slice(1)}`]}`}
              key={stage.mode}
              aria-labelledby={`b-stage-${index}`}
              ref={node => { panels.current[index] = node; }}
            >
              <div className={s.storyScene}>
                <div className={s.storyVisual} role="img" aria-label={`${stage.mode}를 표현한 기하학적 3D 오브젝트`}>
                  <GeometricStudy variant={stage.object} active={activeStage === index} />
                </div>
                <div className={s.storyStageCopy}>
                  <h2 id={`b-stage-${index}`}>
                    {stage.title.map(line => <span key={line}>{line}</span>)}
                  </h2>
                  <p className={s.storyStatement}>
                    <span>{stage.lead}</span>
                    <span>
                      {stage.brandAfter
                        ? <>{stage.text} <strong>그로브</strong></>
                        : <><strong>그로브</strong>는 {stage.text}</>}
                    </span>
                  </p>
                  <ul className={s.serviceScope} aria-label="서비스 범위">
                    {stage.items.map(item => <li key={item}>{item}</li>)}
                  </ul>
                </div>
              </div>
            </section>
          ))}

          <section
            className={`${s.storyPanel} ${s.storyContact}`}
            id="contact"
            aria-labelledby="b-contact-title"
            ref={node => { panels.current[panelCount - 1] = node; }}
          >
            <div className={s.contactTop}>
              <h2 id="b-contact-title">Beyond the screen.<br />Change the work.</h2>
              <div className={s.contactSide}>
                <p className={s.storyContactLead}>보이는 경험을 만들고,<br />보이지 않는 일을 바꿉니다.</p>
                <div>
                  <button ref={drawerTriggerRef} type="button" className={s.contactCta} onClick={() => setDrawerOpen(true)}>
                    변화를 함께 만들기
                    <span className={s.contactCtaIcon} aria-hidden="true">↗</span>
                  </button>
                </div>
              </div>
            </div>
            <ParticleCanvas className={s.contactParticle} />
            <div className={s.contactFooterRow}>
              <span>© grovesoft Co., Ltd. All Rights Reserved</span>
              <div className={s.contactFooterLinks}>
                <a href="mailto:request@grovesoft.net">request@grovesoft.net</a>
                <a href="tel:0234822630">02-3482-2630</a>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>

    <div
      className={`${s.contactBackdrop} ${drawerOpen ? s.contactBackdropOpen : ""}`}
      aria-hidden="true"
      onClick={() => setDrawerOpen(false)}
    />
    <aside
      ref={drawerRef}
      className={`${s.contactDrawer} ${drawerOpen ? s.contactDrawerOpen : ""}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="b-drawer-title"
      aria-hidden={!drawerOpen}
    >
      <button
        ref={drawerCloseRef}
        type="button"
        className={s.drawerClose}
        aria-label="상담 패널 닫기"
        onClick={() => setDrawerOpen(false)}
      />
      <div className={s.drawerBody}>
        <div className={s.drawerLeft}>
          <h2 className={s.drawerTitle} id="b-drawer-title">어디까지<br />바꿀까요?</h2>
          <p className={s.drawerLead}>사용자가 보는 경험부터 화면 뒤에서 움직이는 업무까지.<br />지금 필요한 변화를 함께 설계합니다.</p>
          <dl className={s.drawerInfoList}>
            <div className={s.drawerInfoRow}>
              <dt>Call</dt>
              <dd><a href="tel:0234822630">02-3482-2630</a></dd>
            </div>
            <div className={s.drawerInfoRow}>
              <dt>Email</dt>
              <dd><a href="mailto:request@grovesoft.net">request@grovesoft.net</a></dd>
            </div>
          </dl>
        </div>
        <form className={s.drawerForm} onSubmit={e => e.preventDefault()}>
          <p className={s.drawerFormTitle}>어떤 경험과 업무를 바꾸고 싶으신가요?</p>
          <div className={s.drawerField}>
            <label className={s.drawerLabel} htmlFor="contact-name">이름</label>
            <input id="contact-name" className={s.drawerInput} type="text" placeholder="성함 또는 회사명" autoComplete="name" />
          </div>
          <div className={s.drawerField}>
            <label className={s.drawerLabel} htmlFor="contact-contact">연락처</label>
            <input id="contact-contact" className={s.drawerInput} type="text" placeholder="이메일 또는 전화번호" autoComplete="email" />
          </div>
          <div className={s.drawerField}>
            <label className={s.drawerLabel} htmlFor="contact-desc">프로젝트 내용</label>
            <textarea id="contact-desc" className={s.drawerTextarea} placeholder="새로 만들 경험이나 바꾸고 싶은 업무에 대해 자유롭게 남겨주세요." rows={5} />
          </div>
          <button type="submit" className={s.drawerSubmit}>보내기 <span aria-hidden="true">↗</span></button>
        </form>
      </div>
    </aside>
  </>
  );
}
