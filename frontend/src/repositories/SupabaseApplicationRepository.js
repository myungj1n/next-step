import { Application, ApplicationStatus } from '../models/Application.js'
import { ApplicationRepository } from './ApplicationRepository.js'

const COLUMNS = 'id, company, position, status, deadline, notes, job_link, resume_version, created_at'

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

  async create(application) {
    const { data: userData, error: userError } = await this.#client.auth.getUser()
    if (userError) throw new Error(userError.message)
    if (!userData.user) throw new Error('You must be logged in to add an application.')

    const { data, error } = await this.#client
      .from('applications')
      .insert({
        user_id: userData.user.id,
        company: application.company,
        position: application.position,
        deadline: application.deadline ?? null,
        status: application.status ?? ApplicationStatus.APPLIED,
        job_link: application.jobLink ?? null,
        resume_version: application.resumeVersion ?? null,
        notes: application.notes ?? null,
      })
      .select(COLUMNS)
      .single()
    if (error) throw new Error(error.message)
    return this.#toApplication(data)
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

  async updateNotes(id, notes) {
    return this.#update(id, { notes })
  }

  async updateStatus(id, status) {
    return this.#update(id, { status })
  }

  async updateDetails(id, { company, position, deadline, jobLink, resumeVersion }) {
    return this.#update(id, {
      company,
      position,
      deadline,
      job_link: jobLink ?? null,
      resume_version: resumeVersion ?? null,
    })
  }

  // Asks for the deleted row back: when Row Level Security blocks a delete (another
  // student's id, or no DELETE policy), Supabase returns no error and no rows.
  async delete(id) {
    const { data, error } = await this.#client.from('applications').delete().eq('id', id).select('id')
    if (error?.code === INVALID_UUID) return false
    if (error) throw new Error(error.message)
    return data.length > 0
  }

  // Updates one row and resolves to the updated Application, or null when not found.
  async #update(id, changes) {
    const { data, error } = await this.#client
      .from('applications')
      .update(changes)
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
      createdAt: row.created_at,
    })
  }
}
