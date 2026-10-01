"use client";

import { useEffect, useRef, useState } from "react";
import type { MouseEvent } from "react";
import SiteHeader from "../SiteHeader";
import GroveWelcomeIntro from "./GroveWelcomeIntro";

type HeaderBridgeMessage = {
  type: "grove-b-landing-header";
  isLight: boolean;
  isVisible: boolean;
};

type ContactBridgeMessage = {
  type: "grove-f-contact-state";
  isOpen: boolean;
};

function isHeaderBridgeMessage(value: unknown): value is HeaderBridgeMessage {
  if (!value || typeof value !== "object") return false;
  const message = value as Partial<HeaderBridgeMessage>;
  return (
    message.type === "grove-b-landing-header" &&
    typeof message.isLight === "boolean" &&
    typeof message.isVisible === "boolean"
  );
}

function isContactBridgeMessage(value: unknown): value is ContactBridgeMessage {
  if (!value || typeof value !== "object") return false;
  const message = value as Partial<ContactBridgeMessage>;
  return message.type === "grove-f-contact-state" && typeof message.isOpen === "boolean";
}

export default function AVariantFrame() {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [showIntro, setShowIntro] = useState(true);
  const [iframeSrc, setIframeSrc] = useState<string | undefined>(undefined);
  const [headerLight, setHeaderLight] = useState(true);
  const [headerVisible, setHeaderVisible] = useState(true);
  const [contactOpen, setContactOpen] = useState(false);

  // intro 노출 중 body scroll 잠금
  useEffect(() => {
    if (showIntro) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = prev; };
    }
  }, [showIntro]);

  useEffect(() => {
    const receiveHeaderState = (event: MessageEvent<unknown>) => {
      if (event.origin !== window.location.origin) return;
      if (event.source !== frameRef.current?.contentWindow) return;
      if (isHeaderBridgeMessage(event.data)) {
        setHeaderLight(event.data.isLight);
        setHeaderVisible(event.data.isVisible);
      } else if (isContactBridgeMessage(event.data)) {
        setContactOpen(event.data.isOpen);
      }
    };

    window.addEventListener("message", receiveHeaderState);
    return () => window.removeEventListener("message", receiveHeaderState);
  }, []);

  const openContact = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    event.currentTarget.blur();
    frameRef.current?.contentWindow?.postMessage(
      { type: "grove-f-open-contact" },
      window.location.origin,
    );
  };

  const postHeroReveal = () => {
    frameRef.current?.contentWindow?.postMessage(
      { type: "grove-a-reveal-hero" },
      window.location.origin,
    );
  };

  const startHeroReveal = () => {
    setIframeSrc("/landing-a/source/");
  };

  const handleFrameLoad = () => {
    postHeroReveal();
  };

  return (
    <main className="b-landing-shell landing-f-shell">
      {showIntro && (
        <GroveWelcomeIntro
          onExitStart={startHeroReveal}
          onComplete={() => setShowIntro(false)}
        />
      )}
      <SiteHeader
        landingVariant="f"
        controlledLight={headerLight}
        controlledVisible={headerVisible && !contactOpen}
        onContactClick={openContact}
      />
      <iframe
        ref={frameRef}
        className="b-landing-frame"
        src={iframeSrc}
        onLoad={handleFrameLoad}
        title="GROVE A안 랜딩페이지"
      />
    </main>
  );
}
