'use client'

import { useEffect } from 'react'

export default function Home() {
  useEffect(() => {
    const projects = [
      { title: 'WORKS', tone: '#ffe2ae', titleColor: '#10214b', desc: 'Selected digital products and brand experiences.', lead: 'We turn the essential idea into a clear, useful and memorable digital experience.' },
      { title: 'CORE', tone: '#d7e5d6', titleColor: '#163a2f', desc: 'How GROVE thinks, asks and builds.', lead: 'Good outcomes begin with good questions. We focus first on what the project actually needs.' },
      { title: 'AI', tone: '#d7def3', titleColor: '#172848', desc: 'AI-powered systems and new digital interfaces.', lead: 'We connect useful technology with interfaces people can understand and actually use.' },
      { title: 'CONTACT', tone: '#e7d9cf', titleColor: '#33251f', desc: 'Start with the problem, not the solution.', lead: 'Tell us what needs to change. We will start by finding the question at the core.' },
    ]

    const shell = document.getElementById('shell')!
    const zone = document.getElementById('carouselZone')!
    const stage = document.getElementById('stage')!
    const dotsEl = document.getElementById('dots')!
    const detail = document.getElementById('detail')!
    const backBtn = document.getElementById('backBtn')!

    let active = 0, busy = false, wheelAccum = 0, wheelTimer: ReturnType<typeof setTimeout> | null = null
    let dragStart: number | null = null, dragY = 0
    let pressedCard: HTMLElement | null = null

    function mockMarkup() {
      return `
        <div class="browser-mock">
          <div class="browser-bar"><i class="browser-dot"></i><i class="browser-dot"></i><i class="browser-dot"></i><b class="browser-name">GROVE</b><div class="browser-nav"><span>WORK</span><span>CORE</span><span>CONTACT</span></div></div>
          <div class="mock-layout">
            <div class="mock-left"><div class="mock-tile"></div><div class="mock-tile"></div><div class="mock-tile"></div><div class="mock-tile"></div></div>
            <div class="mock-right"><div class="mock-eyebrow">Digital Experience</div><div class="mock-headline">Designing what matters.</div><div class="mock-rule"></div><div class="mock-rule"></div><div class="mock-rule short"></div></div>
          </div>
        </div>`
    }

    projects.forEach((p, i) => {
      const card = document.createElement('button')
      card.className = 'project-card'
      card.type = 'button'
      card.dataset.index = String(i)
      card.setAttribute('aria-label', `Open ${p.title}`)
      card.innerHTML = `<div class="card-inner" style="--tone:${p.tone};--titleColor:${p.titleColor}">${mockMarkup()}<div class="card-title">${p.title}</div><div class="card-index">${String(i + 1).padStart(2, '0')}</div></div>`
      card.addEventListener('click', () => { if (i === active && !busy) openDetail(card, p) })
      stage.appendChild(card)

      const dot = document.createElement('button')
      dot.className = 'dot'
      dot.type = 'button'
      dot.setAttribute('aria-label', `Go to ${p.title}`)
      dot.addEventListener('click', () => setActive(i))
      dotsEl.appendChild(dot)
    })

    function relativePos(i: number) {
      let d = i - active
      const n = projects.length
      if (d > n / 2) d -= n
      if (d < -n / 2) d += n
      if (d > 1) return 2
      if (d < -1) return -2
      return d
    }

    function render() {
      Array.from(stage.children).forEach((card, i) => (card as HTMLElement).dataset.pos = String(relativePos(i)))
      Array.from(dotsEl.children).forEach((dot, i) => dot.classList.toggle('active', i === active))
    }

    function setActive(i: number) {
      if (busy || i === active) return
      busy = true
      active = (i + projects.length) % projects.length
      render()
      setTimeout(() => busy = false, 930)
    }

    function advance(dir: number) { setActive(active + (dir > 0 ? 1 : -1)) }

    function onWheel(e: WheelEvent) {
      e.preventDefault()
      if (busy) return
      wheelAccum += e.deltaY
      if (wheelTimer) clearTimeout(wheelTimer)
      wheelTimer = setTimeout(() => wheelAccum = 0, 130)
      if (Math.abs(wheelAccum) > 32) { const d = wheelAccum > 0 ? 1 : -1; wheelAccum = 0; advance(d) }
    }

    function onPointerDown(e: PointerEvent) {
      if (busy) return
      dragStart = e.clientY
      dragY = 0
      pressedCard = (e.target as HTMLElement).closest('.project-card[data-pos="0"]') as HTMLElement | null
      zone.classList.add('dragging')
    }

    function onPointerMove(e: PointerEvent) {
      if (dragStart === null || busy) return
      dragY = e.clientY - dragStart
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
      if (dragStart === null) return
      const signedDrag = e.clientY - dragStart
      const distance = Math.abs(signedDrag)
      const tappedCard = pressedCard
      const tappedIndex = tappedCard ? Number(tappedCard.dataset.index) : -1
      const center = stage.querySelector('[data-pos="0"]') as HTMLElement | null
      if (center) { center.style.transition = ''; center.style.transform = '' }
      zone.classList.remove('dragging')
      dragStart = null; dragY = 0; pressedCard = null

      if (distance > 58) {
        advance(signedDrag < 0 ? 1 : -1)
      } else if (distance <= 10 && tappedCard && tappedIndex === active) {
        openDetail(tappedCard, projects[tappedIndex])
      }
    }

    function onPointerCancel() {
      const center = stage.querySelector('[data-pos="0"]') as HTMLElement | null
      if (center) { center.style.transition = ''; center.style.transform = '' }
      zone.classList.remove('dragging')
      dragStart = null; dragY = 0; pressedCard = null
    }

    function onKeyDown(e: KeyboardEvent) {
      if (detail.classList.contains('active')) { if (e.key === 'Escape') closeDetail(); return }
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') advance(1)
      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') advance(-1)
      if (e.key === 'Enter') { const c = stage.querySelector('[data-pos="0"]') as HTMLElement | null; if (c) c.click() }
    }

    function openDetail(card: HTMLElement, p: typeof projects[0]) {
      if (busy) return; busy = true
      const rect = card.getBoundingClientRect()
      const clone = document.createElement('div')
      clone.className = 'expand-clone'
      clone.style.cssText = `left:${rect.left}px;top:${rect.top}px;width:${rect.width}px;height:${rect.height}px;border-radius:40px;background:${p.tone}`
      clone.innerHTML = `<div style="position:absolute;inset:0;--tone:${p.tone};--titleColor:${p.titleColor}">${mockMarkup()}</div>`
      document.body.appendChild(clone)
      const detailHero = document.getElementById('detailHero')!
      detailHero.style.setProperty('--detailTone', p.tone)
      detail.style.setProperty('--detailTone', p.tone)
      document.getElementById('detailTitle')!.textContent = p.title
      document.getElementById('detailDesc')!.textContent = p.desc
      document.getElementById('detailLead')!.textContent = p.lead
      document.getElementById('detailBrowser')!.innerHTML = mockMarkup()
      shell.classList.add('leaving')
      clone.getBoundingClientRect()
      requestAnimationFrame(() => {
        clone.style.transition = 'left 920ms var(--ease),top 920ms var(--ease),width 920ms var(--ease),height 920ms var(--ease),border-radius 920ms var(--ease)'
        clone.style.left = '0'; clone.style.top = '0'; clone.style.width = '100vw'; clone.style.height = '100vh'; clone.style.borderRadius = '0'
      })
      setTimeout(() => { detail.classList.add('active'); detail.setAttribute('aria-hidden', 'false'); detail.scrollTop = 0 }, 800)
      setTimeout(() => { clone.remove(); busy = false }, 980)
    }

    function closeDetail() {
      if (busy) return; busy = true
      const card = stage.querySelector('[data-pos="0"]') as HTMLElement
      const p = projects[active]
      const rect = card.getBoundingClientRect()
      const clone = document.createElement('div')
      clone.className = 'expand-clone'
      clone.style.cssText = `left:0;top:0;width:100vw;height:100vh;border-radius:0;background:${p.tone}`
      clone.innerHTML = `<div style="position:absolute;inset:0;--tone:${p.tone};--titleColor:${p.titleColor}">${mockMarkup()}</div>`
      document.body.appendChild(clone)
      detail.classList.remove('active'); detail.setAttribute('aria-hidden', 'true'); shell.classList.remove('leaving')
      clone.getBoundingClientRect()
      requestAnimationFrame(() => {
        clone.style.transition = 'left 900ms var(--ease),top 900ms var(--ease),width 900ms var(--ease),height 900ms var(--ease),border-radius 900ms var(--ease)'
        clone.style.left = `${rect.left}px`; clone.style.top = `${rect.top}px`; clone.style.width = `${rect.width}px`; clone.style.height = `${rect.height}px`; clone.style.borderRadius = '40px'
      })
      setTimeout(() => { clone.remove(); busy = false }, 950)
    }

    zone.addEventListener('wheel', onWheel as EventListener, { passive: false })
    zone.addEventListener('pointerdown', onPointerDown as EventListener)
    zone.addEventListener('pointermove', onPointerMove as EventListener)
    zone.addEventListener('pointerup', onPointerUp as EventListener)
    zone.addEventListener('pointercancel', onPointerCancel)
    document.addEventListener('keydown', onKeyDown)
    backBtn.addEventListener('click', closeDetail)

    render()

    return () => {
      zone.removeEventListener('wheel', onWheel as EventListener)
      zone.removeEventListener('pointerdown', onPointerDown as EventListener)
      zone.removeEventListener('pointermove', onPointerMove as EventListener)
      zone.removeEventListener('pointerup', onPointerUp as EventListener)
      zone.removeEventListener('pointercancel', onPointerCancel)
      document.removeEventListener('keydown', onKeyDown)
      backBtn.removeEventListener('click', closeDetail)
    }
  }, [])

  return (
    <>
      <main className="shell" id="shell">
        <section className="identity" aria-label="Brand">
          <h1>GROVE<span>Digital Experience</span></h1>
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

        <section className="carousel-zone" id="carouselZone" aria-label="Project menu carousel">
          <div className="carousel-stage" id="stage"></div>
        </section>
        <nav className="dots" id="dots" aria-label="Project pagination"></nav>
        <div className="hint">Scroll / drag</div>
      </main>

      <section className="detail" id="detail" aria-hidden="true">
        <button className="back" id="backBtn">Back</button>
        <div className="detail-hero" id="detailHero">
          <div className="detail-browser" id="detailBrowser"></div>
          <div className="detail-copy">
            <h2 id="detailTitle">WORKS</h2>
            <p id="detailDesc">Selected digital products and brand experiences.</p>
          </div>
        </div>
        <div className="detail-body">
          <p className="lead" id="detailLead">We build digital experiences around the essential idea.</p>
        </div>
      </section>
    </>
  )
}
