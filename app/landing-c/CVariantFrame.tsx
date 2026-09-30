"use client";

import { useEffect, useRef, useState } from "react";
import SiteHeader from "../SiteHeader";

type HeaderBridgeMessage = {
  type: "grove-c-landing-header";
  isLight: boolean;
  isVisible: boolean;
};

function isHeaderBridgeMessage(value: unknown): value is HeaderBridgeMessage {
  if (!value || typeof value !== "object") return false;
  const message = value as Partial<HeaderBridgeMessage>;
  return (
    message.type === "grove-c-landing-header" &&
    typeof message.isLight === "boolean" &&
    typeof message.isVisible === "boolean"
  );
}

export default function CVariantFrame() {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [headerLight, setHeaderLight] = useState(true);
  const [headerVisible, setHeaderVisible] = useState(true);

  useEffect(() => {
    const receiveHeaderState = (event: MessageEvent<unknown>) => {
      if (event.origin !== window.location.origin) return;
      if (event.source !== frameRef.current?.contentWindow) return;
      if (!isHeaderBridgeMessage(event.data)) return;

      setHeaderLight(event.data.isLight);
      setHeaderVisible(event.data.isVisible);
    };

    window.addEventListener("message", receiveHeaderState);
    return () => window.removeEventListener("message", receiveHeaderState);
  }, []);

  return (
    <main className="b-landing-shell">
      <SiteHeader
        landingVariant="c"
        controlledLight={headerLight}
        controlledVisible={headerVisible}
      />
      <iframe
        ref={frameRef}
        className="b-landing-frame"
        src="/landing-c/source/"
        title="GROVE C안 랜딩페이지 — B안 원본 백업"
      />
    </main>
  );
}
