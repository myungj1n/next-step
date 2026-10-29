import { Link, Outlet } from 'react-router-dom'

// Shared header and page container for every screen.
function Layout() {
  return (
    <div className="layout">
      <header className="header">
        <div className="header-inner">
          <Link to="/" className="header-title">
            Next Step
          </Link>
        </div>
      </header>
      <main className="page">
        <Outlet />
      </main>
    </div>
  )
}

export default Layout
