import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import RequireAuth from './components/RequireAuth.jsx'
import LandingPage from './pages/LandingPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import ListRoute from './routes/ListRoute.jsx'
import DetailsRoute from './routes/DetailsRoute.jsx'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route element={<RequireAuth />}>
          <Route element={<Layout />}>
            <Route path="/applications" element={<ListRoute />} />
            <Route path="/applications/:id" element={<DetailsRoute />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
