import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ApplicationsList from '../pages/ApplicationsList.jsx'
import { applicationService } from '../services/index.js'

// Loads the logged-in student's applications and handles list → details navigation.
function ListRoute() {
  const navigate = useNavigate()
  const [applications, setApplications] = useState(null) // null = still loading
  const [error, setError] = useState(null)

  useEffect(() => {
    let ignore = false
    applicationService
      .getMyApplications()
      .then((data) => {
        if (!ignore) setApplications(data)
      })
      .catch((err) => {
        if (!ignore) setError(err)
      })
    return () => {
      ignore = true
    }
  }, [])

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
      onSelect={(id) => navigate(`/applications/${id}`)}
    />
  )
}

export default ListRoute
