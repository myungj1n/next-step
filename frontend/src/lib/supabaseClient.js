import { createClient } from '@supabase/supabase-js'

// Values come from frontend/.env.local (see .env.example). Never commit real keys.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase settings: copy .env.example to .env.local and fill it in.')
}

export const supabase = createClient(supabaseUrl, supabaseKey)
