import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import ApplicationsList from './pages/ApplicationsList.jsx'
import { applications } from './data/applications.js'

// Temporary wiring: replace with ListRoute / DetailsRoute when Tasks 3–4 are merged.
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route
            path="/"
            element={<ApplicationsList applications={applications} onSelect={() => {}} />}
          />
          <Route path="/applications/:id" element={<p>Application Details (Task 3)</p>} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
