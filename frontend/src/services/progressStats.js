// Application layer: numbers for the Progress page. Pure functions (no React, no database),
// like overviewStats.js, which covers the headline numbers. This module goes deeper.
//
// Only each application's current status is stored, not its history, so:
// - the funnel assumes the path Applied → Phone call → Interview → Final interview → Offer,
//   and counts an application as having reached every stage up to its current one;
// - Rejected and Withdrawn count as reaching Applied only (the stage they closed at isn't saved);
// - "age" means days since the application was added, not days spent in a stage.
import { ApplicationStatus, REPLIED_STATUSES, STATUS_STAGES } from '../models/Application.js'
import { isWaiting } from './applicationQuery.js'
import { fromDateKey, toDateKey, weeklyActivity } from './overviewStats.js'

const DAY_MS = 86_400_000

export const ProgressRange = Object.freeze({
  ALL: 'all',
  DAYS_30: '30d',
  DAYS_90: '90d',
})

export const rangeLabels = {
  [ProgressRange.ALL]: 'All time',
  [ProgressRange.DAYS_90]: '90 days',
  [ProgressRange.DAYS_30]: '30 days',
}

const RANGE_DAYS = { [ProgressRange.DAYS_30]: 30, [ProgressRange.DAYS_90]: 90 }

// Below this many applications, a percentage says more about luck than about the student.
export const MIN_SAMPLE = 3

const percent = (part, whole) => (whole > 0 ? Math.round((part / whole) * 100) : 0)

const time = (value) => {
  const ms = value ? new Date(value).getTime() : NaN
  return Number.isNaN(ms) ? null : ms
}

// Whole local days between an application being added and `now`.
function ageInDays(application, now) {
  if (time(application.createdAt) === null) return null
  const added = fromDateKey(toDateKey(new Date(application.createdAt)))
  const today = fromDateKey(toDateKey(now))
  return Math.max(0, Math.round((today - added) / DAY_MS))
}

function median(numbers) {
  if (numbers.length === 0) return null
  const sorted = [...numbers].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[middle] : Math.round((sorted[middle - 1] + sorted[middle]) / 2)
}

// How far along the path an application got: 0 = Applied … 4 = Offer.
function stageReached(status) {
  const index = STATUS_STAGES.indexOf(status)
  return index >= 0 ? index : 0
}

// Applications added within the range (all of them for ProgressRange.ALL).
export function inRange(applications, range, now = new Date()) {
  const days = RANGE_DAYS[range]
  if (!days) return applications
  const cutoff = now.getTime() - days * DAY_MS
  return applications.filter((application) => (time(application.createdAt) ?? 0) >= cutoff)
}

// How many applications reached each stage, and how many moved on from the stage before.
// biggestDrop is the step that loses the most (needs MIN_SAMPLE at the earlier stage).
export function stageFunnel(applications) {
  const reachedCounts = STATUS_STAGES.map(
    (_, index) => applications.filter((application) => stageReached(application.status) >= index).length,
  )
  const applied = reachedCounts[0]

  const stages = STATUS_STAGES.map((stage, index) => ({
    stage,
    reached: reachedCounts[index],
    pctOfApplied: percent(reachedCounts[index], applied),
    pctFromPrevious: index === 0 ? null : percent(reachedCounts[index], reachedCounts[index - 1]),
  }))

  let biggestDrop = null
  for (let index = 1; index < stages.length; index += 1) {
    const from = stages[index - 1]
    if (from.reached < MIN_SAMPLE) continue
    const step = { from: from.stage, to: stages[index].stage, pct: stages[index].pctFromPrevious }
    if (!biggestDrop || step.pct < biggestDrop.pct) biggestDrop = step
  }

  return { stages, biggestDrop }
}

// Where applications stand, split so every application lands in exactly one group.
export const OutcomeGroup = Object.freeze({
  OFFER: 'Offer',
  IN_PROGRESS: 'In progress',
  APPLIED: 'Waiting',
  NO_REPLY: 'No reply yet',
  REJECTED: 'Rejected',
  WITHDRAWN: 'Withdrawn',
})

export function outcomes(applications, now = new Date()) {
  const counts = Object.fromEntries(Object.values(OutcomeGroup).map((group) => [group, 0]))
  for (const application of applications) {
    const { status } = application
    if (status === ApplicationStatus.OFFER) counts[OutcomeGroup.OFFER] += 1
    else if (status === ApplicationStatus.REJECTED) counts[OutcomeGroup.REJECTED] += 1
    else if (status === ApplicationStatus.WITHDRAWN) counts[OutcomeGroup.WITHDRAWN] += 1
    else if (status === ApplicationStatus.APPLIED || stageReached(status) === 0) {
      counts[isWaiting(application, now) ? OutcomeGroup.NO_REPLY : OutcomeGroup.APPLIED] += 1
    } else counts[OutcomeGroup.IN_PROGRESS] += 1
  }
  const total = applications.length
  return Object.values(OutcomeGroup).map((group) => ({
    group,
    count: counts[group],
    pct: percent(counts[group], total),
  }))
}

export const NO_RESUME_LABEL = 'Not recorded'

