import { useEffect, useState } from 'react'
import { applicationService } from '../services/index.js'

// Loads the logged-in student's applications once.
// applications is null while loading; error is set if the load fails.
export function useMyApplications() {
  const [applications, setApplications] = useState(null)
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

  return { applications, error }
}
