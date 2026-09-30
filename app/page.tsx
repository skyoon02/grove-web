'use client'

import { useState, useRef, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'

type MenuKey = 'about' | 'works' | 'service' | 'team' | 'contact'

const PROJECTS = [
  { key: 'about' as MenuKey, title: 'ABOUT', tone: '#e8edf2', titleColor: '#1a2535', desc: 'How GROVE thinks and why we do what we do.', lead: 'We start with the question before we build the answer.' },
  { key: 'works' as MenuKey, title: 'WORKS', tone: '#ffe2ae', titleColor: '#10214b', desc: 'Selected digital products and brand experiences.', lead: 'We turn the essential idea into a clear, useful and memorable digital experience.' },
  { key: 'service' as MenuKey, title: 'SERVICE', tone: '#d7def3', titleColor: '#172848', desc: 'Strategy, design, development and AI — connected.', lead: 'From planning to launch, we connect the pieces that move your business forward.' },
  { key: 'team' as MenuKey, title: 'TEAM', tone: '#d7e5d6', titleColor: '#163a2f', desc: 'The people behind the work.', lead: 'Good work comes from good people asking the right questions together.' },
  { key: 'contact' as MenuKey, title: 'CONTACT', tone: '#e7d9cf', titleColor: '#33251f', desc: 'Start with the problem, not the solution.', lead: 'Tell us what needs to change. We will start by finding the question at the core.' },
]

function mockMarkup() {
  return `<div class="browser-mock"><div class="browser-bar"><i class="browser-dot"></i><i class="browser-dot"></i><i class="browser-dot"></i><b class="browser-name">GROVE</b><div class="browser-nav"><span>WORK</span><span>CORE</span><span>CONTACT</span></div></div><div class="mock-layout"><div class="mock-left"><div class="mock-tile"></div><div class="mock-tile"></div><div class="mock-tile"></div><div class="mock-tile"></div></div><div class="mock-right"><div class="mock-eyebrow">Digital Experience</div><div class="mock-headline">Designing what matters.</div><div class="mock-rule"></div><div class="mock-rule"></div><div class="mock-rule short"></div></div></div></div>`
}

function TestBox() {
  return (
    <mesh rotation={[0.3, 0.5, 0]}>
      <boxGeometry args={[2, 2, 2]} />
      <meshStandardMaterial color="#c8c4bc" roughness={0.4} metalness={0.1} />
    </mesh>
  )
}

function KeycapScene({ activeMenu }: { activeMenu: MenuKey }) {
  void activeMenu
  return (
    <Canvas dpr={[1, 1.5]} camera={{ position: [0, 4.2, 8.5], fov: 36 }}>
      <ambientLight intensity={0.6} />
      <directionalLight position={[-4, 7, 6]} intensity={2.2} />
      <directionalLight position={[5, 2, 3]} intensity={0.35} />
      <TestBox />
    </Canvas>
  )
}

export default function Home() {
  const [activeIdx, setActiveIdxState] = useState(0)
  const [detailOpen, setDetailOpenState] = useState(false)
  const [detailProject, setDetailProject] = useState(PROJECTS[0])
  const [leaving, setLeaving] = useState(false)

  const activeIdxRef = useRef(0)
  const detailOpenRef = useRef(false)
  const busyRef = useRef(false)
  const wheelAccumRef = useRef(0)
  const wheelTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const dragStartRef = useRef<number | null>(null)
  const pressedIdxRef = useRef<number | null>(null)
  const zoneRef = useRef<HTMLElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)

  function syncActiveIdx(next: number) {
    activeIdxRef.current = next
    setActiveIdxState(next)
  }

  function syncDetailOpen(v: boolean) {
    detailOpenRef.current = v
    setDetailOpenState(v)
  }

  function getPos(i: number) {
    let d = i - activeIdx
    const n = PROJECTS.length
    if (d > n / 2) d -= n
    if (d < -n / 2) d += n
    if (d > 1) return 2
    if (d < -1) return -2
    return d
  }

  function openDetail(idx: number) {
    if (busyRef.current) return
    busyRef.current = true
    const p = PROJECTS[idx]
    const card = stageRef.current?.querySelector(`[data-index="${idx}"]`) as HTMLElement | null
    if (!card) { busyRef.current = false; return }
    const rect = card.getBoundingClientRect()
    const clone = document.createElement('div')
    clone.className = 'expand-clone'
    clone.style.cssText = `left:${rect.left}px;top:${rect.top}px;width:${rect.width}px;height:${rect.height}px;border-radius:40px;background:${p.tone}`
    clone.innerHTML = `<div style="position:absolute;inset:0;--tone:${p.tone};--titleColor:${p.titleColor}">${mockMarkup()}</div>`
    document.body.appendChild(clone)
    setDetailProject(p)
    setLeaving(true)
    clone.getBoundingClientRect()
    requestAnimationFrame(() => {
      clone.style.transition = 'left 920ms var(--ease),top 920ms var(--ease),width 920ms var(--ease),height 920ms var(--ease),border-radius 920ms var(--ease)'
      clone.style.left = '0'; clone.style.top = '0'; clone.style.width = '100vw'; clone.style.height = '100vh'; clone.style.borderRadius = '0'
    })
    setTimeout(() => { syncDetailOpen(true); clone.remove(); busyRef.current = false }, 800)
  }

  function closeDetail() {
    if (busyRef.current) return
    busyRef.current = true
    const p = PROJECTS[activeIdxRef.current]
    const card = stageRef.current?.querySelector(`[data-index="${activeIdxRef.current}"]`) as HTMLElement | null
    if (!card) { syncDetailOpen(false); setLeaving(false); busyRef.current = false; return }
    const rect = card.getBoundingClientRect()
    const clone = document.createElement('div')
    clone.className = 'expand-clone'
    clone.style.cssText = `left:0;top:0;width:100vw;height:100vh;border-radius:0;background:${p.tone}`
    clone.innerHTML = `<div style="position:absolute;inset:0;--tone:${p.tone};--titleColor:${p.titleColor}">${mockMarkup()}</div>`
    document.body.appendChild(clone)
    syncDetailOpen(false)
    setLeaving(false)
    clone.getBoundingClientRect()
    requestAnimationFrame(() => {
      clone.style.transition = 'left 900ms var(--ease),top 900ms var(--ease),width 900ms var(--ease),height 900ms var(--ease),border-radius 900ms var(--ease)'
      clone.style.left = `${rect.left}px`; clone.style.top = `${rect.top}px`
      clone.style.width = `${rect.width}px`; clone.style.height = `${rect.height}px`
      clone.style.borderRadius = '40px'
    })
    setTimeout(() => { clone.remove(); busyRef.current = false }, 950)
  }

  useEffect(() => {
    const zone = zoneRef.current!
    const stage = stageRef.current!
    if (!zone || !stage) return

    function doSetActive(i: number) {
      if (busyRef.current) return
      busyRef.current = true
      const next = (i + PROJECTS.length) % PROJECTS.length
      activeIdxRef.current = next
      setActiveIdxState(next)
      setTimeout(() => { busyRef.current = false }, 930)
    }

    function advance(dir: number) {
      doSetActive(activeIdxRef.current + (dir > 0 ? 1 : -1))
    }

    function onWheel(e: WheelEvent) {
      e.preventDefault()
      if (busyRef.current) return
      wheelAccumRef.current += e.deltaY
      if (wheelTimerRef.current) clearTimeout(wheelTimerRef.current)
      wheelTimerRef.current = setTimeout(() => { wheelAccumRef.current = 0 }, 130)
      if (Math.abs(wheelAccumRef.current) > 32) {
        const d = wheelAccumRef.current > 0 ? 1 : -1
        wheelAccumRef.current = 0
        advance(d)
      }
    }

    function onPointerDown(e: PointerEvent) {
      if (busyRef.current) return
      dragStartRef.current = e.clientY
      const card = (e.target as HTMLElement).closest('.project-card[data-pos="0"]') as HTMLElement | null
      pressedIdxRef.current = card ? Number(card.dataset.index) : null
      zone.classList.add('dragging')
    }

    function onPointerMove(e: PointerEvent) {
      if (dragStartRef.current === null || busyRef.current) return
      const dragY = e.clientY - dragStartRef.current
      if (Math.abs(dragY) > 4 && !(zone as any).hasPointerCapture?.(e.pointerId)) {
        (zone as any).setPointerCapture?.(e.pointerId)
      }
      const center = stage.querySelector('[data-pos="0"]') as HTMLElement | null
      if (center && Math.abs(dragY) > 3) {
        center.style.transition = 'none'
        center.style.transform = `translate3d(0,${dragY * .18}px,0) rotateX(${dragY * -.012}deg) scale(${1 - Math.min(Math.abs(dragY) / 4500, .02)})`
      }
    }

    function onPointerUp(e: PointerEvent) {
      if (dragStartRef.current === null) return
      const signedDrag = e.clientY - dragStartRef.current
      const distance = Math.abs(signedDrag)
      const tappedIdx = pressedIdxRef.current
      const center = stage.querySelector('[data-pos="0"]') as HTMLElement | null
      if (center) { center.style.transition = ''; center.style.transform = '' }
      zone.classList.remove('dragging')
      dragStartRef.current = null; pressedIdxRef.current = null

      if (distance > 58) {
        advance(signedDrag < 0 ? 1 : -1)
      } else if (distance <= 10 && tappedIdx !== null && tappedIdx === activeIdxRef.current) {
        openDetail(tappedIdx)
      }
    }

    function onPointerCancel() {
      const center = stage.querySelector('[data-pos="0"]') as HTMLElement | null
      if (center) { center.style.transition = ''; center.style.transform = '' }
      zone.classList.remove('dragging')
      dragStartRef.current = null; pressedIdxRef.current = null
    }

    function onKeyDown(e: KeyboardEvent) {
      if (detailOpenRef.current) { if (e.key === 'Escape') closeDetail(); return }
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') advance(1)
      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') advance(-1)
    }

    zone.addEventListener('wheel', onWheel as EventListener, { passive: false })
    zone.addEventListener('pointerdown', onPointerDown as EventListener)
    zone.addEventListener('pointermove', onPointerMove as EventListener)
    zone.addEventListener('pointerup', onPointerUp as EventListener)
    zone.addEventListener('pointercancel', onPointerCancel)
    document.addEventListener('keydown', onKeyDown)

    return () => {
      zone.removeEventListener('wheel', onWheel as EventListener)
      zone.removeEventListener('pointerdown', onPointerDown as EventListener)
      zone.removeEventListener('pointermove', onPointerMove as EventListener)
      zone.removeEventListener('pointerup', onPointerUp as EventListener)
      zone.removeEventListener('pointercancel', onPointerCancel)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const activeMenu = PROJECTS[activeIdx].key

  return (
    <>
      <main className={`shell${leaving ? ' leaving' : ''}`}>

        <div className="scene-zone">
          <KeycapScene activeMenu={activeMenu} />
        </div>

        <section className="identity" aria-label="Brand">
          <h1>GROVE<span>AI, engineered for AX.</span></h1>
          <div className="utility">
            <button className="icon-btn" aria-label="About Grove" title="About Grove">
              <svg viewBox="0 0 24 24">
                <path d="M4.7 19c.8-3.7 3.2-5.8 7.3-5.8s6.5 2.1 7.3 5.8" />
                <circle cx="12" cy="8" r="3.4" />
              </svg>
            </button>
            <button className="icon-btn" aria-label="Contact" title="Contact">
              <svg viewBox="0 0 24 24">
                <path d="M5 17.5l-.6 2.2 2.4-.8A7.7 7.7 0 1 0 4.3 13c0 1.7.5 3.2 1.4 4.5Z" />
                <circle cx="9" cy="12" r=".7" fill="#151515" stroke="none" />
                <circle cx="12" cy="12" r=".7" fill="#151515" stroke="none" />
                <circle cx="15" cy="12" r=".7" fill="#151515" stroke="none" />
              </svg>
            </button>
          </div>
        </section>

        <section
          className="carousel-zone"
          ref={zoneRef as React.RefObject<HTMLElement>}
          aria-label="Project menu carousel"
        >
          <div className="carousel-stage" ref={stageRef}>
            {PROJECTS.map((p, i) => (
              <button
                key={p.key}
                className="project-card"
                data-pos={String(getPos(i))}
                data-index={String(i)}
                type="button"
                aria-label={`Open ${p.title}`}
                onClick={() => { if (i === activeIdx && !busyRef.current) openDetail(i) }}
              >
                <div
                  className="card-inner"
                  style={{ '--tone': p.tone, '--titleColor': p.titleColor } as React.CSSProperties}
                >
                  <div dangerouslySetInnerHTML={{ __html: mockMarkup() }} />
                  <div className="card-title">{p.title}</div>
                  <div className="card-index">{String(i + 1).padStart(2, '0')}</div>
                </div>
              </button>
            ))}
          </div>
        </section>

        <nav className="dots" aria-label="Project pagination">
          {PROJECTS.map((p, i) => (
            <button
              key={p.key}
              className={`dot${i === activeIdx ? ' active' : ''}`}
              type="button"
              aria-label={`Go to ${p.title}`}
              onClick={() => {
                if (busyRef.current || i === activeIdxRef.current) return
                busyRef.current = true
                activeIdxRef.current = i
                setActiveIdxState(i)
                setTimeout(() => { busyRef.current = false }, 930)
              }}
            />
          ))}
        </nav>
        <div className="hint">Scroll / drag</div>
      </main>

      <section
        className={`detail${detailOpen ? ' active' : ''}`}
        aria-hidden={detailOpen ? 'false' : 'true'}
        style={{ '--detailTone': detailProject.tone } as React.CSSProperties}
      >
        <button className="back" type="button" onClick={closeDetail}>Back</button>
        <div className="detail-hero">
          <div className="detail-browser" dangerouslySetInnerHTML={{ __html: mockMarkup() }} />
          <div className="detail-copy">
            <h2>{detailProject.title}</h2>
            <p>{detailProject.desc}</p>
          </div>
        </div>
        <div className="detail-body">
          <p className="lead">{detailProject.lead}</p>
        </div>
      </section>
    </>
  )
}
