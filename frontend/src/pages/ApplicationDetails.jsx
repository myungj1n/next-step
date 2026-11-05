import { formatDate } from '../lib/formatDate.js'
import './ApplicationDetails.css'

// Pasted links may lack a scheme ("linkedin.com/jobs/..."). Forcing http(s) also stops
// a pasted "javascript:" link from running code when clicked.
function toSafeUrl(link) {
  return /^https?:\/\//i.test(link) ? link : `https://${link}`
}

// Display only: the route component passes in the application and what happens on back.
// Status pill styles (.status, .status-*) are shared with ApplicationsList.css.
function ApplicationDetails({ application, onBack }) {
  const { company, position, status, deadline, notes, job_link, resume_version } = application

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
          <dd className={job_link ? 'details-link' : 'details-empty'}>
            {job_link ? (
              <a href={toSafeUrl(job_link)} target="_blank" rel="noopener noreferrer">
                {job_link}
              </a>
            ) : (
              'No link saved'
            )}
          </dd>
        </div>
        <div className="details-field">
          <dt>Resume Version</dt>
          <dd className={resume_version ? undefined : 'details-empty'}>
            {resume_version || 'Not recorded'}
          </dd>
        </div>
        <div className="details-field details-field-wide">
          <dt>Notes</dt>
          <dd className={notes ? 'details-notes' : 'details-empty'}>{notes || 'No notes yet.'}</dd>
        </div>
      </dl>
    </section>
  )
}

export default ApplicationDetails
