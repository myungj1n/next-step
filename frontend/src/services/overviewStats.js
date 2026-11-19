// Application layer: numbers and groupings for the Overview page.
// Pure functions (no React, no database), like applicationQuery.js.
import { ApplicationStatus, STATUS_STAGES } from '../models/Application.js'
import { isWaiting } from './applicationQuery.js'

const DAY_MS = 86_400_000

const CLOSED = new Set([ApplicationStatus.REJECTED, ApplicationStatus.WITHDRAWN])
const INTERVIEWING = new Set([
  ApplicationStatus.PHONE_CALL,
  ApplicationStatus.INTERVIEW,
  ApplicationStatus.FINAL_INTERVIEW,
])

// A local calendar day as "2026-11-19", the same shape Postgres stores deadlines in.
export function toDateKey(date) {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

// "2026-11-19" → a local-midnight Date (new Date("2026-11-19") would be UTC midnight).
export function fromDateKey(key) {
  const [year, month, day] = key.split('-').map(Number)
  return new Date(year, month - 1, day)
}

// Whole days from today to a deadline: 0 = today, 1 = tomorrow, -2 = two days ago.
export function daysUntil(deadline, now = new Date()) {
  const today = fromDateKey(toDateKey(now))
  return Math.round((fromDateKey(deadline) - today) / DAY_MS)
}

// Headline counts for the stat tiles.
export function summarize(applications, now = new Date()) {
  const weekAgo = now.getTime() - 7 * DAY_MS
  let active = 0
  let interviewing = 0
  let offers = 0
  let heardBack = 0
  let addedThisWeek = 0

  for (const application of applications) {
    const { status, createdAt } = application
    if (!CLOSED.has(status) && status !== ApplicationStatus.OFFER) active += 1
    if (INTERVIEWING.has(status)) interviewing += 1
    if (status === ApplicationStatus.OFFER) offers += 1
    // Anything past "Applied" (including a rejection) means the company replied.
    if (status !== ApplicationStatus.APPLIED && status !== ApplicationStatus.WITHDRAWN) heardBack += 1
    if (createdAt && new Date(createdAt).getTime() >= weekAgo) addedThisWeek += 1
  }

  const total = applications.length
  return {
    total,
    active,
    interviewing,
    offers,
    addedThisWeek,
    responseRate: total ? Math.round((heardBack / total) * 100) : 0,
  }
}

// One row per status for the breakdown chart. Withdrawn only appears once something is withdrawn.
export function statusBreakdown(applications) {
  const counts = Object.fromEntries(Object.values(ApplicationStatus).map((status) => [status, 0]))
  for (const { status } of applications) {
    if (status in counts) counts[status] += 1
  }
  return [...STATUS_STAGES, ApplicationStatus.REJECTED, ApplicationStatus.WITHDRAWN]
    .filter((status) => status !== ApplicationStatus.WITHDRAWN || counts[status] > 0)
    .map((status) => ({ status, count: counts[status] }))
}

// Applications with a deadline, grouped by day: Map { "2026-11-19" => Application[] }.
export function deadlinesByDay(applications) {
  const byDay = new Map()
  for (const application of applications) {
    if (!application.deadline) continue
    const list = byDay.get(application.deadline) ?? []
    list.push(application)
    byDay.set(application.deadline, list)
  }
  return byDay
}

// Open applications with a deadline today or later, soonest first.
export function upcomingDeadlines(applications, now = new Date(), limit = 5) {
  const today = toDateKey(now)
  return applications
    .filter((application) => application.deadline && application.deadline >= today && !CLOSED.has(application.status))
    .sort((a, b) => a.deadline.localeCompare(b.deadline) || a.company.localeCompare(b.company))
    .slice(0, limit)
}

// How many applications were added in each of the last `weeks` weeks (Monday starts), oldest first.
export function weeklyActivity(applications, now = new Date(), weeks = 8) {
  const today = fromDateKey(toDateKey(now))
  const mondayOffset = (today.getDay() + 6) % 7
  const thisMonday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - mondayOffset)

  const buckets = Array.from({ length: weeks }, (_, index) => {
    const start = new Date(thisMonday)
    start.setDate(start.getDate() - (weeks - 1 - index) * 7)
    return { start, count: 0 }
  })
  const first = buckets[0].start.getTime()

  for (const { createdAt } of applications) {
    if (!createdAt) continue
    const time = new Date(createdAt).getTime()
    if (Number.isNaN(time) || time < first) continue
    const index = Math.min(weeks - 1, Math.floor((time - first) / (7 * DAY_MS)))
    buckets[index].count += 1
  }
  return buckets
}

// The most recently added applications.
export function recentApplications(applications, limit = 5) {
  const time = (value) => (value ? new Date(value).getTime() || 0 : 0)
  return [...applications].sort((a, b) => time(b.createdAt) - time(a.createdAt)).slice(0, limit)
}

// Still at "Applied" after three weeks: worth a follow-up email. Oldest first.
export function followUps(applications, now = new Date(), limit = 4) {
  return applications
    .filter((application) => isWaiting(application, now))
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    .slice(0, limit)
}
