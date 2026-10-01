import { readFile } from "node:fs/promises";
import { extname, join, resolve, sep } from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const OFFLINE_ROOT = resolve(process.cwd(), "public/landing-f-snapshot");
const INDEX_FILE = "index.html";
const DOCUMENT_BASE = '<base href="/landing-a/source/">';

const CONTENT_TYPES: Record<string, string> = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".ttf": "font/ttf",
  ".txt": "text/plain; charset=utf-8",
  ".woff2": "font/woff2",
};

const HERO_OVERRIDE = `
<style>
  /* landing-a: Find the / CORE 크기 통일, 굵기 분리 */
  .hero-ai-title .hero-title-line span[style] { font-size: 0.9em !important; font-weight: 240 !important; }
  .hero-ai-title .hero-title-core { font-size: 0.9em !important; font-weight: 290 !important; }

  /* landing-a: 히어로 콘텐츠 + 튜브 중심점 위로 */
  .hero-ai { transform: translateY(-56px) !important; }
  #hero-canvas { transform: translateY(-56px) !important; }

  /* landing-a: pill 위치 조정 */
  .hero-orb-dock { bottom: 112px !important; }
  @media (max-width: 768px) { .hero-orb-dock { bottom: 100px !important; } }

  /* landing-a: pill 크기 + 색감 조정 */
  #thinking-orb-pill {
    height: 82px !important;
    padding: 0 36px 0 10px !important;
    gap: 14px !important;
    box-shadow: 0 4px 28px rgba(0,0,0,0.22), 0 0 36px rgba(100,70,255,0.09) !important;
  }
  #thinking-orb-root,
  #thinking-orb-root canvas {
    width: 62px !important;
    height: 62px !important;
  }
  #thinking-orb-label {
    font-size: 17px !important;
    background: linear-gradient(
      90deg,
      rgba(251,251,251,0.42) 0%,
      rgba(251,251,251,0.42) 30%,
      rgba(251,251,251,0.92) 50%,
      rgba(251,251,251,0.42) 70%,
      rgba(251,251,251,0.42) 100%
    ) !important;
    background-size: 200% auto !important;
    -webkit-background-clip: text !important;
    background-clip: text !important;
    -webkit-text-fill-color: transparent !important;
  }
  .pill-beam-light {
    background: conic-gradient(
      from 0deg,
      transparent 0%,
      transparent 63%,
      rgba(180, 40,240,0.26) 68%,
      rgba(100, 70,255,0.52) 72%,
      rgba( 40,140,255,0.62) 76%,
      rgba( 30,185,170,0.54) 80%,
      rgba( 50,200, 80,0.40) 85%,
      rgba(255,120, 40,0.24) 90%,
      transparent 94%,
      transparent 100%
    ) !important;
  }
  @media (max-width: 768px) {
    #thinking-orb-pill { height: 60px !important; padding: 0 20px 0 8px !important; }
    #thinking-orb-root, #thinking-orb-root canvas { width: 44px !important; height: 44px !important; }
    #thinking-orb-label { font-size: 14px !important; }
  }

  /* landing-a: 두 번째 섹션도 튜브 배경 공유 */
  .ag-section { background: transparent !important; }
  /* hero-ai overflow:hidden 클리핑 경계 제거 */
  .hero-ai { overflow: visible !important; }
  /* neon-wrap 그리드 선 오버레이 제거 */
  .neon-wrap::after { display: none !important; }
  /* ag-container 어두운 오버레이 제거 (경계선 원인) */
  .ag-container::before { display: none !important; }
  /* 두 번째 섹션 beams 캔버스 제거 (블러 회색 그라데이션 원인) */
  #beams-portfolio { display: none !important; }

  /* landing-a: blur-reveal 캔버스 제거, 히어로 투명 + 튜브 커서 오버레이 */
  #blur-reveal-bg,
  #aurora-bg { display: none !important; }
  .hero-ai { background: transparent !important; }
  .hero-ai::before,
  .hero-ai::after { display: none !important; }
  .neon-wrap { isolation: isolate; background: #000 !important; }
  .tubes-sticky {
    position: sticky;
    top: 0;
    height: 100vh;
    margin-bottom: -100vh;
    z-index: 0;
    pointer-events: none;
  }
  #hero-canvas {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    display: block;
    touch-action: none;
    pointer-events: none;
    opacity: .94;
    filter: saturate(.92) contrast(1.06);
  }

  /* landing-a: welcome 이후 hero title → pill 순차 리빌 */
  .hero-ai-title,
  .hero-ai.prism-ready .hero-ai-title {
    visibility: visible !important;
    opacity: 1 !important;
    animation: none !important;
  }
  .hero-title-line > span,
  .hero-title-core {
    display: inline-block;
    opacity: 0;
    transform: translate3d(0, .24em, 0) scale(.99);
    transform-origin: 50% 100%;
    filter: blur(7px);
    will-change: opacity, transform, filter;
  }
  .hero-orb-dock {
    opacity: 0;
    transform: translate3d(0, 16px, 0) scale(.985);
    filter: blur(6px);
    will-change: opacity, transform, filter;
  }
  body.landing-a-hero-ready .hero-title-line > span:first-child {
    animation: landing-a-title-reveal 1.16s cubic-bezier(.16,1,.3,1) .06s both;
  }
  body.landing-a-hero-ready .hero-title-line > span:nth-child(2) {
    animation: landing-a-title-reveal 1.14s cubic-bezier(.16,1,.3,1) .14s both;
  }
  body.landing-a-hero-ready .hero-title-core {
    animation: landing-a-title-reveal 1.2s cubic-bezier(.16,1,.3,1) .22s both;
  }
  body.landing-a-hero-ready .hero-orb-dock {
    animation: landing-a-pill-reveal 1.08s cubic-bezier(.16,1,.3,1) .95s both;
  }
  @keyframes landing-a-title-reveal {
    0% {
      opacity: 0;
      transform: translate3d(0, .24em, 0) scale(.99);
      filter: blur(7px);
    }
    38% { opacity: 1; }
    100% {
      opacity: 1;
      transform: translate3d(0, 0, 0) scale(1);
      filter: blur(0);
    }
  }
  @keyframes landing-a-pill-reveal {
    0% { opacity: 0; transform: translate3d(0, 16px, 0) scale(.985); filter: blur(6px); }
    100% { opacity: 1; transform: translate3d(0, 0, 0) scale(1); filter: blur(0); }
  }
  @media (max-width: 760px) {
    .hero-title-core { display: block; }
  }
  @media (prefers-reduced-motion: reduce) {
    .hero-title-line > span,
    .hero-title-core,
    .hero-orb-dock {
      animation: none !important;
      opacity: 1 !important;
      transform: none !important;
      filter: none !important;
    }
  }
</style>`;

