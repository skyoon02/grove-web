export type MenuKey = 'about' | 'works' | 'service' | 'team' | 'contact'
export type KeySize = '1u' | '1.5u' | '2u' | '2.25u' | '2.75u'
export type MaterialKey = 'ivory' | 'charcoal' | 'slate' | 'terracotta' | 'sage' | 'clear' | 'gunmetal'
export type LegendIcon =
  | 'about-flower'
  | 'person-mark'
  | 'team-sun'
  | 'team-dots'
  | 'service-person'
  | 'service-list'
  | 'contact-fingerprint'
  | 'neutral-face'
  | 'arrow-ne'
  | 'diamond'
  | 'infinity'

export interface KeyDef {
  id: string
  size: KeySize
  material: MaterialKey
  label?: string
  icon?: LegendIcon
  isCore?: boolean
  col: number
  row: number
  ry?: number
}

export interface MenuSceneState {
  menu: MenuKey
  keys: KeyDef[]
}
