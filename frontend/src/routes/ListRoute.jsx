import { useLocation, useNavigate } from 'react-router-dom'
import { useMyApplications } from '../hooks/useMyApplications.js'
import ApplicationsList from '../pages/ApplicationsList.jsx'

// Loads the logged-in student's applications and handles list → details navigation.
function ListRoute() {
  const navigate = useNavigate()
  const location = useLocation()
  const { applications, error } = useMyApplications()

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
      onSelect={(id) =>
        // Remember the current search/filter/sort so "Back" returns to the same view.
        navigate(`/applications/${id}`, { state: { listSearch: location.search } })
      }
    />
  )
}

export default ListRoute
