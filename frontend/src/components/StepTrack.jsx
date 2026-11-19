import { STATUS_STAGES, statusSlug } from '../models/Application.js'
import './StepTrack.css'

// The step track: one stop per stage (Applied → Phone call → Interview → Final interview → Offer)
// that fills in as an application moves forward.
// Closed applications (Rejected, Withdrawn) keep the first stop and show the rest cut off;
// we don't store which stage they closed at.
// size="small" for list rows, size="large" (with stop names) for the details page.
function StepTrack({ status, size = 'small' }) {
  const stageIndex = STATUS_STAGES.indexOf(status)
  const closed = stageIndex < 0
  const reached = closed ? 0 : stageIndex

  const label = closed
    ? `${status}: this application is closed`
    : `${status}: step ${reached + 1} of ${STATUS_STAGES.length}`

  return (
    <div
      className={`step-track step-track-${size} tone-${statusSlug(status)}${closed ? ' is-closed' : ''}`}
      role="img"
      aria-label={label}
    >
      <ol className="step-track-stops">
        {STATUS_STAGES.map((stage, index) => {
          const classes = ['step-stop']
          if (index <= reached && !(closed && index > 0)) classes.push('is-done')
          if (!closed && index === reached) classes.push('is-current')
          if (closed && index > 0) classes.push('is-cut')
          // The line after this stop is filled when the next stop is reached.
          if (!closed && index < reached) classes.push('line-done')
          if (closed && index === 0) classes.push('line-cut')
          return (
            <li key={stage} className={classes.join(' ')}>
              <span className="step-dot" />
              {size === 'large' && <span className="step-name">{stage}</span>}
            </li>
          )
        })}
      </ol>
      {closed && size === 'large' && <p className="step-closed">{status}</p>}
      {/* Narrow screens hide the stop names and show this instead. */}
      {!closed && size === 'large' && (
        <p className="step-caption" aria-hidden="true">
          {status}, step {reached + 1} of {STATUS_STAGES.length}
        </p>
      )}
    </div>
  )
}

export default StepTrack