const TUBES_HTML = `<div class="tubes-sticky"><canvas id="hero-canvas" aria-hidden="true"></canvas></div>`;

// HTML 파일이 CRLF(\r\n)를 사용하므로 \r\n으로 매칭
const OLD_PHRASES = "'핵심 흐름을 찾는 중',\r\n      '요구사항을 정리하는 중',\r\n      '업무 구조를 설계하는 중',\r\n      '연결 지점을 확인하는 중'";
const NEW_PHRASES = "'AI가 업무 맥락을 분석 중....',\r\n      'AX가 필요한 지점을 찾는 중....',\r\n      'AI Agent 프로세스 설계 중....',\r\n      '서비스와 AI 시스템을 구현하는 중....',\r\n      '다음 AX 지점을 찾는 중....'";

const TUBES_SCRIPT = `
<script src="assets/tubes1.min.js"></script>
<script>
  (function () {
    var canvas = document.getElementById('hero-canvas');
    if (!canvas) return;
    function randomColors(count) {
      return Array.from({ length: count }, function () {
        return '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
      });
    }
    var POINTER_ACTIVE_MS = 240;
    var ORBIT_RETURN_SECONDS = 0.9;
    var lastPointerMoveAt = Number.NEGATIVE_INFINITY;
    var appRef = null;
    var heroRevealStarted = false;

    function revealHero() {
      if (heroRevealStarted) return;
      heroRevealStarted = true;
      window.requestAnimationFrame(function () {
        document.body.classList.add('landing-a-hero-ready');
      });
    }

    window.addEventListener('message', function (event) {
      if (event.origin !== window.location.origin || event.source !== window.parent) return;
      if (!event.data || event.data.type !== 'grove-a-reveal-hero') return;
      revealHero();
    });

    function installIdleOrbit(instance) {
      var originalBeforeRender = instance.three.onBeforeRender;
      var wasPointerActive = false;
      var returnProgress = 1;
      var returnFromX = instance.tubes.target.x;
      var returnFromY = instance.tubes.target.y;

      document.body.addEventListener('pointermove', function (event) {
        if (event.pointerType === 'touch') return;
        var rect = canvas.getBoundingClientRect();
        var isInside = event.clientX >= rect.left && event.clientX <= rect.right &&
          event.clientY >= rect.top && event.clientY <= rect.bottom;
        lastPointerMoveAt = isInside ? performance.now() : Number.NEGATIVE_INFINITY;
      }, { passive: true });

      document.body.addEventListener('pointerleave', function () {
        lastPointerMoveAt = Number.NEGATIVE_INFINITY;
      });
      window.addEventListener('blur', function () {
        lastPointerMoveAt = Number.NEGATIVE_INFINITY;
      });

      instance.three.onBeforeRender = function (frame) {
        var pointerActive = performance.now() - lastPointerMoveAt <= POINTER_ACTIVE_MS;
        if (pointerActive) {
          originalBeforeRender.call(instance.three, frame);
          wasPointerActive = true;
          return;
        }

        if (wasPointerActive) {
          returnFromX = instance.tubes.target.x;
          returnFromY = instance.tubes.target.y;
          returnProgress = 0;
          wasPointerActive = false;
        }

        returnProgress = Math.min(1, returnProgress + frame.delta / ORBIT_RETURN_SECONDS);
        var blend = 1 - Math.pow(1 - returnProgress, 3);
        var worldPerPixel = instance.three.size.wWidth / instance.three.size.width;
        var orbitX = instance.options.sleepRadiusX * worldPerPixel *
          Math.cos(frame.elapsed * instance.options.sleepTimeScale1);
        var orbitY = instance.options.sleepRadiusY * worldPerPixel *
          Math.sin(frame.elapsed * instance.options.sleepTimeScale2);

        instance.tubes.target.x = returnFromX + (orbitX - returnFromX) * blend;
        instance.tubes.target.y = returnFromY + (orbitY - returnFromY) * blend;
        instance.tubes.update(frame);
      };
    }

    setTimeout(function () {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
      try {
        if (typeof window.TubesCursor !== 'function') return;
        appRef = window.TubesCursor(canvas, {
          tubes: {
            colors: ['#5e72e4', '#8965e0', '#f5365c'],
            lights: { intensity: 200, colors: ['#21d4fd', '#b721ff', '#f4d03f', '#11cdef'] }
          }
        });
        installIdleOrbit(appRef);
      } catch (err) {
        console.error('TubesCursor 로드 실패:', err);
      }
    }, 100);
    document.body.addEventListener('click', function () {
      if (!appRef) return;
      appRef.tubes.setColors(randomColors(3));
      appRef.tubes.setLightsColors(randomColors(4));
    });
  })();
</script>`;

