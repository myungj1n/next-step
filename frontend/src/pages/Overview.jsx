import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import StepTrack from '../components/StepTrack.jsx'
import { daysAgo } from '../lib/formatDate.js'
import { ApplicationStatus, statusSlug } from '../models/Application.js'
import { SortOption, WAITING_DAYS } from '../services/applicationQuery.js'
import {
  daysUntil,
  deadlinesByDay,
  followUps,
  fromDateKey,
  recentApplications,
  statusBreakdown,
  summarize,
  toDateKey,
  upcomingDeadlines,
  weeklyActivity,
} from '../services/overviewStats.js'
import './Overview.css'

const plural = (count, word) => `${count} ${word}${count === 1 ? '' : 's'}`

function greeting(now) {
  const hour = now.getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

// "Due today", "Tomorrow", "In 5 days", "2 days ago".
function dueLabel(deadline, now) {
  const days = daysUntil(deadline, now)
  if (days === 0) return 'Due today'
  if (days === 1) return 'Tomorrow'
  if (days > 1) return `In ${days} days`
  return days === -1 ? 'Yesterday' : `${-days} days ago`
}

// UI layer: the Overview dashboard. The route passes in the applications and how to open one.
// Every number comes from services/overviewStats.js; this file only lays them out.
function Overview({ applications, onOpen }) {
  // Captured once per visit so every card agrees on what "today" is.
  const [now] = useState(() => new Date())
  const stats = useMemo(() => summarize(applications, now), [applications, now])
  const dueThisWeek = useMemo(
    () => upcomingDeadlines(applications, now, Infinity).filter((app) => daysUntil(app.deadline, now) <= 7).length,
    [applications, now],
  )

  return (
    <section className="ov">
      <h1 className="visually-hidden">Overview</h1>
      <div className="ov-grid">
        <WelcomeCard now={now} stats={stats} dueThisWeek={dueThisWeek} />

        <StatCard
          className="ov-stat-total"
          icon="stack"
          label="Applications"
          value={stats.total}
          note={stats.addedThisWeek > 0 ? `+${stats.addedThisWeek} this week` : 'None added this week'}
        />
        <ResponseCard rate={stats.responseRate} total={stats.total} />

        <CalendarCard applications={applications} now={now} onOpen={onOpen} />

        <StatCard
          className="ov-stat-interviewing"
          icon="chat"
          label="Interviewing"
          value={stats.interviewing}
          note="Phone calls through final rounds"
        />
        <StatCard
          className="ov-stat-offers"
          icon="trophy"
          label="Offers"
          value={stats.offers}
          note={stats.offers > 0 ? 'Congratulations!' : 'Keep going'}
          to={`/applications?status=${encodeURIComponent(ApplicationStatus.OFFER)}`}
        />

        <ActivityCard applications={applications} now={now} />
        <BreakdownCard applications={applications} />
        <RecentCard applications={applications} onOpen={onOpen} />
        <QuickActionsCard />
        <FollowUpCard applications={applications} now={now} onOpen={onOpen} />
      </div>
    </section>
  )
}

function WelcomeCard({ now, stats, dueThisWeek }) {
  const date = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
  let summary
  if (stats.total === 0) {
    summary = 'Add your first application and this page fills in with your progress, deadlines, and next steps.'
  } else {
    summary = `You have ${plural(stats.active, 'active application')}`
    summary += dueThisWeek > 0 ? ` and ${plural(dueThisWeek, 'deadline')} in the next 7 days.` : '.'
  }

  return (
    <article className="ov-card ov-welcome">
      <p className="ov-welcome-date">{date}</p>
      <h2 className="ov-welcome-title">{greeting(now)}</h2>
      <p className="ov-welcome-text">{summary}</p>
      <div className="ov-welcome-actions">
        <Link to="/applications/add" className="ov-btn ov-btn-light">
          <Icon name="plus" /> Add application
        </Link>
        <Link to="/applications" className="ov-btn ov-btn-ghost">
          View all
        </Link>
      </div>
      <span className="ov-welcome-orb ov-welcome-orb-1" aria-hidden="true" />
      <span className="ov-welcome-orb ov-welcome-orb-2" aria-hidden="true" />
    </article>
  )
}

function StatCard({ className, icon, label, value, note, to }) {
  const body = (
    <>
      <span className="ov-stat-icon">
        <Icon name={icon} />
      </span>
      <span className="ov-stat-value num">{value}</span>
      <span className="ov-stat-label">{label}</span>
      <span className="ov-stat-note">{note}</span>
    </>
  )
  return to ? (
    <Link to={to} className={`ov-card ov-stat ov-stat-link ${className}`}>
      {body}
    </Link>
  ) : (
    <article className={`ov-card ov-stat ${className}`}>{body}</article>
  )
}

// A ring meter: the share of applications that got any reply.
function ResponseCard({ rate, total }) {
  const radius = 26
  const circumference = 2 * Math.PI * radius
  return (
    <article className="ov-card ov-stat ov-response">
      <svg className="ov-ring" viewBox="0 0 64 64" role="img" aria-label={`${rate}% response rate`}>
        <circle className="ov-ring-track" cx="32" cy="32" r={radius} />
        <circle
          className="ov-ring-fill"
          cx="32"
          cy="32"
          r={radius}
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - rate / 100)}
        />
      </svg>
      <span className="ov-stat-value num">
        {rate}
        <span className="ov-stat-unit">%</span>
      </span>
      <span className="ov-stat-label">Response rate</span>
      <span className="ov-stat-note">{total ? 'Heard back past “Applied”' : 'No applications yet'}</span>
    </article>
  )
}

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

