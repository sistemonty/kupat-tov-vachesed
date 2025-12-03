import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { 
  ArrowRight, 
  Edit, 
  Phone, 
  Mail, 
  MapPin,
  Calendar,
  CreditCard,
  Users,
  FileText,
  Heart,
  Plus,
  Building
} from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function FamilyDetail() {
  const { id } = useParams()

  const { data: family, isLoading } = useQuery({
    queryKey: ['family', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('families')
        .select(`
          *,
          cities (name),
          streets (name),
          communities (name)
        `)
        .eq('id', id)
        .single()

      if (error) throw error
      return data
    },
    enabled: !!id
  })

  const { data: children } = useQuery({
    queryKey: ['family-children', id],
    queryFn: async () => {
      const { data } = await supabase
        .from('children')
        .select('*')
        .eq('family_id', id)
        .order('birth_date', { ascending: true })
      return data || []
    },
    enabled: !!id
  })

  const { data: financialStatus } = useQuery({
    queryKey: ['family-financial', id],
    queryFn: async () => {
      const { data } = await supabase
        .from('financial_status')
        .select('*')
        .eq('family_id', id)
        .order('year', { ascending: false })
        .limit(1)
        .single()
      return data
    },
    enabled: !!id
  })

  const { data: supports } = useQuery({
    queryKey: ['family-supports', id],
    queryFn: async () => {
      const { data } = await supabase
        .from('supports')
        .select(`
          *,
          support_types (name),
          projects (name)
        `)
        .eq('family_id', id)
        .order('support_date', { ascending: false })
        .limit(10)
      return data || []
    },
    enabled: !!id
  })

  const calculateAge = (birthDate: string) => {
    const today = new Date()
    const birth = new Date(birthDate)
    let age = today.getFullYear() - birth.getFullYear()
    const m = today.getMonth() - birth.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    return age
  }

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { class: string, text: string }> = {
      active: { class: 'badge-success', text: 'פעיל' },
      inactive: { class: 'badge-gray', text: 'לא פעיל' },
      pending: { class: 'badge-warning', text: 'ממתין' },
    }
    return badges[status] || { class: 'badge-gray', text: status }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!family) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900">משפחה לא נמצאה</h2>
        <Link to="/families" className="text-primary-600 hover:underline mt-2 inline-block">
          חזור לרשימת המשפחות
        </Link>
      </div>
    )
  }

  const badge = getStatusBadge(family.status)

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 sm:gap-4">
          <Link to="/families" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </Link>
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-hebrew font-bold text-gray-900">
                משפחת {family.husband_last_name}
              </h1>
              <span className={`badge ${badge.class} text-xs sm:text-sm`}>{badge.text}</span>
            </div>
            <p className="text-gray-500 mt-1 text-sm sm:text-base">
              {family.husband_first_name} {family.wife_first_name && `ו${family.wife_first_name}`}
            </p>
          </div>
        </div>
        <Link to={`/families/${id}/edit`} className="btn btn-primary text-sm sm:text-base">
          <Edit className="w-4 h-4 sm:w-5 sm:h-5" />
          <span>עריכה</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="xl:col-span-2 space-y-6">
          {/* Contact Info */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Phone className="w-5 h-5 text-primary-500" />
              פרטי התקשרות
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Husband */}
              <div className="p-4 bg-blue-50 rounded-xl">
                <h3 className="font-medium text-gray-900 mb-3">בעל</h3>
                <div className="space-y-2 text-sm">
                  <p><span className="text-gray-500">שם:</span> {family.husband_first_name} {family.husband_last_name}</p>
                  {family.husband_id_number && (
                    <p><span className="text-gray-500">ת.ז.:</span> {family.husband_id_number}</p>
                  )}
                  {family.husband_phone && (
                    <p className="flex items-center gap-1">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <a href={`tel:${family.husband_phone}`} className="text-primary-600 hover:underline">
                        {family.husband_phone}
                      </a>
                    </p>
                  )}
                  {family.husband_email && (
                    <p className="flex items-center gap-1">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <a href={`mailto:${family.husband_email}`} className="text-primary-600 hover:underline">
                        {family.husband_email}
                      </a>
                    </p>
                  )}
                </div>
              </div>

              {/* Wife */}
              <div className="p-4 bg-pink-50 rounded-xl">
                <h3 className="font-medium text-gray-900 mb-3">אשה</h3>
                <div className="space-y-2 text-sm">
                  <p><span className="text-gray-500">שם:</span> {family.wife_first_name} {family.wife_last_name || family.husband_last_name}</p>
                  {family.wife_id_number && (
                    <p><span className="text-gray-500">ת.ז.:</span> {family.wife_id_number}</p>
                  )}
                  {family.wife_phone && (
                    <p className="flex items-center gap-1">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <a href={`tel:${family.wife_phone}`} className="text-primary-600 hover:underline">
                        {family.wife_phone}
                      </a>
                    </p>
                  )}
                  {family.wife_email && (
                    <p className="flex items-center gap-1">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <a href={`mailto:${family.wife_email}`} className="text-primary-600 hover:underline">
                        {family.wife_email}
                      </a>
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Address */}
            {(family.cities?.name || family.home_phone) && (
              <div className="mt-4 p-4 bg-gray-50 rounded-xl">
                <div className="flex flex-wrap gap-4 text-sm">
                  {family.cities?.name && (
                    <p className="flex items-center gap-1">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      {family.cities.name}
                      {family.streets?.name && `, ${family.streets.name}`}
                      {family.house_number && ` ${family.house_number}`}
                    </p>
                  )}
                  {family.home_phone && (
                    <p className="flex items-center gap-1">
                      <Phone className="w-4 h-4 text-gray-400" />
                      בית: {family.home_phone}
                    </p>
                  )}
                  {family.synagogue && (
                    <p className="flex items-center gap-1">
                      <Building className="w-4 h-4 text-gray-400" />
                      בית כנסת: {family.synagogue}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Children */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-primary-500" />
                ילדים ({children?.length || 0})
              </h2>
              <button className="btn btn-secondary text-sm">
                <Plus className="w-4 h-4" />
                הוסף ילד
              </button>
            </div>

            {children && children.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>שם</th>
                      <th>גיל</th>
                      <th>מגדר</th>
                      <th>מוסד לימודים</th>
                      <th>שכ"ל</th>
                    </tr>
                  </thead>
                  <tbody>
                    {children.map((child: any) => (
                      <tr key={child.id}>
                        <td className="font-medium">{child.first_name} {child.last_name}</td>
                        <td>{child.birth_date ? calculateAge(child.birth_date) : '-'}</td>
                        <td>{child.gender === 'male' ? 'זכר' : child.gender === 'female' ? 'נקבה' : '-'}</td>
                        <td>{child.school || '-'}</td>
                        <td>{child.tuition_fee ? `₪${child.tuition_fee.toLocaleString()}` : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">אין ילדים רשומים</p>
            )}
          </div>

          {/* Recent Supports */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Heart className="w-5 h-5 text-primary-500" />
                תמיכות אחרונות
              </h2>
              <button className="btn btn-secondary text-sm">
                <Plus className="w-4 h-4" />
                תמיכה חדשה
              </button>
            </div>

            {supports && supports.length > 0 ? (
              <div className="space-y-3">
                {supports.map((support: any) => (
                  <div key={support.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div>
                      <p className="font-medium">{support.support_types?.name || 'תמיכה'}</p>
                      <p className="text-sm text-gray-500">
                        {support.projects?.name && `${support.projects.name} • `}
                        {new Date(support.support_date).toLocaleDateString('he-IL')}
                      </p>
                    </div>
                    <p className="font-semibold text-emerald-600">₪{support.amount.toLocaleString()}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">אין תמיכות רשומות</p>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Financial Summary */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary-500" />
              מצב כלכלי
            </h2>

            {financialStatus ? (
              <div className="space-y-4">
                <div className="p-3 bg-emerald-50 rounded-xl">
                  <p className="text-sm text-gray-500">הכנסה חודשית</p>
                  <p className="text-2xl font-bold text-emerald-600">
                    ₪{(financialStatus.total_monthly_income || 0).toLocaleString()}
                  </p>
                </div>
                <div className="p-3 bg-red-50 rounded-xl">
                  <p className="text-sm text-gray-500">הוצאות חודשיות</p>
                  <p className="text-2xl font-bold text-red-600">
                    ₪{(financialStatus.total_monthly_expenses || 0).toLocaleString()}
                  </p>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-500">יתרה</p>
                  <p className={`text-2xl font-bold ${
                    (financialStatus.total_monthly_income - financialStatus.total_monthly_expenses) >= 0 
                      ? 'text-emerald-600' 
                      : 'text-red-600'
                  }`}>
                    ₪{((financialStatus.total_monthly_income || 0) - (financialStatus.total_monthly_expenses || 0)).toLocaleString()}
                  </p>
                </div>
                <p className="text-xs text-gray-400 text-center">
                  עודכן: {financialStatus.year}
                </p>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-500 mb-2">אין נתונים כלכליים</p>
                <button className="btn btn-secondary text-sm">
                  <Plus className="w-4 h-4" />
                  הוסף מצב כלכלי
                </button>
              </div>
            )}
          </div>

          {/* Bank Details */}
          {family.bank_account && (
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Building className="w-5 h-5 text-primary-500" />
                פרטי בנק
              </h2>
              <div className="space-y-2 text-sm">
                <p><span className="text-gray-500">שם:</span> {family.bank_account_name}</p>
                <p><span className="text-gray-500">בנק:</span> {family.bank_number}</p>
                <p><span className="text-gray-500">סניף:</span> {family.bank_branch}</p>
                <p><span className="text-gray-500">חשבון:</span> {family.bank_account}</p>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">פעולות מהירות</h2>
            <div className="space-y-2">
              <button className="btn btn-secondary w-full justify-start">
                <FileText className="w-4 h-4" />
                בקשת תמיכה חדשה
              </button>
              <button className="btn btn-secondary w-full justify-start">
                <Heart className="w-4 h-4" />
                רשום תמיכה
              </button>
              <button className="btn btn-secondary w-full justify-start">
                <Calendar className="w-4 h-4" />
                עדכן מצב כלכלי
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

