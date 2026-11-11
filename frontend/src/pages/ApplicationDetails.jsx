import { formatDate } from '../lib/formatDate.js'
import './ApplicationDetails.css'

// UI layer, display only: the route passes in an Application model and what happens on back.
// Status pill styles (.status, .status-*) are shared with ApplicationsList.css.
function ApplicationDetails({ application, onBack }) {
  const { company, position, status, deadline, notes, jobLink, resumeVersion } = application

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
    </section>
  )
}

export default ApplicationDetails
