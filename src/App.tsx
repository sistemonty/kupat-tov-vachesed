import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Families from './pages/Families'
import FamilyDetail from './pages/FamilyDetail'
import FamilyForm from './pages/FamilyForm'
import SupportRequests from './pages/SupportRequests'
import Supports from './pages/Supports'
import Projects from './pages/Projects'
import Settings from './pages/Settings'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="families" element={<Families />} />
        <Route path="families/new" element={<FamilyForm />} />
        <Route path="families/:id" element={<FamilyDetail />} />
        <Route path="families/:id/edit" element={<FamilyForm />} />
        <Route path="requests" element={<SupportRequests />} />
        <Route path="supports" element={<Supports />} />
        <Route path="projects" element={<Projects />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  )
}

export default App

