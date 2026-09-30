'use client'

import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from './hooks'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import {
  Environment,
  Lightformer,
  MeshTransmissionMaterial,
  RoundedBox,
  Shadow,
} from '@react-three/drei'
import { Group, MathUtils, PCFShadowMap } from 'three'
import { StandaloneKeycap } from './KeycapScene'

export type LandingScene = 'operate' | 'partner' | 'contact' | 'workflow'
type Vec3 = [number, number, number]

function Key({
  position,
  rotation = [0, 0, 0],
  scale = 1,
  ...props
}: React.ComponentProps<typeof StandaloneKeycap> & {
  position: Vec3
  rotation?: Vec3
  scale?: number
}) {
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <StandaloneKeycap {...props} />
    </group>
  )
}

function OperateKeys() {
  return (
    <group position={[2.75, -0.7, -0.2]} rotation={[0.02, -0.12, -0.05]} scale={1.68}>
      <Key
        position={[0.25, 1.2, 0]}
        rotation={[0.05, -0.14, -0.08]}
        size="1.5u"
        material="gunmetal"
        label="BUILD"
      />
      <Key
        position={[-0.05, -0.1, 0.35]}
        rotation={[-0.03, 0.12, 0.04]}
        size="1.5u"
        material="gunmetal"
        label="OPERATE"
      />
    </group>
  )
}

function PartnerKeys() {
  // Match the production key geometry (0.81u key + 0.055u keyboard gap).
  // Every key shares the same Y and grid pitch so the cluster reads as one
  // keyboard plate, rather than a pile of independently placed objects.
  const pitch = 0.865

  return (
    <group position={[2.03, -0.74, -0.2]} rotation={[0, -0.055, 0]} scale={1.38}>
      <Key position={[-pitch, 0, -pitch]} size="2u" material="ivory" label="PARTNER" />
      <Key position={[pitch / 2, 0, -pitch]} material="clear" isCore />
      <Key position={[pitch * 1.75, 0, -pitch]} size="1.5u" material="charcoal" label="EVOLVE" />

      <Key position={[-pitch * 1.5, 0, 0]} material="terracotta" label="AI" />
      <Key position={[-pitch / 2, 0, 0]} material="ivory" label="IT" />
      <Key position={[pitch / 2, 0, 0]} material="slate" icon="about-flower" />
      <Key position={[pitch * 1.5, 0, 0]} material="charcoal" label="AX" />

      <Key position={[-pitch / 2, 0, pitch]} material="ivory" icon="infinity" />
      <Key position={[pitch / 2, 0, pitch]} material="sage" label="</>" />
    </group>
  )
}

function ContactKey() {
  return (
    <group position={[0, -0.45, 0]} scale={2.55} rotation={[0, -0.07, 0]}>
      <StandaloneKeycap material="ivory" icon="neutral-face" />
    </group>
  )
}

function ExplodedSwitch() {
  const springTurns = Array.from({ length: 8 }, (_, index) => index)

  return (
    <group position={[-1.8, -0.68, 0]} rotation={[0.02, -0.16, -0.03]} scale={1.3}>
      <group position={[0, 2.08, 0]} scale={1.12}>
        <StandaloneKeycap material="clear" />
      </group>

      <group position={[0, 1.10, 0]}>
        <RoundedBox args={[0.52, 0.56, 0.52]} radius={0.055} smoothness={6} castShadow>
          <meshPhysicalMaterial color="#eee7dc" roughness={0.42} clearcoat={0.1} />
        </RoundedBox>
        <RoundedBox args={[0.20, 0.42, 0.20]} radius={0.025} smoothness={4} position={[0, 0.43, 0]}>
          <meshPhysicalMaterial color="#f2ece2" roughness={0.38} />
        </RoundedBox>
      </group>

      <group position={[0, 0.22, 0]}>
        {springTurns.map((turn) => (
          <mesh key={turn} position={[0, turn * 0.082, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.18, 0.018, 10, 36]} />
            <meshStandardMaterial color="#7f8583" metalness={0.92} roughness={0.2} />
          </mesh>
        ))}
      </group>

      <group position={[0, -0.22, 0]}>
        <RoundedBox args={[0.92, 0.55, 0.92]} radius={0.10} smoothness={6} castShadow>
          <MeshTransmissionMaterial
            color="#eee6d8"
            transmission={0.10}
            opacity={0.88}
            transparent
            roughness={0.30}
            thickness={0.35}
            ior={1.34}
          />
        </RoundedBox>
        <mesh position={[0, 0.30, 0]}>
          <boxGeometry args={[0.43, 0.18, 0.43]} />
          <meshPhysicalMaterial color="#e7dfd2" roughness={0.45} />
        </mesh>
      </group>

      <group position={[0, -1.12, 0]}>
        <RoundedBox args={[0.98, 0.60, 0.98]} radius={0.08} smoothness={6} castShadow>
          <meshStandardMaterial color="#1d1f1e" roughness={0.54} metalness={0.08} />
        </RoundedBox>
        <mesh position={[-0.24, 0.28, 0.34]}>
          <boxGeometry args={[0.18, 0.38, 0.08]} />
          <meshStandardMaterial color="#b66e43" metalness={0.82} roughness={0.25} />
        </mesh>
        <mesh position={[0.24, 0.28, 0.34]}>
          <boxGeometry args={[0.18, 0.38, 0.08]} />
          <meshStandardMaterial color="#b66e43" metalness={0.82} roughness={0.25} />
        </mesh>
        <mesh position={[-0.18, -0.58, 0.30]}>
          <boxGeometry args={[0.08, 0.68, 0.12]} />
          <meshStandardMaterial color="#9d693e" metalness={0.86} roughness={0.27} />
        </mesh>
        <mesh position={[0.18, -0.58, 0.30]}>
          <boxGeometry args={[0.08, 0.68, 0.12]} />
          <meshStandardMaterial color="#9d693e" metalness={0.86} roughness={0.27} />
        </mesh>
      </group>

      <Key position={[-1.85, -1.42, 0.46]} rotation={[0, 0.18, -0.08]} material="terracotta" label="AI" scale={1.12} />
    </group>
  )
}

