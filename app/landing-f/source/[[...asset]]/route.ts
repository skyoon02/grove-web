import { readFile } from "node:fs/promises";
import { extname, join, resolve, sep } from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const OFFLINE_ROOT = resolve(process.cwd(), "public/landing-f-snapshot");
const INDEX_FILE = "index.html";
const DOCUMENT_BASE = '<base href="/landing-f/source/">';

const CONTENT_TYPES: Record<string, string> = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".ttf": "font/ttf",
  ".txt": "text/plain; charset=utf-8",
  ".woff2": "font/woff2",
};

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
            .replace("</head>", `${HEADER_BRIDGE}\n</head>`)
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
