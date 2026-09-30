'use client'

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useReducedMotion } from './hooks'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { PerspectiveCamera as DreiPerspectiveCamera, RoundedBox } from '@react-three/drei'
import {
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  Color,
  ExtrudeGeometry,
  Group,
  LinearFilter,
  PCFShadowMap,
  PerspectiveCamera as ThreePerspectiveCamera,
  RepeatWrapping,
  Shape,
  SRGBColorSpace,
  Vector3,
} from 'three'
import { toCreasedNormals } from 'three/addons/utils/BufferGeometryUtils.js'
import type { MenuKey, KeyDef, LegendIcon } from '../lib/keycap/types'
import { MENU_STATES } from '../lib/keycap/states'
import { MATERIALS, type MaterialDef } from '../lib/keycap/materials'

const U = 0.81
const GAP = 0.055
const H_BASE = 0.032
const H_BODY = 0.44
const BODY_OVERLAP = 0.018
const BODY_RADIUS = 0.115
const TOP_TAPER = 0.145
const TOP_DISH = 0.012
const TOP_Y = H_BASE - BODY_OVERLAP + H_BODY
const GEOMETRY_EPSILON = 0.00001
const TAPERED_GEOMETRIES = new Map<number, BufferGeometry>()
let plasticGrainTexture: CanvasTexture | null = null

interface ViewPreset {
  camera: [number, number, number]
  target: [number, number, number]
  fov: number
  rotationY: number
  scale: number
  offset: [number, number, number]
}

const VIEW_PRESETS: Record<MenuKey, ViewPreset> = {
  about: {
    camera: [0.12, 6.70, 4.30],
    target: [0, -0.48, -0.38],
    fov: 31.5,
    rotationY: -0.12,
    scale: 0.82,
    offset: [0, 0, -0.58],
  },
  works: {
    camera: [0.15, 6.50, 4.50],
    target: [0, -0.48, -0.40],
    fov: 31.5,
    rotationY: -0.14,
    scale: 0.80,
    offset: [0, 0, -0.58],
  },
  service: {
    camera: [0, 7.30, 2.40],
    target: [0, -0.64, -0.42],
    fov: 30.5,
    rotationY: 0,
    scale: 0.79,
    offset: [0, 0, -0.68],
  },
  team: {
    camera: [0.15, 6.40, 4.60],
    target: [0, -0.50, -0.39],
    fov: 31.5,
    rotationY: -0.18,
    scale: 0.80,
    offset: [0, 0, -0.60],
  },
  contact: {
    camera: [0.14, 6.30, 4.55],
    target: [0, -0.48, -0.42],
    fov: 31.5,
    rotationY: -0.22,
    scale: 0.78,
    offset: [0, 0, -0.60],
  },
}

const MENU_ORDER: MenuKey[] = ['about', 'works', 'service', 'team', 'contact']
const KEY_TRANSITION_MS = 980
type KeyMotionPhase = 'steady' | 'enter' | 'exit'

function sizeW(size: string): number {
  const sizes: Record<string, number> = {
    '1u': 1,
    '1.5u': 1.5,
    '2u': 2,
    '2.25u': 2.25,
    '2.75u': 2.75,
  }
  const units = sizes[size] ?? 1
  return units * U + (units - 1) * GAP
}

