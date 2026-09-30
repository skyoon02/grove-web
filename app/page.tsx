'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import SiteHeader from './SiteHeader'

const LandingKeycapScene = dynamic(() => import('./LandingKeycapScene'), {
  ssr: false,
  loading: () => <div className="landing-scene-placeholder" aria-hidden="true" />,
})

const workflowSteps = [
  ['proposal', '선제안', '83%'],
  ['prototype', '프로토타입', '75%'],
  ['requirements', '기능 정의', '65%'],
  ['wireframe', '화면 설계', '56%'],
  ['development', '시스템 구축', '45%'],
  ['testing', '품질 검증', '33%'],
  ['stabilize', '런칭 및 안정화', '18%'],
] as const

function handleInquirySubmit(event: FormEvent<HTMLFormElement>) {
  event.preventDefault()
  const data = new FormData(event.currentTarget)
  const name = String(data.get('name') ?? '').trim()
  const contact = String(data.get('contact') ?? '').trim()
  const project = String(data.get('project') ?? '').trim()
  const subject = encodeURIComponent(`[프로젝트 문의] ${name || '새로운 프로젝트'}`)
  const body = encodeURIComponent(`이름: ${name}\
연락처: ${contact}\
\
프로젝트 내용:\
${project}`)
  window.location.href = `mailto:request@grovesoft.net?subject=${subject}&body=${body}`
}

const clientLogos = [
  { name: 'KRAFTON', className: 'krafton' },
  { name: 'AMOREPACIFIC', className: 'amorepacific' },
  { name: 'kt', className: 'kt' },
  { name: 'Titleist', className: 'titleist' },
  { name: 'HYBE', className: 'hybe' },
  { name: 'LG', className: 'lg' },
] as const

