import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { 
  Plus, 
  Search, 
  Filter,
  Eye,
  Edit,
  Phone,
  MapPin,
  Users as UsersIcon
} from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function Families() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const { data: families, isLoading } = useQuery({
    queryKey: ['families', search, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('families')
        .select(`
          *,
          cities (name),
          children (id)
        `)
        .order('created_at', { ascending: false })

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter)
      }

      if (search) {
        query = query.or(`husband_last_name.ilike.%${search}%,husband_first_name.ilike.%${search}%,wife_first_name.ilike.%${search}%,husband_id_number.ilike.%${search}%,husband_phone.ilike.%${search}%`)
      }

      const { data, error } = await query

      if (error) throw error
      return data || []
    }
  })

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { class: string, text: string }> = {
      active: { class: 'badge-success', text: 'פעיל' },
      inactive: { class: 'badge-gray', text: 'לא פעיל' },
      pending: { class: 'badge-warning', text: 'ממתין' },
    }
    return badges[status] || { class: 'badge-gray', text: status }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-hebrew font-bold text-gray-900">משפחות</h1>
          <p className="text-gray-500 mt-1 text-sm sm:text-base">ניהול משפחות נתמכות</p>
        </div>
        <Link to="/families/new" className="btn btn-primary">
          <Plus className="w-5 h-5" />
          <span>משפחה חדשה</span>
        </Link>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="חיפוש לפי שם, ת.ז., טלפון..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pr-10"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input w-auto"
            >
              <option value="all">כל הסטטוסים</option>
              <option value="active">פעיל</option>
              <option value="inactive">לא פעיל</option>
              <option value="pending">ממתין</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table - Desktop / Cards - Mobile */}
      {isLoading ? (
        <div className="card p-8 text-center">
          <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-500 mt-4">טוען משפחות...</p>
        </div>
      ) : families && families.length > 0 ? (
        <>
          {/* Desktop Table */}
          <div className="hidden lg:block table-container overflow-x-auto">
            <table className="table min-w-full">
              <thead>
                <tr>
                  <th className="text-xs sm:text-sm">שם המשפחה</th>
                  <th className="text-xs sm:text-sm">בעל</th>
                  <th className="text-xs sm:text-sm">אשה</th>
                  <th className="text-xs sm:text-sm">עיר</th>
                  <th className="text-xs sm:text-sm">טלפון</th>
                  <th className="text-xs sm:text-sm">ילדים</th>
                  <th className="text-xs sm:text-sm">סטטוס</th>
                  <th className="text-xs sm:text-sm">פעולות</th>
                </tr>
              </thead>
              <tbody>
                {families.map((family: any) => {
                  const badge = getStatusBadge(family.status)
                  return (
                    <tr key={family.id}>
                      <td>
                        <span className="font-semibold text-gray-900 text-sm">
                          {family.husband_last_name}
                        </span>
                      </td>
                      <td className="text-sm">
                        {family.husband_first_name} {family.husband_last_name}
                      </td>
                      <td className="text-sm">
                        {family.wife_first_name} {family.wife_last_name || family.husband_last_name}
                      </td>
                      <td>
                        <div className="flex items-center gap-1 text-gray-500 text-sm">
                          <MapPin className="w-4 h-4" />
                          {family.cities?.name || '-'}
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-1 text-sm">
                          <Phone className="w-4 h-4 text-gray-400" />
                          {family.husband_phone || family.wife_phone || '-'}
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-1 text-sm">
                          <UsersIcon className="w-4 h-4 text-gray-400" />
                          {family.children?.length || 0}
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${badge.class} text-xs`}>{badge.text}</span>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <Link 
                            to={`/families/${family.id}`}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            title="צפייה"
                          >
                            <Eye className="w-4 h-4 text-gray-500" />
                          </Link>
                          <Link 
                            to={`/families/${family.id}/edit`}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            title="עריכה"
                          >
                            <Edit className="w-4 h-4 text-gray-500" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="lg:hidden space-y-4">
            {families.map((family: any) => {
              const badge = getStatusBadge(family.status)
              return (
                <div key={family.id} className="card">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 text-lg">
                        משפחת {family.husband_last_name}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {family.husband_first_name} {family.husband_last_name}
                      </p>
                    </div>
                    <span className={`badge ${badge.class} text-xs`}>{badge.text}</span>
                  </div>

                  <div className="space-y-2 text-sm">
                    {family.wife_first_name && (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 w-16">אשה:</span>
                        <span>{family.wife_first_name} {family.wife_last_name || family.husband_last_name}</span>
                      </div>
                    )}
                    
                    {family.cities?.name && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-500 w-16">עיר:</span>
                        <span>{family.cities.name}</span>
                      </div>
                    )}

                    {(family.husband_phone || family.wife_phone) && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-500 w-16">טלפון:</span>
                        <a href={`tel:${family.husband_phone || family.wife_phone}`} className="text-primary-600 hover:underline">
                          {family.husband_phone || family.wife_phone}
                        </a>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <UsersIcon className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-500 w-16">ילדים:</span>
                      <span>{family.children?.length || 0}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100">
                    <Link 
                      to={`/families/${family.id}`}
                      className="btn btn-secondary flex-1 text-sm"
                    >
                      <Eye className="w-4 h-4" />
                      צפייה
                    </Link>
                    <Link 
                      to={`/families/${family.id}/edit`}
                      className="btn btn-secondary flex-1 text-sm"
                    >
                      <Edit className="w-4 h-4" />
                      עריכה
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      ) : (
          <div className="p-12 text-center">
            <UsersIcon className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">אין משפחות</h3>
            <p className="text-gray-500 mb-4">
              {search ? 'לא נמצאו משפחות התואמות לחיפוש' : 'התחל להוסיף משפחות למערכת'}
            </p>
            {!search && (
              <Link to="/families/new" className="btn btn-primary">
                <Plus className="w-5 h-5" />
                <span>הוסף משפחה ראשונה</span>
              </Link>
            )}
          </div>
        )}

      {/* Summary */}
      {families && families.length > 0 && (
        <div className="text-sm text-gray-500 text-center">
          מציג {families.length} משפחות
        </div>
      )}
    </div>
  )
}

