import { useState } from 'react'
import { applicationStatuses } from '../data/applications.js'
import './ApplicationDetails.css'

// Status pill styles (.status, .status-*) are shared with ApplicationsList.css.
function ApplicationDetails({ application, loadError, onBack, onUpdateStatus }) {
  const { company, position, status, deadline, notes } = application
  const [selectedStatus, setSelectedStatus] = useState(status)
  const [message, setMessage] = useState(loadError)
  const [saved, setSaved] = useState(false)

  const handleSubmit = (event) => {
    event.preventDefault()
    setMessage('')
    setSaved(false)

    const result = onUpdateStatus(application.id, selectedStatus)
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
          <dd>{deadline}</dd>
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
          <button type="submit" disabled={selectedStatus === status}>
            Save status
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
