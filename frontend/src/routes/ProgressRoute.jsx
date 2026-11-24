import { useNavigate } from 'react-router-dom'
import { useMyApplications } from '../hooks/useMyApplications.js'
import Progress from '../pages/Progress.jsx'

// Loads the logged-in student's applications for the Progress page.
function ProgressRoute() {
  const navigate = useNavigate()
  const { applications, error } = useMyApplications()

  if (error) {
    return (
      <p className="page-state page-state-error" role="alert">
        Couldn't load your progress. {error.message}
      </p>
    )
  }

  if (!applications) {
    return <p className="page-state">Loading progress…</p>
  }

  return <Progress applications={applications} onOpen={(id) => navigate(`/applications/${id}`)} />
}

export default ProgressRoute
