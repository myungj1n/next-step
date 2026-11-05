import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { getSession, signIn, signUp } from '../services/authService.js'
import './LoginPage.css'

// LoginPage from the class diagram: one form that switches between log in and sign up.
function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const redirectTo = location.state?.from ?? '/'

  const [mode, setMode] = useState('login') // 'login' | 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const isLogin = mode === 'login'

  // Already logged in: skip the form.
  useEffect(() => {
    getSession().then(({ data }) => {
      if (data.session) navigate('/', { replace: true })
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
      navigate('/', { replace: true })
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

  const switchMode = () => {
    setMode(isLogin ? 'signup' : 'login')
    setError('')
    setMessage('')
  }

  return (
    <main className="auth-page">
      <div className="auth-card">
        <p className="auth-brand">Next Step</p>
        <h1 className="auth-title">{isLogin ? 'Log in' : 'Create an account'}</h1>
        <p className="auth-subtitle">
          {isLogin
            ? 'Welcome back. Log in to see your applications.'
            : 'Start tracking your internship applications.'}
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="auth-field">
            Email
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>

          <label className="auth-field">
            Password
            <input
              type="password"
              autoComplete={isLogin ? 'current-password' : 'new-password'}
              required
              minLength={6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>

          {error && (
            <p className="auth-error" role="alert">
              {error}
            </p>
          )}
          {message && (
            <p className="auth-message" role="status">
              {message}
            </p>
          )}

          <button type="submit" className="auth-submit" disabled={submitting}>
            {submitting ? 'Please wait…' : isLogin ? 'Log in' : 'Sign up'}
          </button>
        </form>

        <p className="auth-switch">
          {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
          <button type="button" onClick={switchMode}>
            {isLogin ? 'Sign up' : 'Log in'}
          </button>
        </p>
      </div>
    </main>
  )
}

export default LoginPage
