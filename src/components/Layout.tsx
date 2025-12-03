import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  Heart, 
  FolderKanban,
  Settings,
  Menu,
  X,
  LogOut,
  Shield,
  Download,
  Upload
} from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useIsAdmin } from '../hooks/usePermissions'

const navigation = [
  { name: 'דשבורד', href: '/', icon: LayoutDashboard },
  { name: 'משפחות', href: '/families', icon: Users },
  { name: 'בקשות תמיכה', href: '/requests', icon: FileText },
  { name: 'תמיכות', href: '/supports', icon: Heart },
  { name: 'פרויקטים', href: '/projects', icon: FolderKanban },
  { name: 'ייצוא', href: '/export', icon: Download },
  { name: 'יבוא', href: '/import', icon: Upload },
  { name: 'הגדרות', href: '/settings', icon: Settings },
]

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const { user, signOut } = useAuth()
  const isAdmin = useIsAdmin() || false // Default to false if hook fails

  const handleSignOut = async () => {
    if (confirm('האם להתנתק מהמערכת?')) {
      await signOut()
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 right-0 z-50
        w-72 bg-white shadow-elegant
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl flex items-center justify-center shadow-lg">
                  <Heart className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="font-hebrew text-xl font-bold text-gray-900">קופת טוב וחסד</h1>
                  <p className="text-xs text-gray-500">מערכת ניהול נתמכים</p>
                </div>
              </div>
              <button 
                className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              // Hide admin-only pages
              if (item.href === '/users' && !isAdmin) return null
              
              const isActive = location.pathname === item.href || 
                (item.href !== '/' && location.pathname.startsWith(item.href))
              
              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={`nav-link ${isActive ? 'active' : ''}`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.name}</span>
                </NavLink>
              )
            })}
            {isAdmin && (
              <NavLink
                to="/users"
                className={`nav-link ${location.pathname === '/users' ? 'active' : ''}`}
                onClick={() => setSidebarOpen(false)}
              >
                <Shield className="w-5 h-5" />
                <span className="font-medium">משתמשים</span>
              </NavLink>
            )}
          </nav>

          {/* Footer with user info */}
          <div className="p-4 border-t border-gray-100">
            {user && (
              <div className="mb-3 px-4 py-2 bg-gray-50 rounded-xl">
                <p className="text-sm font-medium text-gray-900 truncate">{user.email}</p>
                <p className="text-xs text-gray-500">מחובר</p>
              </div>
            )}
            <button 
              onClick={handleSignOut}
              className="nav-link w-full text-gray-500 hover:text-red-600 hover:bg-red-50"
            >
              <LogOut className="w-5 h-5" />
              <span>התנתק</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-lg border-b border-gray-100">
          <div className="flex items-center justify-between px-6 py-4">
            <button 
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>
            
            <div className="flex items-center gap-4">
              <div className="text-left">
                <p className="text-sm font-medium text-gray-900">שלום!</p>
                <p className="text-xs text-gray-500 truncate max-w-[150px]">{user?.email}</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white font-bold">
                {user?.email?.charAt(0).toUpperCase() || 'מ'}
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
