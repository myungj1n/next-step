// Application layer: search, filter, and sort rules for the applications list.
// Pure functions (no React, no database) so they're easy to test and reuse.
import { ApplicationStatus } from '../models/Application.js'

export const ALL_STATUSES = 'all'

export const SortOption = Object.freeze({
  NEWEST: 'newest',
  OLDEST: 'oldest',
  COMPANY: 'company',
  DEADLINE: 'deadline',
})

export const sortLabels = {
  [SortOption.NEWEST]: 'Newest first',
  [SortOption.OLDEST]: 'Oldest first',
  [SortOption.COMPANY]: 'Company (A–Z)',
  [SortOption.DEADLINE]: 'Deadline (soonest)',
}

const time = (value) => (value ? new Date(value).getTime() || 0 : 0)
const byCompany = (a, b) => a.company.localeCompare(b.company, undefined, { sensitivity: 'base' })

const comparators = {
  [SortOption.NEWEST]: (a, b) => time(b.createdAt) - time(a.createdAt) || byCompany(a, b),
  [SortOption.OLDEST]: (a, b) => time(a.createdAt) - time(b.createdAt) || byCompany(a, b),
  [SortOption.COMPANY]: byCompany,
  // Applications without a deadline go last.
  [SortOption.DEADLINE]: (a, b) => {
    if (!a.deadline && !b.deadline) return byCompany(a, b)
    if (!a.deadline) return 1
    if (!b.deadline) return -1
    return a.deadline.localeCompare(b.deadline) || byCompany(a, b)
  },
}

// How many applications are in each status, e.g. { Applied: 3, 'Phone call': 1, ... }.
export function countByStatus(applications) {
  const counts = Object.fromEntries(Object.values(ApplicationStatus).map((status) => [status, 0]))
  for (const application of applications) {
    if (application.status in counts) counts[application.status] += 1
  }
  return counts
}

// Applications still at "Applied" that were added at least `days` ago: likely worth a follow-up.
export const WAITING_DAYS = 21

export function isWaiting(application, now = new Date(), days = WAITING_DAYS) {
  return (
    application.status === ApplicationStatus.APPLIED &&
    Boolean(application.createdAt) &&
    time(application.createdAt) <= now.getTime() - days * 86_400_000
  )
}

export function countWaiting(applications, now = new Date(), days = WAITING_DAYS) {
  return applications.filter((application) => isWaiting(application, now, days)).length
}

// Returns a new array: matches the search (company or position), the status, then sorts.
export function queryApplications(applications, { search = '', status = ALL_STATUSES, sort = SortOption.NEWEST }) {
  const needle = search.trim().toLowerCase()
  const compare = comparators[sort] ?? comparators[SortOption.NEWEST]

  return applications
    .filter((application) => status === ALL_STATUSES || application.status === status)
    .filter(
      (application) =>
        !needle ||
        application.company.toLowerCase().includes(needle) ||
        application.position.toLowerCase().includes(needle),
    )
    .sort(compare)
}

// The student's resume versions, most recently used first, with how many applications
// used each: [{ name: 'Resume v3', count: 4 }, ...]. Names match ignoring case and spacing.
export function resumeVersionsFrom(applications) {
  const byKey = new Map()
  for (const application of applications ?? []) {
    const name = application.resumeVersion?.trim()
    if (!name) continue
    const key = name.toLowerCase().replace(/\s+/g, ' ')
    const used = time(application.createdAt)
    const entry = byKey.get(key)
    if (!entry) byKey.set(key, { name, count: 1, lastUsed: used })
    else {
      entry.count += 1
      if (used > entry.lastUsed) Object.assign(entry, { name, lastUsed: used })
    }
  }
  return [...byKey.values()]
    .sort((a, b) => b.lastUsed - a.lastUsed || a.name.localeCompare(b.name))
    .map(({ name, count }) => ({ name, count }))
}

// A guess at the next version's name: "Resume v3" -> "Resume v4", "CV 2025.2" -> "CV 2025.3".
// Falls back to "Resume v1" when there's nothing to count up from.
export function suggestNextResumeVersion(versions) {
  const latest = versions?.[0]?.name
  if (!latest) return 'Resume v1'
  const match = /^(.*?)(\d+)(\D*)$/.exec(latest)
  if (!match) return `${latest} v2`
  const [, before, number, after] = match
  return `${before}${Number(number) + 1}${after}`
}
