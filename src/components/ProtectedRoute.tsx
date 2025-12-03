import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useUserRole } from '../hooks/usePermissions'
import { Loader2 } from 'lucide-react'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: 'admin' | 'manager' | 'user' | 'viewer'
  requiredPermission?: { resource: string; action: string }
}

export default function ProtectedRoute({ 
  children, 
  requiredRole,
  requiredPermission 
}: ProtectedRouteProps) {
  const { user, loading: authLoading } = useAuth()
  const { data: userRole, isLoading: roleLoading } = useUserRole()

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-primary-100">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary-500 animate-spin mx-auto" />
          <p className="text-gray-500 mt-4">טוען...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (userRole?.status !== 'active') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-primary-100">
        <div className="card max-w-md text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">גישה מוגבלת</h2>
          <p className="text-gray-500">
            החשבון שלך ממתין לאישור מנהל המערכת
          </p>
        </div>
      </div>
    )
  }

  if (requiredRole) {
    const roleHierarchy: Record<string, number> = {
      'viewer': 1,
      'user': 2,
      'manager': 3,
      'admin': 4,
    }

    const userLevel = roleHierarchy[userRole.role] || 0
    const requiredLevel = roleHierarchy[requiredRole] || 0

    if (userLevel < requiredLevel) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-primary-100">
          <div className="card max-w-md text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">אין הרשאה</h2>
            <p className="text-gray-500">
              אין לך הרשאה לגשת לדף זה
            </p>
          </div>
        </div>
      )
    }
  }

  return <>{children}</>
}
