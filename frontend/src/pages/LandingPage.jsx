import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getSession } from '../services/authService.js'
import './LandingPage.css'

const icons = {
  list: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
  calendar: 'M8 3v4M16 3v4M3 10h18M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z',
  details: 'M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9zM14 3v6h6M8 13h8M8 17h5',
  arrow: 'M5 12h14M13 6l6 6-6 6',
  link: 'M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1',
  check: 'M5 12l5 5L20 7',
}

function Icon({ name }) {
  return (
    <svg className="lp-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d={icons[name]} />
    </svg>
  )
}

// Status shown as a small colored dot with dark text, so color stays a small accent.
function StatusBadge({ status }) {
  return (
    <span className={`lp-status lp-status-${status.toLowerCase()}`}>
      <span className="lp-status-dot" aria-hidden="true" />
      {status}
    </span>
  )
}

const benefits = [
  {
    icon: 'list',
    title: 'Track every application',
    text: 'No more digging through job boards, portals, and emails. See every company, position, and status in one private list.',
  },
  {
    icon: 'calendar',
    title: 'Remember deadlines',
    text: 'Keep each application’s deadline next to it, so nothing slips by while you juggle dozens of them.',
  },
  {
    icon: 'details',
    title: 'Save the details',
    text: 'Store notes, the job posting link, and which resume you sent, ready for when an interview comes up.',
  },
]

const steps = [
  { title: 'Create an account', text: 'Sign up with your email and a password.' },
  { title: 'View your applications', text: 'Your dashboard lists every application and its status.' },
  {
    title: 'Open one for the details',
    text: 'See its deadline, notes, job link, and the resume you used.',
  },
]

const highlights = ['Free to use', 'Private to your account', 'Works on any device']

const roadmap = ['Add Application', 'Progress Summary', 'Reminders', 'AI Advisor']

const currentYear = new Date().getFullYear()

const team = ['Quan Huynh', 'Ferris Abouelfadl', 'Joseph Park', 'Adit Reddy']

// Sample rows for the decorative dashboard preview in the hero.
const previewRows = [
  { company: 'Google', position: 'SWE Intern', status: 'Interviewing' },
  { company: 'Microsoft', position: 'SWE Intern', status: 'Applied' },
  { company: 'Capital One', position: 'Technology Intern', status: 'Offer' },
  { company: 'Amazon', position: 'SDE Intern', status: 'Applied' },
  { company: 'Meta', position: 'Software Engineer Intern', status: 'Rejected' },
]

function initials(name) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
}

