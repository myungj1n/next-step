import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import ListRoute from './routes/ListRoute.jsx'
import DetailsRoute from './routes/DetailsRoute.jsx'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<ListRoute />} />
          <Route path="/applications/:id" element={<DetailsRoute />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
