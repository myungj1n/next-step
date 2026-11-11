// Application layer: the domain model for one internship application.
// The UI reads these fields instead of raw database columns.

export const ApplicationStatus = Object.freeze({
  APPLIED: 'Applied',
  INTERVIEWING: 'Interviewing',
  OFFER: 'Offer',
  REJECTED: 'Rejected',
})

export class Application {
  constructor({ id, company, position, status, deadline, notes, jobLink, resumeVersion }) {
    this.id = id
    this.company = company
    this.position = position
    this.status = status
    this.deadline = deadline ?? null
    this.notes = notes ?? null
    this.jobLink = jobLink ?? null
    this.resumeVersion = resumeVersion ?? null
  }

  // Business rule: only open http(s) links. Pasted links may lack a scheme
  // ("linkedin.com/jobs/..."), and forcing one stops a "javascript:" link from running code.
  getSafeJobLink() {
    if (!this.jobLink) return null
    return /^https?:\/\//i.test(this.jobLink) ? this.jobLink : `https://${this.jobLink}`
  }
}
