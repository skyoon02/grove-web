"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { MutableRefObject, PointerEvent as ReactPointerEvent } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer, RoundedBox } from "@react-three/drei";
import { CanvasTexture, Group, MathUtils, PCFShadowMap, RepeatWrapping, SRGBColorSpace } from "three";
import { useReducedMotion } from "../hooks";

export type GeometricStudyVariant = "core" | "build" | "evolve";

type PointerTarget = { x: number; y: number };
type RotationTarget = { x: number; y: number };
type SpinVelocity = { x: number; y: number };
type DragState = { active: boolean; pointerId: number | null; lastX: number; lastY: number };

type SurfaceTone = "dark" | "silver" | "light";

const surfacePalette: Record<SurfaceTone, { base: string; dot: string }> = {
  dark: { base: "#171816", dot: "#696a65" },
  silver: { base: "#5c5e59", dot: "#c1c2bc" },
  light: { base: "#c9c9c3", dot: "#4c4d49" },
};

function useDotTexture(tone: SurfaceTone) {
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 64;
    const context = canvas.getContext("2d");
    if (!context) return null;

    const palette = surfacePalette[tone];
    context.fillStyle = palette.base;
    context.fillRect(0, 0, 64, 64);
    context.fillStyle = palette.dot;
    for (let y = 4; y < 64; y += 8) {
      for (let x = 4; x < 64; x += 8) {
        context.beginPath();
        context.arc(x, y, tone === "light" ? 1.55 : 1.25, 0, Math.PI * 2);
        context.fill();
      }
    }

    const result = new CanvasTexture(canvas);
    result.wrapS = RepeatWrapping;
    result.wrapT = RepeatWrapping;
    result.repeat.set(5, 5);
    result.colorSpace = SRGBColorSpace;
    result.needsUpdate = true;
    return result;
  }, [tone]);

  useEffect(() => () => texture?.dispose(), [texture]);
  return texture;
}

function DottedSurfaceMaterial({ tone = "dark", roughness = 0.22 }: { tone?: SurfaceTone; roughness?: number }) {
  const texture = useDotTexture(tone);
  return (
    <meshPhysicalMaterial
      color="#ffffff"
      map={texture ?? undefined}
      metalness={tone === "light" ? 0.48 : 0.7}
      roughness={roughness}
      clearcoat={1}
      clearcoatRoughness={0.12}
      envMapIntensity={tone === "dark" ? 1.15 : 1.35}
    />
  );
}

function CoreForm() {
  return (
    <group rotation={[0.26, -0.42, -0.12]}>
      <mesh castShadow receiveShadow>
        <torusKnotGeometry args={[1.22, 0.34, 240, 24, 2, 3]} />
        <DottedSurfaceMaterial tone="dark" roughness={0.2} />
      </mesh>
      <mesh scale={1.035}>
        <torusKnotGeometry args={[1.22, 0.34, 240, 24, 2, 3]} />
        <meshBasicMaterial color="#8a8b85" wireframe transparent opacity={0.065} />
      </mesh>
      <mesh position={[0.08, -0.02, 0.04]} castShadow>
        <sphereGeometry args={[0.47, 64, 64]} />
        <DottedSurfaceMaterial tone="light" roughness={0.16} />
      </mesh>
    </group>
  );
}

function BuildForm() {
  return (
    <group rotation={[0.12, -0.28, 0.02]}>
      <RoundedBox
        args={[2.55, 0.62, 0.62]}
        radius={0.2}
        smoothness={8}
        position={[-0.12, 0.58, 0]}
        rotation={[0.12, -0.16, 0.34]}
        castShadow
      >
        <DottedSurfaceMaterial tone="light" roughness={0.17} />
      </RoundedBox>
      <RoundedBox
        args={[2.35, 0.62, 0.62]}
        radius={0.2}
        smoothness={8}
        position={[0.18, -0.08, 0.16]}
        rotation={[-0.18, 0.2, -0.34]}
        castShadow
      >
        <DottedSurfaceMaterial tone="silver" roughness={0.18} />
      </RoundedBox>
      <RoundedBox
        args={[1.9, 0.54, 0.54]}
        radius={0.18}
        smoothness={8}
        position={[-0.08, -0.72, -0.08]}
        rotation={[0.2, -0.24, 0.26]}
        castShadow
      >
        <DottedSurfaceMaterial tone="dark" roughness={0.2} />
      </RoundedBox>
      <mesh rotation={[Math.PI / 2.4, 0.1, -0.36]} position={[0.14, -0.02, 0.08]}>
        <torusGeometry args={[1.72, 0.014, 10, 192]} />
        <meshBasicMaterial color="#d7d8d2" transparent opacity={0.58} />
      </mesh>
    </group>
  );
}

