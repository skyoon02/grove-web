import type { MenuSceneState } from './types'

export const MENU_STATES: Record<string, MenuSceneState> = {
  about: {
    menu: 'about',
    keys: [
      { id: 'a-about',   size: '2u',   material: 'ivory',     label: 'ABOUT',  col: 0,   row: 0 },
      { id: 'a-core',    size: '1u',   material: 'clear',     isCore: true,    col: 2,   row: 0 },
      { id: 'a-why',     size: '1u',   material: 'charcoal',  label: 'why?',   col: 3,   row: 0 },
      { id: 'a-coretxt', size: '1u',   material: 'terracotta', label: 'AI',    col: 0,   row: 1 },
      { id: 'a-blank',   size: '1u',   material: 'ivory',     label: 'core',   col: 1,   row: 1 },
      { id: 'a-flower',  size: '1u',   material: 'slate',     icon: 'about-flower', col: 2,   row: 1 },
      { id: 'a-deeper',  size: '1u',   material: 'charcoal',  label: 'deeper', col: 3,   row: 1 },
      { id: 'a-face',    size: '1u',   material: 'ivory',     icon: 'neutral-face', col: 1,   row: 2 },
      { id: 'a-accent',  size: '1u',   material: 'sage',       icon: 'person-mark', col: 2,   row: 2 },
    ],
  },

  works: {
    menu: 'works',
    keys: [
      { id: 'w-works',   size: '2u',   material: 'ivory',     label: 'WORKS',  col: 0.5, row: 0 },
      { id: 'w-build',   size: '1u',   material: 'charcoal',  label: 'build',  col: 3,   row: 0 },
      { id: 'w-01',      size: '1u',   material: 'sage',      label: 'make',   col: 0,   row: 1 },
      { id: 'w-core',    size: '1u',   material: 'clear',     isCore: true,    col: 1,   row: 1 },
      { id: 'w-made',    size: '1u',   material: 'ivory',     label: 'launch', col: 2,   row: 1 },
      { id: 'w-02',      size: '1u',   material: 'terracotta', label: 'keep',  col: 3,   row: 1 },
      { id: 'w-blankbig', size: '1.5u', material: 'charcoal', label: 'partner', col: 0,  row: 2 },
      { id: 'w-smile',   size: '1u',   material: 'ivory',     label: ':)',     col: 1.5, row: 2 },
      { id: 'w-diamond', size: '1u',   material: 'sage',      icon: 'diamond',  col: 2.5, row: 2 },
      { id: 'w-arrow',   size: '1u',   material: 'charcoal',  icon: 'arrow-ne', col: 3.5, row: 2 },
    ],
  },

  service: {
    menu: 'service',
    keys: [
      { id: 's-plan',    size: '1u',   material: 'charcoal',  label: 'plan',    col: 0, row: 0 },
      { id: 's-design',  size: '1u',   material: 'ivory',     label: 'design',  col: 1, row: 0 },
      { id: 's-core',    size: '1u',   material: 'clear',     isCore: true,     col: 2, row: 0 },
      { id: 's-ax',      size: '1u',   material: 'ivory',     label: 'how?',    col: 0, row: 1 },
      { id: 's-service', size: '2u',   material: 'ivory',     label: 'SERVICE', col: 1, row: 1 },
      { id: 's-dev',     size: '1u',   material: 'sage',      label: 'dev',     col: 3, row: 1 },
      { id: 's-operate', size: '1u',   material: 'charcoal',  label: 'operate', col: 0, row: 2 },
      { id: 's-person',  size: '1u',   material: 'slate',     icon: 'service-person', col: 1, row: 2 },
      { id: 's-menu',    size: '1u',   material: 'terracotta', label: 'AX',           col: 2, row: 2 },
    ],
  },

  team: {
    menu: 'team',
    keys: [
      { id: 't-team',    size: '2u',   material: 'ivory',     label: 'TEAM',    col: 0,   row: 0 },
      { id: 't-burst',   size: '1u',   material: 'terracotta', icon: 'team-sun', col: 2,   row: 0 },
      { id: 't-face',    size: '1u',   material: 'ivory',     label: ':|',      col: 3,   row: 0 },
      { id: 't-we',      size: '1u',   material: 'charcoal',  label: 'we',      col: 0,   row: 1 },
      { id: 't-blank',   size: '1u',   material: 'ivory',                       col: 1,   row: 1 },
      { id: 't-dots',    size: '1u',   material: 'slate',     icon: 'team-dots', col: 2,   row: 1 },
      { id: 't-together', size: '2.25u', material: 'charcoal', label: 'together', col: 0, row: 2 },
      { id: 't-core',    size: '1u',   material: 'clear',     isCore: true,     col: 2.25, row: 2 },
      { id: 't-people',  size: '1u',   material: 'charcoal',  label: 'people',  col: 3.25, row: 2 },
    ],
  },

  contact: {
    menu: 'contact',
    keys: [
      { id: 'c-hello',   size: '1u',   material: 'charcoal',  label: 'hello',   col: 0,   row: 0 },
      { id: 'c-arrow',   size: '1u',   material: 'ivory',     icon: 'arrow-ne',  col: 1,   row: 0 },
      { id: 'c-core',    size: '1u',   material: 'clear',     isCore: true,     col: 2,   row: 0 },
      { id: 'c-blank',   size: '1u',   material: 'ivory',                       col: 0,   row: 1 },
      { id: 'c-contact', size: '2.75u', material: 'terracotta', label: 'CONTACT', col: 0, row: 2 },
      { id: 'c-arch',    size: '1u',   material: 'sage',      icon: 'contact-fingerprint', col: 2.75, row: 2 },
      { id: 'c-face2',   size: '1u',   material: 'ivory',     label: ':|',      col: 3.75, row: 2 },
    ],
  },
}
