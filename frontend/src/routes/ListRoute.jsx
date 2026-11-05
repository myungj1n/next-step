import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ApplicationsList from '../pages/ApplicationsList.jsx'
import { getMyApplications } from '../services/applicationService.js'

// Loads the logged-in student's applications and handles list → details navigation.
function ListRoute() {
  const navigate = useNavigate()
  const [applications, setApplications] = useState(null) // null = still loading
  const [error, setError] = useState(null)

  useEffect(() => {
    let ignore = false
    getMyApplications().then(({ data, error }) => {
      if (ignore) return
      if (error) setError(error)
      else setApplications(data)
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
