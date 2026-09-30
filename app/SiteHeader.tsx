"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { MouseEventHandler } from "react";

type NavLabel = "WORKS" | "SERVICES" | "ABOUT" | "CONTACT";

type SiteHeaderProps = {
  current?: NavLabel;
  home?: boolean;
  landingVariant?: string;
  controlledVisible?: boolean;
  controlledLight?: boolean;
  onContactClick?: MouseEventHandler<HTMLAnchorElement>;
};

export default function SiteHeader({
  current,
  home = false,
  landingVariant,
  controlledVisible,
  controlledLight,
  onContactClick,
}: SiteHeaderProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isLight, setIsLight] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const lastScrollY = useRef(0);
  const scrollDistance = useRef(0);
  const scrollDirection = useRef<"up" | "down" | null>(null);
  const isControlled = controlledVisible !== undefined || controlledLight !== undefined;

  useEffect(() => {
    if (isControlled) return;

    lastScrollY.current = window.scrollY;
    let frameId = 0;

    const updateContrast = () => {
      const header = headerRef.current;
      const sampleX = Math.round(window.innerWidth / 2);
      const sampleY = Math.min(40, Math.round(window.innerHeight / 10));
      const surfaces = document
        .elementsFromPoint(sampleX, sampleY)
        .filter((candidate) => !header?.contains(candidate));
      const hasImageSurface = surfaces.some((candidate) => {
        if (candidate instanceof HTMLImageElement) return true;
        return window.getComputedStyle(candidate).backgroundImage.includes("url(");
      });

      if (hasImageSurface) {
        setIsLight(true);
        return;
      }

      const element = surfaces[0];

      let surface = element instanceof HTMLElement ? element : null;

      while (surface) {
        const color = window.getComputedStyle(surface).backgroundColor;
        const channels = color.match(/[\d.]+/g)?.map(Number);

        if (channels && channels.length >= 3 && (channels[3] ?? 1) > 0.2) {
          const [red, green, blue] = channels;
          const luminance = (0.2126 * red + 0.7152 * green + 0.0722 * blue) / 255;
          setIsLight(luminance < 0.46);
          return;
        }

        surface = surface.parentElement;
      }

      setIsLight(false);
    };

    const updateHeader = () => {
      const currentScrollY = Math.max(window.scrollY, 0);
      const delta = currentScrollY - lastScrollY.current;

      if (currentScrollY < 72) {
        setIsVisible(true);
        scrollDistance.current = 0;
      } else if (Math.abs(delta) > 0.5) {
        const direction = delta > 0 ? "down" : "up";

        if (direction !== scrollDirection.current) {
          scrollDirection.current = direction;
          scrollDistance.current = 0;
        }

        scrollDistance.current += Math.abs(delta);

        if (scrollDistance.current >= 24) {
          setIsVisible(direction === "up");
          scrollDistance.current = 0;
        }
      }

      updateContrast();
      lastScrollY.current = currentScrollY;
      frameId = 0;
    };

    const handleScroll = () => {
      if (!frameId) frameId = window.requestAnimationFrame(updateHeader);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);
    updateContrast();
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
      if (frameId) window.cancelAnimationFrame(frameId);
    };
  }, [isControlled]);

  const navItems = useMemo<{ label: NavLabel; href: string }[]>(() => [
    { label: "WORKS", href: "/works" },
    { label: "SERVICES", href: "/services" },
    { label: "ABOUT", href: "/about" },
    { label: "CONTACT", href: home ? "#contact" : "/#contact" },
  ], [home]);

  const headerVisible = controlledVisible ?? isVisible;
  const headerLight = controlledLight ?? isLight;

  return (
    <header
      ref={headerRef}
      className={`landing-header${landingVariant ? ` landing-header--${landingVariant}` : ""}${headerVisible ? "" : " is-hidden"}${headerLight ? " is-light" : ""}`}
      onFocusCapture={() => setIsVisible(true)}
    >
      <Link
        className="wordmark"
        href={home ? "#partner" : "/"}
        aria-label="GROVE 처음으로"
      >
        <Image src="/grove-logo.png" alt="" width={1000} height={150} priority />
      </Link>
      <nav aria-label="주요 메뉴">
        {navItems.map((item) => (
          <Link
            href={item.href}
            key={item.label}
            className={current === item.label ? "is-current" : undefined}
            aria-current={current === item.label ? "page" : undefined}
            onClick={item.label === "CONTACT" ? onContactClick : undefined}
          >
            <span className="nhb" aria-hidden="true" />
            <span className="nhf" aria-hidden="true" />
            <span className="nht">{item.label}</span>
          </Link>
        ))}
      </nav>
    </header>
  );
}