function OrangePulseLight() {
  const lightRef = useRef<any>(null)
  const { invalidate } = useThree()

  useFrame(({ clock }) => {
    if (!lightRef.current) return
    const t = clock.elapsedTime
    const blink = Math.pow(Math.max(0, Math.sin(t * Math.PI * 1.5)), 4)
    lightRef.current.intensity = 0.5 + blink * 6
    invalidate()
  })

  return (
    <pointLight
      ref={lightRef}
      position={[0, 0.6, 1.6]}
      color="#e54b1b"
      intensity={0.5}
      distance={8}
      decay={2}
    />
  )
}

function SceneLighting({ mode }: { mode: LandingScene }) {
  const dark = mode === 'operate'
  const contact = mode === 'contact'

  return (
    <>
      <ambientLight intensity={dark ? 0.55 : contact ? 1.05 : 1.25} />
      <directionalLight
        position={contact ? [-2.4, 10, 3.4] : [-4, 8, 5]}
        intensity={dark ? 2.5 : contact ? 2.45 : 2.15}
        color={dark ? '#dce1df' : '#fff4e6'}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.00012}
        shadow-normalBias={0.012}
        shadow-radius={contact ? 4.2 : dark ? 3.4 : 2.8}
      />
      <directionalLight
        position={contact ? [4, 2.5, -3] : [6, 3, -4]}
        intensity={dark ? 0.75 : contact ? 0.34 : 0.5}
        color={dark ? '#718087' : '#b9c3ad'}
      />
      {dark && (
        <directionalLight position={[4, 6, 2]} intensity={2.2} color="#c8d4d0" />
      )}
      {dark && (
        <directionalLight position={[-3, 3, 1]} intensity={0.9} color="#8fa0a0" />
      )}
      {contact && <OrangePulseLight />}
      <Environment resolution={64} environmentIntensity={dark ? 0.55 : 0.66}>
        <group rotation={[-Math.PI / 2, 0, 0]}>
          <Lightformer form="rect" intensity={3} color={dark ? '#ccd2d0' : '#fff8ef'} position={[0, 4, -3]} scale={[8, 2, 1]} />
          <Lightformer form="rect" intensity={1.4} color="#a7b0a4" position={[-4, 1, 2]} scale={[3, 3, 1]} />
        </group>
      </Environment>
    </>
  )
}

const COMPACT_POSITION: Record<LandingScene, Vec3> = {
  operate: [-2.6, -0.38, 0],
  partner: [-1.6, -0.42, 0],
  contact: [0, 0.09, 0],
  workflow: [1.8, 0.70, 0],
}
const COMPACT_SCALE: Record<LandingScene, number> = {
  operate: 0.76,
  partner: 0.60,
  contact: 0.82,
  workflow: 0.72,
}

