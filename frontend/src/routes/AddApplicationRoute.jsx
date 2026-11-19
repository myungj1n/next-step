import { useNavigate } from 'react-router-dom'
import AddApplication from '../pages/AddApplication.jsx'
import { applicationService } from '../services/index.js'

function AddApplicationRoute() {
  const navigate = useNavigate()
  const goBack = () => navigate('/applications')

  const handleSubmit = async ({ company, position }) => {
    const result = await applicationService.addApplication({ company, position })
    if (result.success) navigate('/applications')
    return result
  }

  return <AddApplication onSubmit={handleSubmit} onCancel={goBack} />
}

export default AddApplicationRoute
