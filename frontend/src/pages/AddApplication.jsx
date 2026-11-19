import { useState } from 'react'
import './AddApplication.css'

function AddApplication({ onSubmit, onCancel }) {
  const [company, setCompany] = useState('')
  const [position, setPosition] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setSaving(true)

    const result = await onSubmit({ company, position })
    setSaving(false)
    if (!result.success) setError(result.error)
  }

  return (
    <section>
      <button type="button" className="add-back" onClick={onCancel}>
        <span aria-hidden="true">←</span> Back to Applications
      </button>

      <h1 className="add-title">Add Application</h1>
      <p className="add-subtitle">Add the company and position you applied for.</p>

      <form className="add-form" onSubmit={handleSubmit}>
        <div className="add-field">
          <label htmlFor="company">Company</label>
          <input
            id="company"
            name="company"
            type="text"
            value={company}
            onChange={(event) => setCompany(event.target.value)}
            placeholder="Example: Google"
            autoComplete="organization"
            required
          />
        </div>

        <div className="add-field">
          <label htmlFor="position">Position</label>
          <input
            id="position"
            name="position"
            type="text"
            value={position}
            onChange={(event) => setPosition(event.target.value)}
            placeholder="Example: Software Engineer Intern"
            required
          />
        </div>

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
            {saving ? 'Saving…' : 'Add Application'}
          </button>
        </div>
      </form>
    </section>
  )
}

export default AddApplication
