import { useEffect, useState } from 'react'
import ResumeVersionField from '../components/ResumeVersionField.jsx'
import StagePicker from '../components/StagePicker.jsx'
import { daysAgo, formatDate, formatShortDate } from '../lib/formatDate.js'
import { ApplicationStatus, STATUS_STAGES, statusSlug } from '../models/Application.js'
import { MAX_NOTES_LENGTH } from '../services/applicationService.js'
import '../components/FormFields.css'
import './ApplicationDetails.css'

const CLOSED_STATUSES = [ApplicationStatus.REJECTED, ApplicationStatus.WITHDRAWN]

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

// UI layer: the route passes in an Application model, what happens on back, and how to
// save notes, status, and details (onSaveNotes, onUpdateStatus, onUpdateDetails resolve to
// { success, application, error }). resumeVersions feed the resume dropdown in the editor.
function ApplicationDetails({
  application,
  resumeVersions = [],
  resumeVersionsLoading = false,
  onBack,
  onSaveNotes,
  onUpdateStatus,
  onUpdateDetails,
}) {
  const { company, position, status, deadline, notes, jobLink, resumeVersion, createdAt } =
    application

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

  // Details editor: replaces the facts list while open.
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

  const closed = !STATUS_STAGES.includes(status)

  return (
    <section>
      <button type="button" className="details-back" onClick={onBack}>
        <span aria-hidden="true">←</span> All applications
      </button>

      <header className="details-header">
        <div className="details-heading">
          <h1 className="details-title">{company}</h1>
          <p className="details-position">{position}</p>
        </div>
        {!editing && (
          <button type="button" className="details-edit" onClick={startEditingDetails}>
            <PencilIcon />
            Edit details
          </button>
        )}
      </header>

      <fieldset className="details-progress">
        <legend className="details-progress-title">Progress</legend>
        <p className="details-progress-hint">
          {closed
            ? `Marked ${status}. Pick a stage to reopen it.`
            : 'Click a stage when the application moves forward.'}
        </p>
        <StagePicker name="details-status" value={status} onChange={changeStatus} disabled={statusSaving} />
        {/* Buttons first, so a message appearing beside them doesn't move them. */}
        <div className="details-progress-footer">
          <span className="details-close-actions">
            {CLOSED_STATUSES.filter((option) => option !== status).map((option) => (
              <button
                key={option}
                type="button"
                className={`details-close tone-${statusSlug(option)}`}
                onClick={() => changeStatus(option)}
                disabled={statusSaving}
              >
                Mark as {option.toLowerCase()}
              </button>
            ))}
          </span>
          {statusSaving && <span className="details-saving">Saving…</span>}
          <Message message={statusMessage} className="details-message" />
        </div>
      </fieldset>

      {editing ? (
        <form className="details-editor" onSubmit={saveDetails}>
          <h2 className="details-editor-title">Edit details</h2>
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
      ) : (
        <>
          <dl className="details-facts">
            <div className="details-field">
              <dt>Applied</dt>
              <dd className={createdAt ? undefined : 'details-empty'}>
                {createdAt ? (
                  <span className="num">
                    {formatShortDate(createdAt)}
                    <span className="details-sub">{daysAgo(createdAt)}</span>
                  </span>
                ) : (
                  'Not recorded'
                )}
              </dd>
            </div>
            <div className="details-field">
              <dt>Deadline</dt>
              <dd className={deadline ? undefined : 'details-empty'}>
                {deadline ? <span className="num">{formatDate(deadline)}</span> : 'No deadline'}
              </dd>
            </div>
            <div className="details-field">
              <dt>Job link</dt>
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
              <dt>Resume version</dt>
              <dd className={resumeVersion ? undefined : 'details-empty'}>
                {resumeVersion || 'Not recorded'}
              </dd>
            </div>
          </dl>
          <Message message={detailsMessage} className="details-message details-message-after" />
        </>
      )}

      <section className="notes-card" aria-labelledby="notes-title">
        <header className="notes-card-header">
          <h2 id="notes-title" className="notes-title">
            <NoteIcon />
            Notes
          </h2>
          {!editingNotes && notes && (
            <button type="button" className="notes-edit" onClick={startEditingNotes}>
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
              <span className="notes-empty-sub">
                Keep track of interview dates, contacts, and next steps.
              </span>
            </span>
          </button>
        )}

        <Message message={notesMessage} className="notes-message" />
      </section>
    </section>
  )
}

function NoteIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
      <path d="M14 3v6h6M8 13h8M8 17h5" />
    </svg>
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
