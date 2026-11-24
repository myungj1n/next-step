// Application layer: the domain model for one internship application.
// The UI reads these fields instead of raw database columns.

export const ApplicationStatus = Object.freeze({
  APPLIED: 'Applied',
  PHONE_CALL: 'Phone call',
  INTERVIEW: 'Interview',
  FINAL_INTERVIEW: 'Final interview',
  OFFER: 'Offer',
  REJECTED: 'Rejected',
  WITHDRAWN: 'Withdrawn',
})

// The path an application moves along, in order. Rejected and Withdrawn leave it.
export const STATUS_STAGES = Object.freeze([
  ApplicationStatus.APPLIED,
  ApplicationStatus.PHONE_CALL,
  ApplicationStatus.INTERVIEW,
  ApplicationStatus.FINAL_INTERVIEW,
  ApplicationStatus.OFFER,
])

// Applications that left the path without an offer.
export const CLOSED_STATUSES = Object.freeze(new Set([ApplicationStatus.REJECTED, ApplicationStatus.WITHDRAWN]))

// The company replied: anything past Applied, including a rejection. Withdrawn doesn't
// count, since that was the student's choice. Overview's response rate uses this too.
export const REPLIED_STATUSES = Object.freeze(
  new Set([
    ApplicationStatus.PHONE_CALL,
    ApplicationStatus.INTERVIEW,
    ApplicationStatus.FINAL_INTERVIEW,
    ApplicationStatus.OFFER,
    ApplicationStatus.REJECTED,
  ]),
)

// Other spellings that mean the same status, including values saved before the
// five-step path existed ("Interviewing").
const STATUS_ALIASES = {
  interviewing: ApplicationStatus.INTERVIEW,
  'phone screen': ApplicationStatus.PHONE_CALL,
  'phone interview': ApplicationStatus.PHONE_CALL,
  'final round': ApplicationStatus.FINAL_INTERVIEW,
  'final interviewing': ApplicationStatus.FINAL_INTERVIEW,
}

// A status as a CSS-safe name: "Final interview" -> "final-interview".
export function statusSlug(status) {
  return String(status ?? '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
}

export class Application {
  constructor({ id, company, position, status, deadline, notes, jobLink, resumeVersion, createdAt }) {
    this.id = id
    this.company = company
    this.position = position
    this.status = Application.normalizeStatus(status)
    this.deadline = deadline ?? null
    this.notes = notes ?? null
    this.jobLink = jobLink ?? null
    this.resumeVersion = resumeVersion ?? null
    // When the application was added to the tracker; shown as "Date Applied".
    this.createdAt = createdAt ?? null
  }

  // Cleans stored values like "'Applied'", " phone_call " or "Interviewing" into a known status.
  // Unknown values are kept (trimmed, unquoted) so nothing is silently hidden.
  static normalizeStatus(value) {
    const cleaned = String(value ?? '')
      .trim()
      .replace(/^['"]+|['"]+$/g, '')
      .trim()
    const key = cleaned.toLowerCase().replace(/[\s_-]+/g, ' ')
    const known = Object.values(ApplicationStatus).find((option) => option.toLowerCase() === key)
    return known ?? STATUS_ALIASES[key] ?? cleaned
  }

  // Business rule: only open http(s) links. Pasted links may lack a scheme
  // ("linkedin.com/jobs/..."), and forcing one stops a "javascript:" link from running code.
  getSafeJobLink() {
    if (!this.jobLink) return null
    return /^https?:\/\//i.test(this.jobLink) ? this.jobLink : `https://${this.jobLink}`
  }

  // "https://www.stripe.com/jobs/123" -> "stripe.com", for labels. null when there's no link.
  getJobLinkHost() {
    const link = this.getSafeJobLink()
    if (!link) return null
    try {
      return new URL(link).host.replace(/^www\./, '')
    } catch {
      return this.jobLink
    }
  }
}
