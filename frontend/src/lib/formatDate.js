// Formats a Postgres date ("2026-10-01") as "October 1, 2026".
// Builds the date from its parts: new Date("2026-10-01") is UTC midnight,
// which shows as the previous day in US time zones.
export function formatDate(isoDate) {
  if (!isoDate) return ''
  const [year, month, day] = isoDate.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}
