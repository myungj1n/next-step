import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMyApplications } from '../hooks/useMyApplications.js'
import AddApplication from '../pages/AddApplication.jsx'
import { applicationService } from '../services/index.js'
import { resumeVersionsFrom } from '../services/applicationQuery.js'

// Loads the student's applications only to offer their earlier resume versions.
// The form works while they load (or if loading fails): the dropdown just starts empty.
function AddApplicationRoute() {
  const navigate = useNavigate()
  const { applications } = useMyApplications()
  const resumeVersions = useMemo(() => resumeVersionsFrom(applications), [applications])
  const goBack = () => navigate('/applications')

  const handleSubmit = async (details) => {
    const result = await applicationService.addApplication(details)
    // Back to the list, which confirms the new application and highlights its row.
    if (result.success) {
      navigate('/applications', {
        state: { added: { id: result.application.id, company: result.application.company } },
      })
    }
    return result
  }

  return (
    <AddApplication
      resumeVersions={resumeVersions}
      resumeVersionsLoading={applications === null}
      onSubmit={handleSubmit}
      onCancel={goBack}
    />
  )
}

export default AddApplicationRoute
