import { useNavigate, useParams } from 'react-router-dom'
import ApplicationDetails from '../pages/ApplicationDetails.jsx'
import { applications } from '../data/applications.js'

// Details → back navigation. Unknown ids show a not-found message.
function DetailsRoute() {
  const { id } = useParams()
  const navigate = useNavigate()
  const application = applications.find((app) => String(app.id) === id)
  const goBack = () => navigate('/')

  if (!application) {
    return (
      <section>
        <button type="button" className="details-back" onClick={goBack}>
          <span aria-hidden="true">←</span> Back to Applications
        </button>
        <h1 className="details-title">Application not found</h1>
      </section>
    )
  }

  return <ApplicationDetails application={application} onBack={goBack} />
}

export default DetailsRoute
