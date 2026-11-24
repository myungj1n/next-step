import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ApplicationStatus, statusSlug } from '../models/Application.js'
import { WAITING_DAYS } from '../services/applicationQuery.js'
import {
  MIN_SAMPLE,
  OutcomeGroup,
  ProgressRange,
  deadlineLead,
  firstAdded,
  inRange,
  openAgesByStage,
  outcomes,
  pace,
  rangeLabels,
  resumePerformance,
  stageFunnel,
  waitingAges,
} from '../services/progressStats.js'
import '../components/StepTrack.css'
import './Progress.css'

const plural = (count, word) => `${count} ${word}${count === 1 ? '' : 's'}`
const days = (count) => plural(count, 'day')
const shortDate = (date) => date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

// Outcome groups: color, and the list filter they open (only the ones that are one status).
const OUTCOME_STYLE = {
  [OutcomeGroup.OFFER]: { tone: 'offer', status: ApplicationStatus.OFFER },
  [OutcomeGroup.IN_PROGRESS]: { tone: 'interview' },
  [OutcomeGroup.APPLIED]: { tone: 'applied' },
  [OutcomeGroup.NO_REPLY]: { tone: 'no-reply', label: `No reply after ${WAITING_DAYS / 7} weeks` },
  [OutcomeGroup.REJECTED]: { tone: 'rejected', status: ApplicationStatus.REJECTED },
  [OutcomeGroup.WITHDRAWN]: { tone: 'withdrawn', status: ApplicationStatus.WITHDRAWN },
}

// The page's headline and the sentence under it, built from the biggest drop-off.
function takeaway(funnel, total, since) {
  const sinceText = since ? ` since ${shortDate(since)}` : ''
  const { stages, biggestDrop } = funnel
  if (!biggestDrop) {
    return {
      headline: `${plural(total, 'application')} so far.`,
      detail: `Track a few more and this page shows where they stall.`,
    }
  }
  if (biggestDrop.from === ApplicationStatus.APPLIED) {
    return {
      headline: `${stages[1].pctOfApplied}% of your applications reach a phone call.`,
      detail: `${plural(total, 'application')}${sinceText}. Most stop right after applying, so the resume and the first message matter most right now.`,
    }
  }
  return {
    headline: `Your biggest drop is from ${biggestDrop.from.toLowerCase()} to ${biggestDrop.to.toLowerCase()}.`,
    detail: `${plural(total, 'application')}${sinceText}. ${biggestDrop.pct}% move on at that step, so that's the one to practice for.`,
  }
}

// UI layer: every number comes from services/progressStats.js; this file lays them out.
// The range (?range=all|90d|30d) lives in the URL like the list's filters.
function Progress({ applications, onOpen }) {
  const [params, setParams] = useSearchParams()
  const range = Object.values(ProgressRange).includes(params.get('range')) ? params.get('range') : ProgressRange.ALL
  // Captured once per visit so every section agrees on what "today" is.
  const [now] = useState(() => new Date())

  const scoped = useMemo(() => inRange(applications, range, now), [applications, range, now])
  const funnel = useMemo(() => stageFunnel(scoped), [scoped])

  const setRange = (next) =>
    setParams(
      (current) => {
        const updated = new URLSearchParams(current)
        if (next === ProgressRange.ALL) updated.delete('range')
        else updated.set('range', next)
        return updated
      },
      { replace: true },
    )

  if (applications.length === 0) {
    return (
      <section className="pg">
        <h1 className="pg-title">Progress</h1>
        <div className="pg-card pg-empty">
          <p className="pg-empty-title">Nothing to measure yet</p>
          <p className="pg-empty-text">
            Add a few applications and this page shows where they move forward, which resume works best, and
            how long you're waiting.
          </p>
          <Link to="/applications/add" className="pg-button">
            Add an application
          </Link>
        </div>
      </section>
    )
  }

  const summary = takeaway(funnel, scoped.length, firstAdded(scoped))

  return (
    <section className="pg">
      <header className="pg-header">
        <div className="pg-header-text">
          <p className="pg-kicker">Progress, {rangeLabels[range].toLowerCase()}</p>
          {scoped.length > 0 ? (
            <>
              <h1 className="pg-headline">{summary.headline}</h1>
              <p className="pg-detail">{summary.detail}</p>
            </>
          ) : (
            <h1 className="pg-headline">No applications in the last {rangeLabels[range].toLowerCase()}.</h1>
          )}
        </div>
        <div className="pg-range" role="group" aria-label="Time range">
          {[ProgressRange.ALL, ProgressRange.DAYS_90, ProgressRange.DAYS_30].map((option) => (
            <button
              key={option}
              type="button"
              className={option === range ? 'is-active' : undefined}
              aria-pressed={option === range}
              onClick={() => setRange(option)}
            >
              {rangeLabels[option]}
            </button>
          ))}
        </div>
      </header>

      {scoped.length === 0 ? (
        <div className="pg-card pg-empty">
          <p className="pg-empty-text">Pick a longer range to see your progress.</p>
          <button type="button" className="pg-button" onClick={() => setRange(ProgressRange.ALL)}>
            Show all time
          </button>
        </div>
      ) : (
        <div className="pg-stack">
          <FlowCard funnel={funnel} />
          <div className="pg-pair">
            <ResumeCard applications={scoped} />
            <OutcomesCard applications={scoped} now={now} />
          </div>
          <RhythmCard applications={scoped} now={now} onOpen={onOpen} />
        </div>
      )}
    </section>
  )
}

