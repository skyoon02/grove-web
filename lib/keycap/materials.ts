import type { MaterialKey } from './types'

export interface MaterialDef {
  color: string
  roughness: number
  metalness: number
  clearcoat: number
  clearcoatRoughness: number
  transparent: boolean
  opacity: number
}

export const MATERIALS: Record<MaterialKey, MaterialDef> = {
  ivory: {
    color: '#E9E3D9',
    roughness: 0.60,
    metalness: 0.0,
    clearcoat: 0.05,
    clearcoatRoughness: 0.62,
    transparent: false,
    opacity: 1,
  },
  charcoal: {
    color: '#272928',
    roughness: 0.62,
    metalness: 0.0,
    clearcoat: 0.04,
    clearcoatRoughness: 0.66,
    transparent: false,
    opacity: 1,
  },
  slate: {
    color: '#7C8A8F',
    roughness: 0.59,
    metalness: 0.0,
    clearcoat: 0.04,
    clearcoatRoughness: 0.64,
    transparent: false,
    opacity: 1,
  },
  terracotta: {
    color: '#BF4F2E',
    roughness: 0.57,
    metalness: 0.0,
    clearcoat: 0.06,
    clearcoatRoughness: 0.58,
    transparent: false,
    opacity: 1,
  },
  sage: {
    color: '#888A77',
    roughness: 0.61,
    metalness: 0.0,
    clearcoat: 0.04,
    clearcoatRoughness: 0.66,
    transparent: false,
    opacity: 1,
  },
  gunmetal: {
    color: '#373b39',
    roughness: 0.50,
    metalness: 0.72,
    clearcoat: 1.0,
    clearcoatRoughness: 0.02,
    transparent: false,
    opacity: 1,
  },
  clear: {
    color: '#E8EEEC',
    roughness: 0.10,
    metalness: 0.0,
    clearcoat: 1,
    clearcoatRoughness: 0.08,
    transparent: true,
    opacity: 0.30,
  },
}
