import { Link, Outlet, useLocation, useOutletContext } from 'react-router-dom'
import { signOut } from '../services/authService.js'

// Sidebar items. Overview and Applications are built; the rest are mock
// placeholders for upcoming features (set `to` once their route exists).
// Adding an application lives on the Applications page, not in the sidebar.
const navItems = [
  { label: 'Overview', to: '/overview', icon: 'grid' },
  { label: 'Applications', to: '/applications', icon: 'list' },
  { label: 'Progress summary', icon: 'chart' },
  { label: 'Reminders', icon: 'bell' },
  { label: 'AI Advisor', icon: 'sparkle' },
]

const iconPaths = {
  grid: 'M4 4h7v7H4zM13 4h7v4h-7zM13 10h7v10h-7zM4 13h7v7H4z',
  list: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
  chart: 'M4 20V10M10 20V4M16 20v-7M22 20H2',
  bell: 'M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0',
  sparkle: 'M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9zM19 17l.8 2.2L22 20l-2.2.8L19 23l-.8-2.2L16 20l2.2-.8z',
}

function NavIcon({ name }) {
  return (
    <svg className="nav-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d={iconPaths[name]} />
    </svg>
  )
}

// Same logo mark as the landing page header.
function BrandMark() {
  return (
    <span className="brand-mark" aria-hidden="true">
      N
    </span>
  )
}

// Shared sidebar navigation and page container for every screen.
// Logging out needs no redirect here: RequireAuth sees the session end and sends the user to /login.
function Layout() {
  const { pathname } = useLocation()
  const { user } = useOutletContext()

  // Applications stays active on its details and add pages.
  const isActive = (item) => pathname === item.to || pathname.startsWith(`${item.to}/`)

  return (
    <div className="layout">
      <aside className="sidebar">
        <Link to="/overview" className="brand">
          <BrandMark />
          Next Step
        </Link>
        <nav aria-label="Main">
          <ul className="nav-list">
            {navItems.map((item) => (
              <li key={item.label}>
                {item.to ? (
                  <Link
                    to={item.to}
                    className={`nav-item${isActive(item) ? ' nav-item-active' : ''}`}
                    aria-current={isActive(item) ? 'page' : undefined}
                  >
                    <NavIcon name={item.icon} />
                    {item.label}
                  </Link>
                ) : (
                  <span className="nav-item nav-item-disabled" aria-disabled="true">
                    <NavIcon name={item.icon} />
                    {item.label}
                    <span className="nav-soon">Soon</span>
                  </span>
                )}
              </li>
            ))}
          </ul>
        </nav>
        <div className="sidebar-footer">
          <p className="sidebar-user" title={user.email}>
            {user.email}
          </p>
          <button type="button" className="sidebar-logout" onClick={signOut}>
            Log out
          </button>
        </div>
      </aside>
      <main className="page">
        <Outlet context={{ user }} />
      </main>
    </div>
  )
}

export default Layout
