import { Link, Outlet, useLocation, useOutletContext } from 'react-router-dom'
import { signOut } from '../services/authService.js'

// Sidebar items. Only Applications is built this sprint; the rest are mock
// placeholders for upcoming features (set `to` once their route exists).
const navItems = [
  { label: 'Applications', to: '/', matches: ['/', '/applications'], icon: 'list' },
  { label: 'Add Application', icon: 'plus' },
  { label: 'Progress Summary', icon: 'chart' },
  { label: 'Reminders', icon: 'bell' },
  { label: 'AI Advisor', icon: 'sparkle' },
]

const iconPaths = {
  list: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
  plus: 'M12 5v14M5 12h14',
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

// Shared sidebar navigation and page container for every screen.
// Logging out needs no redirect here: RequireAuth sees the session end and sends the user to /login.
function Layout() {
  const { pathname } = useLocation()
  const { user } = useOutletContext()

  const isActive = (item) =>
    item.matches.some((path) => (path === '/' ? pathname === '/' : pathname.startsWith(path)))

  return (
    <div className="layout">
      <aside className="sidebar">
        <Link to="/" className="brand">
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
        <Outlet />
      </main>
    </div>
  )
}

export default Layout
