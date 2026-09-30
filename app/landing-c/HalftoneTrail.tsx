"use client";

import { useEffect, useRef } from "react";

const VERTEX_SHADER = `
  attribute vec2 position;
  varying vec2 vUv;

  void main() {
    vUv = position * 0.5 + 0.5;
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

const TRAIL_SHADER = `
  precision mediump float;
  uniform sampler2D uPrevious;
  uniform vec2 uPointer;
  uniform vec2 uDirection;
  uniform float uVelocity;
  uniform float uDecay;
  uniform float uBrushSize;
  uniform float uAspect;
  uniform float uReveal;
  varying vec2 vUv;

  void main() {
    float previous = texture2D(uPrevious, vUv).r * uDecay;
    vec2 delta = vUv - uPointer;
    delta.x *= uAspect;

    vec2 direction = length(uDirection) > 0.001 ? uDirection : vec2(0.0, 1.0);
    float along = dot(delta, direction);
    float across = length(delta - along * direction);
    float elongation = 1.0 + uVelocity * 2.1;
    float distanceToPointer = sqrt(along * along / elongation + across * across);
    float brush = exp(-distanceToPointer * distanceToPointer / (uBrushSize * uBrushSize)) * uReveal;

    gl_FragColor = vec4(min(previous + brush, 1.0), 0.0, 0.0, 1.0);
  }
`;

const HALFTONE_SHADER = `
  #extension GL_OES_standard_derivatives : enable
  precision highp float;
  uniform sampler2D uTrail;
  uniform vec2 uResolution;
  uniform float uCellSize;
  uniform vec3 uColor;
  uniform float uOpacity;
  varying vec2 vUv;

  void main() {
    vec2 pixel = vUv * uResolution;
    vec2 cell = floor(pixel / uCellSize);
    vec2 sampleUv = ((cell + 0.5) * uCellSize) / uResolution;
    float density = texture2D(uTrail, sampleUv).r;
    float distanceToCenter = length(fract(pixel / uCellSize) - 0.5);
    float radius = density * 0.46;
    float edge = fwidth(distanceToCenter);
    float dot = 1.0 - smoothstep(radius - edge, radius, distanceToCenter);
    float alpha = dot * smoothstep(0.04, 0.2, density);

    gl_FragColor = vec4(uColor, alpha * uOpacity);
  }