// Per resume version: how many applications used it, and how often they got a reply,
// an interview (Interview or later), or an offer. best = highest interview rate among
// versions with at least MIN_SAMPLE applications.
export function resumePerformance(applications) {
  const byName = new Map()
  for (const application of applications) {
    const raw = application.resumeVersion?.trim()
    const key = raw ? raw.toLowerCase().replace(/\s+/g, ' ') : ''
    const row = byName.get(key) ?? { name: raw || NO_RESUME_LABEL, recorded: Boolean(raw), total: 0, replied: 0, interviews: 0, offers: 0 }
    row.total += 1
    if (REPLIED_STATUSES.has(application.status)) row.replied += 1
    if (stageReached(application.status) >= STATUS_STAGES.indexOf(ApplicationStatus.INTERVIEW)) row.interviews += 1
    if (application.status === ApplicationStatus.OFFER) row.offers += 1
    byName.set(key, row)
  }

  const rows = [...byName.values()]
    .map((row) => ({
      ...row,
      replyRate: percent(row.replied, row.total),
      interviewRate: percent(row.interviews, row.total),
    }))
    // Recorded versions first (most used first), "Not recorded" last.
    .sort((a, b) => Number(b.recorded) - Number(a.recorded) || b.total - a.total || a.name.localeCompare(b.name))

  const best =
    rows
      .filter((row) => row.recorded && row.total >= MIN_SAMPLE)
      .sort((a, b) => b.interviewRate - a.interviewRate || b.total - a.total)[0]?.name ?? null

  return { rows, best, recordedCount: rows.filter((row) => row.recorded).length }
}

export const WAITING_BUCKETS = Object.freeze([
  { label: 'This week', min: 0, max: 7 },
  { label: '1–2 weeks', min: 8, max: 14 },
  { label: '2–3 weeks', min: 15, max: 21 },
  { label: 'Over 3 weeks', min: 22, max: Infinity },
])

// Applications still at Applied, by how long ago they were added.
export function waitingAges(applications, now = new Date()) {
  const waiting = applications
    .filter((application) => application.status === ApplicationStatus.APPLIED)
    .map((application) => ({ application, age: ageInDays(application, now) }))
    .filter((entry) => entry.age !== null)

  const buckets = WAITING_BUCKETS.map((bucket) => ({
    label: bucket.label,
    count: waiting.filter((entry) => entry.age >= bucket.min && entry.age <= bucket.max).length,
  }))
  const oldest = waiting.reduce((max, entry) => (!max || entry.age > max.age ? entry : max), null)

  return {
    total: waiting.length,
    buckets,
    medianDays: median(waiting.map((entry) => entry.age)),
    oldest: oldest ? { id: oldest.application.id, company: oldest.application.company, days: oldest.age } : null,
  }
}

// For each open stage, the median days since those applications were added.
export function openAgesByStage(applications, now = new Date()) {
  return STATUS_STAGES.filter((stage) => stage !== ApplicationStatus.OFFER).map((stage) => {
    const ages = applications
      .filter((application) => application.status === stage)
      .map((application) => ageInDays(application, now))
      .filter((age) => age !== null)
    return { stage, count: ages.length, medianDays: median(ages) }
  })
}

// For applications with a deadline: how many days before it they were added.
export const LAST_MINUTE_DAYS = 3

export function deadlineLead(applications) {
  const leads = applications
    .filter((application) => application.deadline && time(application.createdAt) !== null)
    .map((application) => {
      const added = fromDateKey(toDateKey(new Date(application.createdAt)))
      return Math.round((fromDateKey(application.deadline) - added) / DAY_MS)
    })
  return {
    count: leads.length,
    medianDays: median(leads),
    lastMinute: leads.filter((days) => days >= 0 && days <= LAST_MINUTE_DAYS).length,
    afterDeadline: leads.filter((days) => days < 0).length,
  }
}

export const MAX_PACE_WEEKS = 26

// Applications added per week across the season (from the first application's week,
// up to MAX_PACE_WEEKS), plus the average, the best week, and the current streak.
export function pace(applications, now = new Date()) {
  const times = applications.map((application) => time(application.createdAt)).filter((ms) => ms !== null)
  if (times.length === 0) return { weeks: [], averagePerWeek: 0, bestWeek: null, streak: 0 }

  const today = fromDateKey(toDateKey(now))
  const mondayOffset = (today.getDay() + 6) % 7
  const thisMonday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - mondayOffset)
  const first = fromDateKey(toDateKey(new Date(Math.min(...times))))
  const firstMonday = new Date(first.getFullYear(), first.getMonth(), first.getDate() - ((first.getDay() + 6) % 7))
  // Round, not floor: a daylight-saving change makes a week 1 hour short or long.
  const span = Math.round((thisMonday - firstMonday) / (7 * DAY_MS)) + 1
  const weekCount = Math.min(MAX_PACE_WEEKS, Math.max(1, span))

  const weeks = weeklyActivity(applications, now, weekCount)
  const total = weeks.reduce((sum, week) => sum + week.count, 0)
  const bestWeek = weeks.reduce((best, week) => (!best || week.count > best.count ? week : best), null)

  // Weeks in a row with at least one application, counting back from this week.
  // An empty current week doesn't break the streak yet: the week isn't over.
  let streak = 0
  for (let index = weeks.length - 1; index >= 0; index -= 1) {
    if (weeks[index].count > 0) streak += 1
    else if (index !== weeks.length - 1) break
  }

  return {
    weeks,
    averagePerWeek: Math.round((total / weeks.length) * 10) / 10,
    bestWeek: bestWeek?.count ? bestWeek : null,
    streak,
  }
}

// When the earliest application in the list was added (a Date), or null.
export function firstAdded(applications) {
  const times = applications.map((application) => time(application.createdAt)).filter((ms) => ms !== null)
  return times.length ? new Date(Math.min(...times)) : null
}
