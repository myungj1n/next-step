import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useMyApplications } from '../hooks/useMyApplications.js'
import ApplicationDetails from '../pages/ApplicationDetails.jsx'
import { applicationService } from '../services/index.js'
import { DetailsOutcome } from '../services/applicationService.js'
import { resumeVersionsFrom } from '../services/applicationQuery.js'

// UI layer: asks ApplicationService for one application, picks the screen for the
// outcome, and handles details → back navigation. No business or database logic here.
function DetailsRoute() {
  const { id } = useParams()
  const navigate = useNavigate()
  // The result remembers its id, so a result for a previous id counts as still loading.
  const [result, setResult] = useState(null)
  const location = useLocation()
  // Only for the editor's resume dropdown; the page doesn't wait on it.
  const { applications } = useMyApplications()
  const resumeVersions = useMemo(() => resumeVersionsFrom(applications), [applications])
  const goBack = () => navigate(`/applications${location.state?.listSearch ?? ''}`)

  useEffect(() => {
    let ignore = false
    applicationService.getApplicationDetails(id).then((details) => {
      if (!ignore) setResult({ id, ...details })
    })
    return () => {
      ignore = true
    }
  }, [id])

  const backButton = (
    <button type="button" className="details-back" onClick={goBack}>
      <span aria-hidden="true">←</span> All applications
    </button>
  )

  if (result?.id !== id) {
    return <p className="page-state">Loading application…</p>
  }

  if (result.outcome === DetailsOutcome.ERROR) {
    return (
      <section>
        {backButton}
        <p className="page-state page-state-error" role="alert">
          Couldn't load this application. {result.message}
        </p>
      </section>
    )
  }

  if (result.outcome === DetailsOutcome.NOT_FOUND) {
    return (
      <section>
        {backButton}
        <h1 className="details-title">Application not found</h1>
      </section>
    )
  }

  // Swaps in the saved application, unless the user has already moved to another one.
  const applyUpdate = (update) => {
    if (update.success) {
      setResult((current) => (current?.id === id ? { ...current, application: update.application } : current))
    }
    return update
  }

  const saveNotes = async (notes) => applyUpdate(await applicationService.updateApplicationNotes(id, notes))

  const updateStatus = async (status) => applyUpdate(await applicationService.updateApplicationStatus(id, status))

  const updateDetails = async (details) =>
    applyUpdate(await applicationService.updateApplicationDetails(id, details))

  return (
    <ApplicationDetails
      key={result.application.id}
      application={result.application}
      resumeVersions={resumeVersions}
      resumeVersionsLoading={applications === null}
      onBack={goBack}
      onSaveNotes={saveNotes}
      onUpdateStatus={updateStatus}
      onUpdateDetails={updateDetails}
    />
  )
}

export default DetailsRoute
