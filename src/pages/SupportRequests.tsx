import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  Plus, 
  Search, 
  Filter,
  Eye,
  Check,
  X,
  Clock,
  FileText
} from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function SupportRequests() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const queryClient = useQueryClient()

  const { data: requests, isLoading } = useQuery({
    queryKey: ['support-requests', search, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('support_requests')
        .select(`
          *,
          families (
            husband_first_name,
            husband_last_name,
            husband_phone
          )
        `)
        .order('created_at', { ascending: false })

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter)
      }

      const { data, error } = await query
      if (error) throw error
      return data || []
    }
  })

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, approved_amount }: { id: string, status: string, approved_amount?: number }) => {
      const updateData: any = { 
        status,
        ...(status === 'approved' && { 
          approval_date: new Date().toISOString().split('T')[0],
          approved_amount 
        })
      }
      
      const { error } = await supabase
        .from('support_requests')
        .update(updateData)
        .eq('id', id)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-requests'] })
    }
  })

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { class: string, text: string, icon: any }> = {
      new: { class: 'badge-info', text: 'חדש', icon: Clock },
      in_review: { class: 'badge-warning', text: 'בטיפול', icon: Eye },
      approved: { class: 'badge-success', text: 'אושר', icon: Check },
      rejected: { class: 'badge-danger', text: 'נדחה', icon: X },
      completed: { class: 'badge-gray', text: 'הושלם', icon: Check },
      cancelled: { class: 'badge-gray', text: 'בוטל', icon: X },
    }
    return badges[status] || { class: 'badge-gray', text: status, icon: Clock }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-hebrew font-bold text-gray-900">בקשות תמיכה</h1>
          <p className="text-gray-500 mt-1">ניהול בקשות תמיכה ממשפחות</p>
        </div>
        <button className="btn btn-primary">
          <Plus className="w-5 h-5" />
          <span>בקשה חדשה</span>
        </button>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="חיפוש לפי שם משפחה..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pr-10"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input w-auto"
            >
              <option value="all">כל הסטטוסים</option>
              <option value="new">חדש</option>
              <option value="in_review">בטיפול</option>
              <option value="approved">אושר</option>
              <option value="rejected">נדחה</option>
              <option value="completed">הושלם</option>
            </select>
          </div>
        </div>
      </div>

      {/* Requests List */}
      {isLoading ? (
        <div className="card p-8 text-center">
          <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-500 mt-4">טוען בקשות...</p>
        </div>
      ) : requests && requests.length > 0 ? (
        <div className="space-y-4">
          {requests.map((request: any) => {
            const badge = getStatusBadge(request.status)
            const BadgeIcon = badge.icon

            return (
              <div key={request.id} className="card hover:shadow-elegant transition-shadow">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900">
                        {request.families?.husband_first_name} {request.families?.husband_last_name}
                      </h3>
                      <span className={`badge ${badge.class} flex items-center gap-1`}>
                        <BadgeIcon className="w-3 h-3" />
                        {badge.text}
                      </span>
                    </div>
                    
                    <p className="text-gray-600 text-sm mb-2">
                      {request.purpose || request.description || 'ללא תיאור'}
                    </p>
                    
                    <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                      <span>תאריך: {new Date(request.request_date).toLocaleDateString('he-IL')}</span>
                      {request.requested_amount && (
                        <span>סכום מבוקש: ₪{request.requested_amount.toLocaleString()}</span>
                      )}
                      {request.approved_amount && (
                        <span className="text-emerald-600 font-medium">
                          סכום מאושר: ₪{request.approved_amount.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {request.status === 'new' && (
                      <>
                        <button
                          onClick={() => updateStatusMutation.mutate({ id: request.id, status: 'in_review' })}
                          className="btn btn-secondary text-sm"
                        >
                          <Eye className="w-4 h-4" />
                          לטיפול
                        </button>
                      </>
                    )}
                    
                    {request.status === 'in_review' && (
                      <>
                        <button
                          onClick={() => {
                            const amount = prompt('הכנס סכום לאישור:', request.requested_amount?.toString())
                            if (amount) {
                              updateStatusMutation.mutate({ 
                                id: request.id, 
                                status: 'approved',
                                approved_amount: parseFloat(amount)
                              })
                            }
                          }}
                          className="btn btn-success text-sm"
                        >
                          <Check className="w-4 h-4" />
                          אשר
                        </button>
                        <button
                          onClick={() => updateStatusMutation.mutate({ id: request.id, status: 'rejected' })}
                          className="btn btn-danger text-sm"
                        >
                          <X className="w-4 h-4" />
                          דחה
                        </button>
                      </>
                    )}

                    <button className="p-2 hover:bg-gray-100 rounded-lg">
                      <Eye className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="card p-12 text-center">
          <FileText className="w-16 h-16 text-gray-200 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">אין בקשות תמיכה</h3>
          <p className="text-gray-500 mb-4">
            {search || statusFilter !== 'all' 
              ? 'לא נמצאו בקשות התואמות לחיפוש' 
              : 'עדיין לא הוגשו בקשות תמיכה'}
          </p>
        </div>
      )}
    </div>
  )
}