function getTaperedGeometry(w: number) {
  const cacheKey = Math.round(w * 10000)
  const cached = TAPERED_GEOMETRIES.get(cacheKey)
  if (cached) return cached

  const radius = BODY_RADIUS - GEOMETRY_EPSILON
  const shape = new Shape()
  shape.absarc(GEOMETRY_EPSILON, GEOMETRY_EPSILON, GEOMETRY_EPSILON, -Math.PI / 2, -Math.PI, true)
  shape.absarc(GEOMETRY_EPSILON, H_BODY - radius * 2, GEOMETRY_EPSILON, Math.PI, Math.PI / 2, true)
  shape.absarc(w - radius * 2, H_BODY - radius * 2, GEOMETRY_EPSILON, Math.PI / 2, 0, true)
  shape.absarc(w - radius * 2, GEOMETRY_EPSILON, GEOMETRY_EPSILON, 0, -Math.PI / 2, true)

  const geometry = new ExtrudeGeometry(shape, {
    depth: U - BODY_RADIUS * 2,
    bevelEnabled: true,
    bevelSegments: 8,
    steps: 1,
    bevelSize: radius,
    bevelThickness: BODY_RADIUS,
    curveSegments: 6,
  })
  geometry.center()

  const position = geometry.attributes.position as BufferAttribute
  let minY = Infinity
  let maxY = -Infinity
  for (let index = 0; index < position.count; index++) {
    const y = position.getY(index)
    minY = Math.min(minY, y)
    maxY = Math.max(maxY, y)
  }

  const height = Math.max(0.001, maxY - minY)
  for (let index = 0; index < position.count; index++) {
    const normalizedY = (position.getY(index) - minY) / height
    const eased = normalizedY * normalizedY * (3 - 2 * normalizedY)
    const shoulder = Math.pow(eased, 1.28)
    const scale = 1 - TOP_TAPER * (normalizedY * 0.16 + shoulder * 0.84)
    position.setX(index, position.getX(index) * scale)
    position.setZ(index, position.getZ(index) * scale)

    if (normalizedY > 0.78) {
      const topProgress = (normalizedY - 0.78) / 0.22
      const topInfluence = topProgress * topProgress * (3 - 2 * topProgress)
      const zLimit = Math.max(0.001, U * 0.43)
      const normalizedZ = Math.min(1, Math.abs(position.getZ(index)) / zLimit)
      const cylindricalDish = Math.max(0, 1 - normalizedZ * normalizedZ)
      position.setY(
        index,
        position.getY(index) - TOP_DISH * cylindricalDish * topInfluence,
      )
    }
  }

  position.needsUpdate = true
  toCreasedNormals(geometry, 1.02)
  geometry.computeBoundingBox()
  geometry.computeBoundingSphere()
  TAPERED_GEOMETRIES.set(cacheKey, geometry)
  return geometry
}

function getPlasticGrainTexture() {
  if (plasticGrainTexture) return plasticGrainTexture

  const canvas = document.createElement('canvas')
  canvas.width = 128
  canvas.height = 128
  const context = canvas.getContext('2d')
  if (!context) return null

  const image = context.createImageData(canvas.width, canvas.height)
  for (let index = 0; index < canvas.width * canvas.height; index++) {
    const x = index % canvas.width
    const y = Math.floor(index / canvas.width)
    const hash = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453
    const noise = hash - Math.floor(hash)
    const value = Math.round(112 + noise * 32)
    const offset = index * 4
    image.data[offset] = value
    image.data[offset + 1] = value
    image.data[offset + 2] = value
    image.data[offset + 3] = 255
  }
  context.putImageData(image, 0, 0)

  plasticGrainTexture = new CanvasTexture(canvas)
  plasticGrainTexture.wrapS = RepeatWrapping
  plasticGrainTexture.wrapT = RepeatWrapping
  plasticGrainTexture.repeat.set(5, 5)
  plasticGrainTexture.minFilter = LinearFilter
  plasticGrainTexture.magFilter = LinearFilter
  plasticGrainTexture.needsUpdate = true
  return plasticGrainTexture
}

