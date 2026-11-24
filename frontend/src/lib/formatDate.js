// Formats a timestamp ("2026-10-28T14:03:00+00:00") as "Oct 28, 2026" in local time.
export function formatShortDate(timestamp) {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// "Today", "1 day ago", "23 days ago" — how long since a timestamp, in whole local days.
export function daysAgo(timestamp, now = new Date()) {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  if (Number.isNaN(date.getTime())) return ''
  const startOf = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const days = Math.round((startOf(now) - startOf(date)) / 86_400_000)
  if (days <= 0) return 'Today'
  return days === 1 ? '1 day ago' : `${days} days ago`
}

// Formats a Postgres date ("2026-10-01") as "October 1, 2026".
// Builds the date from its parts: new Date("2026-10-01") is UTC midnight,
// which shows as the previous day in US time zones.
// Pass month: 'short' for "Oct 1, 2026".
export function formatDate(isoDate, { month = 'long' } = {}) {
  if (!isoDate) return ''
  const [year, monthNumber, day] = isoDate.split('-').map(Number)
  return new Date(year, monthNumber - 1, day).toLocaleDateString('en-US', {
    year: 'numeric',
    month,
    day: 'numeric',
  })
}
