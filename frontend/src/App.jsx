import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout.jsx'

// Placeholders: replace with the real route components when Tasks 2–4 are merged.
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<p>Applications List (Task 2)</p>} />
          <Route path="/applications/:id" element={<p>Application Details (Task 3)</p>} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