function EvolveForm() {
  const rings = [-3, -2, -1, 0, 1, 2, 3];

  return (
    <group rotation={[0.16, -0.36, -0.08]}>
      {rings.map((step) => (
        <mesh
          key={step}
          castShadow
          position={[Math.sin(step * 0.72) * 0.18, step * 0.34, Math.cos(step * 0.56) * 0.12]}
          rotation={[Math.PI / 2 + step * 0.11, step * 0.2, step * 0.08]}
          scale={1 - Math.abs(step) * 0.045}
        >
          <torusGeometry args={[1.12, 0.125, 24, 128]} />
          <DottedSurfaceMaterial tone={step % 2 === 0 ? "dark" : "silver"} roughness={0.2} />
        </mesh>
      ))}
      <mesh position={[0, 0.03, 0.08]} castShadow>
        <sphereGeometry args={[0.44, 64, 64]} />
        <DottedSurfaceMaterial tone="light" roughness={0.16} />
      </mesh>
    </group>
  );
}

function StudioLighting({ dark }: { dark: boolean }) {
  return (
    <>
      <ambientLight intensity={dark ? 0.32 : 0.72} />
      <directionalLight
        position={[-4.5, 5.5, 6]}
        intensity={dark ? 2.6 : 2.15}
        color="#ffffff"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0001}
      />
      <Environment resolution={64} environmentIntensity={dark ? 0.88 : 0.28}>
        <group rotation={[-Math.PI / 2, 0, 0]}>
          <Lightformer form="rect" intensity={3.8} color="#ffffff" position={[0, 5, -4]} scale={[8, 1.4, 1]} />
          <Lightformer form="rect" intensity={2.2} color="#d8d9d4" position={[-4, 1, 2]} scale={[2.1, 4.2, 1]} />
          <Lightformer form="rect" intensity={1.5} color="#ffffff" position={[4, -1, 1]} scale={[2.4, 3, 1]} />
          {!dark && <Lightformer form="rect" intensity={1.2} color="#1a1c18" position={[0, -1, 3]} scale={[6, 3, 1]} />}
        </group>
      </Environment>
    </>
  );
}

function StudyScene({
  variant,
  active,
  reduced,
  pointer,
  rotation,
}: {
  variant: GeometricStudyVariant;
  active: boolean;
  reduced: boolean;
  pointer: MutableRefObject<PointerTarget>;
  rotation: MutableRefObject<RotationTarget>;
}) {
  const motion = useRef<Group>(null);
  const { invalidate, viewport } = useThree();
  const autoAngle = useRef(0);
  const autoRotation = useRef<RotationTarget>({ x: 0, y: 0 });

  useFrame((_, delta) => {
    const object = motion.current;
    if (!object) return;

    if (active && !reduced) {
      const prev = autoAngle.current;
      autoAngle.current += delta * 0.08;
      autoRotation.current.y += delta * 0.08;
      // tilted axis: X gently nods as Y spins
      autoRotation.current.x += Math.sin(autoAngle.current * 0.28) * 0.2 - Math.sin(prev * 0.28) * 0.2;
    }

    const targetX = rotation.current.x + autoRotation.current.x + pointer.current.y * 0.13;
    const targetY = rotation.current.y + autoRotation.current.y + pointer.current.x * 0.18;
    object.rotation.x = reduced ? rotation.current.x : MathUtils.damp(object.rotation.x, targetX, 4.4, delta);
    object.rotation.y = reduced ? rotation.current.y : MathUtils.damp(object.rotation.y, targetY, 4.4, delta);

    if (active && !reduced) invalidate();
  });

  useEffect(() => {
    invalidate();
  }, [active, invalidate, reduced, variant]);

  return (
    <>
      <StudioLighting dark />
      <group ref={motion} scale={Math.min(viewport.width / 4.8, viewport.height / 4.8, 1) * (variant === "core" ? 0.9 : variant === "build" ? 1.02 : 0.98)}>
        {variant === "core" && <CoreForm />}
        {variant === "build" && <BuildForm />}
        {variant === "evolve" && <EvolveForm />}
      </group>
    </>
  );
}

