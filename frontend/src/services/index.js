import { supabase } from '../lib/supabaseClient.js'
import { SupabaseApplicationRepository } from '../repositories/SupabaseApplicationRepository.js'
import { ApplicationService } from './applicationService.js'

// Wires each service to its concrete repository. The UI imports services from here.
export const applicationService = new ApplicationService(new SupabaseApplicationRepository(supabase))
