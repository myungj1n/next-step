import { useNavigate } from 'react-router-dom'
import ApplicationsList from '../pages/ApplicationsList.jsx'
import { applications } from '../data/applications.js'

// List → details navigation.
function ListRoute() {
  const navigate = useNavigate()

  return (
    <ApplicationsList
      applications={applications}
      onSelect={(id) => navigate(`/applications/${id}`)}
    />
  )
}

export default ListRoute
