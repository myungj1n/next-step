import { useEffect, useState } from 'react'
import ResumeVersionField from '../components/ResumeVersionField.jsx'
import { daysAgo, formatDate, formatShortDate } from '../lib/formatDate.js'
import { ApplicationStatus, CLOSED_STATUSES, STATUS_STAGES, statusSlug } from '../models/Application.js'
import { MAX_NOTES_LENGTH } from '../services/applicationService.js'
import { nextStage, nextStepFor } from '../services/nextStep.js'
import { daysUntil } from '../services/overviewStats.js'
import '../components/FormFields.css'
import '../components/StepTrack.css'
import './ApplicationDetails.css'

// Shows a confirmation for a moment, then clears it.
function useFadingMessage() {
  const [message, setMessage] = useState(null) // { text, ok }
  useEffect(() => {
    if (!message?.ok) return undefined
    const timer = setTimeout(() => setMessage(null), 2500)
    return () => clearTimeout(timer)
  }, [message])
  return [message, setMessage]
}

function Message({ message, className }) {
  if (!message) return null
  return (
    <p
      className={`${className}${message.ok ? ` ${className}-success` : ''}`}
      role={message.ok ? 'status' : 'alert'}
    >
      {message.text}
    </p>
  )
}

// "Today", "Tomorrow", "In 7 days", "3 days ago".
function deadlineText(days) {
  if (days === 0) return 'Today'
  if (days === 1) return 'Tomorrow'
  if (days > 1) return `In ${days} days`
  return days === -1 ? 'Yesterday' : `${-days} days ago`
}

