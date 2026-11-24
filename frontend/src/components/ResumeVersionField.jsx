import { useState } from 'react'
import { suggestNextResumeVersion } from '../services/applicationQuery.js'
import { MAX_RESUME_VERSION_LENGTH } from '../services/applicationService.js'
import './FormFields.css'

const NONE = ''
const NEW = '__new__'

// Resume version: pick one used before, or name a new one.
// versions: [{ name, count }], most recently used first. value/onChange hold the name ('' = none).
function ResumeVersionField({ id = 'resume', versions = [], loading = false, value, onChange }) {
  // null until the student picks from the dropdown. Until then a saved name that isn't in
  // the list counts as "new" (worked out each render, since the list can arrive after mount).
  const [picked, setPicked] = useState(null)
  const addingNew =
    picked ?? (!loading && Boolean(value) && !versions.some((version) => version.name === value))
  const setAddingNew = setPicked

  const choose = (choice) => {
    if (choice === NEW) {
      setAddingNew(true)
      onChange(suggestNextResumeVersion(versions))
    } else {
      setAddingNew(false)
      onChange(choice)
    }
  }

  return (
    <div className="field">
      <label htmlFor={id}>
        Resume version <span className="field-optional">Optional</span>
      </label>

      {loading ? (
        <select id={id} disabled value="">
          <option value="">Loading your versions…</option>
        </select>
      ) : (
        <select id={id} value={addingNew ? NEW : value} onChange={(event) => choose(event.target.value)}>
          <option value={NONE}>Don't record a version</option>
          {versions.length > 0 && (
            <optgroup label="Used before">
              {versions.map((version) => (
                <option key={version.name} value={version.name}>
                  {version.name} ({version.count} {version.count === 1 ? 'application' : 'applications'})
                </option>
              ))}
            </optgroup>
          )}
          <option value={NEW}>Add a new version…</option>
        </select>
      )}

      {addingNew && (
        <input
          id={`${id}-new`}
          className="field-reveal"
          type="text"
          value={value}
          maxLength={MAX_RESUME_VERSION_LENGTH}
          onChange={(event) => onChange(event.target.value)}
          aria-label="New resume version name"
          placeholder="Resume v1"
          autoFocus
        />
      )}

      <p className="field-hint">
        {addingNew
          ? 'Name it the way your file is named, so you can find it later.'
          : 'Know which resume got you the interview.'}
      </p>
    </div>
  )
}

export default ResumeVersionField