`;

type Framebuffer = {
  framebuffer: WebGLFramebuffer | null;
  texture: WebGLTexture | null;
};

type TrailConfig = {
  brushSize: number;
  cellSize: number;
  decay: number;
  hoverBrushSize: number;
  hoverOpacity: number;
  hoverSelector: string;
  opacity: number;
  speedScale: number;
};

type TrailUniforms = {
  previous: WebGLUniformLocation | null;
  pointer: WebGLUniformLocation | null;
  direction: WebGLUniformLocation | null;
  velocity: WebGLUniformLocation | null;
  decay: WebGLUniformLocation | null;
  brushSize: WebGLUniformLocation | null;
  aspect: WebGLUniformLocation | null;
  reveal: WebGLUniformLocation | null;
};

type HalftoneUniforms = {
  trail: WebGLUniformLocation | null;
  resolution: WebGLUniformLocation | null;
  cellSize: WebGLUniformLocation | null;
  color: WebGLUniformLocation | null;
  opacity: WebGLUniformLocation | null;
};

const colorProbe = typeof document === "undefined"
  ? null
  : document.createElement("canvas").getContext("2d");

function lerp(from: number, to: number, amount: number) {
  return from + (to - from) * amount;
}

function compileShader(gl: WebGLRenderingContext, source: string, type: number) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function createProgram(gl: WebGLRenderingContext, fragmentSource: string) {
  const vertex = compileShader(gl, VERTEX_SHADER, gl.VERTEX_SHADER);
  const fragment = compileShader(gl, fragmentSource, gl.FRAGMENT_SHADER);
  if (!vertex || !fragment) return null;

  const program = gl.createProgram();
  if (!program) return null;
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program);
    return null;
  }
  return program;
}

function createFramebuffer(gl: WebGLRenderingContext): Framebuffer {
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 512, 512, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  const framebuffer = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
  return { framebuffer, texture };
}

function resolveColor(element: HTMLElement, color: string): [number, number, number] {
  element.style.color = color;
  if (!colorProbe) return [0.9, 0.9, 0.86];
  colorProbe.fillStyle = getComputedStyle(element).color;
  colorProbe.fillRect(0, 0, 1, 1);
  const [red, green, blue] = colorProbe.getImageData(0, 0, 1, 1).data;
  return [red / 255, green / 255, blue / 255];
}

class HalftoneEngine {
  private gl: WebGLRenderingContext;
  private trailProgram: WebGLProgram;
  private halftoneProgram: WebGLProgram;
  private positionBuffer: WebGLBuffer;
  private trailPosition: number;
  private halftonePosition: number;
  private trailUniforms: TrailUniforms;
  private halftoneUniforms: HalftoneUniforms;
  private source: Framebuffer;
  private destination: Framebuffer;
  private frame = 0;
  private width = 1;
  private height = 1;
  private pointerX = -1;
  private pointerY = -1;
  private previousX = -1;
  private previousY = -1;
  private directionX = 0;
  private directionY = 1;
  private velocity = 0;
  private reveal = 0;
  private hasPointer = false;
  private hovering = false;
  private brushSize: number;
  private opacity: number;
  private color: [number, number, number] = [0.9, 0.9, 0.86];

  constructor(private canvas: HTMLCanvasElement, private config: TrailConfig) {
    const gl = canvas.getContext("webgl", { alpha: true, antialias: false, premultipliedAlpha: false });
    if (!gl || !gl.getExtension("OES_standard_derivatives")) throw new Error("WebGL unavailable");
    this.gl = gl;

    const trailProgram = createProgram(gl, TRAIL_SHADER);
    const halftoneProgram = createProgram(gl, HALFTONE_SHADER);
    const positionBuffer = gl.createBuffer();
    if (!trailProgram || !halftoneProgram || !positionBuffer) throw new Error("Halftone setup failed");
    this.trailProgram = trailProgram;
    this.halftoneProgram = halftoneProgram;
    this.positionBuffer = positionBuffer;
    this.trailPosition = gl.getAttribLocation(trailProgram, "position");
    this.halftonePosition = gl.getAttribLocation(halftoneProgram, "position");
    this.trailUniforms = {
      previous: gl.getUniformLocation(trailProgram, "uPrevious"),
      pointer: gl.getUniformLocation(trailProgram, "uPointer"),
      direction: gl.getUniformLocation(trailProgram, "uDirection"),
      velocity: gl.getUniformLocation(trailProgram, "uVelocity"),
      decay: gl.getUniformLocation(trailProgram, "uDecay"),
      brushSize: gl.getUniformLocation(trailProgram, "uBrushSize"),
      aspect: gl.getUniformLocation(trailProgram, "uAspect"),
      reveal: gl.getUniformLocation(trailProgram, "uReveal"),
    };
    this.halftoneUniforms = {
      trail: gl.getUniformLocation(halftoneProgram, "uTrail"),
      resolution: gl.getUniformLocation(halftoneProgram, "uResolution"),
      cellSize: gl.getUniformLocation(halftoneProgram, "uCellSize"),
      color: gl.getUniformLocation(halftoneProgram, "uColor"),
      opacity: gl.getUniformLocation(halftoneProgram, "uOpacity"),
    };
    this.source = createFramebuffer(gl);
    this.destination = createFramebuffer(gl);
    this.brushSize = config.brushSize;
    this.opacity = config.opacity;

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW,
    );
    this.clearFramebuffer(this.source);
    this.clearFramebuffer(this.destination);
    this.tick = this.tick.bind(this);
    this.frame = requestAnimationFrame(this.tick);
  }

  private clearFramebuffer(target: Framebuffer) {
    const gl = this.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, target.framebuffer);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
  }

  resize(width: number, height: number) {
    this.width = Math.max(width, 1);
    this.height = Math.max(height, 1);
    const ratio = Math.min(window.devicePixelRatio, 1.75);
    this.canvas.width = Math.round(this.width * ratio);
    this.canvas.height = Math.round(this.height * ratio);
  }

  setColor(color: [number, number, number]) {
    this.color = color;
  }

  updatePointer(clientX: number, clientY: number, bounds: DOMRect) {
    this.previousX = this.pointerX;
    this.previousY = this.pointerY;
    this.pointerX = (clientX - bounds.left) / Math.max(bounds.width, 1);
    this.pointerY = 1 - (clientY - bounds.top) / Math.max(bounds.height, 1);
    this.hasPointer = true;

    const aspect = this.width / this.height;
    const deltaX = this.previousX < 0 ? 0 : (this.pointerX - this.previousX) * aspect;
    const deltaY = this.previousY < 0 ? 0 : this.pointerY - this.previousY;
    const distance = Math.hypot(deltaX, deltaY);
    this.velocity = Math.min(distance * this.config.speedScale, 1);
    if (distance > 0.0001) {
      this.directionX = deltaX / distance;
      this.directionY = deltaY / distance;
    }

    const target = document.elementFromPoint(clientX, clientY);
    this.hovering = Boolean(target?.closest(this.config.hoverSelector));
  }

  private prepare(program: WebGLProgram, position: number) {
    const gl = this.gl;
    gl.useProgram(program);
    gl.enableVertexAttribArray(position);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
  }

  private tick() {
    const gl = this.gl;
    const ratio = Math.min(window.devicePixelRatio, 1.75);
    this.reveal = lerp(this.reveal, this.hasPointer ? 1 : 0, 0.05);
    this.brushSize = lerp(
      this.brushSize,
      this.hovering ? this.config.hoverBrushSize : this.config.brushSize,
      0.1,
    );
    this.opacity = lerp(
      this.opacity,
      this.hovering ? this.config.hoverOpacity : this.config.opacity,
      0.1,
    );
    this.velocity *= 0.9;

    gl.bindFramebuffer(gl.FRAMEBUFFER, this.destination.framebuffer);
    gl.viewport(0, 0, 512, 512);
    this.prepare(this.trailProgram, this.trailPosition);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.source.texture);
    gl.uniform1i(this.trailUniforms.previous, 0);
    gl.uniform2f(this.trailUniforms.pointer, this.pointerX, this.pointerY);
    gl.uniform2f(this.trailUniforms.direction, this.directionX, this.directionY);
    gl.uniform1f(this.trailUniforms.velocity, this.velocity);
    gl.uniform1f(this.trailUniforms.decay, this.config.decay);
    gl.uniform1f(this.trailUniforms.brushSize, this.brushSize);
    gl.uniform1f(this.trailUniforms.aspect, this.width / this.height);
    gl.uniform1f(this.trailUniforms.reveal, this.reveal);
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    [this.source, this.destination] = [this.destination, this.source];

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, Math.round(this.width * ratio), Math.round(this.height * ratio));
    this.prepare(this.halftoneProgram, this.halftonePosition);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.source.texture);
    gl.uniform1i(this.halftoneUniforms.trail, 0);
    gl.uniform2f(this.halftoneUniforms.resolution, this.width * ratio, this.height * ratio);
    gl.uniform1f(this.halftoneUniforms.cellSize, this.config.cellSize);
    gl.uniform3f(this.halftoneUniforms.color, ...this.color);
    gl.uniform1f(this.halftoneUniforms.opacity, this.opacity);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    this.frame = requestAnimationFrame(this.tick);
  }

  destroy() {
    cancelAnimationFrame(this.frame);
    const gl = this.gl;
    gl.deleteFramebuffer(this.source.framebuffer);
    gl.deleteFramebuffer(this.destination.framebuffer);
    gl.deleteTexture(this.source.texture);
    gl.deleteTexture(this.destination.texture);
    gl.deleteBuffer(this.positionBuffer);
    gl.deleteProgram(this.trailProgram);
    gl.deleteProgram(this.halftoneProgram);
  }
}

type HalftoneTrailProps = {
  className?: string;
  color?: string;
};

export default function HalftoneTrail({ className = "", color = "#eeede7" }: HalftoneTrailProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<HalftoneEngine | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
    if (!host || !canvas || reduceMotion || coarsePointer) return;

    let engine: HalftoneEngine;
    try {
      engine = new HalftoneEngine(canvas, {
        brushSize: 0.042,
        cellSize: 9,
        decay: 0.966,
        hoverBrushSize: 0.015,
        hoverOpacity: 0.2,
        hoverSelector: "a, button, [data-halftone-focus]",
        opacity: 0.66,
        speedScale: 38,
      });
    } catch {
      return;
    }

    engineRef.current = engine;
    engine.setColor(resolveColor(host, color));
    const updatePointer = (event: PointerEvent) => {
      engine.updatePointer(event.clientX, event.clientY, host.getBoundingClientRect());
    };
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width > 0 && height > 0) engine.resize(width, height);
    });
    const updateColor = () => engine.setColor(resolveColor(host, color));
    const colorObserver = new MutationObserver(updateColor);

    window.addEventListener("pointermove", updatePointer, { passive: true });
    observer.observe(host);
    colorObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "style"] });

    return () => {
      engine.destroy();
      engineRef.current = null;
      window.removeEventListener("pointermove", updatePointer);
      observer.disconnect();
      colorObserver.disconnect();
    };
  }, [color]);

  return (
    <div ref={hostRef} className={className} aria-hidden="true">
      <canvas ref={canvasRef} />
    </div>
  );
}