function SceneContent({ mode, active, reduced }: { mode: LandingScene; active: boolean; reduced: boolean }) {
  const motion = useRef<Group>(null)
  const { invalidate, size } = useThree()
  const compact = size.width < 720

  useFrame(({ pointer }, delta) => {
    if (!motion.current || !active || reduced) return
    const targetY = pointer.x * 0.038
    const targetX = -pointer.y * 0.010
    const moving = Math.abs(motion.current.rotation.y - targetY) > 0.0003
      || Math.abs(motion.current.rotation.x - targetX) > 0.0003
    motion.current.rotation.y = MathUtils.damp(motion.current.rotation.y, targetY, 4.5, delta)
    motion.current.rotation.x = MathUtils.damp(motion.current.rotation.x, targetX, 4.5, delta)
    if (moving) invalidate()
  })

  const dark = mode === 'operate'
  const floorY = mode === 'partner'
    ? (compact ? -1.17 : -0.82)
    : mode === 'contact'
      ? (compact ? -0.30 : -0.52)
      : mode === 'workflow'
        ? (compact ? -2.25 : -2.76)
        : -2.25

  const groundingShadow = mode === 'partner'
    ? { position: [2.05, floorY + 0.006, -0.12] as Vec3, scale: [5.1, 3.5, 1] as Vec3, opacity: 0.105 }
    : mode === 'contact'
      ? { position: [0, floorY + 0.006, 0] as Vec3, scale: [3.7, 3.0, 1] as Vec3, opacity: 0.12 }
      : mode === 'workflow'
        ? { position: [-1.8, floorY + 0.006, 0.08] as Vec3, scale: [3.2, 2.4, 1] as Vec3, opacity: 0.10 }
        : { position: [2.75, floorY + 0.006, 0] as Vec3, scale: [5.4, 3.8, 1] as Vec3, opacity: 0.22 }

  useEffect(() => {
    invalidate()
    const frame = window.requestAnimationFrame(() => invalidate())
    return () => window.cancelAnimationFrame(frame)
  }, [invalidate])

  return (
    <>
      <SceneLighting mode={mode} />
      <group
        ref={motion}
        position={compact ? COMPACT_POSITION[mode] : [0, 0, 0]}
        scale={compact ? COMPACT_SCALE[mode] : 1}
      >
        {mode === 'operate' && <OperateKeys />}
        {mode === 'partner' && <PartnerKeys />}
        {mode === 'contact' && <ContactKey />}
        {mode === 'workflow' && <ExplodedSwitch />}
      </group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, floorY, 0]} receiveShadow renderOrder={-2}>
        <planeGeometry args={[18, 16]} />
        <shadowMaterial
          color={dark ? '#151918' : '#756b61'}
          transparent
          depthWrite={false}
          opacity={dark ? 0.34 : mode === 'workflow' ? 0.14 : mode === 'contact' ? 0.20 : 0.16}
        />
      </mesh>
      <Shadow
        position={groundingShadow.position}
        scale={groundingShadow.scale}
        color={dark ? '#111514' : '#756b61'}
        colorStop={0.08}
        opacity={groundingShadow.opacity}
        depthWrite={false}
        renderOrder={-1}
      />
    </>
  )
}

export default function LandingKeycapScene({ mode }: { mode: LandingScene }) {
  const host = useRef<HTMLDivElement>(null)
  const invalidateRef = useRef<() => void>(() => undefined)
  const [mounted, setMounted] = useState(false)
  const [active, setActive] = useState(false)
  const reduced = useReducedMotion()
  const cameraPosition: Vec3 = mode === 'partner' ? [0, 8.35, 6.15] : mode === 'contact' ? [0, 9.2, 4.2] : [0, 7.2, 7.1]
  const cameraFov = mode === 'contact' ? 20 : mode === 'partner' ? 32 : 33

  useEffect(() => {
    const element = host.current
    if (!element) return
    const preloadObserver = new IntersectionObserver(
      ([entry]) => setMounted(entry.isIntersecting),
      { rootMargin: '500px', threshold: 0 },
    )
    const activeObserver = new IntersectionObserver(
      ([entry]) => setActive(entry.isIntersecting),
      { rootMargin: '0px', threshold: 0.02 },
    )
    preloadObserver.observe(element)
    activeObserver.observe(element)
    return () => {
      preloadObserver.disconnect()
      activeObserver.disconnect()
    }
  }, [])

  useEffect(() => {
    if (!mounted) return
    let remainingFrames = 16
    const timer = window.setInterval(() => {
      invalidateRef.current()
      remainingFrames -= 1
      if (remainingFrames <= 0) window.clearInterval(timer)
    }, 120)
    return () => window.clearInterval(timer)
  }, [mounted])

  return (
    <div
      ref={host}
      className="landing-keycap-canvas"
      aria-hidden="true"
      onPointerMove={() => invalidateRef.current()}
    >
      {mounted && (
        <Canvas
          dpr={[1, 1.25]}
          frameloop="demand"
          camera={{ position: cameraPosition, fov: cameraFov, near: 0.1, far: 50 }}
          gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
          onCreated={({ camera, gl, invalidate }) => {
            const lookAtY = mode === 'workflow' ? 0.25 : mode === 'operate' ? 0.32 : mode === 'contact' ? 0.8 : -0.2
            camera.lookAt(0, lookAtY, 0)
            gl.setClearAlpha(0)
            gl.shadowMap.enabled = true
            gl.shadowMap.type = PCFShadowMap
            invalidateRef.current = invalidate
          }}
        >
          <SceneContent mode={mode} active={active} reduced={reduced} />
        </Canvas>
      )}
    </div>
  )
}
