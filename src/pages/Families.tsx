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
  Square
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import BulkActions from '../components/BulkActions'
import AdvancedFilters, { FilterRule } from '../components/AdvancedFilters'

export default function Families() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [advancedFilters, setAdvancedFilters] = useState<FilterRule[]>([])
  const queryClient = useQueryClient()

  const applyFiltersToQuery = (query: any, filters: FilterRule[]) => {
    filters.forEach(filter => {
      const { field, operator, value, value2 } = filter

      if (!value && !['is_empty', 'is_not_empty'].includes(operator)) {
        return // Skip empty filters
      }

      switch (operator) {
        case 'contains':
          query = query.ilike(field, `%${value}%`)
          break
        case 'not_contains':
          query = query.not(field, 'ilike', `%${value}%`)
          break
        case 'equals':
          query = query.eq(field, value)
          break
        case 'starts_with':
          query = query.ilike(field, `${value}%`)
          break
        case 'ends_with':
          query = query.ilike(field, `%${value}`)
          break
        case 'is_empty':
          query = query.is(field, null)
          break
        case 'is_not_empty':
          query = query.not(field, 'is', null)
          break
        case 'greater_than':
          query = query.gt(field, value)
          break
        case 'less_than':
          query = query.lt(field, value)
          break
        case 'greater_equal':
          query = query.gte(field, value)
          break
        case 'less_equal':
          query = query.lte(field, value)
          break
        case 'between':
          if (value !== null && value2 !== null) {
            query = query.gte(field, value).lte(field, value2)
          }
          break
        case 'after':
          query = query.gt(field, value)
          break
        case 'before':
          query = query.lt(field, value)
          break
      }
    })
    return query
  }

  const { data: families, isLoading } = useQuery({
    queryKey: ['families', search, statusFilter, advancedFilters],
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

      // Apply advanced filters
      if (advancedFilters.length > 0) {
        query = applyFiltersToQuery(query, advancedFilters)
      }

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
        <div className="flex flex-col gap-4">
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

            {/* Advanced Filters */}
            <AdvancedFilters
              fields={[
                { key: 'husband_last_name', label: 'שם משפחה', type: 'text' },
                { key: 'husband_first_name', label: 'שם פרטי בעל', type: 'text' },
                { key: 'husband_id_number', label: 'ת.ז. בעל', type: 'text' },
                { key: 'husband_phone', label: 'טלפון בעל', type: 'text' },
                { key: 'husband_email', label: 'אימייל בעל', type: 'text' },
                { key: 'husband_birth_date', label: 'תאריך לידה בעל', type: 'date' },
                { key: 'husband_marital_status', label: 'סטטוס בעל', type: 'select', options: [
                  { value: 'married', label: 'נשוי' },
                  { value: 'divorced', label: 'גרוש' },
                  { value: 'widower', label: 'אלמן' },
                  { value: 'single', label: 'רווק' },
                ]},
                { key: 'wife_first_name', label: 'שם פרטי אשה', type: 'text' },
                { key: 'wife_last_name', label: 'שם משפחה אשה', type: 'text' },
                { key: 'wife_id_number', label: 'ת.ז. אשה', type: 'text' },
                { key: 'wife_phone', label: 'טלפון אשה', type: 'text' },
                { key: 'wife_email', label: 'אימייל אשה', type: 'text' },
                { key: 'wife_birth_date', label: 'תאריך לידה אשה', type: 'date' },
                { key: 'wife_marital_status', label: 'סטטוס אשה', type: 'select', options: [
                  { value: 'married', label: 'נשואה' },
                  { value: 'divorced', label: 'גרושה' },
                  { value: 'widow', label: 'אלמנה' },
                  { value: 'single', label: 'רווקה' },
                ]},
                { key: 'home_phone', label: 'טלפון בית', type: 'text' },
                { key: 'additional_phone', label: 'טלפון נוסף', type: 'text' },
                { key: 'house_number', label: 'מספר בית', type: 'text' },
                { key: 'entrance', label: 'כניסה', type: 'text' },
                { key: 'floor', label: 'קומה', type: 'text' },
                { key: 'apartment_code', label: 'קוד דירה', type: 'text' },
                { key: 'synagogue', label: 'בית כנסת', type: 'text' },
                { key: 'bank_account_name', label: 'שם בעל חשבון', type: 'text' },
                { key: 'bank_number', label: 'מספר בנק', type: 'text' },
                { key: 'bank_branch', label: 'מספר סניף', type: 'text' },
                { key: 'bank_account', label: 'מספר חשבון', type: 'text' },
                { key: 'status', label: 'סטטוס', type: 'select', options: [
                  { value: 'active', label: 'פעיל' },
                  { value: 'inactive', label: 'לא פעיל' },
                  { value: 'pending', label: 'ממתין' },
                ]},
                { key: 'created_at', label: 'תאריך יצירה', type: 'date' },
              ]}
              filters={advancedFilters}
              onFiltersChange={setAdvancedFilters}
            />
          </div>

          {/* Active Filters Display */}
          {advancedFilters.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2 border-t">
              <span className="text-sm text-gray-500">פילטרים פעילים:</span>
              {advancedFilters.map((filter, index) => {
                const field = [
                  { key: 'husband_last_name', label: 'שם משפחה' },
                  { key: 'husband_first_name', label: 'שם פרטי בעל' },
                  { key: 'husband_id_number', label: 'ת.ז. בעל' },
                  { key: 'husband_phone', label: 'טלפון בעל' },
                  { key: 'husband_email', label: 'אימייל בעל' },
                  { key: 'husband_birth_date', label: 'תאריך לידה בעל' },
                  { key: 'husband_marital_status', label: 'סטטוס בעל' },
                  { key: 'wife_first_name', label: 'שם פרטי אשה' },
                  { key: 'wife_last_name', label: 'שם משפחה אשה' },
                  { key: 'wife_id_number', label: 'ת.ז. אשה' },
                  { key: 'wife_phone', label: 'טלפון אשה' },
                  { key: 'wife_email', label: 'אימייל אשה' },
                  { key: 'wife_birth_date', label: 'תאריך לידה אשה' },
                  { key: 'wife_marital_status', label: 'סטטוס אשה' },
                  { key: 'home_phone', label: 'טלפון בית' },
                  { key: 'additional_phone', label: 'טלפון נוסף' },
                  { key: 'house_number', label: 'מספר בית' },
                  { key: 'entrance', label: 'כניסה' },
                  { key: 'floor', label: 'קומה' },
                  { key: 'apartment_code', label: 'קוד דירה' },
                  { key: 'synagogue', label: 'בית כנסת' },
                  { key: 'bank_account_name', label: 'שם בעל חשבון' },
                  { key: 'bank_number', label: 'מספר בנק' },
                  { key: 'bank_branch', label: 'מספר סניף' },
                  { key: 'bank_account', label: 'מספר חשבון' },
                  { key: 'status', label: 'סטטוס' },
                  { key: 'created_at', label: 'תאריך יצירה' },
                ].find(f => f.key === filter.field)
                const operatorLabels: Record<string, string> = {
                  contains: 'מכיל',
                  not_contains: 'לא מכיל',
                  equals: 'שווה',
                  starts_with: 'מתחיל ב',
                  ends_with: 'מסתיים ב',
                  is_empty: 'ריק',
                  is_not_empty: 'לא ריק',
                  greater_than: 'גדול מ',
                  less_than: 'קטן מ',
                  greater_equal: 'גדול או שווה',
                  less_equal: 'קטן או שווה',
                  between: 'בין',
                  after: 'אחרי',
                  before: 'לפני',
                }
                return (
                  <span key={index} className="inline-flex items-center gap-1 px-2 py-1 bg-primary-100 text-primary-700 rounded text-xs">
                    {field?.label} {operatorLabels[filter.operator]} {filter.value}
                    {filter.operator === 'between' && filter.value2 && ` - ${filter.value2}`}
                    <button
                      onClick={() => {
                        const newFilters = advancedFilters.filter((_, i) => i !== index)
                        setAdvancedFilters(newFilters)
                      }}
                      className="hover:text-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )
              })}
            </div>
          )}
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