function CalendarCard({ applications, now, onOpen }) {
  const todayKey = toDateKey(now)
  const [view, setView] = useState({ year: now.getFullYear(), month: now.getMonth() })
  const [selected, setSelected] = useState(null)
  const byDay = useMemo(() => deadlinesByDay(applications), [applications])
  const upcoming = useMemo(() => upcomingDeadlines(applications, now, 4), [applications, now])

  const first = new Date(view.year, view.month, 1)
  const daysInMonth = new Date(view.year, view.month + 1, 0).getDate()
  const monthLabel = first.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const isCurrentMonth = view.year === now.getFullYear() && view.month === now.getMonth()
  const dueThisMonth = [...byDay.keys()].filter((key) =>
    key.startsWith(`${view.year}-${String(view.month + 1).padStart(2, '0')}`),
  ).length

  const shiftMonth = (delta) => {
    const next = new Date(view.year, view.month + delta, 1)
    setView({ year: next.getFullYear(), month: next.getMonth() })
    setSelected(null)
  }

  const cells = []
  for (let blank = 0; blank < first.getDay(); blank += 1) cells.push(null)
  for (let day = 1; day <= daysInMonth; day += 1) cells.push(toDateKey(new Date(view.year, view.month, day)))

  const selectedApps = selected ? (byDay.get(selected) ?? []) : null
  const listTitle = selected
    ? fromDateKey(selected).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
    : 'Coming up'
  const listItems = selectedApps ?? upcoming

  return (
    <article className="ov-card ov-calendar" aria-labelledby="ov-calendar-title">
      <header className="ov-card-header">
        <div>
          <h2 id="ov-calendar-title" className="ov-card-title">
            Deadlines
          </h2>
          <p className="ov-card-sub">
            {dueThisMonth > 0 ? `${plural(dueThisMonth, 'day')} with deadlines this month` : 'Nothing due this month'}
          </p>
        </div>
        <div className="ov-cal-nav">
          {!isCurrentMonth && (
            <button
              type="button"
              className="ov-cal-today"
              onClick={() => {
                setView({ year: now.getFullYear(), month: now.getMonth() })
                setSelected(null)
              }}
            >
              Today
            </button>
          )}
          <button type="button" className="ov-icon-btn" onClick={() => shiftMonth(-1)} aria-label="Previous month">
            <Icon name="chevron-left" />
          </button>
          <button type="button" className="ov-icon-btn" onClick={() => shiftMonth(1)} aria-label="Next month">
            <Icon name="chevron-right" />
          </button>
        </div>
      </header>

      <p className="ov-cal-month" aria-live="polite">
        {monthLabel}
      </p>
      <div className="ov-cal-grid">
        {WEEKDAYS.map((day, index) => (
          <span key={index} className="ov-cal-weekday" aria-hidden="true">
            {day}
          </span>
        ))}
        {cells.map((key, index) => {
          if (!key) return <span key={`blank-${index}`} />
          const due = byDay.get(key) ?? []
          const classes = ['ov-cal-day']
          if (key === todayKey) classes.push('is-today')
          if (key === selected) classes.push('is-selected')
          if (key < todayKey) classes.push('is-past')
          if (due.length) classes.push('has-due')
          const day = Number(key.slice(-2))
          const label = fromDateKey(key).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
          return (
            <button
              key={key}
              type="button"
              className={classes.join(' ')}
              onClick={() => setSelected(key === selected ? null : key)}
              aria-pressed={key === selected}
              aria-label={due.length ? `${label}, ${plural(due.length, 'deadline')}` : label}
            >
              <span className="num">{day}</span>
              {due.length > 0 && (
                <span className="ov-cal-dots" aria-hidden="true">
                  {due.slice(0, 3).map((app) => (
                    <span key={app.id} className={`ov-cal-dot tone-${statusSlug(app.status)}`} />
                  ))}
                </span>
              )}
            </button>
          )
        })}
      </div>

      <div className="ov-cal-list">
        <div className="ov-cal-list-head">
          <h3 className="ov-cal-list-title">{listTitle}</h3>
          {selected && (
            <button type="button" className="ov-text-btn" onClick={() => setSelected(null)}>
              Show upcoming
            </button>
          )}
        </div>
        {listItems.length === 0 ? (
          <p className="ov-empty-line">
            {selected
              ? 'Nothing due this day.'
              : 'No upcoming deadlines. Add one when you create or edit an application.'}
          </p>
        ) : (
          <ul className="ov-deadlines">
            {listItems.map((app) => {
              const date = fromDateKey(app.deadline)
              const days = daysUntil(app.deadline, now)
              return (
                <li key={app.id}>
                  <button type="button" className="ov-deadline" onClick={() => onOpen(app.id)}>
                    <span className={`ov-date-chip${days >= 0 && days <= 3 ? ' is-soon' : ''}`}>
                      <span className="ov-date-chip-month">
                        {date.toLocaleDateString('en-US', { month: 'short' })}
                      </span>
                      <span className="ov-date-chip-day num">{date.getDate()}</span>
                    </span>
                    <span className="ov-deadline-text">
                      <span className="ov-deadline-company">{app.company}</span>
                      <span className="ov-deadline-position">{app.position}</span>
                    </span>
                    <span className="ov-deadline-when">{dueLabel(app.deadline, now)}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </article>
  )
}

// Column chart: applications added per week, last 8 weeks. One series, so no legend.
function ActivityCard({ applications, now }) {
  const weeks = useMemo(() => weeklyActivity(applications, now, 8), [applications, now])
  const [hovered, setHovered] = useState(null)
  const max = Math.max(1, ...weeks.map((week) => week.count))
  const total = weeks.reduce((sum, week) => sum + week.count, 0)
  const weekLabel = (start) => start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  return (
    <article className="ov-card ov-activity" aria-labelledby="ov-activity-title">
      <header className="ov-card-header">
        <div>
          <h2 id="ov-activity-title" className="ov-card-title">
            Weekly activity
          </h2>
          <p className="ov-card-sub">Applications added, last 8 weeks</p>
        </div>
        <p className="ov-activity-total">
          <span className="num">{total}</span> total
        </p>
      </header>

      <div className="ov-columns" onMouseLeave={() => setHovered(null)}>
        {weeks.map((week, index) => {
          const isLast = index === weeks.length - 1
          return (
            <div
              key={week.start.getTime()}
              className={`ov-column${hovered === index ? ' is-hovered' : ''}${isLast ? ' is-current' : ''}`}
              tabIndex={0}
              aria-label={`Week of ${weekLabel(week.start)}: ${plural(week.count, 'application')}`}
              onMouseEnter={() => setHovered(index)}
              onFocus={() => setHovered(index)}
              onBlur={() => setHovered(null)}
            >
              {hovered === index && (
                <span className="ov-tooltip" role="tooltip">
                  <strong className="num">{week.count}</strong> added
                  <span>Week of {weekLabel(week.start)}</span>
                </span>
              )}
              <span className="ov-column-plot">
                {/* Label only the current week's value; the tooltip carries the rest. */}
                {isLast && hovered === null && <span className="ov-column-value num">{week.count}</span>}
                <span
                  className="ov-column-bar"
                  style={{ height: week.count ? `${(week.count / max) * 100}%` : '2px' }}
                />
              </span>
              <span className="ov-column-label" aria-hidden="true">
                {isLast ? 'Now' : index % 2 === 1 ? weekLabel(week.start) : ''}
              </span>
            </div>
          )
        })}
      </div>
    </article>
  )
}

// Horizontal bars, one per status. Each row is labeled with its name and count, so
// identity never depends on color alone. Rows link to the filtered list.
function BreakdownCard({ applications }) {
  const rows = useMemo(() => statusBreakdown(applications), [applications])
  const max = Math.max(1, ...rows.map((row) => row.count))

  return (
    <article className="ov-card ov-breakdown" aria-labelledby="ov-breakdown-title">
      <header className="ov-card-header">
        <div>
          <h2 id="ov-breakdown-title" className="ov-card-title">
            By status
          </h2>
          <p className="ov-card-sub">Where every application stands</p>
        </div>
      </header>
      <ul className="ov-bars">
        {rows.map(({ status, count }) => (
          <li key={status}>
            <Link
              to={`/applications?status=${encodeURIComponent(status)}`}
              className={`ov-bar-row tone-${statusSlug(status)}`}
              aria-label={`${status}: ${plural(count, 'application')}`}
            >
              <span className="ov-bar-name">{status}</span>
              <span className="ov-bar-track">
                <span
                  className="ov-bar-fill"
                  style={{ width: count ? `${(count / max) * 100}%` : '0%' }}
                />
              </span>
              <span className="ov-bar-count num">{count}</span>
            </Link>
          </li>
        ))}
      </ul>
    </article>
  )
}

function RecentCard({ applications, onOpen }) {
  const recent = useMemo(() => recentApplications(applications, 5), [applications])

  return (
    <article className="ov-card ov-recent" aria-labelledby="ov-recent-title">
      <header className="ov-card-header">
        <div>
          <h2 id="ov-recent-title" className="ov-card-title">
            Recent applications
          </h2>
          <p className="ov-card-sub">The latest you've added</p>
        </div>
        <Link to="/applications" className="ov-text-btn">
          View all <span aria-hidden="true">→</span>
        </Link>
      </header>
      {recent.length === 0 ? (
        <p className="ov-empty-line">Nothing here yet. Applications you add show up first.</p>
      ) : (
        <ul className="ov-recent-list">
          {recent.map((app) => (
            <li key={app.id}>
              <button type="button" className="ov-recent-row" onClick={() => onOpen(app.id)}>
                <span className={`ov-avatar tone-${statusSlug(app.status)}`} aria-hidden="true">
                  {app.company.trim().charAt(0).toUpperCase() || '?'}
                </span>
                <span className="ov-recent-text">
                  <span className="ov-recent-company">{app.company}</span>
                  <span className="ov-recent-position">{app.position}</span>
                </span>
                <span className="ov-recent-progress">
                  <StepTrack status={app.status} />
                  <span className="ov-recent-meta">
                    {app.status}
                    {app.createdAt && <> · {daysAgo(app.createdAt)}</>}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </article>
  )
}

const QUICK_ACTIONS = [
  { to: '/applications/add', icon: 'plus', title: 'Add application', text: 'Track a new role' },
  { to: '/applications', icon: 'search', title: 'Search', text: 'Find any application' },
  {
    to: `/applications?sort=${SortOption.DEADLINE}`,
    icon: 'calendar',
    title: 'By deadline',
    text: 'Soonest due first',
  },
  {
    to: `/applications?status=${encodeURIComponent(ApplicationStatus.APPLIED)}`,
    icon: 'clock',
    title: 'Awaiting reply',
    text: 'Still at Applied',
  },
]

function QuickActionsCard() {
  return (
    <article className="ov-card ov-actions" aria-labelledby="ov-actions-title">
      <header className="ov-card-header">
        <h2 id="ov-actions-title" className="ov-card-title">
          Quick actions
        </h2>
      </header>
      <div className="ov-actions-grid">
        {QUICK_ACTIONS.map((action) => (
          <Link key={action.title} to={action.to} className="ov-action">
            <span className="ov-action-icon">
              <Icon name={action.icon} />
            </span>
            <span className="ov-action-title">{action.title}</span>
            <span className="ov-action-text">{action.text}</span>
          </Link>
        ))}
      </div>
    </article>
  )
}

function FollowUpCard({ applications, now, onOpen }) {
  const waiting = useMemo(() => followUps(applications, now, 4), [applications, now])

  return (
    <article className="ov-card ov-followup" aria-labelledby="ov-followup-title">
      <header className="ov-card-header">
        <div>
          <h2 id="ov-followup-title" className="ov-card-title">
            Time to follow up
          </h2>
          <p className="ov-card-sub">No reply after {WAITING_DAYS / 7} weeks</p>
        </div>
      </header>
      {waiting.length === 0 ? (
        <div className="ov-caught-up">
          <span className="ov-caught-up-icon">
            <Icon name="check" />
          </span>
          <p>
            <strong>You're all caught up.</strong> Nothing has been waiting over {WAITING_DAYS / 7} weeks.
          </p>
        </div>
      ) : (
        <ul className="ov-followup-list">
          {waiting.map((app) => (
            <li key={app.id}>
              <button type="button" className="ov-followup-row" onClick={() => onOpen(app.id)}>
                <span className="ov-followup-text">
                  <span className="ov-recent-company">{app.company}</span>
                  <span className="ov-recent-position">{app.position}</span>
                </span>
                <span className="ov-followup-age">Applied {daysAgo(app.createdAt).toLowerCase()}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </article>
  )
}

const ICONS = {
  plus: 'M12 5v14M5 12h14',
  stack: 'M12 3 3 8l9 5 9-5-9-5zM3 13l9 5 9-5M3 18l9 5 9-5',
  chat: 'M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z',
  trophy: 'M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0zM17 6h3v2a3 3 0 0 1-3 3M7 6H4v2a3 3 0 0 0 3 3',
  search: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM21 21l-4.35-4.35',
  calendar: 'M4 6h16v15H4zM4 10h16M8 3v4M16 3v4',
  clock: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7v5l3 2',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  'chevron-left': 'M15 6l-6 6 6 6',
  'chevron-right': 'M9 6l6 6-6 6',
}

function Icon({ name }) {
  return (
    <svg className="ov-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d={ICONS[name]} />
    </svg>
  )
}

export default Overview