const HEADER_BRIDGE = String.raw`
<style>
  .site-header,
  .mobile-nav { display: none !important; }
</style>
<script>
  (function () {
    var lastScrollY = Math.max(window.scrollY, 0);
    var scrollDistance = 0;
    var scrollDirection = null;
    var isVisible = true;
    var frameId = 0;

    function getLightHeaderState() {
      var sampleX = Math.round(window.innerWidth / 2);
      var sampleY = Math.min(40, Math.round(window.innerHeight / 10));
      var surfaces = document.elementsFromPoint(sampleX, sampleY).filter(function (candidate) {
        return !candidate.closest('.site-header');
      });
      var hasImageSurface = surfaces.some(function (candidate) {
        if (candidate instanceof HTMLImageElement) return true;
        return window.getComputedStyle(candidate).backgroundImage.indexOf('url(') !== -1;
      });

      if (hasImageSurface) return true;

      var surface = surfaces[0] instanceof HTMLElement ? surfaces[0] : null;
      while (surface) {
        var color = window.getComputedStyle(surface).backgroundColor;
        var channels = color.match(/[\d.]+/g);
        if (channels && channels.length >= 3 && Number(channels[3] || 1) > 0.2) {
          var red = Number(channels[0]);
          var green = Number(channels[1]);
          var blue = Number(channels[2]);
          var luminance = (0.2126 * red + 0.7152 * green + 0.0722 * blue) / 255;
          return luminance < 0.46;
        }
        surface = surface.parentElement;
      }
      return false;
    }

    function postHeaderState() {
      var currentScrollY = Math.max(window.scrollY, 0);
      var delta = currentScrollY - lastScrollY;

      if (currentScrollY < 72) {
        isVisible = true;
        scrollDistance = 0;
      } else if (Math.abs(delta) > 0.5) {
        var direction = delta > 0 ? 'down' : 'up';
        if (direction !== scrollDirection) {
          scrollDirection = direction;
          scrollDistance = 0;
        }
        scrollDistance += Math.abs(delta);
        if (scrollDistance >= 24) {
          isVisible = direction === 'up';
          scrollDistance = 0;
        }
      }

      window.parent.postMessage({
        type: 'grove-b-landing-header',
        isLight: getLightHeaderState(),
        isVisible: isVisible
      }, window.location.origin);
      lastScrollY = currentScrollY;
      frameId = 0;
    }

    function scheduleHeaderState() {
      if (!frameId) frameId = window.requestAnimationFrame(postHeaderState);
    }

    window.addEventListener('scroll', scheduleHeaderState, { passive: true });
    window.addEventListener('resize', scheduleHeaderState);
    window.addEventListener('grove:intro-done', scheduleHeaderState, { once: true });
    window.addEventListener('message', function (event) {
      if (event.origin !== window.location.origin || event.source !== window.parent) return;
      if (!event.data || event.data.type !== 'grove-f-open-contact') return;
      var contactTrigger = document.querySelector('.js-lde-open');
      if (contactTrigger) contactTrigger.click();
    });
    postHeaderState();
  })();
</script>`;