function drawLegendIcon(
  context: CanvasRenderingContext2D,
  icon: LegendIcon,
  width: number,
  height: number,
  color: string,
) {
  const cx = width / 2
  const cy = height / 2
  const unit = Math.min(width, height)

  context.fillStyle = color
  context.strokeStyle = color
  context.lineCap = 'round'
  context.lineJoin = 'round'

  const circle = (x: number, y: number, radius: number) => {
    context.beginPath()
    context.arc(x, y, radius, 0, Math.PI * 2)
    context.fill()
  }

  switch (icon) {
    case 'about-flower': {
      const drawPetal = (angle: number) => {
        context.save()
        context.translate(cx, cy)
        context.rotate(angle)
        context.beginPath()
        context.moveTo(0, -unit * 0.025)
        context.bezierCurveTo(-unit * 0.09, -unit * 0.11, -unit * 0.11, -unit * 0.25, 0, -unit * 0.35)
        context.bezierCurveTo(unit * 0.11, -unit * 0.25, unit * 0.09, -unit * 0.11, 0, -unit * 0.025)
        context.fill()
        context.restore()
      }
      for (let index = 0; index < 4; index += 1) drawPetal(index * Math.PI / 2)
      break
    }
    case 'person-mark':
      circle(cx, cy - unit * 0.13, unit * 0.105)
      context.fillRect(cx - unit * 0.17, cy + unit * 0.10, unit * 0.34, unit * 0.045)
      break
    case 'team-sun':
      circle(cx, cy, unit * 0.055)
      context.lineWidth = unit * 0.045
      for (let index = 0; index < 8; index += 1) {
        const angle = index * Math.PI / 4
        context.beginPath()
        context.moveTo(cx + Math.cos(angle) * unit * 0.13, cy + Math.sin(angle) * unit * 0.13)
        context.lineTo(cx + Math.cos(angle) * unit * 0.27, cy + Math.sin(angle) * unit * 0.27)
        context.stroke()
      }
      break
    case 'team-dots': {
      const radius = unit * 0.105
      circle(cx, cy - unit * 0.19, radius)
      circle(cx - unit * 0.19, cy, radius)
      circle(cx + unit * 0.19, cy, radius)
      circle(cx, cy + unit * 0.19, radius)
      break
    }
    case 'service-person':
      circle(cx, cy - unit * 0.24, unit * 0.105)
      context.beginPath()
      context.moveTo(cx - unit * 0.20, cy - unit * 0.02)
      context.quadraticCurveTo(cx, cy + unit * 0.22, cx + unit * 0.20, cy - unit * 0.02)
      context.closePath()
      context.fill()
      context.beginPath()
      context.moveTo(cx - unit * 0.20, cy + unit * 0.30)
      context.quadraticCurveTo(cx, cy + unit * 0.06, cx + unit * 0.20, cy + unit * 0.30)
      context.closePath()
      context.fill()
      break
    case 'service-list':
      context.lineWidth = unit * 0.038
      for (const [start, end, y] of [
        [-0.22, 0.22, -0.18],
        [-0.22, 0.22, 0],
        [-0.22, 0.10, 0.18],
      ] as const) {
        context.beginPath()
        context.moveTo(cx + unit * start, cy + unit * y)
        context.lineTo(cx + unit * end, cy + unit * y)
        context.stroke()
      }
      circle(cx + unit * 0.22, cy + unit * 0.18, unit * 0.045)
      break
    case 'contact-fingerprint':
      circle(cx, cy - unit * 0.29, unit * 0.048)
      context.lineWidth = unit * 0.03
      for (let index = 0; index < 4; index += 1) {
        const radius = unit * (0.10 + index * 0.065)
        context.beginPath()
        context.arc(cx, cy + unit * 0.16, radius, Math.PI, Math.PI * 2)
        context.stroke()
      }
      break
    case 'neutral-face':
      circle(cx - unit * 0.18, cy - unit * 0.10, unit * 0.038)
      circle(cx + unit * 0.18, cy - unit * 0.10, unit * 0.038)
      context.lineWidth = unit * 0.035
      context.beginPath()
      context.arc(cx, cy + unit * 0.10, unit * 0.12, 0, Math.PI)
      context.stroke()
      break
    case 'arrow-ne':
      context.lineWidth = unit * 0.045
      context.beginPath()
      context.moveTo(cx - unit * 0.24, cy + unit * 0.24)
      context.lineTo(cx + unit * 0.24, cy - unit * 0.24)
      context.moveTo(cx - unit * 0.02, cy - unit * 0.24)
      context.lineTo(cx + unit * 0.24, cy - unit * 0.24)
      context.lineTo(cx + unit * 0.24, cy + unit * 0.02)
      context.stroke()
      break
    case 'diamond':
      context.lineWidth = unit * 0.034
      context.beginPath()
      context.moveTo(cx, cy - unit * 0.23)
      context.lineTo(cx + unit * 0.23, cy)
      context.lineTo(cx, cy + unit * 0.23)
      context.lineTo(cx - unit * 0.23, cy)
      context.closePath()
      context.stroke()
      break
    case 'infinity': {
      // 중앙 교차점에서 두 접선이 ±45° 대각선이 되도록 d를 정사각형으로 설정
      // → 교차각 90°, 실제 ∞ 교차 형태
      const r = unit * 0.26   // 각 루프의 절반 너비
      const d = unit * 0.10   // 교차점 접선 오프셋 (x=y → 90° 교차)
      const h = d * 1.65      // 루프 높이 제어
      context.lineWidth = unit * 0.038
      context.lineCap = 'round'
      context.lineJoin = 'round'
      context.beginPath()
      context.moveTo(cx, cy)
      context.bezierCurveTo(cx - d, cy - d, cx - r, cy - h, cx - r, cy)
      context.bezierCurveTo(cx - r, cy + h, cx - d, cy + d, cx, cy)
      context.bezierCurveTo(cx + d, cy + d, cx + r, cy + h, cx + r, cy)
      context.bezierCurveTo(cx + r, cy - h, cx + d, cy - d, cx, cy)
      context.stroke()
      break
    }
  }
}

