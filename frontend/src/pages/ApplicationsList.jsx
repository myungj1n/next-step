import './ApplicationsList.css'

// Display only: the route component passes in the data and what happens on select.
function ApplicationsList({ applications, loadError, onSelect }) {
  const handleKeyDown = (event, id) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onSelect(id)
    }
  }

  if (applications.length === 0) {
    return (
      <section>
        <h1 className="list-title">My Applications</h1>
        <div className="list-card list-empty">
          <p className="list-empty-title">No applications yet</p>
          <p className="list-empty-text">Applications you add will show up here.</p>
        </div>
      </section>
    )
  }

  return (
    <section>
      <h1 className="list-title">My Applications</h1>
      <p className="list-subtitle">Select an application to view its details.</p>
      {loadError && (
        <p className="list-error" role="alert">
          {loadError}
        </p>
      )}

      <div className="list-card">
        <table className="list-table">
          <thead>
            <tr>
              <th>Company</th>
              <th>Position</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {applications.map((app) => (
              <tr
                key={app.id}
                className="list-row"
                tabIndex={0}
                onClick={() => onSelect(app.id)}
                onKeyDown={(event) => handleKeyDown(event, app.id)}
              >
                <td className="list-company">{app.company}</td>
                <td>{app.position}</td>
                <td>
                  <span className={`status status-${app.status.toLowerCase()}`}>
                    {app.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

export default ApplicationsList
