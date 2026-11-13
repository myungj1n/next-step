import { useNavigate } from 'react-router-dom'
import ApplicationsList from '../pages/ApplicationsList.jsx'

// List → details navigation.
function ListRoute({ applications, loadError }) {
  const navigate = useNavigate()

  return (
    <ApplicationsList
      applications={applications}
      loadError={loadError}
      onSelect={(id) => navigate(`/applications/${id}`)}
    />
  )
}

export default ListRoute
