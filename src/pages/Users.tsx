import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, UserPlus, Edit, Trash2, Check, X, Shield, UserCheck } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useIsAdmin } from '../hooks/usePermissions'
import { useAuth } from '../contexts/AuthContext'
import ProtectedRoute from '../components/ProtectedRoute'

export default function Users() {
  const isAdmin = useIsAdmin()

  if (!isAdmin) {
    return (
      <ProtectedRoute requiredRole="admin">
        <div />
      </ProtectedRoute>
    )
  }

  return <UsersContent />
}

function UsersContent() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const queryClient = useQueryClient()

  const { data: users, isLoading } = useQuery({
    queryKey: ['system-users', search, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('system_users')
        .select(`
          *,
          created_by_user:system_users!created_by(email, full_name)
        `)
        .order('created_at', { ascending: false })

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter)
      }

      if (search) {
        query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`)
      }

      const { data, error } = await query
      if (error) throw error
      return data || []
    }
  })

  const { data: accessRequests } = useQuery({
    queryKey: ['access-requests'],
    queryFn: async () => {
      const { data } = await supabase
        .from('access_requests')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
      return data || []
    }
  })

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: string }) => {
      const { error } = await supabase
        .from('system_users')
        .update({ status })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-users'] })
    }
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('system_users')
        .delete()
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-users'] })
    }
  })

  const getRoleBadge = (role: string) => {
    const badges: Record<string, { class: string, text: string }> = {
      admin: { class: 'badge-danger', text: 'מנהל' },
      manager: { class: 'badge-warning', text: 'מנהל משנה' },
      user: { class: 'badge-info', text: 'משתמש' },
      viewer: { class: 'badge-gray', text: 'צופה' },
    }
    return badges[role] || { class: 'badge-gray', text: role }
  }

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { class: string, text: string }> = {
      active: { class: 'badge-success', text: 'פעיל' },
      pending: { class: 'badge-warning', text: 'ממתין' },
      suspended: { class: 'badge-danger', text: 'מושעה' },
    }
    return badges[status] || { class: 'badge-gray', text: status }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-hebrew font-bold text-gray-900">ניהול משתמשים</h1>
          <p className="text-gray-500 mt-1 text-sm sm:text-base">ניהול משתמשי המערכת והרשאות</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="btn btn-primary text-sm sm:text-base"
        >
          <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
          <span>משתמש חדש</span>
        </button>
      </div>

      {/* Access Requests */}
      {accessRequests && accessRequests.length > 0 && (
        <div className="card bg-amber-50 border border-amber-200">
          <div className="flex items-center gap-2 mb-4">
            <UserCheck className="w-5 h-5 text-amber-600" />
            <h2 className="text-lg font-semibold text-amber-900">בקשות גישה ממתינות ({accessRequests.length})</h2>
          </div>
          <div className="space-y-3">
            {accessRequests.map((request: any) => (
              <AccessRequestCard key={request.id} request={request} />
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
            <input
              type="text"
              placeholder="חיפוש לפי שם או אימייל..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pr-10 text-sm sm:text-base"
            />
          </div>
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input w-auto text-sm sm:text-base"
            >
              <option value="all">כל הסטטוסים</option>
              <option value="active">פעיל</option>
              <option value="pending">ממתין</option>
              <option value="suspended">מושעה</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="table-container overflow-x-auto">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-gray-500 mt-4">טוען משתמשים...</p>
          </div>
        ) : users && users.length > 0 ? (
          <table className="table min-w-full">
            <thead>
              <tr>
                <th className="text-xs sm:text-sm">שם</th>
                <th className="text-xs sm:text-sm">אימייל</th>
                <th className="text-xs sm:text-sm">תפקיד</th>
                <th className="text-xs sm:text-sm">סטטוס</th>
                <th className="text-xs sm:text-sm">תאריך יצירה</th>
                <th className="text-xs sm:text-sm">פעולות</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user: any) => {
                const roleBadge = getRoleBadge(user.role)
                const statusBadge = getStatusBadge(user.status)
                return (
                  <tr key={user.id}>
                    <td className="font-medium text-xs sm:text-sm">{user.full_name || '-'}</td>
                    <td className="text-xs sm:text-sm">{user.email}</td>
                    <td>
                      <span className={`badge ${roleBadge.class} text-xs`}>{roleBadge.text}</span>
                    </td>
                    <td>
                      <span className={`badge ${statusBadge.class} text-xs`}>{statusBadge.text}</span>
                    </td>
                    <td className="text-xs sm:text-sm text-gray-500">
                      {new Date(user.created_at).toLocaleDateString('he-IL')}
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        {user.status !== 'active' && (
                          <button
                            onClick={() => updateStatusMutation.mutate({ id: user.id, status: 'active' })}
                            className="p-1.5 hover:bg-green-100 text-green-600 rounded transition-colors"
                            title="הפעל"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                        {user.status === 'active' && (
                          <button
                            onClick={() => updateStatusMutation.mutate({ id: user.id, status: 'suspended' })}
                            className="p-1.5 hover:bg-red-100 text-red-600 rounded transition-colors"
                            title="השעה"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => {
                            if (confirm('האם למחוק את המשתמש?')) {
                              deleteMutation.mutate(user.id)
                            }
                          }}
                          className="p-1.5 hover:bg-red-100 text-red-600 rounded transition-colors"
                          title="מחק"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        ) : (
          <div className="p-12 text-center">
            <Shield className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">אין משתמשים</h3>
            <p className="text-gray-500 mb-4">התחל להוסיף משתמשים למערכת</p>
            <button 
              onClick={() => setShowAddModal(true)}
              className="btn btn-primary"
            >
              <Plus className="w-5 h-5" />
              <span>הוסף משתמש ראשון</span>
            </button>
          </div>
        )}
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <AddUserModal onClose={() => setShowAddModal(false)} />
      )}
    </div>
  )
}

function AccessRequestCard({ request }: { request: any }) {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  const approveMutation = useMutation({
    mutationFn: async () => {
      // Create auth user first
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: request.email,
        email_confirm: true,
        user_metadata: { full_name: request.full_name }
      })

      if (authError) throw authError

      // Create system user
      const { error: sysError } = await supabase
        .from('system_users')
        .insert({
          auth_user_id: authUser.user.id,
          email: request.email,
          full_name: request.full_name,
          role: request.requested_role,
          status: 'active',
          created_by: user?.id
        })

      if (sysError) throw sysError

      // Update request
      await supabase
        .from('access_requests')
        .update({
          status: 'approved',
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', request.id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['access-requests'] })
      queryClient.invalidateQueries({ queryKey: ['system-users'] })
    }
  })

  const rejectMutation = useMutation({
    mutationFn: async () => {
      await supabase
        .from('access_requests')
        .update({
          status: 'rejected',
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', request.id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['access-requests'] })
    }
  })

  return (
    <div className="p-4 bg-white rounded-xl border border-amber-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="font-medium text-gray-900">{request.full_name || request.email}</p>
          <p className="text-sm text-gray-500">{request.email}</p>
          <p className="text-xs text-gray-400 mt-1">
            מבקש תפקיד: {request.requested_role === 'admin' ? 'מנהל' : 
                         request.requested_role === 'manager' ? 'מנהל משנה' :
                         request.requested_role === 'user' ? 'משתמש' : 'צופה'}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => approveMutation.mutate()}
            disabled={approveMutation.isPending}
            className="btn btn-success text-sm"
          >
            <Check className="w-4 h-4" />
            אשר
          </button>
          <button
            onClick={() => rejectMutation.mutate()}
            disabled={rejectMutation.isPending}
            className="btn btn-danger text-sm"
          >
            <X className="w-4 h-4" />
            דחה
          </button>
        </div>
      </div>
    </div>
  )
}

function AddUserModal({ onClose }: { onClose: () => void }) {
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    role: 'user' as 'admin' | 'manager' | 'user' | 'viewer',
    password: '',
  })
  const queryClient = useQueryClient()
  const { user } = useAuth()

  const createMutation = useMutation({
    mutationFn: async () => {
      // Create auth user
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: formData.email,
        password: formData.password,
        email_confirm: true,
        user_metadata: { full_name: formData.full_name }
      })

      if (authError) throw authError

      // Create system user
      const { error: sysError } = await supabase
        .from('system_users')
        .insert({
          auth_user_id: authUser.user.id,
          email: formData.email,
          full_name: formData.full_name,
          role: formData.role,
          status: 'active',
          created_by: user?.id
        })

      if (sysError) throw sysError
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-users'] })
      onClose()
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createMutation.mutate()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-elegant w-full max-w-md animate-fade-in">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900">משתמש חדש</h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="label">אימייל *</label>
            <input
              type="email"
              className="input"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              dir="ltr"
            />
          </div>

          <div>
            <label className="label">שם מלא</label>
            <input
              type="text"
              className="input"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            />
          </div>

          <div>
            <label className="label">תפקיד *</label>
            <select
              className="input"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
              required
            >
              <option value="viewer">צופה</option>
              <option value="user">משתמש</option>
              <option value="manager">מנהל משנה</option>
              <option value="admin">מנהל</option>
            </select>
          </div>

          <div>
            <label className="label">סיסמה *</label>
            <input
              type="password"
              className="input"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              minLength={6}
              dir="ltr"
            />
            <p className="text-xs text-gray-500 mt-1">מינימום 6 תווים</p>
          </div>

          <div className="flex items-center justify-end gap-4 pt-4">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              ביטול
            </button>
            <button type="submit" className="btn btn-primary" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'יוצר...' : 'צור משתמש'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}


