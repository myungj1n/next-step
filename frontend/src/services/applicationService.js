// Application layer: business logic for viewing applications.
// Depends only on the ApplicationRepository abstraction, passed in by services/index.js.
import { ApplicationStatus } from '../models/Application.js'

export const MAX_NOTES_LENGTH = 2000

export const DetailsOutcome = Object.freeze({
  FOUND: 'FOUND',
  NOT_FOUND: 'NOT_FOUND',
  ERROR: 'ERROR',
})

export class ApplicationService {
  #repository

  constructor(repository) {
    this.#repository = repository
  }

  // Creates an application for the logged-in student with the initial Applied status.
  async addApplication({ company, position }) {
    const trimmedCompany = company?.trim()
    const trimmedPosition = position?.trim()

    if (!trimmedCompany || !trimmedPosition) {
      return {
        success: false,
        application: null,
        error: 'Enter both a company and position.',
      }
    }

    try {
      const application = await this.#repository.create({
        company: trimmedCompany,
        position: trimmedPosition,
      })
      return { success: true, application, error: null }
    } catch (error) {
      return {
        success: false,
        application: null,
        error: `The application could not be saved. ${error.message}`,
      }
    }
  }

  // Resolves to Application[]; rejects with an Error the UI can show.
  getMyApplications() {
    return this.#repository.findAll()
  }

  // Decides what the details screen shows. Always resolves to
  // { outcome, application, message } so the UI never handles database errors.
  // A missing id, a malformed id, and another student's id are all NOT_FOUND.
  async getApplicationDetails(id) {
    if (!id?.trim()) {
      return { outcome: DetailsOutcome.NOT_FOUND, application: null, message: null }
    }

    try {
      const application = await this.#repository.findById(id)
      return application
        ? { outcome: DetailsOutcome.FOUND, application, message: null }
        : { outcome: DetailsOutcome.NOT_FOUND, application: null, message: null }
    } catch (error) {
      return { outcome: DetailsOutcome.ERROR, application: null, message: error.message }
    }
  }

  // Business rules: trim whitespace, store blank notes as null, cap the length.
  // Always resolves to { success, application, error } so the UI never handles database errors.
  async updateApplicationNotes(id, notes) {
    const trimmed = (notes ?? '').trim()
    if (trimmed.length > MAX_NOTES_LENGTH) {
      return {
        success: false,
        application: null,
        error: `Notes can be at most ${MAX_NOTES_LENGTH} characters.`,
      }
    }

    return this.#saveUpdate(() => this.#repository.updateNotes(id, trimmed || null), 'notes')
  }

  // Business rule: only the known statuses are allowed. Always resolves to
  // { success, application, error } so the UI never handles database errors.
  async updateApplicationStatus(id, status) {
    if (!Object.values(ApplicationStatus).includes(status)) {
      return { success: false, application: null, error: 'Choose a valid application status.' }
    }

    return this.#saveUpdate(() => this.#repository.updateStatus(id, status), 'status')
  }

  // Runs a repository update and turns its result into { success, application, error }.
  async #saveUpdate(update, what) {
    try {
      const application = await update()
      return application
        ? { success: true, application, error: null }
        : { success: false, application: null, error: 'This application could not be found.' }
    } catch (error) {
      return {
        success: false,
        application: null,
        error: `Your ${what} could not be saved. ${error.message}`,
      }
    }
  }

  // Business rule: company and position are required and trimmed. Same result shape as above.
  async updateApplicationDetails(id, { company, position }) {
    const trimmedCompany = company?.trim()
    const trimmedPosition = position?.trim()

    if (!trimmedCompany || !trimmedPosition) {
      return {
        success: false,
        application: null,
        error: 'Enter both a company and position.',
      }
    }

    return this.#saveUpdate(
      () => this.#repository.updateDetails(id, { company: trimmedCompany, position: trimmedPosition }),
      'application details',
    )
  }
}