function isSafeAssetPath(segments: string[]) {
  return segments.every(
    (segment) =>
      segment.length > 0 &&
      segment !== "." &&
      segment !== ".." &&
      !segment.includes("/") &&
      !segment.includes("\\") &&
      !segment.includes("\0"),
  );
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ asset?: string[] }> },
) {
  const { asset = [] } = await context.params;
  const segments = asset.length ? asset : [INDEX_FILE];

  if (!isSafeAssetPath(segments)) {
    return new Response("Not found", { status: 404 });
  }

  const filePath = resolve(join(OFFLINE_ROOT, ...segments));
  if (filePath !== OFFLINE_ROOT && !filePath.startsWith(`${OFFLINE_ROOT}${sep}`)) {
    return new Response("Not found", { status: 404 });
  }

  const extension = extname(filePath).toLowerCase();
  const contentType = CONTENT_TYPES[extension];
  if (!contentType) {
    return new Response("Unsupported file type", { status: 415 });
  }

  try {
    const file = await readFile(filePath);
    const body =
      extension === ".html"
        ? file
            .toString("utf8")
            .replace("<head>", `<head>\n${DOCUMENT_BASE}`)
            .replace("</head>", `${HERO_OVERRIDE}${HEADER_BRIDGE}\n</head>`)
            .replace(OLD_PHRASES, NEW_PHRASES)
            .replace(
              '>핵심 흐름을 찾는 중</span>',
              '>AI가 업무 맥락을 분석 중....</span>',
            )
            .replace('<div aria-hidden="true" style="position:absolute;inset:0;z-index:1;pointer-events:none;background:linear-gradient(to top,#000 0%,rgba(0,0,0,.88) 14%,rgba(0,0,0,.58) 32%,rgba(0,0,0,.18) 56%,transparent 100%);"></div>', '')
            .replace('<div class="neon-wrap">', `<div class="neon-wrap">${TUBES_HTML}`)
            .replace("</body>", `${TUBES_SCRIPT}\n</body>`)
        : new Uint8Array(file);

    return new Response(body, {
      headers: {
        "Cache-Control": extension === ".html" ? "no-cache" : "public, max-age=86400",
        "Content-Type": contentType,
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
