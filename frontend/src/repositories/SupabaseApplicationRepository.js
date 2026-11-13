import { Application } from '../models/Application.js'
import { ApplicationRepository } from './ApplicationRepository.js'

const COLUMNS = 'id, company, position, status, deadline, notes, job_link, resume_version'

// Postgres error for a malformed uuid, e.g. /applications/abc. No such row can exist.
const INVALID_UUID = '22P02'

// Supabase implementation. No user_id filter is needed: Row Level Security only
// returns the logged-in student's rows, so another student's id comes back empty.
export class SupabaseApplicationRepository extends ApplicationRepository {
  #client

  constructor(client) {
    super()
    this.#client = client
  }

  async findAll() {
    const { data, error } = await this.#client
      .from('applications')
      .select(COLUMNS)
      .order('created_at', { ascending: false })
    if (error) throw new Error(error.message)
    return data.map((row) => this.#toApplication(row))
  }

  async findById(id) {
    const { data, error } = await this.#client
      .from('applications')
      .select(COLUMNS)
      .eq('id', id)
      .maybeSingle()
    if (error?.code === INVALID_UUID) return null
    if (error) throw new Error(error.message)
    return data ? this.#toApplication(data) : null
  }

  async updateStatus(id, status) {
    const { data, error } = await this.#client
      .from('applications')
      .update({ status })
      .eq('id', id)
      .select(COLUMNS)
      .maybeSingle()
    if (error?.code === INVALID_UUID) return null
    if (error) throw new Error(error.message)
    return data ? this.#toApplication(data) : null
  }

  // Maps database column names to the domain model.
  #toApplication(row) {
    return new Application({
      id: row.id,
      company: row.company,
      position: row.position,
      status: row.status,
      deadline: row.deadline,
      notes: row.notes,
      jobLink: row.job_link,
      resumeVersion: row.resume_version,
    })
  }
}
