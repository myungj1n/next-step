import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import ApplicationDetails from '../pages/ApplicationDetails.jsx'
import { getApplicationById } from '../services/applicationService.js'

// Postgres error for a malformed uuid, e.g. /applications/abc. Treated as "not found".
const INVALID_UUID = '22P02'

// Loads one application and handles details → back navigation.
// RLS returns nothing for another student's application, so it shows as not found.
function DetailsRoute() {
  const { id } = useParams()
  const navigate = useNavigate()
  // The result remembers its id, so a result for a previous id counts as still loading.
  const [result, setResult] = useState(null)
  const goBack = () => navigate('/applications')

  useEffect(() => {
    let ignore = false
    getApplicationById(id).then(({ data, error }) => {
      if (ignore) return
      if (error?.code === INVALID_UUID) setResult({ id, application: null })
      else setResult({ id, application: data, error })
    })
    return () => {
      ignore = true
    }
  }, [id])

  const backButton = (
    <button type="button" className="details-back" onClick={goBack}>
      <span aria-hidden="true">←</span> Back to Applications
    </button>
  )

  if (result?.id !== id) {
    return <p className="page-state">Loading application…</p>
  }

  if (result.error) {
    return (
      <section>
        {backButton}
        <p className="page-state page-state-error" role="alert">
          Couldn't load this application. {result.error.message}
        </p>
      </section>
    )
  }

  if (!result.application) {
    return (
      <section>
        {backButton}
        <h1 className="details-title">Application not found</h1>
      </section>
    )
  }

  return <ApplicationDetails application={result.application} onBack={goBack} />
}

export default DetailsRoute
