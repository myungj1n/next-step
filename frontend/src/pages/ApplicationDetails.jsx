import { useState } from 'react'
import { formatDate } from '../lib/formatDate.js'
import { ApplicationStatus } from '../models/Application.js'
import './ApplicationDetails.css'

const applicationStatuses = Object.values(ApplicationStatus)

// UI layer: the route passes in an Application model, what happens on back,
// and how to save a new status (resolves to { success, error }).
// Status pill styles (.status, .status-*) are shared with ApplicationsList.css.
function ApplicationDetails({ application, onBack, onUpdateStatus, onUpdateDetails }) {
  const { company, position, status, deadline, notes, jobLink, resumeVersion } = application
  const [selectedStatus, setSelectedStatus] = useState(status)
  const [message, setMessage] = useState('')
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingDetails, setEditingDetails] = useState(false)
  const [editedCompany, setEditedCompany] = useState(company)
  const [editedPosition, setEditedPosition] = useState(position)
  const [detailsMessage, setDetailsMessage] = useState('')
  const [detailsSaved, setDetailsSaved] = useState(false)
  const [savingDetails, setSavingDetails] = useState(false)

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

  const handleDetailsSubmit = async (event) => {
    event.preventDefault()
    setDetailsMessage('')
    setDetailsSaved(false)
    setSavingDetails(true)

    const result = await onUpdateDetails({ company: editedCompany, position: editedPosition })
    setSavingDetails(false)
    if (!result.success) {
      setDetailsMessage(result.error)
      return
    }

    setEditedCompany(result.application.company)
    setEditedPosition(result.application.position)
    setEditingDetails(false)
    setDetailsMessage('Application details saved.')
    setDetailsSaved(true)
  }

  const cancelDetailsEdit = () => {
    setEditedCompany(company)
    setEditedPosition(position)
    setDetailsMessage('')
    setDetailsSaved(false)
    setEditingDetails(false)
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

      <button
        type="button"
        className="details-edit-toggle"
        onClick={() => {
          if (editingDetails) {
            cancelDetailsEdit()
          } else {
            setDetailsMessage('')
            setDetailsSaved(false)
            setEditingDetails(true)
          }
        }}
        aria-expanded={editingDetails}
      >
        {editingDetails ? 'Close editor' : 'Edit application'}
      </button>

      {editingDetails && (
        <form className="details-edit-form" onSubmit={handleDetailsSubmit}>
          <div className="details-edit-field">
            <label htmlFor="edit-company">Company</label>
            <input
              id="edit-company"
              name="company"
              type="text"
              value={editedCompany}
              onChange={(event) => setEditedCompany(event.target.value)}
              autoComplete="organization"
              required
            />
          </div>
          <div className="details-edit-field">
            <label htmlFor="edit-position">Position</label>
            <input
              id="edit-position"
              name="position"
              type="text"
              value={editedPosition}
              onChange={(event) => setEditedPosition(event.target.value)}
              required
            />
          </div>
          {detailsMessage && (
            <p
              className={detailsSaved ? 'status-message status-message-success' : 'status-message'}
              role={detailsSaved ? 'status' : 'alert'}
            >
              {detailsMessage}
            </p>
          )}
          <div className="details-edit-actions">
            <button type="button" onClick={cancelDetailsEdit} disabled={savingDetails}>
              Cancel
            </button>
            <button type="submit" disabled={savingDetails}>
              {savingDetails ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>
      )}
      {!editingDetails && detailsMessage && (
        <p className="status-message status-message-success" role="status">
          {detailsMessage}
        </p>
      )}

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
