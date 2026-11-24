import { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useMyApplications } from '../hooks/useMyApplications.js'
import ApplicationsList from '../pages/ApplicationsList.jsx'
import { applicationService } from '../services/index.js'

// Loads the logged-in student's applications, handles list → details navigation, and
// saves status changes made from a row. After adding an application, the add page sends
// { added: { id, company } } in the location state so the list can confirm it.
function ListRoute() {
  const navigate = useNavigate()
  const location = useLocation()
  const { applications: loaded, error } = useMyApplications()
  // Applications updated from this page, by id, layered over what was loaded.
  const [updated, setUpdated] = useState({})
  const applications = useMemo(
    () => loaded?.map((application) => updated[application.id] ?? application) ?? null,
    [loaded, updated],
  )
  const justAdded = location.state?.added ?? null

  const updateStatus = async (id, status) => {
    const result = await applicationService.updateApplicationStatus(id, status)
    if (result.success) setUpdated((current) => ({ ...current, [id]: result.application }))
    return result
  }

  // Clears the "Added …" confirmation, keeping the current search/filter/sort.
  const dismissAdded = () => navigate(`${location.pathname}${location.search}`, { replace: true, state: null })

  if (error) {
    return (
      <p className="page-state page-state-error" role="alert">
        Couldn't load your applications. {error.message}
      </p>
    )
  }

  if (!applications) {
    return <p className="page-state">Loading applications…</p>
  }

  return (
    <ApplicationsList
      applications={applications}
      justAdded={justAdded}
      onDismissAdded={dismissAdded}
      onUpdateStatus={updateStatus}
      onSelect={(id) =>
        // Remember the current search/filter/sort so "Back" returns to the same view.
        navigate(`/applications/${id}`, { state: { listSearch: location.search } })
      }
    />
  )
}

export default ListRoute
