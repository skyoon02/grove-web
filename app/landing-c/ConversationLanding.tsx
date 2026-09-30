"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import AICardOrbit, { AI_QUESTION } from "./AICardOrbit";
import ExperienceOrbit from "./ExperienceOrbit";
import HalftoneTrail from "./HalftoneTrail";
import StoryFlow from "./StoryFlow";
import s from "./conversation.module.css";

export default function ConversationLanding() {
  const root = useRef<HTMLDivElement>(null);
  const heroPromptRef = useRef<HTMLDivElement>(null);
  const reduced = useRef(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [headerVisible, setHeaderVisible] = useState(true);
  const [headerLight, setHeaderLight] = useState(true);
  const [groveReady, setGroveReady] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    reduced.current = preference.matches;
    const updatePreference = () => { reduced.current = preference.matches; };
    preference.addEventListener("change", updatePreference);
    const groveTimer = setTimeout(() => setGroveReady(true), 120);
    return () => { clearTimeout(groveTimer); preference.removeEventListener("change", updatePreference); };
  }, []);

  useEffect(() => {
    const scroller = root.current;
    if (!scroller) return;

    if (menuOpen) return;

    let lastScrollY = scroller.scrollTop;
    let scrollDistance = 0;
    let scrollDirection: "up" | "down" | null = null;
    let frame = 0;

    const updateContrast = () => {
      const header = headerRef.current;
      const sampleX = Math.round(window.innerWidth / 2);
      const sampleY = Math.min(40, Math.round(window.innerHeight / 10));
      const surfaces = document.elementsFromPoint(sampleX, sampleY)
        .filter(el => !header?.contains(el));
      const hasImage = surfaces.some(el => {
        if (el instanceof HTMLImageElement) return true;
        return window.getComputedStyle(el).backgroundImage.includes("url(");
      });
      if (hasImage) { setHeaderLight(true); return; }
      let surface: HTMLElement | null = surfaces[0] instanceof HTMLElement ? surfaces[0] as HTMLElement : null;
      while (surface) {
        const color = window.getComputedStyle(surface).backgroundColor;
        const ch = color.match(/[\d.]+/g)?.map(Number);
        if (ch && ch.length >= 3 && (ch[3] ?? 1) > 0.2) {
          const lum = (0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2]) / 255;
          setHeaderLight(lum < 0.46);
          return;
        }
        surface = surface.parentElement;
      }
      setHeaderLight(false);
    };

    const updateHeader = () => {
      const currentScrollY = Math.max(scroller.scrollTop, 0);
      const delta = currentScrollY - lastScrollY;

      if (currentScrollY < 72) {
        setHeaderVisible(true);
        scrollDistance = 0;
      } else if (Math.abs(delta) > 0.5) {
        const direction = delta > 0 ? "down" : "up";
        if (direction !== scrollDirection) {
          scrollDirection = direction;
          scrollDistance = 0;
        }
        scrollDistance += Math.abs(delta);
        if (scrollDistance >= 24) {
          setHeaderVisible(direction === "up");
          scrollDistance = 0;
        }
      }

      lastScrollY = currentScrollY;
      frame = 0;
      updateContrast();
    };

    const handleScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(updateHeader);
    };

    scroller.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", updateContrast);
    updateContrast();
    return () => {
      scroller.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", updateContrast);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [menuOpen]);

  useEffect(() => {
    const scroller = root.current;
    if (!scroller || !menuOpen) return;
    const savedScroll = scroller.scrollTop;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    const closeOnDesktop = () => {
      if (window.innerWidth > 720) setMenuOpen(false);
    };

    scroller.style.overflowY = "hidden";
    document.addEventListener("keydown", closeOnEscape);
    window.addEventListener("resize", closeOnDesktop);
    return () => {
      scroller.style.overflowY = "";
      scroller.scrollTop = savedScroll;
      document.removeEventListener("keydown", closeOnEscape);
      window.removeEventListener("resize", closeOnDesktop);
    };
  }, [menuOpen]);

  useEffect(() => {
    if (window.location.hash !== "#contact") return;
    const timer = window.setTimeout(() => {
      const scroller = root.current;
      const flow = scroller?.querySelector<HTMLElement>("#services")?.parentElement;
      if (!scroller || !flow) return;
      const top = flow.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop + flow.offsetHeight - scroller.clientHeight;
      scroller.scrollTo({ top, behavior: "instant" });
    }, 120);
    return () => window.clearTimeout(timer);
  }, []);

  function jump(id: string) {
    const scroller = root.current;
    const target = scroller?.querySelector<HTMLElement>(`#${id}`);
    if (scroller && id === "contact") {
      const flow = scroller.querySelector<HTMLElement>("#services")?.parentElement;
      if (flow) {
        const top = flow.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop + flow.offsetHeight - scroller.clientHeight;
        scroller.scrollTo({ top, behavior: reduced.current ? "instant" : "smooth" });
      }
    } else {
      target?.scrollIntoView({ behavior: reduced.current ? "instant" : "smooth", block: "start" });
    }
    setMenuOpen(false);
  }

  return (
    <div className={s.page} ref={root} data-b-scroll-root>
      <HalftoneTrail className={s.globalHalftone} />
      <a className={s.skip} href="#ai-orbit">AI 서비스 범위로 건너뛰기</a>
      <header ref={headerRef} className={`${s.header} ${headerVisible ? "" : s.headerHidden} ${headerLight ? s.headerLight : ""} ${menuOpen ? s.headerMenuOpen : ""}`} onFocusCapture={() => setHeaderVisible(true)}>
        <Link className={s.logo} href="/" aria-label="GROVE 처음으로"><Image src="/grove-logo.png" alt="GROVE" width={160} height={24} priority /></Link>
        <button className={s.menuButton} aria-label={menuOpen ? "메뉴 닫기" : "메뉴 열기"} aria-expanded={menuOpen} aria-controls="b-navigation" onClick={() => { if (!menuOpen) setHeaderVisible(true); setMenuOpen(!menuOpen); }}>{menuOpen ? "닫기" : "메뉴"}</button>
        <nav id="b-navigation" className={`${s.nav} ${menuOpen ? s.navOpen : ""}`} aria-label="주요 메뉴">
          <Link href="/works">WORKS</Link><Link href="/services">SERVICES</Link><Link href="/about">ABOUT</Link><a href="#contact" onClick={e => { e.preventDefault(); jump("contact"); }}>CONTACT</a>
        </nav>
      </header>

      <main>
        <section className={`${s.hero} ${groveReady ? s.heroReady : ""}`} id="about" aria-label="GROVE Hero" data-ai-scroll-section>
          <div className={s.heroScene}>
            <div className={s.heroCopy} data-hero-copy>
              <h1 className={s.heroTitle} id="b-title">
                <span>RETHINK THE WORK.</span>
                <span>CHANGE IT FOR REAL.</span>
              </h1>
            </div>
            <div
              className={s.heroPrompt}
              ref={heroPromptRef}
              aria-label={AI_QUESTION}
            >
              <p className={s.heroPromptLead} data-ai-prompt-line aria-hidden="true">{AI_QUESTION.replace(", ", ",\n")}</p>
            </div>
            <AICardOrbit promptRef={heroPromptRef} />
          </div>
        </section>

        <ExperienceOrbit />

        <StoryFlow />
      </main>
    </div>
  );
}
