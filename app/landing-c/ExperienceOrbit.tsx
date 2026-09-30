"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import s from "./conversation.module.css";

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger);

const scenes = [
  { name: "Beauty Point", image: "/landing-b-media/portfolio-beauty-point.png", href: "/works/beauty-point" },
  { name: "KT ONMARU", image: "/works/kt-onmaru.png", href: "/works/kt-onmaru" },
  { name: "KRAFTON", image: "/landing-b-media/krafton-works.png", href: "/works" },
  { name: "HYBE", image: "/works/hybe.png", href: "/works" },
  { name: "Tonework", image: "/landing-b-media/portfolio-tonework.jpg", href: "/works" },
  { name: "Art of Healing", image: "/works/art-of-healing.png", href: "/works" },
  { name: "Taejae University", image: "/landing-b-media/portfolio-taejae.jpg", href: "/works" },
  { name: "AMORE Counselor", image: "/works/amore-counselor.png", href: "/works" },
] as const;

const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

export default function ExperienceOrbit() {
  const sectionRef = useRef<HTMLElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const wrapperRefs = useRef<(HTMLDivElement | null)[]>([]);
  const cardRefs = useRef<(HTMLAnchorElement | null)[]>([]);

  useIsomorphicLayoutEffect(() => {
    const section = sectionRef.current;
    const track = trackRef.current;
    if (!section || !track) return;

    const scrollRoot = section.closest<HTMLElement>("[class*=page]");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const media = gsap.matchMedia();
    const scope = gsap.context(() => {
      media.add({
        mobile: "(max-width: 639px)",
        tablet: "(min-width: 640px) and (max-width: 1024px)",
        desktop: "(min-width: 1025px)",
      }, (context) => {
        const conditions = context.conditions as { mobile?: boolean; tablet?: boolean };
        const step = conditions.mobile ? 2.4 : conditions.tablet ? 7.5 : 12;
        const rotateIn = conditions.mobile ? -68 : conditions.tablet ? -92 : -112;
        const rotateOut = conditions.mobile ? 58 : conditions.tablet ? 76 : 92;
        const rotationScale = reducedMotion ? 0.15 : 1;

        const horizontalTween = gsap.to(track, {
          x: () => -(track.scrollWidth - section.clientWidth),
          ease: "none",
          scrollTrigger: {
            trigger: section,
            scroller: scrollRoot ?? undefined,
            start: "top top",
            end: () => `+=${track.scrollWidth - section.clientWidth}`,
            scrub: reducedMotion ? true : 1.05,
            invalidateOnRefresh: true,
          },
        });

        cardRefs.current.forEach((card, index) => {
          const wrapper = wrapperRefs.current[index];
          if (!card || !wrapper) return;

          const mid = Math.floor(scenes.length / 2);
          const offset = index < mid
            ? -((mid - index) * step)
            : (index - mid + 1) * step;
          const rotateX = (offset < 0 ? 6 : -6) * rotationScale;

          gsap.timeline({
            scrollTrigger: {
              trigger: wrapper,
              scroller: scrollRoot ?? undefined,
              containerAnimation: horizontalTween,
              start: "left 100%",
              end: "right 0%",
              scrub: true,
            },
          }).fromTo(card, {
            rotateY: rotateIn * rotationScale,
            rotateX,
            opacity: reducedMotion ? 1 : 0.62,
            y: `${offset}vh`,
          }, {
            rotateY: 0,
            rotateX: 0,
            opacity: 1,
            y: 0,
            ease: "none",
          }).to(card, {
            rotateY: rotateOut * rotationScale,
            rotateX: -rotateX * 0.65,
            opacity: reducedMotion ? 1 : 0.78,
            y: `${-offset}vh`,
            ease: "none",
          });
        });

        ScrollTrigger.refresh();
        return () => horizontalTween.kill();
      });
    }, section);

    return () => {
      media.revert();
      scope.revert();
    };
  }, []);

  return (
    <section ref={sectionRef} className={s.orbitSection} id="portfolio" aria-labelledby="b-orbit-title">
      <h2 id="b-orbit-title" className={s.srOnly}>Beyond the screen. Change the work.</h2>
      <div ref={viewportRef} className={s.orbitViewport}>
        <div ref={trackRef} className={s.orbitTrack}>
          {scenes.map((scene, index) => (
            <div
              ref={(node) => { wrapperRefs.current[index] = node; }}
              className={s.orbitCardWrap}
              key={scene.name}
            >
              <Link
                ref={(node) => { cardRefs.current[index] = node; }}
                className={s.orbitCard}
                href={scene.href}
                aria-label={`${scene.name} 프로젝트 보기`}
                style={{ zIndex: scenes.length - index }}
              >
                <Image
                  src={scene.image}
                  alt=""
                  fill
                  sizes="(max-width: 900px) 76vw, 38vw"
                  className={s.orbitImage}
                />
                <span className={s.orbitShade} aria-hidden="true" />
                <span className={s.orbitCaption}>{scene.name}</span>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