// UI layer: the route passes in an Application model, what happens on back, and how to
// save notes, status, and details (onSaveNotes, onUpdateStatus, onUpdateDetails resolve to
// { success, application, error }). resumeVersions feed the resume dropdown in the editor.
// onDelete resolves to { success, error }; on success the route navigates away.
function ApplicationDetails({
  application,
  resumeVersions = [],
  resumeVersionsLoading = false,
  onBack,
  onSaveNotes,
  onUpdateStatus,
  onUpdateDetails,
  onDelete,
}) {
  const { company, position, status, deadline, notes, jobLink, resumeVersion, createdAt } =
    application
  const [now] = useState(() => new Date())

  // Progress: saved as soon as a stage is clicked.
  const [statusSaving, setStatusSaving] = useState(false)
  const [statusMessage, setStatusMessage] = useFadingMessage()

  const changeStatus = async (next) => {
    if (statusSaving || next === status) return
    setStatusSaving(true)
    setStatusMessage(null)
    const result = await onUpdateStatus(next)
    setStatusSaving(false)
    setStatusMessage(
      result.success ? { text: `Moved to ${next}.`, ok: true } : { text: result.error, ok: false },
    )
  }

  // Details editor: shown above the page's columns while open.
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState(null)
  const [detailsSaving, setDetailsSaving] = useState(false)
  const [detailsMessage, setDetailsMessage] = useFadingMessage()

  const startEditingDetails = () => {
    setForm({
      company,
      position,
      deadline: deadline ?? '',
      jobLink: jobLink ?? '',
      resumeVersion: resumeVersion ?? '',
    })
    setDetailsMessage(null)
    setEditing(true)
  }

  const setField = (key) => (value) => setForm((current) => ({ ...current, [key]: value }))

  const saveDetails = async (event) => {
    event.preventDefault()
    setDetailsSaving(true)
    setDetailsMessage(null)
    const result = await onUpdateDetails(form)
    setDetailsSaving(false)
    if (!result.success) {
      setDetailsMessage({ text: result.error, ok: false })
      return
    }
    setEditing(false)
    setDetailsMessage({ text: 'Changes saved.', ok: true })
  }

  // Notes.
  const [editingNotes, setEditingNotes] = useState(false)
  const [draft, setDraft] = useState(notes ?? '')
  const [notesSaving, setNotesSaving] = useState(false)
  const [notesMessage, setNotesMessage] = useFadingMessage()

  const startEditingNotes = () => {
    setDraft(notes ?? '')
    setNotesMessage(null)
    setEditingNotes(true)
  }

  const cancelEditingNotes = () => {
    setEditingNotes(false)
    setNotesMessage(null)
  }

  const saveNotes = async (event) => {
    event.preventDefault()
    if (notesSaving || draft.trim() === (notes ?? '')) return
    setNotesSaving(true)
    setNotesMessage(null)
    const result = await onSaveNotes(draft)
    setNotesSaving(false)
    if (!result.success) {
      setNotesMessage({ text: result.error, ok: false })
      return
    }
    setEditingNotes(false)
    setNotesMessage({ text: 'Notes saved.', ok: true })
  }

  // Delete: asks to confirm in place before anything is removed.
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  const deleteApplication = async () => {
    setDeleting(true)
    setDeleteError('')
    const result = await onDelete()
    // On success the route leaves this page; only a failure needs handling here.
    if (!result.success) {
      setDeleting(false)
      setDeleteError(result.error)
    }
  }

  const stageIndex = STATUS_STAGES.indexOf(status)
  const closed = stageIndex < 0
  const upcoming = nextStage(status)
  const advice = nextStepFor(application, now)
  const deadlineDays = deadline ? daysUntil(deadline, now) : null
  const deadlineSoon =
    deadlineDays !== null && deadlineDays >= 0 && deadlineDays <= 7 && !CLOSED_STATUSES.has(status)
  const host = application.getJobLinkHost()

  return (
    <section className="dt">
      <button type="button" className="details-back" onClick={onBack}>
        <span aria-hidden="true">←</span> All applications
      </button>

      <header className="dt-header">
        <span className="dt-monogram" aria-hidden="true">
          {company.trim().charAt(0).toUpperCase() || '?'}
        </span>
        <div className="dt-heading">
          <h1 className="dt-title">{company}</h1>
          <p className="dt-position">{position}</p>
        </div>
        {!editing && (
          <button type="button" className="dt-button" onClick={startEditingDetails}>
            <PencilIcon />
            Edit details
          </button>
        )}
      </header>

      {editing && (
        <form className="dt-panel details-editor" onSubmit={saveDetails}>
          <h2 className="dt-panel-title">Edit details</h2>
          <div className="field-grid">
            <div className="field">
              <label htmlFor="edit-company">Company</label>
              <input
                id="edit-company"
                type="text"
                value={form.company}
                onChange={(event) => setField('company')(event.target.value)}
                autoComplete="organization"
                required
              />
            </div>
            <div className="field">
              <label htmlFor="edit-position">Position</label>
              <input
                id="edit-position"
                type="text"
                value={form.position}
                onChange={(event) => setField('position')(event.target.value)}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="edit-deadline">
                Deadline <span className="field-optional">Optional</span>
              </label>
              <input
                id="edit-deadline"
                type="date"
                value={form.deadline}
                className={form.deadline ? undefined : 'is-empty'}
                onChange={(event) => setField('deadline')(event.target.value)}
              />
            </div>
            <ResumeVersionField
              id="edit-resume"
              versions={resumeVersions}
              loading={resumeVersionsLoading}
              value={form.resumeVersion}
              onChange={setField('resumeVersion')}
            />
            <div className="field field-wide">
              <label htmlFor="edit-job-link">
                Job posting link <span className="field-optional">Optional</span>
              </label>
              <div className="input-icon">
                <LinkIcon />
                <input
                  id="edit-job-link"
                  type="text"
                  inputMode="url"
                  spellCheck={false}
                  value={form.jobLink}
                  onChange={(event) => setField('jobLink')(event.target.value)}
                  placeholder="careers.google.com/jobs/123"
                />
              </div>
            </div>
          </div>
          <Message message={detailsMessage} className="details-message" />
          <div className="details-editor-actions">
            <button type="button" className="details-cancel" onClick={() => setEditing(false)} disabled={detailsSaving}>
              Cancel
            </button>
            <button type="submit" className="details-save" disabled={detailsSaving}>
              {detailsSaving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>
      )}
      {!editing && <Message message={detailsMessage} className="details-message dt-saved" />}

      <div className="dt-columns">
        <div className="dt-main">
          {/* Progress: the current stage, a one-click move forward, and the full path. */}
          <section className={`dt-panel dt-progress tone-${statusSlug(status)}`} aria-labelledby="progress-stage">
            <div className="dt-progress-head">
              <div>
                <p className="dt-progress-step">
                  {closed ? 'Closed' : `Step ${stageIndex + 1} of ${STATUS_STAGES.length}`}
                </p>
                <p id="progress-stage" className="dt-progress-stage">
                  {status}
                </p>
              </div>
              {upcoming && (
                <button type="button" className="dt-advance" onClick={() => changeStatus(upcoming)} disabled={statusSaving}>
                  {statusSaving ? 'Saving…' : `Move to ${upcoming}`}
                </button>
              )}
              {closed && (
                <button
                  type="button"
                  className="dt-button"
                  onClick={() => changeStatus(ApplicationStatus.APPLIED)}
                  disabled={statusSaving}
                >
                  Reopen at Applied
                </button>
              )}
            </div>

            <fieldset className="dt-segments" disabled={statusSaving}>
              <legend className="visually-hidden">Stage</legend>
              {STATUS_STAGES.map((stage, index) => {
                const reached = !closed && index <= stageIndex
                return (
                  <label
                    key={stage}
                    className={`dt-segment${reached ? ' is-reached' : ''}${stage === status ? ' is-current' : ''}`}
                  >
                    <input
                      type="radio"
                      name="details-stage"
                      value={stage}
                      checked={stage === status}
                      onChange={() => changeStatus(stage)}
                    />
                    <span className="dt-segment-bar" aria-hidden="true" />
                    <span className="dt-segment-name">{stage}</span>
                  </label>
                )
              })}
            </fieldset>

            <div className="dt-progress-foot">
              <span>Click any stage to set it.</span>
              {!closed && <span>Didn't work out?</span>}
              {[ApplicationStatus.REJECTED, ApplicationStatus.WITHDRAWN]
                .filter((option) => option !== status)
                .map((option) => (
                  <button
                    key={option}
                    type="button"
                    className={`dt-close dt-close-${statusSlug(option)}`}
                    onClick={() => changeStatus(option)}
                    disabled={statusSaving}
                  >
                    Mark as {option.toLowerCase()}
                  </button>
                ))}
              <Message message={statusMessage} className="details-message" />
            </div>
          </section>

          <section className="dt-next" aria-labelledby="next-step-title">
            <p className="dt-next-label">Your next step</p>
            <h2 id="next-step-title" className="dt-next-title">
              {advice.title}
            </h2>
            <ul className="dt-next-list">
              {advice.tips.map((tip) => (
                <li key={tip}>{tip}</li>
              ))}
            </ul>
          </section>

          <section className="dt-panel notes-card" aria-labelledby="notes-title">
            <header className="notes-card-header">
              <h2 id="notes-title" className="dt-panel-title">
                Notes
              </h2>
              {!editingNotes && notes && (
                <button type="button" className="dt-button dt-button-small" onClick={startEditingNotes}>
                  <PencilIcon />
                  Edit
                </button>
              )}
            </header>

            {editingNotes ? (
              <form className="notes-form" onSubmit={saveNotes}>
                <label htmlFor="application-notes" className="visually-hidden">
                  Notes
                </label>
                <textarea
                  id="application-notes"
                  value={draft}
                  maxLength={MAX_NOTES_LENGTH}
                  rows={5}
                  placeholder="Interview dates, recruiter contacts, follow-ups, things to prep…"
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Escape') cancelEditingNotes()
                    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) saveNotes(event)
                  }}
                  autoFocus
                />
                <div className="notes-form-footer">
                  <span className="notes-hint">
                    {draft.length} of {MAX_NOTES_LENGTH} characters. <kbd>Ctrl</kbd>/<kbd>⌘</kbd>+<kbd>Enter</kbd> saves.
                  </span>
                  <button type="button" className="notes-cancel" onClick={cancelEditingNotes} disabled={notesSaving}>
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="notes-save"
                    disabled={notesSaving || draft.trim() === (notes ?? '')}
                  >
                    {notesSaving ? 'Saving…' : 'Save'}
                  </button>
                </div>
              </form>
            ) : notes ? (
              <p className="notes-body">{notes}</p>
            ) : (
              <button type="button" className="notes-empty" onClick={startEditingNotes}>
                <span className="notes-empty-plus" aria-hidden="true">+</span>
                <span>
                  <span className="notes-empty-title">Add a note</span>
                  <span className="notes-empty-sub">Recruiter names, interview times, what to prepare.</span>
                </span>
              </button>
            )}

            <Message message={notesMessage} className="notes-message" />
          </section>
        </div>

        <aside className="dt-side">
          <section className="dt-panel" aria-label="Details">
            <dl className="dt-facts">
              <div>
                <dt>Applied</dt>
                {createdAt ? (
                  <>
                    <dd className="dt-fact num">{formatShortDate(createdAt)}</dd>
                    <dd className="dt-fact-sub">{daysAgo(createdAt)}</dd>
                  </>
                ) : (
                  <dd className="dt-fact is-empty">Not recorded</dd>
                )}
              </div>
              <div>
                <dt>Deadline</dt>
                {deadline ? (
                  <>
                    <dd className="dt-fact num">{formatDate(deadline, { month: 'short' })}</dd>
                    <dd className={`dt-fact-sub${deadlineSoon ? ' is-soon' : ''}`}>{deadlineText(deadlineDays)}</dd>
                  </>
                ) : (
                  <dd className="dt-fact is-empty">No deadline</dd>
                )}
              </div>
              <div>
                <dt>Resume version</dt>
                <dd className={`dt-fact${resumeVersion ? '' : ' is-empty'}`}>{resumeVersion || 'Not recorded'}</dd>
              </div>
              <div>
                <dt>Job posting</dt>
                {jobLink ? (
                  <dd>
                    <a className="dt-posting" href={application.getSafeJobLink()} target="_blank" rel="noopener noreferrer">
                      <ExternalIcon />
                      Open {host} posting
                    </a>
                  </dd>
                ) : (
                  <dd className="dt-fact is-empty">No link saved</dd>
                )}
              </div>
            </dl>
          </section>

          <section className="dt-danger" aria-label="Delete application">
            {confirmingDelete ? (
              <div
                className="details-delete-confirm"
                role="alertdialog"
                aria-labelledby="delete-title"
                aria-describedby="delete-text"
                onKeyDown={(event) => {
                  if (event.key === 'Escape' && !deleting) setConfirmingDelete(false)
                }}
              >
                <div>
                  <p id="delete-title" className="details-delete-title">
                    Delete {company}?
                  </p>
                  <p id="delete-text" className="details-delete-text">
                    Its status, details, and notes are removed for good. This can't be undone.
                  </p>
                </div>
                <div className="details-delete-actions">
                  <button
                    type="button"
                    className="details-cancel"
                    onClick={() => setConfirmingDelete(false)}
                    disabled={deleting}
                    autoFocus
                  >
                    Keep it
                  </button>
                  <button type="button" className="details-delete-confirm-button" onClick={deleteApplication} disabled={deleting}>
                    {deleting ? 'Deleting…' : 'Delete'}
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                className="details-delete"
                onClick={() => {
                  setDeleteError('')
                  setConfirmingDelete(true)
                }}
              >
                <TrashIcon />
                Delete application
              </button>
            )}
            {deleteError && (
              <p className="details-message" role="alert">
                {deleteError}
              </p>
            )}
          </section>
        </aside>
      </div>
    </section>
  )
}

function PencilIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
    </svg>
  )
}

function ExternalIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6" />
    </svg>
  )
}

function LinkIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7.1-7.1l-1.7 1.7" />
      <path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7.1 7.1l1.7-1.7" />
    </svg>
  )
}

export default ApplicationDetails
