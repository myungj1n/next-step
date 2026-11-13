import { useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import ListRoute from './routes/ListRoute.jsx'
import DetailsRoute from './routes/DetailsRoute.jsx'
import { applicationStatuses, applications as sampleApplications } from './data/applications.js'

const STORAGE_KEY = 'next-step-application-statuses'

function loadApplications() {
  try {
    const savedStatuses = window.localStorage.getItem(STORAGE_KEY)
    if (!savedStatuses) return { applications: sampleApplications, error: '' }

    const parsedStatuses = JSON.parse(savedStatuses)
    if (!parsedStatuses || typeof parsedStatuses !== 'object' || Array.isArray(parsedStatuses)) {
      throw new Error('Invalid saved status data')
    }

    const updatedApplications = sampleApplications.map((application) => {
      const status = parsedStatuses[application.id]
      if (status === undefined) return application
      if (!applicationStatuses.includes(status)) throw new Error('Invalid saved status')
      return { ...application, status }
    })

    return { applications: updatedApplications, error: '' }
  } catch {
    return {
      applications: sampleApplications,
      error: 'Saved statuses could not be loaded. You can choose a status and save to replace them.',
    }
  }
}

function App() {
  const [loadedState] = useState(loadApplications)
  const [applications, setApplications] = useState(loadedState.applications)
  const [loadError, setLoadError] = useState(loadedState.error)

  const updateApplicationStatus = (id, status) => {
    if (!applicationStatuses.includes(status)) {
      return { success: false, error: 'Choose a valid application status.' }
    }

    const updatedApplications = applications.map((application) =>
      application.id === id ? { ...application, status } : application,
    )
    const savedStatuses = Object.fromEntries(
      updatedApplications.map((application) => [application.id, application.status]),
    )

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(savedStatuses))
    } catch {
      return {
        success: false,
        error: 'Your status could not be saved. Check your browser storage and try again.',
      }
    }

    setApplications(updatedApplications)
    setLoadError('')
    return { success: true }
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route
            path="/"
            element={<ListRoute applications={applications} loadError={loadError} />}
          />
          <Route
            path="/applications/:id"
            element={
              <DetailsRoute
                applications={applications}
                loadError={loadError}
                onUpdateStatus={updateApplicationStatus}
              />
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