function useLegendTexture(label: string | undefined, icon: LegendIcon | undefined, color: string, aspect: number) {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas')
    const height = 256
    canvas.height = height
    canvas.width = Math.round(height * aspect)

    const context = canvas.getContext('2d')
    if (!context) return null

    context.clearRect(0, 0, canvas.width, canvas.height)
    if (icon) {
      drawLegendIcon(context, icon, canvas.width, canvas.height, color)
    } else if (label) {
      const isSymbol = !/[A-Za-z0-9]/.test(label)
      const fontSize = Math.round(height * (isSymbol ? 0.58 : label.length > 7 ? 0.40 : 0.46))
      context.fillStyle = color
      context.font = `${isSymbol ? 400 : 500} ${fontSize}px Arial, Helvetica, sans-serif`
      context.textAlign = 'center'
      context.textBaseline = 'middle'
      context.fillText(label, canvas.width / 2, canvas.height * 0.515, canvas.width * 0.90)
    }

    const result = new CanvasTexture(canvas)
    result.colorSpace = SRGBColorSpace
    result.minFilter = LinearFilter
    result.magFilter = LinearFilter
    result.generateMipmaps = true
    result.needsUpdate = true
    return result
  }, [aspect, color, icon, label])

  useEffect(() => () => texture?.dispose(), [texture])
  return texture
}

function KeyMaterial({ material, color, surface = 'body' }: {
  material: MaterialDef
  color: string
  surface?: 'body' | 'base'
}) {
  const grainTexture = getPlasticGrainTexture()

  if (material.transparent) {
    return (
      <meshPhysicalMaterial
        color={color}
        roughness={material.roughness}
        metalness={material.metalness}
        clearcoat={material.clearcoat}
        clearcoatRoughness={material.clearcoatRoughness}
        transparent
        opacity={surface === 'base' ? material.opacity * 0.72 : material.opacity}
        depthWrite={false}
        transmission={0.18}
        thickness={0.22}
        ior={1.46}
      />
    )
  }

  return (
    <meshPhysicalMaterial
      color={color}
      roughness={material.roughness}
      metalness={material.metalness}
      clearcoat={material.clearcoat}
      clearcoatRoughness={material.clearcoatRoughness}
      bumpMap={grainTexture ?? undefined}
      bumpScale={surface === 'base' ? 0.002 : 0.006}
    />
  )
}

function SculptedBody({ w, material }: { w: number; material: MaterialDef }) {
  const geometry = useMemo(() => getTaperedGeometry(w), [w])

  return (
    <mesh
      geometry={geometry}
      position={[0, H_BASE - BODY_OVERLAP + H_BODY / 2, 0]}
      castShadow
      receiveShadow
    >
      <KeyMaterial material={material} color={material.color} />
    </mesh>
  )
}