export default function Home() {
  const [contactOpen, setContactOpen] = useState(false)
  const contactPanelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!contactOpen) return
    contactPanelRef.current?.focus({ preventScroll: true })
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setContactOpen(false)
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [contactOpen])

  const panelTabIndex = contactOpen ? 0 : -1

  return (
    <main className="landing-page">
      <SiteHeader home landingVariant="a" />

      <section className="landing-section partner-section" id="partner" aria-labelledby="partner-title">
        <LandingKeycapScene mode="partner" />

        <div className="section-copy partner-copy">
          <h1 id="partner-title">AI 이후의<br /><span>일하는 방식</span></h1>
          <p className="partner-subcopy">디지털 서비스를 만들어온 경험 위에 AI를 연결합니다.<br />업무와 시스템을 넘어 기업이 일하는 방식까지.</p>
          <a className="dark-link" href="#contact">
            <span>WHAT&#39;S NEXT ?</span><b aria-hidden="true">↗</b>
          </a>
        </div>
      </section>

      <section className="landing-section workflow-section" id="workflow" aria-labelledby="workflow-title">
        <LandingKeycapScene mode="workflow" />

        <div className="workflow-callouts" aria-hidden="true">
          {workflowSteps.map(([key, label, top]) => (
            <div className={`workflow-callout callout-${key}`} key={key} style={{ top }}>
              <i /><span>{label}</span>
            </div>
          ))}
        </div>

        <div className="workflow-copy">
          <h2 id="workflow-title"><span className="workflow-title-primary"><span>더 빠른 실행,</span></span><span>더 깊은 판단</span></h2>
          <div>
            AI는 반복과 실행의 범위를 넓히고,<br />전문가는 맥락과 기준이 필요한 판단에 집중합니다.
          </div>
          <a className="text-link workflow-button" href="#operate">
            <span>구축부터 운영까지 보기</span><b aria-hidden="true">→</b>
          </a>
        </div>
      </section>

      <section className="landing-section operate-section" id="operate" aria-labelledby="operate-title">
        <LandingKeycapScene mode="operate" />

        <div className="section-copy operate-copy">
          <h2 id="operate-title">비즈니스를<span>이해하는 AX</span></h2>
          <p className="section-description">
            기업마다 다른 업무와 데이터, 기준을 이해하고<br />
            실제 업무 프로세스에 연결되는 AX를 설계합니다.
          </p>
          <Link className="text-link light-link" href="/works">
            <span>분야별 프로젝트 보기</span><b aria-hidden="true">→</b>
          </Link>
        </div>

        <div className="client-logo-stream" aria-label="그로브 고객사">
          <div className="client-logo-track" aria-hidden="true">
            {[0, 1].map((group) => (
              <div className="client-logo-group" key={group}>
                {clientLogos.map((logo) => (
                  <span className={`client-logo client-logo--${logo.className}`} key={`${group}-${logo.name}`}>
                    {logo.className === 'lg' && <i aria-hidden="true">●</i>}
                    {logo.name}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>

      </section>

      <section className={`landing-section contact-section${contactOpen ? ' contact-is-open' : ''}`} id="contact" aria-labelledby="contact-title">
        <LandingKeycapScene mode="contact" />

        <div className="contact-copy">
          <h2 id="contact-title">새로운 방식의 <span style={{color:'var(--landing-orange)'}}>시작</span></h2>
          <p className="contact-description">지금의 업무에 가장 먼저 달라져야 할 곳부터 찾습니다.</p>
        </div>

        <div className="contact-reveal" aria-hidden="true" />

        <button
          className="contact-toggle"
          type="button"
          aria-expanded={contactOpen}
          aria-controls="contact-panel"
          aria-label={contactOpen ? 'Contact 패널 닫고 랜딩페이지로 돌아가기' : 'Contact 패널 열고 첫 AX 과제 정하기'}
          onClick={() => setContactOpen((open) => !open)}
        >
          <span className="contact-toggle-label" aria-hidden="true">
            <span className="toggle-label-default">
              <span style={{color:'var(--landing-orange)'}}>Let&#39;s Start!</span>
              <svg className="contact-direction-arrow" viewBox="0 0 20 42" fill="none">
                <path d="M10 40V4M10 4L4 11M10 4L16 11" />
              </svg>
            </span>
            <span className="toggle-label-active">문의 닫기 <b>↺</b></span>
          </span>
        </button>

        <div
          className="contact-panel"
          id="contact-panel"
          ref={contactPanelRef}
          role="region"
          aria-labelledby="contact-panel-title"
          aria-hidden={!contactOpen}
          tabIndex={-1}
        >
          <div className="contact-panel-intro">
            <p className="panel-index">IT CONSULTANCY <span>/ CONTACT</span></p>
            <h3 id="contact-panel-title">무엇부터 바꿀까요?</h3>
            <p className="contact-panel-lead">새로운 서비스부터 기존 시스템, 반복되는 업무까지.<br />지금 가장 필요한 변화에서 시작합니다.</p>

            <dl className="contact-details">
              <div><dt>Email</dt><dd><a href="mailto:request@grovesoft.net" tabIndex={panelTabIndex}>request@grovesoft.net</a></dd></div>
              <div><dt>Call</dt><dd><a href="tel:0234822630" tabIndex={panelTabIndex}>02-3482-2630</a></dd></div>
              <div><dt>Location</dt><dd>서울시 용산구 청파로 46 한통빌딩 12층</dd></div>
            </dl>
          </div>

          <form className="contact-form" onSubmit={handleInquirySubmit}>
            <p>어떤 변화를 생각하고 계신가요?</p>
            <label><span>이름</span><input name="name" type="text" autoComplete="name" placeholder="성함 또는 회사명" disabled={!contactOpen} required /></label>
            <label><span>연락처</span><input name="contact" type="text" autoComplete="email" placeholder="이메일 또는 전화번호" disabled={!contactOpen} required /></label>
            <label><span>프로젝트 내용</span><textarea name="project" rows={4} placeholder="바꾸고 싶은 업무나 시스템, 만들고 싶은 서비스에 대해 자유롭게 남겨주세요." disabled={!contactOpen} required /></label>
            <button type="submit" disabled={!contactOpen}><span>AX 과제 상담하기</span><b aria-hidden="true">↗</b></button>
          </form>
        </div>

        <footer className="landing-footer">
          <nav aria-label="하단 메뉴"><Link href="/about">회사소개</Link><Link href="/works">포트폴리오</Link></nav>
          <p>2012–NOW · IT CONSULTING &amp; OPERATIONS</p>
          <p>© 2026</p>
        </footer>
      </section>
    </main>
  )
}