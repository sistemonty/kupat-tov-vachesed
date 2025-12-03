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
  FileText,
  CheckSquare,
  Square
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import SendEmailButton from '../components/SendEmailButton'
import BulkActions from '../components/BulkActions'
import { sendNotificationEmail } from '../utils/email'

export default function SupportRequests() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showNewRequestModal, setShowNewRequestModal] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
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
            husband_phone,
            husband_email
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
      setSelectedIds(new Set())
    }
  })

  const bulkUpdateMutation = useMutation({
    mutationFn: async ({ ids, status }: { ids: string[], status: string }) => {
      const updateData: any = { status }
      if (status === 'approved') {
        updateData.approval_date = new Date().toISOString().split('T')[0]
      }
      
      const { error } = await supabase
        .from('support_requests')
        .update(updateData)
        .in('id', ids)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-requests'] })
      setSelectedIds(new Set())
    }
  })

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase
        .from('support_requests')
        .delete()
        .in('id', ids)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-requests'] })
      setSelectedIds(new Set())
    }
  })

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(requests?.map((r: any) => r.id) || []))
    } else {
      setSelectedIds(new Set())
    }
  }

  const handleSelect = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedIds)
    if (checked) {
      newSelected.add(id)
    } else {
      newSelected.delete(id)
    }
    setSelectedIds(newSelected)
  }

  const handleBulkApprove = () => {
    if (confirm(`האם לאשר ${selectedIds.size} בקשות?`)) {
      bulkUpdateMutation.mutate({ ids: Array.from(selectedIds), status: 'approved' })
    }
  }

  const handleBulkReject = () => {
    if (confirm(`האם לדחות ${selectedIds.size} בקשות?`)) {
      bulkUpdateMutation.mutate({ ids: Array.from(selectedIds), status: 'rejected' })
    }
  }

  const handleBulkDelete = () => {
    if (confirm(`האם למחוק ${selectedIds.size} בקשות?`)) {
      bulkDeleteMutation.mutate(Array.from(selectedIds))
    }
  }

  const handleBulkEmail = async () => {
    const selectedRequests = requests?.filter((r: any) => selectedIds.has(r.id)) || []
    const emails = selectedRequests
      .map((r: any) => r.families?.husband_email)
      .filter(Boolean)
    
    if (emails.length === 0) {
      alert('אין כתובות אימייל לבקשות הנבחרות')
      return
    }

    try {
      await sendNotificationEmail(
        emails.join(','),
        'עדכון על בקשות התמיכה - קופת טוב וחסד',
      )
      alert(`נשלח מייל ל-${emails.length} משפחות`)
    } catch (error) {
      alert('שגיאה בשליחת מייל')
    }
  }

  const allSelected = requests && requests.length > 0 && selectedIds.size === requests.length
  const someSelected = selectedIds.size > 0 && selectedIds.size < (requests?.length || 0)

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
        <button 
          onClick={() => setShowNewRequestModal(true)}
          className="btn btn-primary"
        >
          <Plus className="w-5 h-5" />
          <span>בקשה חדשה</span>
        </button>
      </div>

      {/* Bulk Actions */}
      <BulkActions
        selectedCount={selectedIds.size}
        onDelete={handleBulkDelete}
        onEmail={handleBulkEmail}
        onApprove={handleBulkApprove}
        onReject={handleBulkReject}
        availableActions={['delete', 'email', 'approve', 'reject']}
      />

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
            const isSelected = selectedIds.has(request.id)

            return (
              <div key={request.id} className={`card hover:shadow-elegant transition-shadow ${isSelected ? 'ring-2 ring-primary-500' : ''}`}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <button
                      onClick={() => handleSelect(request.id, !isSelected)}
                      className="p-1 hover:bg-gray-100 rounded transition-colors mt-1 flex-shrink-0"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-5 h-5 text-primary-600" />
                      ) : (
                        <Square className="w-5 h-5 text-gray-400" />
                      )}
                    </button>
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
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
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

                    {request.status === 'approved' && request.families?.husband_email && (
                      <SendEmailButton
                        to={request.families.husband_email}
                        familyName={`${request.families.husband_first_name} ${request.families.husband_last_name}`}
                        amount={request.approved_amount || request.requested_amount}
                        type="approval"
                        onSuccess={() => {
                          updateStatusMutation.mutate({ id: request.id, status: 'completed' })
                        }}
                      />
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

      {/* New Request Modal */}
      {showNewRequestModal && (
        <NewRequestModal 
          onClose={() => setShowNewRequestModal(false)}
          onSuccess={() => {
            setShowNewRequestModal(false)
            queryClient.invalidateQueries({ queryKey: ['support-requests'] })
          }}
        />
      )}
    </div>
  )
}

function NewRequestModal({ onClose, onSuccess }: { onClose: () => void, onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    family_id: '',
    purpose: '',
    description: '',
    requested_amount: '',
    needs_rights_assistance: false,
    needs_financial_coaching: false,
    submitted_by: '',
    submitter_relation: '',
    submitter_phone: '',
    submitter_email: '',
    is_self_request: true,
  })

  const { data: families } = useQuery({
    queryKey: ['families-for-request'],
    queryFn: async () => {
      const { data } = await supabase
        .from('families')
        .select('id, husband_first_name, husband_last_name')
        .eq('status', 'active')
        .order('husband_last_name')
      return data || []
    }
  })

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from('support_requests')
        .insert({
          family_id: data.family_id,
          purpose: data.purpose,
          description: data.description,
          requested_amount: data.requested_amount ? parseFloat(data.requested_amount) : null,
          needs_rights_assistance: data.needs_rights_assistance,
          needs_financial_coaching: data.needs_financial_coaching,
          submitted_by: data.submitted_by,
          submitter_relation: data.submitter_relation,
          submitter_phone: data.submitter_phone,
          submitter_email: data.submitter_email,
          is_self_request: data.is_self_request,
          status: 'new',
        })
      if (error) throw error
    },
    onSuccess: () => {
      onSuccess()
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createMutation.mutate(formData)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-elegant w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-fade-in">
        <div className="p-6 border-b border-gray-100 sticky top-0 bg-white">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">בקשה חדשה</h2>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="label">משפחה *</label>
            <select
              className="input"
              value={formData.family_id}
              onChange={(e) => setFormData({ ...formData, family_id: e.target.value })}
              required
            >
              <option value="">בחר משפחה</option>
              {families?.map((family: any) => (
                <option key={family.id} value={family.id}>
                  {family.husband_first_name} {family.husband_last_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">מטרת הבקשה *</label>
            <input
              type="text"
              className="input"
              value={formData.purpose}
              onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
              placeholder="למשל: סיוע בשכר דירה, הוצאות רפואיות..."
              required
            />
          </div>

          <div>
            <label className="label">תיאור המצב</label>
            <textarea
              className="input min-h-[100px]"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="תאר את המצב ומטרת הבקשה..."
            />
          </div>

          <div>
            <label className="label">סכום מבוקש</label>
            <input
              type="number"
              className="input"
              value={formData.requested_amount}
              onChange={(e) => setFormData({ ...formData, requested_amount: e.target.value })}
              placeholder="₪"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.needs_rights_assistance}
                onChange={(e) => setFormData({ ...formData, needs_rights_assistance: e.target.checked })}
                className="w-4 h-4"
              />
              <span>צורך במיצוי זכויות</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.needs_financial_coaching}
                onChange={(e) => setFormData({ ...formData, needs_financial_coaching: e.target.checked })}
                className="w-4 h-4"
              />
              <span>צורך בליווי כלכלי</span>
            </label>
          </div>

          <div className="border-t pt-4">
            <label className="flex items-center gap-2 mb-4 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_self_request}
                onChange={(e) => setFormData({ ...formData, is_self_request: e.target.checked })}
                className="w-4 h-4"
              />
              <span>הבקשה מוגשת עבורי</span>
            </label>

            {!formData.is_self_request && (
              <div className="space-y-4">
                <div>
                  <label className="label">שם מלא</label>
                  <input
                    type="text"
                    className="input"
                    value={formData.submitted_by}
                    onChange={(e) => setFormData({ ...formData, submitted_by: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">קשר למשפחה</label>
                  <input
                    type="text"
                    className="input"
                    value={formData.submitter_relation}
                    onChange={(e) => setFormData({ ...formData, submitter_relation: e.target.value })}
                    placeholder="למשל: קרוב משפחה, שכן..."
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">טלפון</label>
                    <input
                      type="tel"
                      className="input"
                      value={formData.submitter_phone}
                      onChange={(e) => setFormData({ ...formData, submitter_phone: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="label">דוא"ל</label>
                    <input
                      type="email"
                      className="input"
                      value={formData.submitter_email}
                      onChange={(e) => setFormData({ ...formData, submitter_email: e.target.value })}
                      dir="ltr"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-4 pt-4 border-t">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              ביטול
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? 'שומר...' : 'שלח בקשה'}
            </button>
          </div>

          {createMutation.isError && (
            <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm">
              שגיאה: {(createMutation.error as Error).message}
            </div>
          )}
        </form>
      </div>
    </div>
  )
}

