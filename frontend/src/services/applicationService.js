import { supabase } from '../lib/supabaseClient.js'

// ApplicationService from the class diagram. Each method returns Supabase's { data, error }.
// No user_id filter is needed: Row Level Security only returns the logged-in student's rows.

export function getMyApplications() {
  return supabase
    .from('applications')
    .select('id, company, position, status, deadline, notes')
    .order('created_at', { ascending: false })
}

// data is null when the id doesn't exist or belongs to another student.
export function getApplicationById(id) {
  return supabase
    .from('applications')
    .select('id, company, position, status, deadline, notes')
    .eq('id', id)
    .maybeSingle()
}
