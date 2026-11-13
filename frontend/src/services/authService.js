import { supabase } from '../lib/supabaseClient.js'

// AuthService from the class diagram. Each method returns Supabase's { data, error }.

export function signUp(email, password) {
  return supabase.auth.signUp({ email, password })
}

export function signIn(email, password) {
  return supabase.auth.signInWithPassword({ email, password })
}

export function signOut() {
  return supabase.auth.signOut()
}

export function getCurrentUser() {
  return supabase.auth.getUser()
}

// The saved login session (null when logged out). Read locally, so it's fast enough to check on every page load.
export function getSession() {
  return supabase.auth.getSession()
}

// Calls callback(session) whenever the user logs in or out. Returns a function that stops listening.
export function onAuthChange(callback) {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => callback(session))
  return () => data.subscription.unsubscribe()
}
