import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import StepTrack from '../components/StepTrack.jsx'
import { ApplicationStatus, statusSlug } from '../models/Application.js'
import {
  ALL_STATUSES,
  SortOption,
  WAITING_DAYS,
  countByStatus,
  countWaiting,
  isWaiting,
  queryApplications,
  sortLabels,
} from '../services/applicationQuery.js'
import { daysAgo, formatShortDate } from '../lib/formatDate.js'
import './ApplicationsList.css'

const plural = (count, word) => `${count} ${word}${count === 1 ? '' : 's'}`

// UI layer: the route passes in the applications, what happens on select, and how to
// change a status from a row (onUpdateStatus resolves to { success, error }).
// justAdded ({ id, company }) / justDeleted ({ company }) confirm what the student just did;
// onDismissAdded clears either one.
// Search, status, and sort live in the URL (?q=&status=&sort=) so they survive
// going into an application and coming back.
function ApplicationsList({ applications, onSelect, onUpdateStatus, justAdded, justDeleted, onDismissAdded }) {
  const [savingId, setSavingId] = useState(null)
  const [rowError, setRowError] = useState(null)

  const changeStatus = async (app, next) => {
    if (next === app.status) return
    setSavingId(app.id)
    setRowError(null)
    const result = await onUpdateStatus(app.id, next)
    setSavingId(null)
    if (!result.success) setRowError(`Couldn't move ${app.company} to ${next}. ${result.error}`)
  }

  const [params, setParams] = useSearchParams()
  const search = params.get('q') ?? ''
  const status = params.get('status') ?? ALL_STATUSES
  const sort = params.get('sort') ?? SortOption.NEWEST

  const counts = useMemo(() => countByStatus(applications), [applications])
  const waiting = useMemo(() => countWaiting(applications), [applications])
  const visible = useMemo(
    () => queryApplications(applications, { search, status, sort }),
    [applications, search, status, sort],
  )
  const filtersActive = search.trim() !== '' || status !== ALL_STATUSES

  // Withdrawn only gets a spot in the pipeline once something is withdrawn.
  const pipeline = Object.values(ApplicationStatus).filter(
    (option) => option !== ApplicationStatus.WITHDRAWN || counts[option] > 0,
  )

  const updateParam = (key, value, defaultValue) => {
    setParams(
      (current) => {
        const next = new URLSearchParams(current)
        if (!value || value === defaultValue) next.delete(key)
        else next.set(key, value)
        return next
      },
      { replace: true },
    )
  }

  const clearFilters = () =>
    setParams(
      (current) => {
        const next = new URLSearchParams(current)
        next.delete('q')
        next.delete('status')
        return next
      },
      { replace: true },
    )

  const handleKeyDown = (event, id) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onSelect(id)
    }
  }

  // "Added …" or "Deleted …", shown once after coming back to the list.
  const notice = (justAdded || justDeleted) && (
    <div className="apps-added" role="status">
      <CheckIcon />
      <span>
        {justAdded ? 'Added' : 'Deleted'} <strong>{(justAdded ?? justDeleted).company}</strong>.
      </span>
      {justAdded && (
        <Link to="/applications/add" className="apps-added-link">
          Add another
        </Link>
      )}
      <button type="button" className="apps-added-close" onClick={onDismissAdded} aria-label="Dismiss">
        ×
      </button>
    </div>
  )

  if (applications.length === 0) {
    return (
      <section className="apps">
        <div className="apps-heading">
          <h1 className="apps-title">My applications</h1>
          <Link to="/applications/add" className="apps-add">
            <span aria-hidden="true">+</span> Add application
          </Link>
        </div>
        {notice}
        <div className="apps-panel apps-empty">
          <p className="apps-empty-title">Nothing tracked yet</p>
          <p className="apps-empty-text">
            Applications you add will show up here, each with its own step track.
          </p>
        </div>
      </section>
    )
  }

  return (
    <section className="apps">
      <header className="apps-header">
        <div className="apps-heading">
          <h1 className="apps-title">My applications</h1>
          <Link to="/applications/add" className="apps-add">
            <span aria-hidden="true">+</span> Add application
          </Link>
        </div>
        <p className="apps-summary">
          {plural(applications.length, 'application')} tracked.
          {waiting > 0 && (
            <>
              {' '}
              <strong>
                {plural(waiting, 'application')} {waiting === 1 ? 'has' : 'have'} waited over{' '}
                {WAITING_DAYS / 7} weeks
              </strong>{' '}
              for a reply. A follow-up email might help.
            </>
          )}
        </p>
      </header>

      <div className="pipeline">
        <div className="pipeline-bar" aria-hidden="true">
          {pipeline.map((option) =>
            counts[option] > 0 ? (
              <span
                key={option}
                className={`pipeline-segment tone-${statusSlug(option)}${
                  status !== ALL_STATUSES && status !== option ? ' is-dimmed' : ''
                }`}
                style={{ flexGrow: counts[option] }}
              />
            ) : null,
          )}
        </div>
        <ul className="pipeline-legend" aria-label="Filter by status">
          {pipeline.map((option) => {
            const active = status === option
            return (
              <li key={option}>
                <button
                  type="button"
                  className={`pipeline-key tone-${statusSlug(option)}${active ? ' is-active' : ''}`}
                  aria-pressed={active}
                  onClick={() => updateParam('status', active ? ALL_STATUSES : option, ALL_STATUSES)}
                >
                  <span className="pipeline-count">{counts[option]}</span>
                  <span className="pipeline-name">{option}</span>
                </button>
              </li>
            )
          })}
        </ul>
      </div>

      {notice}

      {rowError && (
        <p className="apps-row-error" role="alert">
          {rowError}
        </p>
      )}

      <div className="apps-toolbar">
        <label className="apps-search">
          <SearchIcon />
          <span className="visually-hidden">Search applications</span>
          <input
            type="search"
            placeholder="Search by company or position"
            value={search}
            onChange={(event) => updateParam('q', event.target.value, '')}
          />
        </label>

        <label className="apps-select">
          <span className="visually-hidden">Filter by status</span>
          <select
            value={status}
            onChange={(event) => updateParam('status', event.target.value, ALL_STATUSES)}
          >
            <option value={ALL_STATUSES}>All statuses</option>
            {Object.values(ApplicationStatus).map((option) => (
              <option key={option} value={option}>
                {option} ({counts[option]})
              </option>
            ))}
          </select>
        </label>

        <label className="apps-select">
          <span className="visually-hidden">Sort applications</span>
          <select
            value={sort}
            onChange={(event) => updateParam('sort', event.target.value, SortOption.NEWEST)}
          >
            {Object.values(SortOption).map((option) => (
              <option key={option} value={option}>
                {sortLabels[option]}
              </option>
            ))}
          </select>
        </label>
      </div>

      {filtersActive && (
        <p className="apps-results" aria-live="polite">
          Showing {visible.length} of {applications.length}
          <button type="button" className="apps-clear" onClick={clearFilters}>
            Clear filters
          </button>
        </p>
      )}

      <div className="apps-panel">
        {visible.length === 0 ? (
          <div className="apps-empty">
            <p className="apps-empty-title">No applications match</p>
            <p className="apps-empty-text">Try another company name or status.</p>
            <button type="button" className="apps-clear" onClick={clearFilters}>
              Clear filters
            </button>
          </div>
        ) : (
          <table className="apps-table">
            <thead>
              <tr>
                <th scope="col">Application</th>
                <th scope="col">Progress</th>
                <th scope="col">Applied</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((app) => (
                <tr
                  key={app.id}
                  className={`apps-row${justAdded?.id === app.id ? ' is-new' : ''}`}
                  tabIndex={0}
                  onClick={() => onSelect(app.id)}
                  onKeyDown={(event) => handleKeyDown(event, app.id)}
                >
                  <td className="apps-cell-main">
                    <span className="apps-company">{app.company}</span>
                    <span className="apps-position">{app.position}</span>
                  </td>
                  {/* Changing the status here shouldn't open the application. */}
                  <td
                    className="apps-cell-progress"
                    onClick={(event) => event.stopPropagation()}
                    onKeyDown={(event) => event.stopPropagation()}
                  >
                    <label className={`apps-progress${savingId === app.id ? ' is-saving' : ''}`}>
                      <span className="visually-hidden">Status for {app.company}</span>
                      <StepTrack status={app.status} />
                      <span className={`apps-status tone-${statusSlug(app.status)}`}>
                        {savingId === app.id ? 'Saving…' : app.status}
                      </span>
                      <ChevronIcon />
                      <select
                        className="apps-progress-select"
                        value={app.status}
                        disabled={savingId === app.id}
                        onChange={(event) => changeStatus(app, event.target.value)}
                      >
                        {Object.values(ApplicationStatus).map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </label>
                  </td>
                  <td className="apps-date num">
                    {app.createdAt ? (
                      <>
                        <span>{formatShortDate(app.createdAt)}</span>
                        <span className={`apps-ago${isWaiting(app) ? ' is-waiting' : ''}`}>
                          {daysAgo(app.createdAt)}
                          {isWaiting(app) && ', no reply yet'}
                        </span>
                      </>
                    ) : (
                      <span className="apps-ago">Not recorded</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  )
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  )
}

function ChevronIcon() {
  return (
    <svg className="apps-progress-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 9l6 6 6-6" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg className="apps-added-icon" width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
}

export default ApplicationsList
