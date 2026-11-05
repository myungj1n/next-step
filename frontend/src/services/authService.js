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