export default function GeometricStudy({ variant, active }: { variant: GeometricStudyVariant; active: boolean }) {
  const host = useRef<HTMLDivElement>(null);
  const pointer = useRef<PointerTarget>({ x: 0, y: 0 });
  const rotation = useRef<RotationTarget>({ x: 0, y: 0 });
  const velocity = useRef<SpinVelocity>({ x: 0, y: 0 });
  const drag = useRef<DragState>({ active: false, pointerId: null, lastX: 0, lastY: 0 });
  const inertiaFrame = useRef(0);
  const inertiaTime = useRef(0);
  const invalidateRef = useRef<() => void>(() => undefined);
  const [mounted, setMounted] = useState(false);
  const [inView, setInView] = useState(false);
  const reduced = useReducedMotion();

  useEffect(() => {
    const element = host.current;
    if (!element) return;
    let alignmentFrame = 0;
    const mountWhenNear = () => {
      const bounds = element.getBoundingClientRect();
      if (bounds.bottom >= -600 && bounds.top <= window.innerHeight + 600) setMounted(true);
    };
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setMounted(true);
    }, { rootMargin: "600px", threshold: 0 });
    const visibilityObserver = new IntersectionObserver(([entry]) => {
      setInView(entry.isIntersecting);
    }, { threshold: 0 });
    observer.observe(element);
    visibilityObserver.observe(element);
    mountWhenNear();
    alignmentFrame = window.requestAnimationFrame(mountWhenNear);
    return () => {
      window.cancelAnimationFrame(alignmentFrame);
      observer.disconnect();
      visibilityObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    if (active) invalidateRef.current();
  }, [active]);

  useEffect(() => () => window.cancelAnimationFrame(inertiaFrame.current), []);

  function stopInertia() {
    window.cancelAnimationFrame(inertiaFrame.current);
    inertiaFrame.current = 0;
  }

  function continueInertia(time: number) {
    const delta = Math.min((time - inertiaTime.current) / 1000, 0.034);
    inertiaTime.current = time;
    rotation.current.x += velocity.current.x * delta * 60;
    rotation.current.y += velocity.current.y * delta * 60;
    const damping = Math.exp(-6.2 * delta);
    velocity.current.x *= damping;
    velocity.current.y *= damping;
    invalidateRef.current();

    if (Math.abs(velocity.current.x) + Math.abs(velocity.current.y) > 0.0004) {
      inertiaFrame.current = window.requestAnimationFrame(continueInertia);
    } else {
      inertiaFrame.current = 0;
    }
  }

  function startInertia() {
    if (reduced || !active) return;
    stopInertia();
    inertiaTime.current = performance.now();
    inertiaFrame.current = window.requestAnimationFrame(continueInertia);
  }

  function moveObject(event: ReactPointerEvent<HTMLDivElement>) {
    if (drag.current.active) {
      const deltaX = event.clientX - drag.current.lastX;
      const deltaY = event.clientY - drag.current.lastY;
      drag.current.lastX = event.clientX;
      drag.current.lastY = event.clientY;
      rotation.current.x += deltaY * 0.012;
      rotation.current.y += deltaX * 0.012;
      velocity.current.x = deltaY * 0.0018;
      velocity.current.y = deltaX * 0.0018;
      pointer.current.x = 0;
      pointer.current.y = 0;
      invalidateRef.current();
      return;
    }

    const bounds = event.currentTarget.getBoundingClientRect();
    pointer.current.x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 2;
    pointer.current.y = -((event.clientY - bounds.top) / bounds.height - 0.5) * 2;
    invalidateRef.current();
  }

  function startDrag(event: ReactPointerEvent<HTMLDivElement>) {
    stopInertia();
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = {
      active: true,
      pointerId: event.pointerId,
      lastX: event.clientX,
      lastY: event.clientY,
    };
    velocity.current.x = 0;
    velocity.current.y = 0;
  }

  function endDrag(event: ReactPointerEvent<HTMLDivElement>) {
    if (drag.current.pointerId === event.pointerId && event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    drag.current.active = false;
    drag.current.pointerId = null;
    startInertia();
    invalidateRef.current();
  }

  function resetObject() {
    if (drag.current.active) return;
    pointer.current.x = 0;
    pointer.current.y = 0;
    invalidateRef.current();
  }

  return (
    <div
      ref={host}
      className="geometric-study"
      onPointerDown={startDrag}
      onPointerMove={moveObject}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onPointerLeave={resetObject}
      aria-hidden="true"
    >
      {mounted && (
        <Canvas
          dpr={[1, 1.5]}
          frameloop="demand"
          camera={{ position: [0, 0.2, 7], fov: 34, near: 0.1, far: 30 }}
          gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
          onCreated={({ camera, gl, invalidate }) => {
            camera.lookAt(0, 0, 0);
            gl.setClearAlpha(0);
            gl.shadowMap.enabled = true;
            gl.shadowMap.type = PCFShadowMap;
            invalidateRef.current = invalidate;
          }}
        >
          <StudyScene
            variant={variant}
            active={active && inView}
            reduced={reduced}
            pointer={pointer}
            rotation={rotation}
          />
        </Canvas>
      )}
    </div>
  );
}