function Legend({ label, icon, w, color }: { label?: string; icon?: LegendIcon; w: number; color: string }) {
  const isShort = Boolean(label && label.length <= 2)
  const width = icon ? U * 0.48 : Math.min(w * 0.72, isShort ? U * 0.43 : w * 0.78)
  const height = icon ? 0.34 : isShort ? 0.27 : 0.235
  const texture = useLegendTexture(label, icon, color, width / height)
  if (!texture) return null

  return (
    <mesh position={[0, TOP_Y - TOP_DISH + 0.006, 0]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={4}>
      <planeGeometry args={[width, height]} />
      <meshBasicMaterial
        map={texture}
        transparent
        alphaTest={0.08}
        depthWrite={false}
        toneMapped={false}
        polygonOffset
        polygonOffsetFactor={-2}
      />
    </mesh>
  )
}

function CoreInternals({ w }: { w: number }) {
  const side = Math.min(w, U)
  return (
    <group>
      <RoundedBox args={[side * 0.74, 0.035, side * 0.74]} radius={0.045} smoothness={5} position={[0, 0.115, 0]}>
        <meshPhysicalMaterial color="#F6F2EB" roughness={0.28} transparent opacity={0.42} depthWrite={false} />
      </RoundedBox>
      <RoundedBox args={[side * 0.56, 0.16, side * 0.56]} radius={0.035} smoothness={5} position={[0, 0.205, 0]} castShadow>
        <meshStandardMaterial color="#242625" roughness={0.58} />
      </RoundedBox>
      <RoundedBox args={[side * 0.39, 0.055, side * 0.39]} radius={0.028} smoothness={5} position={[0, 0.305, 0]}>
        <meshPhysicalMaterial color="#EEE8DE" roughness={0.38} clearcoat={0.18} />
      </RoundedBox>
      <mesh position={[0, 0.344, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[side * 0.135, side * 0.026, 16, 42]} />
        <meshStandardMaterial color="#1D1F1E" roughness={0.50} />
      </mesh>
      <mesh position={[0, 0.354, 0]}>
        <cylinderGeometry args={[side * 0.045, side * 0.045, 0.028, 24]} />
        <meshPhysicalMaterial color="#C8A862" metalness={0.28} roughness={0.30} />
      </mesh>
    </group>
  )
}

function SingleKey({
  def,
  position,
  index,
  total,
  phase,
  direction,
  reducedMotion,
}: {
  def: KeyDef
  position: [number, number, number]
  index: number
  total: number
  phase: KeyMotionPhase
  direction: number
  reducedMotion: boolean
}) {
  const groupRef = useRef<Group>(null!)
  const invalidate = useThree((state) => state.invalidate)
  const elapsedRef = useRef(0)
  const settledRef = useRef(phase === 'steady' || reducedMotion)
  const [hovered, setHovered] = useState(false)
  const [pressed, setPressed] = useState(false)
  const w = sizeW(def.size)
  const material = MATERIALS[def.material]
  const baseY = position[1]
  const targetY = pressed ? baseY - 0.045 : hovered ? baseY + 0.055 : baseY
  const baseRotationY = def.ry ?? 0
  const motion = useMemo(() => {
    const fallbackAngle = (index + 1) * 2.17
    const sourceX = Math.abs(position[0]) + Math.abs(position[2]) > 0.18
      ? position[0]
      : Math.sin(fallbackAngle)
    const sourceZ = Math.abs(position[0]) + Math.abs(position[2]) > 0.18
      ? position[2]
      : Math.cos(fallbackAngle)
    const length = Math.max(0.35, Math.hypot(sourceX, sourceZ))
    const radialX = sourceX / length
    const radialZ = sourceZ / length
    const phaseDirection = phase === 'enter' ? -direction : direction
    const sideBias = Math.sin((index + 1) * 1.91)
    const isExit = phase === 'exit'
    const spread = isExit
      ? 5.10 + (index % 4) * 0.36
      : 2.15 + (index % 4) * 0.22
    const directionalPush = isExit
      ? phaseDirection * (0.28 + (index % 2) * 0.12)
      : phaseDirection * (0.54 + (index % 2) * 0.16)

    return {
      position: [
        position[0] + radialX * spread + sideBias * (isExit ? 0.48 : 0.30),
        position[1],
        position[2] + radialZ * spread + directionalPush,
      ] as [number, number, number],
      rotation: [
        0,
        baseRotationY + phaseDirection * (isExit ? 0.16 + (index % 4) * 0.05 : 0.24 + (index % 4) * 0.04),
        0,
      ] as [number, number, number],
    }
  }, [baseRotationY, direction, index, phase, position])

  const initialPosition = phase === 'enter' && !reducedMotion ? motion.position : position
  const initialRotation = phase === 'enter' && !reducedMotion
    ? motion.rotation
    : [0, baseRotationY, 0] as [number, number, number]

  useFrame((_, delta) => {
    if (!groupRef.current) return

    if (reducedMotion || phase === 'steady' || (phase === 'enter' && settledRef.current)) {
      const moving = Math.abs(targetY - groupRef.current.position.y) > 0.001
      groupRef.current.position.y += (targetY - groupRef.current.position.y) * Math.min(1, delta * 22)
      if (moving) invalidate()
      return
    }

    elapsedRef.current += delta
    const isEnter = phase === 'enter'
    const delay = isEnter ? index * 0.020 : (total - index - 1) * 0.014
    const duration = isEnter ? 0.76 : 0.82
    const progress = Math.min(1, Math.max(0, (elapsedRef.current - delay) / duration))
    if (progress <= 0) return

    const eased = isEnter
      ? progress * progress * progress * (progress * (progress * 6 - 15) + 10)
      : progress * (2 - progress)
    const restRotation = [0, baseRotationY, 0] as [number, number, number]
    const from = isEnter ? motion.position : position
    const to = isEnter ? position : motion.position
    const fromRotation = isEnter ? motion.rotation : restRotation
    const toRotation = isEnter ? restRotation : motion.rotation

    groupRef.current.position.set(
      from[0] + (to[0] - from[0]) * eased,
      from[1] + (to[1] - from[1]) * eased,
      from[2] + (to[2] - from[2]) * eased,
    )
    groupRef.current.rotation.set(
      fromRotation[0] + (toRotation[0] - fromRotation[0]) * eased,
      fromRotation[1] + (toRotation[1] - fromRotation[1]) * eased,
      fromRotation[2] + (toRotation[2] - fromRotation[2]) * eased,
    )

    groupRef.current.scale.setScalar(1)

    if (phase === 'exit' && progress >= 0.96) {
      groupRef.current.visible = false
      return
    }

    if (phase === 'enter' && progress >= 1) {
      settledRef.current = true
      groupRef.current.position.set(...position)
      groupRef.current.rotation.set(0, baseRotationY, 0)
      groupRef.current.scale.setScalar(1)
    }
  })

  const labelColor = useMemo(() => {
    const hsl = { h: 0, s: 0, l: 0 }
    new Color(material.color).getHSL(hsl)
    return hsl.l < 0.44 ? '#F3EFE8' : '#252726'
  }, [material.color])

  return (
    <group
      ref={groupRef}
      position={initialPosition}
      rotation={initialRotation}
      scale={1}
      onPointerEnter={(event) => { event.stopPropagation(); setHovered(true) }}
      onPointerLeave={() => { setHovered(false); setPressed(false) }}
      onPointerDown={(event) => { event.stopPropagation(); setPressed(true) }}
      onPointerUp={(event) => { event.stopPropagation(); setPressed(false) }}
    >
      <RoundedBox
        args={[w * 0.84, H_BASE, U * 0.84]}
        radius={0.04}
        smoothness={5}
        bevelSegments={4}
        position={[0, H_BASE / 2, 0]}
        castShadow
        receiveShadow
      >
        <KeyMaterial material={material} color={material.color} surface="base" />
      </RoundedBox>

      <SculptedBody w={w} material={material} />

      {def.isCore && <CoreInternals w={w} />}
      {(def.label || def.icon) && <Legend label={def.label} icon={def.icon} w={w} color={labelColor} />}
    </group>
  )
}

export interface StandaloneKeycapProps {
  size?: KeyDef['size']
  material?: KeyDef['material']
  label?: string
  icon?: LegendIcon
  isCore?: boolean
}

/** Reuses the production keycap geometry and materials without menu-transition logic. */
export function StandaloneKeycap({
  size = '1u',
  material = 'ivory',
  label,
  icon,
  isCore = false,
}: StandaloneKeycapProps) {
  return (
    <SingleKey
      def={{
        id: `standalone-${label ?? icon ?? material}`,
        size,
        material,
        label,
        icon,
        isCore,
        col: 0,
        row: 0,
      }}
      position={[0, 0, 0]}
      index={0}
      total={1}
      phase="steady"
      direction={1}
      reducedMotion
    />
  )
}

function CameraRig({ activeMenu }: { activeMenu: MenuKey }) {
  const cameraRef = useRef<ThreePerspectiveCamera>(null!)
  const initialized = useRef(false)
  const desiredPosition = useRef(new Vector3())
  const desiredTarget = useRef(new Vector3())
  const { size } = useThree()

  const getHorizontalShift = (preset: ViewPreset) => {
    if (size.width <= 900) return 0
    const distance = Math.hypot(
      preset.camera[0] - preset.target[0],
      preset.camera[1] - preset.target[1],
      preset.camera[2] - preset.target[2],
    )
    const viewHeight = 2 * Math.tan(preset.fov * Math.PI / 360) * distance
    const viewWidth = viewHeight * size.width / Math.max(1, size.height)
    return viewWidth * 0.25
  }

  useFrame((_, delta) => {
    const camera = cameraRef.current
    if (!camera) return
    const preset = VIEW_PRESETS[activeMenu]
    const horizontalShift = getHorizontalShift(preset)
    const response = 1 - Math.exp(-delta * 5.2)
    desiredPosition.current.set(
      preset.camera[0] + horizontalShift,
      preset.camera[1],
      preset.camera[2],
    )
    desiredTarget.current.set(
      preset.target[0] + horizontalShift,
      preset.target[1],
      preset.target[2],
    )

    if (!initialized.current) {
      camera.position.copy(desiredPosition.current)
      initialized.current = true
    } else {
      camera.position.lerp(desiredPosition.current, response)
    }

    camera.lookAt(desiredTarget.current)
    const nextFov = camera.fov + (preset.fov - camera.fov) * response
    if (Math.abs(nextFov - camera.fov) > 0.0001) {
      camera.fov = nextFov
      camera.updateProjectionMatrix()
    }
  })

  const initialPreset = VIEW_PRESETS.about
  const initialHorizontalShift = getHorizontalShift(initialPreset)
  return (
    <DreiPerspectiveCamera
      ref={cameraRef}
      makeDefault
      position={[
        initialPreset.camera[0] + initialHorizontalShift,
        initialPreset.camera[1],
        initialPreset.camera[2],
      ]}
      fov={initialPreset.fov}
    />
  )
}

function KeyLayout({
  activeMenu,
  phase,
  direction,
  reducedMotion,
}: {
  activeMenu: MenuKey
  phase: KeyMotionPhase
  direction: number
  reducedMotion: boolean
}) {
  const state = MENU_STATES[activeMenu]
  const layoutRef = useRef<Group>(null!)
  const initialized = useRef(false)
  const pitch = U + GAP
  const allX: number[] = []
  const allZ: number[] = []

  state.keys.forEach((key) => {
    const w = sizeW(key.size)
    allX.push(key.col * pitch, key.col * pitch + w)
    allZ.push(key.row * pitch)
  })

  const centerX = (Math.min(...allX) + Math.max(...allX)) / 2
  const centerZ = (Math.min(...allZ) + Math.max(...allZ)) / 2

  useFrame((_, delta) => {
    if (!layoutRef.current) return
    const preset = VIEW_PRESETS[activeMenu]
    const response = 1 - Math.exp(-delta * 5.2)

    if (!initialized.current) {
      layoutRef.current.rotation.y = preset.rotationY
      layoutRef.current.position.set(...preset.offset)
      layoutRef.current.scale.setScalar(preset.scale)
      initialized.current = true
      return
    }

    layoutRef.current.rotation.y += (preset.rotationY - layoutRef.current.rotation.y) * response
    layoutRef.current.position.x += (preset.offset[0] - layoutRef.current.position.x) * response
    layoutRef.current.position.y += (preset.offset[1] - layoutRef.current.position.y) * response
    layoutRef.current.position.z += (preset.offset[2] - layoutRef.current.position.z) * response
    const nextScale = layoutRef.current.scale.x + (preset.scale - layoutRef.current.scale.x) * response
    layoutRef.current.scale.setScalar(nextScale)
  })

  return (
    <group ref={layoutRef}>
      {state.keys.map((key, keyIndex) => {
        const w = sizeW(key.size)
        const x = key.col * pitch + w / 2 - centerX
        const z = key.row * pitch - centerZ
        return (
          <SingleKey
            key={key.id}
            def={key}
            position={[x, 0, z]}
            index={keyIndex}
            total={state.keys.length}
            phase={phase}
            direction={direction}
            reducedMotion={reducedMotion}
          />
        )
      })}
    </group>
  )
}

function TransitioningKeyLayouts({ activeMenu, reducedMotion }: {
  activeMenu: MenuKey
  reducedMotion: boolean
}) {
  const [visibleMenu, setVisibleMenu] = useState(activeMenu)
  const [outgoingMenu, setOutgoingMenu] = useState<MenuKey | null>(null)
  const [direction, setDirection] = useState(1)
  const [transitionId, setTransitionId] = useState(0)
  const startTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const cleanupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useLayoutEffect(() => {
    if (activeMenu === visibleMenu) return

    const previousIndex = MENU_ORDER.indexOf(visibleMenu)
    const nextIndex = MENU_ORDER.indexOf(activeMenu)
    let distance = nextIndex - previousIndex
    if (distance > MENU_ORDER.length / 2) distance -= MENU_ORDER.length
    if (distance < -MENU_ORDER.length / 2) distance += MENU_ORDER.length
    const nextDirection = distance >= 0 ? 1 : -1

    if (startTimerRef.current) clearTimeout(startTimerRef.current)
    if (cleanupTimerRef.current) clearTimeout(cleanupTimerRef.current)
    startTimerRef.current = setTimeout(() => {
      setOutgoingMenu(reducedMotion ? null : visibleMenu)
      setDirection(nextDirection)
      setVisibleMenu(activeMenu)
      setTransitionId((value) => value + 1)
      startTimerRef.current = null

      cleanupTimerRef.current = setTimeout(() => {
        setOutgoingMenu(null)
        cleanupTimerRef.current = null
      }, KEY_TRANSITION_MS)
    }, 0)
  }, [activeMenu, reducedMotion, visibleMenu])

  useEffect(() => () => {
    if (startTimerRef.current) clearTimeout(startTimerRef.current)
    if (cleanupTimerRef.current) clearTimeout(cleanupTimerRef.current)
  }, [])

  return (
    <>
      {outgoingMenu && (
        <KeyLayout
          key={`out-${outgoingMenu}-${transitionId}`}
          activeMenu={outgoingMenu}
          phase="exit"
          direction={direction}
          reducedMotion={reducedMotion}
        />
      )}
      <KeyLayout
        key={`in-${visibleMenu}-${transitionId}`}
        activeMenu={visibleMenu}
        phase={transitionId === 0 || reducedMotion ? 'steady' : 'enter'}
        direction={direction}
        reducedMotion={reducedMotion}
      />
    </>
  )
}

export default function KeycapScene({ activeMenu }: { activeMenu: MenuKey }) {
  const reducedMotion = useReducedMotion()
  const focusLayerRef = useRef<HTMLDivElement>(null)
  const previousMenuRef = useRef(activeMenu)

  useLayoutEffect(() => {
    if (previousMenuRef.current === activeMenu) return
    previousMenuRef.current = activeMenu
    if (reducedMotion || !focusLayerRef.current) return

    const animation = focusLayerRef.current.animate([
      { filter: 'blur(0px)', opacity: 1, offset: 0 },
      { filter: 'blur(1.5px)', opacity: 0.96, offset: 0.20 },
      { filter: 'blur(8px)', opacity: 0.76, offset: 0.48 },
      { filter: 'blur(4px)', opacity: 0.90, offset: 0.70 },
      { filter: 'blur(0px)', opacity: 1, offset: 1 },
    ], {
      duration: KEY_TRANSITION_MS,
      easing: 'cubic-bezier(.22,.74,.18,1)',
    })

    return () => animation.cancel()
  }, [activeMenu, reducedMotion])

  return (
    <div ref={focusLayerRef} className="keycap-focus-layer">
      <Canvas
        style={{ position: 'absolute', inset: 0 }}
        gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
        onCreated={({ gl }) => {
          gl.setClearAlpha(0)
          gl.shadowMap.type = PCFShadowMap
        }}
        dpr={[1, 2]}
        camera={{ position: [0, 5.25, 5.25], fov: 34 }}
        shadows
      >
        <ambientLight intensity={0.72} />
        <hemisphereLight args={['#FFF9F0', '#8B8176', 0.72]} />
        <directionalLight
          position={[-4.5, 8.5, 4.5]}
          intensity={2.45}
          color="#FFF7EA"
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-bias={-0.00018}
          shadow-normalBias={0.025}
          shadow-camera-near={0.5}
          shadow-camera-far={20}
          shadow-camera-left={-5.5}
          shadow-camera-right={5.5}
          shadow-camera-top={5.5}
          shadow-camera-bottom={-5.5}
        />
        <directionalLight position={[4.5, 4, 2]} intensity={0.58} color="#DCE8F0" />
        <directionalLight position={[0, 2.5, -5]} intensity={0.28} color="#FFF4E7" />

        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.008, 0]} receiveShadow>
          <planeGeometry args={[18, 18]} />
          <shadowMaterial color="#776F66" opacity={0.20} />
        </mesh>

        <CameraRig activeMenu={activeMenu} />
        <TransitioningKeyLayouts activeMenu={activeMenu} reducedMotion={reducedMotion} />
      </Canvas>
    </div>
  )
}
