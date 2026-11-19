import { useNavigate } from 'react-router-dom'
import { useMyApplications } from '../hooks/useMyApplications.js'
import Overview from '../pages/Overview.jsx'

// Loads the logged-in student's applications for the Overview dashboard.
function OverviewRoute() {
  const navigate = useNavigate()
  const { applications, error } = useMyApplications()

  if (error) {
    return (
      <p className="page-state page-state-error" role="alert">
        Couldn't load your overview. {error.message}
      </p>
    )
  }

  if (!applications) {
    return <p className="page-state">Loading overview…</p>
  }

  return <Overview applications={applications} onOpen={(id) => navigate(`/applications/${id}`)} />
}

export default OverviewRoute