function FlowCard({ funnel }) {
  const applied = funnel.stages[0].reached
  const dropStage = funnel.biggestDrop?.to
  return (
    <section className="pg-card pg-flow" aria-labelledby="flow-title">
      <h2 id="flow-title" className="pg-card-title">
        How far applications get
      </h2>
      <p className="pg-card-sub">
        Each column is how many reached that stage. The badge under it is how many moved on from the stage before.
      </p>

      <ol className="pg-flow-columns">
        {funnel.stages.map((row, index) => (
          <li key={row.stage} className={`pg-flow-column tone-${statusSlug(row.stage)}`}>
            <span className="pg-flow-bar-area">
              <span className="pg-flow-count num">{row.reached}</span>
              <span
                className="pg-flow-bar"
                // Sized against the space under the count, so every bar keeps its true proportion.
                style={{
                  height: `calc((100% - 2.6rem) * ${applied ? Math.max(row.reached / applied, row.reached ? 0.04 : 0) : 0})`,
                }}
              />
            </span>
            <span className="pg-flow-name">{row.stage}</span>
            {index === 0 ? (
              <span className="pg-flow-caption">Everything you sent</span>
            ) : (
              <span className={`pg-flow-badge num${row.stage === dropStage ? ' is-drop' : ''}`}>
                {row.pctFromPrevious}%<span className="pg-flow-badge-word"> moved on</span>
              </span>
            )}
          </li>
        ))}
      </ol>

      <p className="pg-note">
        {dropStage ? 'The red badge marks your biggest drop. ' : ''}
        Rejected and withdrawn applications count at Applied, since the stage they closed at isn't saved.
      </p>
    </section>
  )
}

function ResumeCard({ applications }) {
  const { rows, best, recordedCount } = useMemo(() => resumePerformance(applications), [applications])
  const recorded = rows.filter((row) => row.recorded)
  const unrecorded = rows.find((row) => !row.recorded)

  return (
    <section className="pg-card" aria-labelledby="resume-title">
      <h2 id="resume-title" className="pg-card-title">
        Which resume works
      </h2>
      <p className="pg-card-sub">Replies and interviews for each version you've used.</p>

      {recordedCount === 0 ? (
        <p className="pg-empty-line">
          No resume versions recorded yet. Pick one when you add or edit an application to compare them here.
        </p>
      ) : (
        <ul className="pg-resumes">
          {recorded.map((row) => (
            <li key={row.name} className={row.name === best ? 'is-best' : undefined}>
              <div className="pg-resume-head">
                <span className="pg-resume-name">{row.name}</span>
                {row.name === best && <span className="pg-best">Best</span>}
                <span className="pg-resume-count">{plural(row.total, 'application')}</span>
              </div>
              <div className="pg-meters">
                <span className="pg-meter-label">Replied</span>
                <span className="pg-meter">
                  <span className="pg-meter-fill is-light" style={{ width: `${row.replyRate}%` }} />
                </span>
                <span className="pg-meter-value num">{row.replyRate}%</span>
                <span className="pg-meter-label">Interviews</span>
                <span className="pg-meter">
                  <span className="pg-meter-fill" style={{ width: `${row.interviewRate}%` }} />
                </span>
                <span className="pg-meter-value num">{row.interviewRate}%</span>
              </div>
            </li>
          ))}
        </ul>
      )}

      {recordedCount > 0 && (
        <p className="pg-note">
          {unrecorded ? `${plural(unrecorded.total, 'application')} without a resume version. ` : ''}
          Best needs at least {MIN_SAMPLE} applications.
        </p>
      )}
    </section>
  )
}

