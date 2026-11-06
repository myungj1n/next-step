import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { getSession, signIn, signUp } from '../services/authService.js'
import './LoginPage.css'

const icons = {
  mail: 'M4 6h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1zM3 7l9 6 9-6',
  lock: 'M6 11h12a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1zM8 11V7a4 4 0 0 1 8 0v4',
  eye: 'M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  eyeOff: 'M3 3l18 18M10.6 5.1A10.9 10.9 0 0 1 12 5c6.5 0 10 7 10 7a17.6 17.6 0 0 1-3.2 4.2M6.6 6.6C3.9 8.4 2 12 2 12s3.5 7 10 7c1.9 0 3.6-.6 5-1.5M9.9 9.9a3 3 0 0 0 4.2 4.2',
  check: 'M5 12l5 5L20 7',
  back: 'M19 12H5M11 18l-6-6 6-6',
}

function Icon({ name, className = 'auth-icon' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path d={icons[name]} />
    </svg>
  )
}

const benefits = [
  'Every application in one dashboard',
  'Track status, deadlines, and notes',
  'Save the job link and resume you used',
]

// LoginPage from the class diagram: one form that switches between log in and sign up.
function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const redirectTo = location.state?.from ?? '/applications'

  // The landing page's "Sign up" buttons open this page in signup mode.
  const [mode, setMode] = useState(location.state?.mode ?? 'login') // 'login' | 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const isLogin = mode === 'login'

  // Already logged in: skip the form.
  useEffect(() => {
    getSession().then(({ data }) => {
      if (data.session) navigate('/applications', { replace: true })
    })
  }, [navigate])

  const handleLogin = async () => {
    const { error } = await signIn(email, password)
    if (error) {
      setError(error.message)
      return
    }
    navigate(redirectTo, { replace: true })
  }

  const handleSignup = async () => {
    const { data, error } = await signUp(email, password)
    if (error) {
      setError(error.message)
      return
    }
    // With "Confirm email" off, Supabase logs the new user in right away.
    if (data.session) {
      navigate('/applications', { replace: true })
    } else {
      setMessage('Account created. Check your email to confirm it, then log in.')
      setMode('login')
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setMessage('')
    setSubmitting(true)
    await (isLogin ? handleLogin() : handleSignup())
    setSubmitting(false)
  }

  const switchMode = (nextMode) => {
    setMode(nextMode)
    setError('')
    setMessage('')
  }

  return (
    <div className="auth">
      <aside className="auth-panel" aria-hidden="true">
        <div className="auth-panel-inner">
          <span className="auth-logo auth-logo-light">
            <span className="auth-logo-mark">N</span>
            Next Step
          </span>

          <div>
            <h2 className="auth-panel-title">Your internship search, finally organized.</h2>
            <ul className="auth-benefits">
              {benefits.map((benefit) => (
                <li key={benefit}>
                  <span className="auth-benefit-check">
                    <Icon name="check" />
                  </span>
                  {benefit}
                </li>
              ))}
            </ul>
          </div>

          <div className="auth-preview">
            <div className="auth-preview-row">
              <span className="auth-preview-logo">G</span>
              <span className="auth-preview-text">
                <strong>Google</strong>
                <small>SWE Intern</small>
              </span>
              <span className="auth-preview-status auth-preview-interviewing">Interviewing</span>
            </div>
            <div className="auth-preview-row">
              <span className="auth-preview-logo">C</span>
              <span className="auth-preview-text">
                <strong>Capital One</strong>
                <small>Technology Intern</small>
              </span>
              <span className="auth-preview-status auth-preview-offer">Offer</span>
            </div>
          </div>
        </div>
      </aside>

      <main className="auth-main">
        <div className="auth-topbar">
          <Link to="/" className="auth-logo auth-logo-mobile">
            <span className="auth-logo-mark">N</span>
            Next Step
          </Link>
          <Link to="/" className="auth-home">
            <Icon name="back" />
            Back to home
          </Link>
        </div>

        <div className="auth-form-wrap">
          <h1 className="auth-title">{isLogin ? 'Welcome back' : 'Create your account'}</h1>
          <p className="auth-subtitle">
            {isLogin
              ? 'Log in to see your internship applications.'
              : 'Start tracking your internship applications in minutes.'}
          </p>

          <div className="auth-tabs" role="group" aria-label="Choose log in or sign up">
            <button
              type="button"
              className={`auth-tab${isLogin ? ' auth-tab-active' : ''}`}
              aria-pressed={isLogin}
              onClick={() => switchMode('login')}
            >
              Log in
            </button>
            <button
              type="button"
              className={`auth-tab${!isLogin ? ' auth-tab-active' : ''}`}
              aria-pressed={!isLogin}
              onClick={() => switchMode('signup')}
            >
              Sign up
            </button>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <label className="auth-field">
              <span className="auth-label">Email</span>
              <span className="auth-input-wrap">
                <Icon name="mail" />
                <input
                  type="email"
                  autoComplete="email"
                  placeholder="peterparker@gmail.com"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </span>
            </label>

            <label className="auth-field">
              <span className="auth-label">Password</span>
              <span className="auth-input-wrap">
                <Icon name="lock" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                  placeholder={isLogin ? 'Your password' : 'At least 6 characters'}
                  required
                  minLength={6}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
                <button
                  type="button"
                  className="auth-reveal"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <Icon name={showPassword ? 'eyeOff' : 'eye'} />
                </button>
              </span>
            </label>

            {error && (
              <p className="auth-alert auth-alert-error" role="alert">
                {error}
              </p>
            )}
            {message && (
              <p className="auth-alert auth-alert-success" role="status">
                {message}
              </p>
            )}

            <button type="submit" className="auth-submit" disabled={submitting}>
              {submitting && <span className="auth-spinner" aria-hidden="true" />}
              {submitting ? 'Please wait…' : isLogin ? 'Log in' : 'Create account'}
            </button>
          </form>

          <p className="auth-switch">
            {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
            <button type="button" onClick={() => switchMode(isLogin ? 'signup' : 'login')}>
              {isLogin ? 'Sign up' : 'Log in'}
            </button>
          </p>
        </div>
      </main>
    </div>
  )
}

export default LoginPage
