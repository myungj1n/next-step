import { useEffect, useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { getSession, onAuthChange } from '../services/authService.js'

// Wraps pages that need a logged-in student. Logged-out visitors are sent to /login,
// and logging out from any page sends them there too.
function RequireAuth() {
  const location = useLocation()
  const [session, setSession] = useState(undefined) // undefined = still checking

  useEffect(() => {
    getSession().then(({ data }) => setSession(data.session))
    return onAuthChange(setSession)
  }, [])

  if (session === undefined) {
    return null
  }

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return <Outlet context={{ user: session.user }} />
}

export default RequireAuth
