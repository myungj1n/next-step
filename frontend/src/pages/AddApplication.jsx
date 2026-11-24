import { useState } from 'react'
import ResumeVersionField from '../components/ResumeVersionField.jsx'
import StagePicker from '../components/StagePicker.jsx'
import StepTrack from '../components/StepTrack.jsx'
import { formatDate } from '../lib/formatDate.js'
import { ApplicationStatus, statusSlug } from '../models/Application.js'
import { MAX_NOTES_LENGTH } from '../services/applicationService.js'
import '../components/FormFields.css'
import './AddApplication.css'

// "https://careers.google.com/jobs/123" -> "careers.google.com"
function linkHost(link) {
  const trimmed = link.trim()
  if (!trimmed) return ''
  try {
    return new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`).host.replace(/^www\./, '')
  } catch {
    return trimmed
  }
}

// UI layer: collects the details and hands them to the route. Validation and saving
// happen in ApplicationService; its error comes back as result.error.
// resumeVersions: [{ name, count }] from earlier applications, most recent first.
function AddApplication({ resumeVersions = [], resumeVersionsLoading = false, onSubmit, onCancel }) {
  const [company, setCompany] = useState('')
  const [position, setPosition] = useState('')
  const [status, setStatus] = useState(ApplicationStatus.APPLIED)
  const [deadline, setDeadline] = useState('')
  const [jobLink, setJobLink] = useState('')
  // null until the student picks: until then the most recent version is the default.
  const [pickedResume, setPickedResume] = useState(null)
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const resumeVersion = pickedResume ?? resumeVersions[0]?.name ?? ''

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setSaving(true)

    const result = await onSubmit({ company, position, status, deadline, jobLink, resumeVersion, notes })
    setSaving(false)
    if (!result.success) setError(result.error)
  }

  const host = linkHost(jobLink)

  return (
    <section className="add">
      <button type="button" className="add-back" onClick={onCancel}>
        <span aria-hidden="true">←</span> All applications
      </button>

      <header className="add-header">
        <h1 className="add-title">Add an application</h1>
        <p className="add-subtitle">Only the company and position are required. Fill in the rest now or later.</p>
      </header>

      <div className="add-layout">
        <form className="add-form" onSubmit={handleSubmit}>
          <fieldset className="add-section">
            <legend className="add-section-title">The role</legend>
            <div className="field-grid">
              <div className="field">
                <label htmlFor="company">Company</label>
                <input
                  id="company"
                  type="text"
                  value={company}
                  onChange={(event) => setCompany(event.target.value)}
                  placeholder="Google"
                  autoComplete="organization"
                  autoFocus
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="position">Position</label>
                <input
                  id="position"
                  type="text"
                  value={position}
                  onChange={(event) => setPosition(event.target.value)}
                  placeholder="Software Engineer Intern"
                  required
                />
              </div>
            </div>
          </fieldset>

          <fieldset className="add-section">
            <legend className="add-section-title">Where it stands</legend>
            <p className="add-section-hint">Already past applying? Pick the stage you're at.</p>
            <StagePicker value={status} onChange={setStatus} />
          </fieldset>

          <fieldset className="add-section">
            <legend className="add-section-title">Details</legend>
            <div className="field-grid">
              <div className="field">
                <label htmlFor="deadline">
                  Deadline <span className="field-optional">Optional</span>
                </label>
                <input
                  id="deadline"
                  type="date"
                  value={deadline}
                  className={deadline ? undefined : 'is-empty'}
                  onChange={(event) => setDeadline(event.target.value)}
                  aria-describedby="deadline-hint"
                />
                <p id="deadline-hint" className="field-hint">
                  Shows up on your Overview calendar.
                </p>
              </div>

              <ResumeVersionField
                versions={resumeVersions}
                loading={resumeVersionsLoading}
                value={resumeVersion}
                onChange={setPickedResume}
              />

              <div className="field field-wide">
                <label htmlFor="job-link">
                  Job posting link <span className="field-optional">Optional</span>
                </label>
                <div className="input-icon">
                  <LinkIcon />
                  <input
                    id="job-link"
                    type="text"
                    inputMode="url"
                    autoComplete="url"
                    spellCheck={false}
                    value={jobLink}
                    onChange={(event) => setJobLink(event.target.value)}
                    placeholder="careers.google.com/jobs/123"
                  />
                </div>
                <p className="field-hint">Postings often come down after they close. Save it to reread before interviews.</p>
              </div>
            </div>
          </fieldset>

          <fieldset className="add-section">
            <legend className="add-section-title">Notes</legend>
            <div className="field">
              <label htmlFor="notes" className="visually-hidden">
                Notes
              </label>
              <textarea
                id="notes"
                rows={4}
                value={notes}
                maxLength={MAX_NOTES_LENGTH}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Who referred you, recruiter's name, what to prep…"
              />
            </div>
          </fieldset>

          {error && (
            <p className="add-error" role="alert">
              {error}
            </p>
          )}

          <div className="add-actions">
            <button type="button" className="add-cancel" onClick={onCancel} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="add-submit" disabled={saving}>
              {saving ? 'Adding…' : 'Add application'}
            </button>
          </div>
        </form>

        {/* The application as it will be saved, built as you type. */}
        <aside className="add-preview" aria-label="Preview">
          <div className="add-card">
            <p className={company.trim() ? 'add-card-company' : 'add-card-company is-empty'}>
              {company.trim() || 'Company'}
            </p>
            <p className="add-card-position">{position.trim() || 'Position'}</p>

            <div className="add-card-track">
              <StepTrack status={status} />
              <span className={`add-card-status tone-${statusSlug(status)}`}>{status}</span>
            </div>

            <dl className="add-card-facts">
              <div>
                <dt>Deadline</dt>
                <dd className={deadline ? undefined : 'is-empty'}>{deadline ? formatDate(deadline, { month: 'short' }) : 'None'}</dd>
              </div>
              <div>
                <dt>Resume</dt>
                <dd className={resumeVersion.trim() ? undefined : 'is-empty'}>
                  {resumeVersion.trim() || 'Not recorded'}
                </dd>
              </div>
              <div className="add-card-wide">
                <dt>Job link</dt>
                <dd className={host ? 'add-card-link' : 'is-empty'}>{host || 'Not saved'}</dd>
              </div>
              {notes.trim() && (
                <div className="add-card-wide">
                  <dt>Notes</dt>
                  <dd className="add-card-notes">{notes.trim()}</dd>
                </div>
              )}
            </dl>
          </div>
        </aside>
      </div>
    </section>
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

export default AddApplication
