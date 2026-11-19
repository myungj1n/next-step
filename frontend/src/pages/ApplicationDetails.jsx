import { useEffect, useState } from 'react'
import StepTrack from '../components/StepTrack.jsx'
import { daysAgo, formatDate, formatShortDate } from '../lib/formatDate.js'
import { MAX_NOTES_LENGTH } from '../services/applicationService.js'
import './ApplicationDetails.css'

// UI layer: the route passes in an Application model, what happens on back,
// and how to save notes (onSaveNotes resolves to { success, error }).
// Status pill styles (.status, .status-*) are shared with ApplicationsList.css.
function ApplicationDetails({ application, onBack, onSaveNotes }) {
  const { company, position, status, deadline, notes, jobLink, resumeVersion, createdAt } =
    application
  const [editingNotes, setEditingNotes] = useState(false)
  const [draft, setDraft] = useState(notes ?? '')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [saved, setSaved] = useState(false)

  const startEditing = () => {
    setDraft(notes ?? '')
    setMessage('')
    setSaved(false)
    setEditingNotes(true)
  }

  const cancelEditing = () => {
    setEditingNotes(false)
    setMessage('')
  }

  const handleSaveNotes = async (event) => {
    event.preventDefault()
    if (saving || draft.trim() === (notes ?? '')) return
    setSaving(true)
    setMessage('')
    const result = await onSaveNotes(draft)
    setSaving(false)
    if (!result.success) {
      setSaved(false)
      setMessage(result.error)
      return
    }
    setEditingNotes(false)
    setSaved(true)
    setMessage('Notes saved.')
  }

  // Let the "Notes saved." confirmation fade away on its own.
  useEffect(() => {
    if (!saved) return undefined
    const timer = setTimeout(() => setMessage(''), 2500)
    return () => clearTimeout(timer)
  }, [saved, message])

  return (
    <section>
      <button type="button" className="details-back" onClick={onBack}>
        <span aria-hidden="true">←</span> All applications
      </button>

      <header className="details-header">
        <h1 className="details-title">{company}</h1>
        <p className="details-position">{position}</p>
      </header>

      <div className="details-track">
        <StepTrack status={status} size="large" />
      </div>

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

      <section className="notes-card" aria-labelledby="notes-title">
        <header className="notes-card-header">
          <h2 id="notes-title" className="notes-title">
            <NoteIcon />
            Notes
          </h2>
          {!editingNotes && notes && (
            <button type="button" className="notes-edit" onClick={startEditing}>
              <PencilIcon />
              Edit
            </button>
          )}
        </header>

        {editingNotes ? (
          <form className="notes-form" onSubmit={handleSaveNotes}>
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
                if (event.key === 'Escape') cancelEditing()
                if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) handleSaveNotes(event)
              }}
              autoFocus
            />
            <div className="notes-form-footer">
              <span className="notes-hint">
                {draft.length} of {MAX_NOTES_LENGTH} characters. <kbd>Ctrl</kbd>/<kbd>⌘</kbd>+<kbd>Enter</kbd> saves.
              </span>
              <button type="button" className="notes-cancel" onClick={cancelEditing} disabled={saving}>
                Cancel
              </button>
              <button
                type="submit"
                className="notes-save"
                disabled={saving || draft.trim() === (notes ?? '')}
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </form>
        ) : notes ? (
          <p className="notes-body">{notes}</p>
        ) : (
          <button type="button" className="notes-empty" onClick={startEditing}>
            <span className="notes-empty-plus" aria-hidden="true">+</span>
            <span>
              <span className="notes-empty-title">Add a note</span>
              <span className="notes-empty-sub">
                Keep track of interview dates, contacts, and next steps.
              </span>
            </span>
          </button>
        )}

        {message && (
          <p
            className={saved ? 'notes-message notes-message-success' : 'notes-message'}
            role={saved ? 'status' : 'alert'}
          >
            {message}
          </p>
        )}
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

export default ApplicationDetails
