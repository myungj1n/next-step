import { STATUS_STAGES, statusSlug } from '../models/Application.js'
import './FormFields.css'

// The step track as a set of radio buttons: click a stop to choose that stage.
// A closed status (Rejected, Withdrawn) shows no stop chosen; picking one reopens it.
// The caller wraps it in a <fieldset> with a <legend> that names the group.
function StagePicker({ name = 'status', value, onChange, disabled = false }) {
  const index = STATUS_STAGES.indexOf(value)
  const progress = index > 0 ? index / (STATUS_STAGES.length - 1) : 0

  return (
    <div
      className={`stage-picker tone-${statusSlug(value)}${disabled ? ' is-busy' : ''}`}
      style={{ '--progress': progress }}
    >
      {STATUS_STAGES.map((stage, stageIndex) => {
        const reached = index >= 0 && stageIndex <= index
        return (
          <label
            key={stage}
            className={`stage-option${reached ? ' is-reached' : ''}${stage === value ? ' is-selected' : ''}`}
          >
            <input
              type="radio"
              name={name}
              value={stage}
              checked={stage === value}
              disabled={disabled}
              onChange={() => onChange(stage)}
            />
            <span className="stage-dot" aria-hidden="true" />
            <span className="stage-name">{stage}</span>
          </label>
        )
      })}
    </div>
  )
}

export default StagePicker
