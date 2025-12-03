import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  Plus, 
  FolderKanban,
  Calendar,
  DollarSign,
  Users,
  Edit,
  Trash2,
  MoreVertical
} from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function Projects() {
  const [showForm, setShowForm] = useState(false)
  const [editingProject, setEditingProject] = useState<any>(null)
  const queryClient = useQueryClient()

  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const { data: projectsData, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      // Get support totals for each project
      const { data: supportsData } = await supabase
        .from('supports')
        .select('project_id, amount')
        .eq('status', 'completed')

      const supportsByProject = supportsData?.reduce((acc: any, s) => {
        if (s.project_id) {
          acc[s.project_id] = (acc[s.project_id] || 0) + (s.amount || 0)
        }
        return acc
      }, {}) || {}

      return projectsData?.map(p => ({
        ...p,
        spent: supportsByProject[p.id] || 0
      })) || []
    }
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('projects').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    }
  })

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { class: string, text: string }> = {
      planned: { class: 'badge-info', text: 'מתוכנן' },
      active: { class: 'badge-success', text: 'פעיל' },
      completed: { class: 'badge-gray', text: 'הסתיים' },
      cancelled: { class: 'badge-danger', text: 'בוטל' },
    }
    return badges[status] || { class: 'badge-gray', text: status }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-hebrew font-bold text-gray-900">פרויקטים</h1>
          <p className="text-gray-500 mt-1">ניהול פרויקטים וחלוקות</p>
        </div>
        <button 
          onClick={() => { setEditingProject(null); setShowForm(true) }}
          className="btn btn-primary"
        >
          <Plus className="w-5 h-5" />
          <span>פרויקט חדש</span>
        </button>
      </div>

      {/* Projects Grid */}
      {isLoading ? (
        <div className="card p-8 text-center">
          <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-500 mt-4">טוען פרויקטים...</p>
        </div>
      ) : projects && projects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project: any) => {
            const badge = getStatusBadge(project.status)
            const progress = project.budget > 0 ? (project.spent / project.budget) * 100 : 0

            return (
              <div key={project.id} className="card hover:shadow-elegant transition-all group">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <FolderKanban className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`badge ${badge.class}`}>{badge.text}</span>
                    <div className="relative">
                      <button className="p-1 hover:bg-gray-100 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreVertical className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                  </div>
                </div>

                <h3 className="font-semibold text-gray-900 text-lg mb-1">{project.name}</h3>
                <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                  {project.description || 'ללא תיאור'}
                </p>

                {/* Budget Progress */}
                {project.budget > 0 && (
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-500">תקציב</span>
                      <span className="font-medium">
                        ₪{project.spent.toLocaleString()} / ₪{project.budget.toLocaleString()}
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all ${
                          progress > 90 ? 'bg-red-500' : progress > 70 ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Dates */}
                <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                  {project.start_date && (
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(project.start_date).toLocaleDateString('he-IL')}
                    </div>
                  )}
                  {project.end_date && (
                    <div className="flex items-center gap-1">
                      <span>עד</span>
                      {new Date(project.end_date).toLocaleDateString('he-IL')}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
                  <button 
                    onClick={() => { setEditingProject(project); setShowForm(true) }}
                    className="btn btn-secondary flex-1 text-sm"
                  >
                    <Edit className="w-4 h-4" />
                    עריכה
                  </button>
                  <button 
                    onClick={() => {
                      if (confirm('האם למחוק את הפרויקט?')) {
                        deleteMutation.mutate(project.id)
                      }
                    }}
                    className="p-2 hover:bg-red-50 text-red-500 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="card p-12 text-center">
          <FolderKanban className="w-16 h-16 text-gray-200 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">אין פרויקטים</h3>
          <p className="text-gray-500 mb-4">התחל ליצור פרויקטים לניהול חלוקות</p>
          <button 
            onClick={() => setShowForm(true)}
            className="btn btn-primary"
          >
            <Plus className="w-5 h-5" />
            <span>צור פרויקט ראשון</span>
          </button>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <ProjectForm 
          project={editingProject}
          onClose={() => { setShowForm(false); setEditingProject(null) }}
        />
      )}
    </div>
  )
}

function ProjectForm({ project, onClose }: { project: any, onClose: () => void }) {
  const queryClient = useQueryClient()
  const isEdit = !!project

  const [formData, setFormData] = useState({
    name: project?.name || '',
    description: project?.description || '',
    budget: project?.budget || '',
    start_date: project?.start_date || '',
    end_date: project?.end_date || '',
    status: project?.status || 'planned',
  })

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      if (isEdit) {
        const { error } = await supabase
          .from('projects')
          .update(data)
          .eq('id', project.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('projects')
          .insert(data)
        if (error) throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      onClose()
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    saveMutation.mutate({
      ...formData,
      budget: formData.budget ? parseFloat(formData.budget as string) : 0,
    })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-elegant w-full max-w-lg animate-fade-in">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900">
            {isEdit ? 'עריכת פרויקט' : 'פרויקט חדש'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="label">שם הפרויקט *</label>
            <input
              type="text"
              className="input"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="label">תיאור</label>
            <textarea
              className="input min-h-[100px]"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div>
            <label className="label">תקציב</label>
            <input
              type="number"
              className="input"
              value={formData.budget}
              onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
              placeholder="₪"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">תאריך התחלה</label>
              <input
                type="date"
                className="input"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              />
            </div>
            <div>
              <label className="label">תאריך סיום</label>
              <input
                type="date"
                className="input"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="label">סטטוס</label>
            <select
              className="input"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            >
              <option value="planned">מתוכנן</option>
              <option value="active">פעיל</option>
              <option value="completed">הסתיים</option>
              <option value="cancelled">בוטל</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-4 pt-4">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              ביטול
            </button>
            <button type="submit" className="btn btn-primary" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'שומר...' : (isEdit ? 'שמור שינויים' : 'צור פרויקט')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

