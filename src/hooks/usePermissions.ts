import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

export type Role = 'admin' | 'manager' | 'user' | 'viewer'
export type Resource = 'families' | 'supports' | 'projects' | 'users' | 'settings'
export type Action = 'read' | 'write' | 'delete' | 'approve'

export function useUserRole() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['user-role', user?.id],
    queryFn: async () => {
      if (!user) return null

      const { data, error } = await supabase
        .from('system_users')
        .select('role, status')
        .eq('auth_user_id', user.id)
        .single()

      if (error || !data) {
        // Default to user if not found
        return { role: 'user' as Role, status: 'active' }
      }

      return { role: data.role as Role, status: data.status }
    },
    enabled: !!user,
  })
}

export function usePermission(resource: Resource, action: Action) {
  const { data: userRole } = useUserRole()

  return useQuery({
    queryKey: ['permission', userRole?.role, resource, action],
    queryFn: async () => {
      if (!userRole?.role) return false

      const { data } = await supabase
        .from('permissions')
        .select('allowed')
        .eq('role', userRole.role)
        .eq('resource', resource)
        .eq('action', action)
        .single()

      return data?.allowed ?? false
    },
    enabled: !!userRole?.role,
  })
}

export function useIsAdmin() {
  const { data: userRole } = useUserRole()
  return userRole?.role === 'admin'
}

export function useIsManager() {
  const { data: userRole } = useUserRole()
  return userRole?.role === 'admin' || userRole?.role === 'manager'
}

