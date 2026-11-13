import { useState } from 'react'
import { formatDate } from '../lib/formatDate.js'
import { ApplicationStatus } from '../models/Application.js'
import './ApplicationDetails.css'

const applicationStatuses = Object.values(ApplicationStatus)

// UI layer: the route passes in an Application model, what happens on back,
// and how to save a new status (resolves to { success, error }).
// Status pill styles (.status, .status-*) are shared with ApplicationsList.css.
function ApplicationDetails({ application, onBack, onUpdateStatus }) {
  const { company, position, status, deadline, notes, jobLink, resumeVersion } = application
  const [selectedStatus, setSelectedStatus] = useState(status)
  const [message, setMessage] = useState('')
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setMessage('')
    setSaved(false)
    setSaving(true)

    const result = await onUpdateStatus(selectedStatus)
    setSaving(false)
    if (!result.success) {
      setMessage(result.error)
      return
    }

    setMessage('Application status saved.')
    setSaved(true)
  }

  return (
    <section>
      <button type="button" className="details-back" onClick={onBack}>
        <span aria-hidden="true">←</span> Back to Applications
      </button>

      <header className="details-header">
        <h1 className="details-title">{company}</h1>
        <p className="details-position">{position}</p>
      </header>

      <dl className="details-card">
        <div className="details-field">
          <dt>Status</dt>
          <dd>
            <span className={`status status-${status.toLowerCase()}`}>{status}</span>
          </dd>
        </div>
        <div className="details-field">
          <dt>Deadline</dt>
          <dd className={deadline ? undefined : 'details-empty'}>
            {deadline ? formatDate(deadline) : 'No deadline'}
          </dd>
        </div>
        <div className="details-field">
          <dt>Job Link</dt>
          <dd className={jobLink ? 'details-link' : 'details-empty'}>
            {jobLink ? (
              <a href={application.getSafeJobLink()} target="_blank" rel="noopener noreferrer">
                {jobLink}
              </a>
            ) : (
              'No link saved'
            )}
          </dd>
        </div>
        <div className="details-field">
          <dt>Resume Version</dt>
          <dd className={resumeVersion ? undefined : 'details-empty'}>
            {resumeVersion || 'Not recorded'}
          </dd>
        </div>
        <div className="details-field details-field-wide">
          <dt>Notes</dt>
          <dd className={notes ? 'details-notes' : 'details-empty'}>{notes || 'No notes yet.'}</dd>
        </div>
      </dl>

      <form className="status-form" onSubmit={handleSubmit}>
        <label htmlFor="application-status">Update status</label>
        <div className="status-form-controls">
          <select
            id="application-status"
            value={selectedStatus}
            onChange={(event) => {
              setSelectedStatus(event.target.value)
              setMessage('')
              setSaved(false)
            }}
          >
            {applicationStatuses.map((applicationStatus) => (
              <option key={applicationStatus} value={applicationStatus}>
                {applicationStatus}
              </option>
            ))}
          </select>
          <button type="submit" disabled={saving || selectedStatus === status}>
            {saving ? 'Saving…' : 'Save status'}
          </button>
        </div>
        {message && (
          <p
            className={saved ? 'status-message status-message-success' : 'status-message'}
            role={saved ? 'status' : 'alert'}
          >
            {message}
          </p>
        )}
      </form>
    </section>
  )
}

export default ApplicationDetails
