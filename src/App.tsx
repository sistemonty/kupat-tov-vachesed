import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
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
      {/* Public route */}
      <Route path="/login" element={<Login />} />
      
      {/* Protected routes */}
      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
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
