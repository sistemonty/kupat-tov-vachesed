import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { 
  Plus, 
  Search, 
  Filter,
  Eye,
  Edit,
  Phone,
  MapPin,
  Users as UsersIcon,
  CheckSquare,
  Square,
  ChevronDown
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import BulkActions from '../components/BulkActions'

interface ColumnFilter {
  field: string
  operator: string
  value: string | number | null
  value2?: string | number | null
}

export default function Families() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [columnFilters, setColumnFilters] = useState<Record<string, ColumnFilter>>({})
  const [activeFilterColumn, setActiveFilterColumn] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const applyColumnFilter = (query: any, field: string, filter: ColumnFilter) => {
    if (!filter || (!filter.value && !['is_empty', 'is_not_empty'].includes(filter.operator))) {
      return query
    }

    const { operator, value, value2 } = filter

    switch (operator) {
      case 'contains':
        return query.ilike(field, `%${value}%`)
      case 'not_contains':
        return query.not(field, 'ilike', `%${value}%`)
      case 'equals':
        return query.eq(field, value)
      case 'starts_with':
        return query.ilike(field, `${value}%`)
      case 'ends_with':
        return query.ilike(field, `%${value}`)
      case 'is_empty':
        return query.is(field, null)
      case 'is_not_empty':
        return query.not(field, 'is', null)
      case 'greater_than':
        return query.gt(field, value)
      case 'less_than':
        return query.lt(field, value)
      case 'greater_equal':
        return query.gte(field, value)
      case 'less_equal':
        return query.lte(field, value)
      case 'between':
        if (value !== null && value2 !== null) {
          return query.gte(field, value).lte(field, value2)
        }
        return query
      case 'after':
        return query.gt(field, value)
      case 'before':
        return query.lt(field, value)
      default:
        return query
    }
  }

  const { data: families, isLoading } = useQuery({
    queryKey: ['families', search, statusFilter, columnFilters],
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

      // Apply column filters
      Object.entries(columnFilters).forEach(([field, filter]) => {
        query = applyColumnFilter(query, field, filter)
      })

      const { data, error } = await query

      if (error) throw error
      return data || []
    }
  })

  const deleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase
        .from('families')
        .delete()
        .in('id', ids)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['families'] })
      setSelectedIds(new Set())
    }
  })

  const updateStatusMutation = useMutation({
    mutationFn: async ({ ids, status }: { ids: string[], status: string }) => {
      const { error } = await supabase
        .from('families')
        .update({ status })
        .in('id', ids)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['families'] })
      setSelectedIds(new Set())
    }
  })

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(families?.map((f: any) => f.id) || []))
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

  const handleBulkDelete = () => {
    if (confirm(`האם למחוק ${selectedIds.size} משפחות?`)) {
      deleteMutation.mutate(Array.from(selectedIds))
    }
  }

  const handleBulkStatusChange = (status: string) => {
    updateStatusMutation.mutate({ ids: Array.from(selectedIds), status })
  }

  const getSelectedEmails = () => {
    const selectedFamilies = families?.filter((f: any) => selectedIds.has(f.id)) || []
    return selectedFamilies
      .map((f: any) => f.husband_email || f.wife_email)
      .filter(Boolean)
  }

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { class: string, text: string }> = {
      active: { class: 'badge-success', text: 'פעיל' },
      inactive: { class: 'badge-gray', text: 'לא פעיל' },
      pending: { class: 'badge-warning', text: 'ממתין' },
    }
    return badges[status] || { class: 'badge-gray', text: status }
  }

  const allSelected = families && families.length > 0 && selectedIds.size === families.length
  const someSelected = selectedIds.size > 0 && selectedIds.size < (families?.length || 0)

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

      {/* Bulk Actions */}
      <BulkActions
        selectedCount={selectedIds.size}
        onDelete={handleBulkDelete}
        onStatusChange={handleBulkStatusChange}
        availableActions={['delete', 'email', 'status']}
        selectedEmails={getSelectedEmails()}
      />

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
                  <th className="text-xs sm:text-sm w-12">
                    <button
                      onClick={() => handleSelectAll(!allSelected)}
                      className="p-1 hover:bg-gray-100 rounded transition-colors"
                    >
                      {allSelected ? (
                        <CheckSquare className="w-5 h-5 text-primary-600" />
                      ) : someSelected ? (
                        <div className="w-5 h-5 border-2 border-primary-600 rounded bg-primary-100" />
                      ) : (
                        <Square className="w-5 h-5 text-gray-400" />
                      )}
                    </button>
                  </th>
                  <th className="text-xs sm:text-sm">
                    <div className="space-y-1">
                      <div>שם המשפחה</div>
                      <ColumnFilter
                        field="husband_last_name"
                        label="שם משפחה"
                        type="text"
                        value={columnFilters['husband_last_name'] || null}
                        onChange={(filter) => setColumnFilters({ ...columnFilters, 'husband_last_name': filter || undefined })}
                      />
                    </div>
                  </th>
                  <th className="text-xs sm:text-sm">
                    <div className="space-y-1">
                      <div>בעל</div>
                      <ColumnFilter
                        field="husband_first_name"
                        label="שם פרטי בעל"
                        type="text"
                        value={columnFilters['husband_first_name'] || null}
                        onChange={(filter) => setColumnFilters({ ...columnFilters, 'husband_first_name': filter || undefined })}
                      />
                    </div>
                  </th>
                  <th className="text-xs sm:text-sm">
                    <div className="space-y-1">
                      <div>אשה</div>
                      <ColumnFilter
                        field="wife_first_name"
                        label="שם פרטי אשה"
                        type="text"
                        value={columnFilters['wife_first_name'] || null}
                        onChange={(filter) => setColumnFilters({ ...columnFilters, 'wife_first_name': filter || undefined })}
                      />
                    </div>
                  </th>
                  <th className="text-xs sm:text-sm">
                    <div className="space-y-1">
                      <div>עיר</div>
                      <ColumnFilter
                        field="city_id"
                        label="עיר"
                        type="text"
                        value={columnFilters['city_id'] || null}
                        onChange={(filter) => setColumnFilters({ ...columnFilters, 'city_id': filter || undefined })}
                      />
                    </div>
                  </th>
                  <th className="text-xs sm:text-sm">
                    <div className="space-y-1">
                      <div>טלפון</div>
                      <ColumnFilter
                        field="husband_phone"
                        label="טלפון"
                        type="text"
                        value={columnFilters['husband_phone'] || null}
                        onChange={(filter) => setColumnFilters({ ...columnFilters, 'husband_phone': filter || undefined })}
                      />
                    </div>
                  </th>
                  <th className="text-xs sm:text-sm">
                    <div className="space-y-1">
                      <div>ילדים</div>
                    </div>
                  </th>
                  <th className="text-xs sm:text-sm">
                    <div className="space-y-1">
                      <div>סטטוס</div>
                      <ColumnFilter
                        field="status"
                        label="סטטוס"
                        type="select"
                        options={[
                          { value: 'active', label: 'פעיל' },
                          { value: 'inactive', label: 'לא פעיל' },
                          { value: 'pending', label: 'ממתין' },
                        ]}
                        value={columnFilters['status'] || null}
                        onChange={(filter) => setColumnFilters({ ...columnFilters, 'status': filter || undefined })}
                      />
                    </div>
                  </th>
                  <th className="text-xs sm:text-sm">פעולות</th>
                </tr>
              </thead>
              <tbody>
                {families.map((family: any) => {
                  const badge = getStatusBadge(family.status)
                  const isSelected = selectedIds.has(family.id)
                  return (
                    <tr key={family.id} className={isSelected ? 'bg-primary-50' : ''}>
                      <td>
                        <button
                          onClick={() => handleSelect(family.id, !isSelected)}
                          className="p-1 hover:bg-gray-100 rounded transition-colors"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-5 h-5 text-primary-600" />
                          ) : (
                            <Square className="w-5 h-5 text-gray-400" />
                          )}
                        </button>
                      </td>
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
              const isSelected = selectedIds.has(family.id)
              return (
                <div key={family.id} className={`card ${isSelected ? 'ring-2 ring-primary-500' : ''}`}>
                  <div className="flex items-start justify-between mb-3">
                    <button
                      onClick={() => handleSelect(family.id, !isSelected)}
                      className="p-1 hover:bg-gray-100 rounded transition-colors mt-1"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-5 h-5 text-primary-600" />
                      ) : (
                        <Square className="w-5 h-5 text-gray-400" />
                      )}
                    </button>
                    <div className="flex-1 mr-2">
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