function OutcomesCard({ applications, now }) {
  const groups = useMemo(() => outcomes(applications, now), [applications, now])
  const shown = groups.filter((group) => group.count > 0)
  return (
    <section className="pg-card" aria-labelledby="outcomes-title">
      <h2 id="outcomes-title" className="pg-card-title">
        Where they stand
      </h2>
      <p className="pg-card-sub">Every application, counted once.</p>
      <div className="pg-split" aria-hidden="true">
        {shown.map((group) => (
          <span
            key={group.group}
            className={`pg-split-part pg-tone-${OUTCOME_STYLE[group.group].tone}`}
            style={{ flexGrow: group.count }}
          />
        ))}
      </div>
      <ul className="pg-legend">
        {groups.map((group) => {
          const style = OUTCOME_STYLE[group.group]
          const content = (
            <>
              <span className={`pg-swatch pg-tone-${style.tone}`} aria-hidden="true" />
              <span className="pg-legend-name">{style.label ?? group.group}</span>
              <span className="pg-legend-count num">{group.count}</span>
              <span className="pg-legend-pct num">{group.pct}%</span>
            </>
          )
          return (
            <li key={group.group} className={group.count === 0 ? 'is-zero' : undefined}>
              {style.status && group.count > 0 ? (
                <Link className="pg-legend-row" to={`/applications?status=${encodeURIComponent(style.status)}`}>
                  {content}
                </Link>
              ) : (
                <span className="pg-legend-row">{content}</span>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}

// Waiting, pace, and timing: three short columns in one panel.
function RhythmCard({ applications, now, onOpen }) {
  const waiting = useMemo(() => waitingAges(applications, now), [applications, now])
  const weekly = useMemo(() => pace(applications, now), [applications, now])
  const ages = useMemo(() => openAgesByStage(applications, now), [applications, now])
  const lead = useMemo(() => deadlineLead(applications), [applications])
  const maxBucket = Math.max(1, ...waiting.buckets.map((bucket) => bucket.count))
  const maxWeek = Math.max(1, ...weekly.weeks.map((week) => week.count))

  return (
    <section className="pg-card pg-rhythm" aria-label="Waiting, pace, and timing">
      <div className="pg-rhythm-part">
        <h2 className="pg-part-title">Waiting on a reply</h2>
        {waiting.total === 0 ? (
          <p className="pg-empty-line">Nothing is waiting at Applied.</p>
        ) : (
          <>
            <p className="pg-figure num">{days(waiting.medianDays)}</p>
            <p className="pg-figure-label">median wait across {plural(waiting.total, 'application')}</p>
            <ul className="pg-bars">
              {waiting.buckets.map((bucket, index) => (
                <li key={bucket.label} className={index === waiting.buckets.length - 1 ? 'is-late' : undefined}>
                  <span>{bucket.label}</span>
                  <span className="pg-meter">
                    <span className="pg-meter-fill" style={{ width: `${(bucket.count / maxBucket) * 100}%` }} />
                  </span>
                  <span className="pg-meter-value num">{bucket.count}</span>
                </li>
              ))}
            </ul>
            {waiting.oldest && waiting.oldest.days > WAITING_DAYS && (
              <p className="pg-callout">
                Longest: <strong>{waiting.oldest.company}</strong>, {days(waiting.oldest.days)}.{' '}
                <button type="button" className="pg-link" onClick={() => onOpen(waiting.oldest.id)}>
                  Follow up
                </button>
              </p>
            )}
          </>
        )}
      </div>

      <div className="pg-rhythm-part">
        <h2 className="pg-part-title">Pace</h2>
        <p className="pg-figure num">{weekly.averagePerWeek} a week</p>
        <p className="pg-figure-label">
          {weekly.streak > 1 ? `${plural(weekly.streak, 'week')} in a row` : 'Applications added each week'}
          {weekly.bestWeek ? `, best week ${weekly.bestWeek.count}` : ''}
        </p>
        <div className="pg-columns" role="img" aria-label={`Applications per week over ${plural(weekly.weeks.length, 'week')}`}>
          {weekly.weeks.map((week, index) => (
            <span
              key={week.start.getTime()}
              className={`pg-column${index === weekly.weeks.length - 1 ? ' is-current' : ''}`}
              title={`Week of ${shortDate(week.start)}: ${plural(week.count, 'application')}`}
            >
              <span className="pg-column-fill" style={{ height: `${(week.count / maxWeek) * 100}%` }} />
            </span>
          ))}
        </div>
        {weekly.weeks.length > 0 && (
          <p className="pg-axis">
            <span>{shortDate(weekly.weeks[0].start)}</span>
            <span>This week</span>
          </p>
        )}
      </div>

      <div className="pg-rhythm-part">
        <h2 className="pg-part-title">Timing</h2>
        {lead.count > 0 ? (
          <>
            <p className="pg-figure num">{days(Math.max(0, lead.medianDays))} early</p>
            <p className="pg-figure-label">median head start before deadlines</p>
          </>
        ) : (
          <p className="pg-figure-label">Add deadlines to see how early you apply.</p>
        )}
        <ul className="pg-ages">
          {ages.map((row) => (
            <li key={row.stage} className={`tone-${statusSlug(row.stage)}`}>
              <span className="pg-ages-dot" aria-hidden="true" />
              <span>{row.stage}</span>
              <span className="pg-ages-value num">{row.count === 0 ? 'None' : days(row.medianDays)}</span>
            </li>
          ))}
        </ul>
        <p className="pg-note">Median days since added, by current stage.</p>
      </div>
    </section>
  )
}

export default Progress