// Public home page: what Next Step does, how to use it, and who built it.
function LandingPage() {
  const [loggedIn, setLoggedIn] = useState(false)

  useEffect(() => {
    getSession().then(({ data }) => setLoggedIn(Boolean(data.session)))
  }, [])

  const ctaTarget = loggedIn ? '/applications' : '/login'
  const ctaState = loggedIn ? undefined : { mode: 'signup' }

  return (
    <div className="lp">
      <header className="lp-header">
        <div className="lp-container lp-header-inner">
          <Link to="/" className="lp-brand">
            <span className="lp-brand-mark" aria-hidden="true">
              N
            </span>
            Next Step
          </Link>
          <nav className="lp-nav" aria-label="Page sections">
            <a href="#features">Features</a>
            <a href="#how-it-works">How it works</a>
          </nav>
          <nav className="lp-header-actions" aria-label="Account">
            {loggedIn ? (
              <Link to="/applications" className="lp-btn lp-btn-primary">
                My Applications
              </Link>
            ) : (
              <>
                <Link to="/login" className="lp-btn lp-btn-ghost">
                  Log in
                </Link>
                <Link to="/login" state={{ mode: 'signup' }} className="lp-btn lp-btn-primary">
                  Sign up
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main>
        <section className="lp-hero">
          <div className="lp-container lp-hero-inner">
            <div className="lp-hero-copy">
              <p className="lp-eyebrow">Internship application tracker</p>
              <h1 className="lp-hero-title">
                Every internship application, <span className="lp-gradient-text">one place.</span>
              </h1>
              <p className="lp-hero-text">
                Track your applications, deadlines, and interview notes in one place.
              </p>
              <Link to={ctaTarget} state={ctaState} className="lp-btn lp-btn-primary lp-btn-lg">
                {loggedIn ? 'Go to my applications' : 'Get started free'} <Icon name="arrow" />
              </Link>
              <ul className="lp-highlights">
                {highlights.map((item) => (
                  <li key={item}>
                    <Icon name="check" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="lp-preview-stage">
              <div className="lp-preview" aria-hidden="true">
                <div className="lp-preview-bar">
                  <span />
                  <span />
                  <span />
                </div>
                <div className="lp-preview-body">
                  <div className="lp-preview-list">
                    <p className="lp-preview-heading">My Applications</p>
                    {previewRows.map((row, index) => (
                      <div
                        key={row.company}
                        className={`lp-preview-row${index === 0 ? ' lp-preview-row-active' : ''}`}
                      >
                        <span className="lp-preview-logo">{row.company[0]}</span>
                        <span className="lp-preview-text">
                          <strong>{row.company}</strong>
                          <small>{row.position}</small>
                        </span>
                        <StatusBadge status={row.status} />
                      </div>
                    ))}
                  </div>

                  <div className="lp-preview-detail">
                    <p className="lp-preview-detail-title">Google</p>
                    <p className="lp-preview-detail-sub">SWE Intern</p>
                    <dl className="lp-preview-fields">
                      <div>
                        <dt>Status</dt>
                        <dd>
                          <StatusBadge status="Interviewing" />
                        </dd>
                      </div>
                      <div>
                        <dt>Deadline</dt>
                        <dd>Oct 1, 2026</dd>
                      </div>
                      <div>
                        <dt>Job link</dt>
                        <dd className="lp-preview-link">
                          <Icon name="link" /> careers.google.com
                        </dd>
                      </div>
                      <div>
                        <dt>Resume</dt>
                        <dd>Resume v3</dd>
                      </div>
                      <div className="lp-preview-notes">
                        <dt>Notes</dt>
                        <dd>Technical interview Nov 5. Review graphs and system design.</dd>
                      </div>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="lp-section" aria-labelledby="benefits-heading">
          <div className="lp-container">
            <div className="lp-section-head">
              <h2 id="benefits-heading" className="lp-section-title">
                Applying to internships is a lot to keep track of
              </h2>
              <p className="lp-section-text">
                Students apply to dozens of internships at once. Next Step keeps it all together.
              </p>
            </div>
            <div className="lp-benefits">
              {benefits.map((benefit) => (
                <article key={benefit.title} className="lp-card">
                  <span className="lp-icon-box">
                    <Icon name={benefit.icon} />
                  </span>
                  <h3 className="lp-card-title">{benefit.title}</h3>
                  <p className="lp-card-text">{benefit.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="how-it-works" className="lp-section lp-section-tint" aria-labelledby="steps-heading">
          <div className="lp-container">
            <div className="lp-section-head">
              <h2 id="steps-heading" className="lp-section-title">
                Get started in three steps
              </h2>
            </div>
            <ol className="lp-steps">
              {steps.map((step, index) => (
                <li key={step.title} className="lp-step">
                  <span className="lp-step-number" aria-hidden="true">
                    {index + 1}
                  </span>
                  <h3 className="lp-card-title">{step.title}</h3>
                  <p className="lp-card-text">{step.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="lp-section lp-section-cta">
          <div className="lp-container">
            <div className="lp-cta">
              <h2 className="lp-cta-title">Ready to take the next step?</h2>
              <p className="lp-cta-text">Bring your whole internship search into one place.</p>
              <Link to={ctaTarget} state={ctaState} className="lp-btn lp-btn-white lp-btn-lg">
                {loggedIn ? 'Go to my applications' : 'Create your account'} <Icon name="arrow" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="lp-footer">
        <div className="lp-container">
          <div className="lp-footer-grid">
            <div className="lp-footer-about">
              <span className="lp-brand lp-brand-footer">
                <span className="lp-brand-mark" aria-hidden="true">
                  N
                </span>
                Next Step
              </span>
              <p>
                An internship application tracker that keeps your whole search organized in one
                place.
              </p>
            </div>

            <nav className="lp-footer-col" aria-label="Footer">
              <h2 className="lp-footer-heading">Product</h2>
              <ul>
                <li>
                  <a href="#features">Features</a>
                </li>
                <li>
                  <a href="#how-it-works">How it works</a>
                </li>
                <li>
                  <Link to="/login">Log in</Link>
                </li>
                <li>
                  <Link to="/login" state={{ mode: 'signup' }}>
                    Sign up
                  </Link>
                </li>
              </ul>
            </nav>

            <div className="lp-footer-col">
              <h2 className="lp-footer-heading">Built by</h2>
              <ul>
                {team.map((name) => (
                  <li key={name} className="lp-team-member">
                    <span className="lp-avatar" aria-hidden="true">
                      {initials(name)}
                    </span>
                    {name}
                  </li>
                ))}
              </ul>
            </div>

            <div className="lp-footer-col">
              <h2 className="lp-footer-heading">Coming next</h2>
              <ul>
                {roadmap.map((item) => (
                  <li key={item} className="lp-roadmap-item">
                    {item}
                    <span className="lp-soon">Soon</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="lp-footer-bottom">
            <span>© {currentYear} Next Step</span>
            <span>Made by Quan Huynh, Ferris Abouelfadl, Joseph Park, and Adit Reddy</span>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage
