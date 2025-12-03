import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { 
  Plus, 
  Search, 
  Filter,
  Heart,
  Calendar,
  Download
} from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function Supports() {
  const [search, setSearch] = useState('')
  const [projectFilter, setProjectFilter] = useState<string>('all')

  const { data: supports, isLoading } = useQuery({
    queryKey: ['supports', search, projectFilter],
    queryFn: async () => {
      let query = supabase
        .from('supports')
        .select(`
          *,
          families (
            husband_first_name,
            husband_last_name
          ),
          support_types (name),
          projects (name)
        `)
        .order('support_date', { ascending: false })

      if (projectFilter !== 'all') {
        query = query.eq('project_id', projectFilter)
      }

      const { data, error } = await query
      if (error) throw error
      return data || []
    }
  })

  const { data: projects } = useQuery({
    queryKey: ['projects-list'],
    queryFn: async () => {
      const { data } = await supabase
        .from('projects')
        .select('id, name')
        .order('name')
      return data || []
    }
  })

  const { data: stats } = useQuery({
    queryKey: ['supports-stats'],
    queryFn: async () => {
      const { data } = await supabase
        .from('supports')
        .select('amount, status')
      
      const total = data?.reduce((sum, s) => sum + (s.amount || 0), 0) || 0
      const completed = data?.filter(s => s.status === 'completed').reduce((sum, s) => sum + (s.amount || 0), 0) || 0
      const pending = data?.filter(s => s.status === 'pending').reduce((sum, s) => sum + (s.amount || 0), 0) || 0
      
      return { total, completed, pending, count: data?.length || 0 }
    }
  })

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { class: string, text: string }> = {
      pending: { class: 'badge-warning', text: 'ממתין' },
      completed: { class: 'badge-success', text: 'בוצע' },
      cancelled: { class: 'badge-danger', text: 'בוטל' },
    }
    return badges[status] || { class: 'badge-gray', text: status }
  }

  const getMethodText = (method: string) => {
    const methods: Record<string, string> = {
      transfer: 'העברה בנקאית',
      check: 'שיק',
      cash: 'מזומן',
      voucher: 'שובר',
      other: 'אחר',
    }
    return methods[method] || method
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-hebrew font-bold text-gray-900">תמיכות</h1>
          <p className="text-gray-500 mt-1">ניהול תמיכות שניתנו למשפחות</p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-secondary">
            <Download className="w-5 h-5" />
            <span>ייצוא</span>
          </button>
          <button className="btn btn-primary">
            <Plus className="w-5 h-5" />
            <span>תמיכה חדשה</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card bg-gradient-to-br from-emerald-50 to-emerald-100">
          <p className="text-sm text-emerald-600 font-medium">סה"כ תמיכות</p>
          <p className="text-2xl font-bold text-emerald-700">₪{(stats?.total || 0).toLocaleString()}</p>
        </div>
        <div className="card bg-gradient-to-br from-blue-50 to-blue-100">
          <p className="text-sm text-blue-600 font-medium">בוצעו</p>
          <p className="text-2xl font-bold text-blue-700">₪{(stats?.completed || 0).toLocaleString()}</p>
        </div>
        <div className="card bg-gradient-to-br from-amber-50 to-amber-100">
          <p className="text-sm text-amber-600 font-medium">ממתינים</p>
          <p className="text-2xl font-bold text-amber-700">₪{(stats?.pending || 0).toLocaleString()}</p>
        </div>
        <div className="card bg-gradient-to-br from-purple-50 to-purple-100">
          <p className="text-sm text-purple-600 font-medium">מספר תמיכות</p>
          <p className="text-2xl font-bold text-purple-700">{stats?.count || 0}</p>
        </div>
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
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="input w-auto"
            >
              <option value="all">כל הפרויקטים</option>
              {projects?.map((project: any) => (
                <option key={project.id} value={project.id}>{project.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-gray-500 mt-4">טוען תמיכות...</p>
          </div>
        ) : supports && supports.length > 0 ? (
          <table className="table">
            <thead>
              <tr>
                <th>משפחה</th>
                <th>סוג תמיכה</th>
                <th>פרויקט</th>
                <th>סכום</th>
                <th>תאריך</th>
                <th>אופן מתן</th>
                <th>סטטוס</th>
              </tr>
            </thead>
            <tbody>
              {supports.map((support: any) => {
                const badge = getStatusBadge(support.status)
                return (
                  <tr key={support.id}>
                    <td className="font-medium">
                      {support.families?.husband_first_name} {support.families?.husband_last_name}
                    </td>
                    <td>{support.support_types?.name || '-'}</td>
                    <td>{support.projects?.name || '-'}</td>
                    <td className="font-semibold text-emerald-600">
                      ₪{support.amount.toLocaleString()}
                    </td>
                    <td>
                      <div className="flex items-center gap-1 text-gray-500">
                        <Calendar className="w-4 h-4" />
                        {new Date(support.support_date).toLocaleDateString('he-IL')}
                      </div>
                    </td>
                    <td>{support.payment_method ? getMethodText(support.payment_method) : '-'}</td>
                    <td>
                      <span className={`badge ${badge.class}`}>{badge.text}</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        ) : (
          <div className="p-12 text-center">
            <Heart className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">אין תמיכות</h3>
            <p className="text-gray-500 mb-4">עדיין לא נרשמו תמיכות</p>
            <button className="btn btn-primary">
              <Plus className="w-5 h-5" />
              <span>הוסף תמיכה ראשונה</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

