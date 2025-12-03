import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { 
  Users, 
  FileText, 
  Heart, 
  TrendingUp,
  ArrowUpLeft,
  Calendar,
  AlertCircle
} from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function Dashboard() {
  // Fetch statistics
  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const [families, requests, supports, projects] = await Promise.all([
        supabase.from('families').select('id, status', { count: 'exact' }),
        supabase.from('support_requests').select('id, status', { count: 'exact' }),
        supabase.from('supports').select('id, amount, status').eq('status', 'completed'),
        supabase.from('projects').select('id, status').eq('status', 'active'),
      ])

      const activeFamilies = families.data?.filter(f => f.status === 'active').length || 0
      const pendingRequests = requests.data?.filter(r => r.status === 'new' || r.status === 'in_review').length || 0
      const totalSupport = supports.data?.reduce((sum, s) => sum + (s.amount || 0), 0) || 0

      return {
        totalFamilies: families.count || 0,
        activeFamilies,
        pendingRequests,
        totalRequests: requests.count || 0,
        totalSupport,
        activeProjects: projects.data?.length || 0,
      }
    }
  })

  // Fetch recent requests
  const { data: recentRequests } = useQuery({
    queryKey: ['recent-requests'],
    queryFn: async () => {
      const { data } = await supabase
        .from('support_requests')
        .select(`
          id,
          request_date,
          purpose,
          status,
          requested_amount,
          families (
            husband_first_name,
            husband_last_name
          )
        `)
        .order('created_at', { ascending: false })
        .limit(5)
      
      return data || []
    }
  })

  const statCards = [
    {
      title: 'משפחות פעילות',
      value: stats?.activeFamilies || 0,
      total: stats?.totalFamilies || 0,
      icon: Users,
      color: 'from-blue-500 to-blue-600',
      link: '/families'
    },
    {
      title: 'בקשות ממתינות',
      value: stats?.pendingRequests || 0,
      total: stats?.totalRequests || 0,
      icon: FileText,
      color: 'from-amber-500 to-orange-500',
      link: '/requests'
    },
    {
      title: 'סה"כ תמיכות',
      value: `₪${(stats?.totalSupport || 0).toLocaleString()}`,
      icon: Heart,
      color: 'from-emerald-500 to-teal-500',
      link: '/supports'
    },
    {
      title: 'פרויקטים פעילים',
      value: stats?.activeProjects || 0,
      icon: TrendingUp,
      color: 'from-purple-500 to-indigo-500',
      link: '/projects'
    },
  ]

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { class: string, text: string }> = {
      new: { class: 'badge-info', text: 'חדש' },
      in_review: { class: 'badge-warning', text: 'בטיפול' },
      approved: { class: 'badge-success', text: 'אושר' },
      rejected: { class: 'badge-danger', text: 'נדחה' },
      completed: { class: 'badge-gray', text: 'הושלם' },
    }
    return badges[status] || { class: 'badge-gray', text: status }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-hebrew font-bold text-gray-900">דשבורד</h1>
        <p className="text-gray-500 mt-1 text-sm sm:text-base">ברוכים הבאים למערכת ניהול הנתמכים</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <Link 
            key={stat.title}
            to={stat.link}
            className="card group hover:scale-[1.02] transition-transform"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                {stat.total && (
                  <p className="text-xs text-gray-400 mt-1">מתוך {stat.total}</p>
                )}
              </div>
              <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm text-primary-600 font-medium">
              <span>צפה בכל</span>
              <ArrowUpLeft className="w-4 h-4 mr-1" />
            </div>
          </Link>
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Requests */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">בקשות אחרונות</h2>
            <Link to="/requests" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
              צפה בכל
            </Link>
          </div>

          {recentRequests && recentRequests.length > 0 ? (
            <div className="space-y-4">
              {recentRequests.map((request: any) => {
                const badge = getStatusBadge(request.status)
                return (
                  <div key={request.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                        <FileText className="w-5 h-5 text-gray-400" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {request.families?.husband_first_name} {request.families?.husband_last_name}
                        </p>
                        <p className="text-xs text-gray-500">{request.purpose || 'ללא מטרה מוגדרת'}</p>
                      </div>
                    </div>
                    <div className="text-left">
                      <span className={`badge ${badge.class}`}>{badge.text}</span>
                      {request.requested_amount && (
                        <p className="text-xs text-gray-500 mt-1">₪{request.requested_amount.toLocaleString()}</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">אין בקשות אחרונות</p>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">פעולות מהירות</h2>
          
          <div className="grid grid-cols-2 gap-4">
            <Link to="/families/new" className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl hover:from-blue-100 hover:to-blue-200 transition-colors group">
              <Users className="w-8 h-8 text-blue-600 mb-3 group-hover:scale-110 transition-transform" />
              <p className="font-medium text-gray-900">משפחה חדשה</p>
              <p className="text-xs text-gray-500 mt-1">הוסף משפחה למערכת</p>
            </Link>

            <Link to="/requests" className="p-4 bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl hover:from-amber-100 hover:to-amber-200 transition-colors group">
              <FileText className="w-8 h-8 text-amber-600 mb-3 group-hover:scale-110 transition-transform" />
              <p className="font-medium text-gray-900">בקשה חדשה</p>
              <p className="text-xs text-gray-500 mt-1">טפל בבקשת תמיכה</p>
            </Link>

            <Link to="/supports" className="p-4 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl hover:from-emerald-100 hover:to-emerald-200 transition-colors group">
              <Heart className="w-8 h-8 text-emerald-600 mb-3 group-hover:scale-110 transition-transform" />
              <p className="font-medium text-gray-900">תמיכה חדשה</p>
              <p className="text-xs text-gray-500 mt-1">רשום תמיכה שניתנה</p>
            </Link>

            <Link to="/projects" className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl hover:from-purple-100 hover:to-purple-200 transition-colors group">
              <Calendar className="w-8 h-8 text-purple-600 mb-3 group-hover:scale-110 transition-transform" />
              <p className="font-medium text-gray-900">פרויקטים</p>
              <p className="text-xs text-gray-500 mt-1">נהל פרויקטים וחגים</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

