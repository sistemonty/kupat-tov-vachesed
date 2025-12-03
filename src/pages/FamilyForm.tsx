import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowRight, Save, Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import type { FamilyInsert } from '../lib/database.types'

export default function FamilyForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isEdit = !!id

  const [formData, setFormData] = useState<Partial<FamilyInsert>>({
    status: 'active',
    husband_marital_status: 'married',
    wife_marital_status: 'married',
  })

  // Fetch existing family for edit
  const { data: family } = useQuery({
    queryKey: ['family', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('families')
        .select('*')
        .eq('id', id)
        .single()
      if (error) throw error
      return data
    },
    enabled: isEdit
  })

  // Fetch cities
  const { data: cities } = useQuery({
    queryKey: ['cities'],
    queryFn: async () => {
      const { data } = await supabase.from('cities').select('*').order('name')
      return data || []
    }
  })

  // Fetch streets based on selected city
  const { data: streets } = useQuery({
    queryKey: ['streets', formData.city_id],
    queryFn: async () => {
      const { data } = await supabase
        .from('streets')
        .select('*')
        .eq('city_id', formData.city_id)
        .order('name')
      return data || []
    },
    enabled: !!formData.city_id
  })

  // Update form when family data loads
  useEffect(() => {
    if (family) {
      setFormData(family)
    }
  }, [family])

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (data: Partial<FamilyInsert>) => {
      if (isEdit) {
        const { error } = await supabase
          .from('families')
          .update(data)
          .eq('id', id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('families')
          .insert(data as FamilyInsert)
        if (error) throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['families'] })
      navigate('/families')
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    saveMutation.mutate(formData)
  }

  const handleChange = (field: keyof FamilyInsert, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <Link to="/families" className="p-2 hover:bg-gray-100 rounded-lg transition-colors self-start">
          <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
        </Link>
        <div>
          <h1 className="text-2xl sm:text-3xl font-hebrew font-bold text-gray-900">
            {isEdit ? 'עריכת משפחה' : 'משפחה חדשה'}
          </h1>
          <p className="text-gray-500 mt-1 text-sm sm:text-base">
            {isEdit ? 'עדכן את פרטי המשפחה' : 'הוסף משפחה חדשה למערכת'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Status */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">סטטוס</h2>
          <div className="flex gap-4">
            {[
              { value: 'active', label: 'פעיל', color: 'emerald' },
              { value: 'inactive', label: 'לא פעיל', color: 'gray' },
              { value: 'pending', label: 'ממתין', color: 'amber' },
            ].map(option => (
              <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  value={option.value}
                  checked={formData.status === option.value}
                  onChange={(e) => handleChange('status', e.target.value)}
                  className="w-4 h-4 text-primary-600"
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Husband Details */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">פרטי בעל</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="label">שם משפחה *</label>
              <input
                type="text"
                className="input"
                value={formData.husband_last_name || ''}
                onChange={(e) => handleChange('husband_last_name', e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label">שם פרטי</label>
              <input
                type="text"
                className="input"
                value={formData.husband_first_name || ''}
                onChange={(e) => handleChange('husband_first_name', e.target.value)}
              />
            </div>
            <div>
              <label className="label">תעודת זהות</label>
              <input
                type="text"
                className="input"
                value={formData.husband_id_number || ''}
                onChange={(e) => handleChange('husband_id_number', e.target.value)}
              />
            </div>
            <div>
              <label className="label">תאריך לידה</label>
              <input
                type="date"
                className="input"
                value={formData.husband_birth_date || ''}
                onChange={(e) => handleChange('husband_birth_date', e.target.value)}
              />
            </div>
            <div>
              <label className="label">טלפון</label>
              <input
                type="tel"
                className="input"
                value={formData.husband_phone || ''}
                onChange={(e) => handleChange('husband_phone', e.target.value)}
              />
            </div>
            <div>
              <label className="label">דוא"ל</label>
              <input
                type="email"
                className="input"
                value={formData.husband_email || ''}
                onChange={(e) => handleChange('husband_email', e.target.value)}
              />
            </div>
            <div>
              <label className="label">סטטוס משפחתי</label>
              <select
                className="input"
                value={formData.husband_marital_status || ''}
                onChange={(e) => handleChange('husband_marital_status', e.target.value)}
              >
                <option value="married">נשוי</option>
                <option value="divorced">גרוש</option>
                <option value="widower">אלמן</option>
                <option value="single">רווק</option>
              </select>
            </div>
          </div>
        </div>

        {/* Wife Details */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">פרטי אשה</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="label">שם משפחה</label>
              <input
                type="text"
                className="input"
                value={formData.wife_last_name || ''}
                onChange={(e) => handleChange('wife_last_name', e.target.value)}
                placeholder="אם שונה מהבעל"
              />
            </div>
            <div>
              <label className="label">שם פרטי</label>
              <input
                type="text"
                className="input"
                value={formData.wife_first_name || ''}
                onChange={(e) => handleChange('wife_first_name', e.target.value)}
              />
            </div>
            <div>
              <label className="label">תעודת זהות</label>
              <input
                type="text"
                className="input"
                value={formData.wife_id_number || ''}
                onChange={(e) => handleChange('wife_id_number', e.target.value)}
              />
            </div>
            <div>
              <label className="label">תאריך לידה</label>
              <input
                type="date"
                className="input"
                value={formData.wife_birth_date || ''}
                onChange={(e) => handleChange('wife_birth_date', e.target.value)}
              />
            </div>
            <div>
              <label className="label">טלפון</label>
              <input
                type="tel"
                className="input"
                value={formData.wife_phone || ''}
                onChange={(e) => handleChange('wife_phone', e.target.value)}
              />
            </div>
            <div>
              <label className="label">דוא"ל</label>
              <input
                type="email"
                className="input"
                value={formData.wife_email || ''}
                onChange={(e) => handleChange('wife_email', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">כתובת</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="label">עיר</label>
              <select
                className="input"
                value={formData.city_id || ''}
                onChange={(e) => handleChange('city_id', e.target.value || null)}
              >
                <option value="">בחר עיר</option>
                {cities?.map((city: any) => (
                  <option key={city.id} value={city.id}>{city.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">רחוב</label>
              <select
                className="input"
                value={formData.street_id || ''}
                onChange={(e) => handleChange('street_id', e.target.value || null)}
                disabled={!formData.city_id}
              >
                <option value="">בחר רחוב</option>
                {streets?.map((street: any) => (
                  <option key={street.id} value={street.id}>{street.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">מספר בית</label>
              <input
                type="text"
                className="input"
                value={formData.house_number || ''}
                onChange={(e) => handleChange('house_number', e.target.value)}
              />
            </div>
            <div>
              <label className="label">כניסה</label>
              <input
                type="text"
                className="input"
                value={formData.entrance || ''}
                onChange={(e) => handleChange('entrance', e.target.value)}
              />
            </div>
            <div>
              <label className="label">קומה</label>
              <input
                type="text"
                className="input"
                value={formData.floor || ''}
                onChange={(e) => handleChange('floor', e.target.value)}
              />
            </div>
            <div>
              <label className="label">קוד בבניין</label>
              <input
                type="text"
                className="input"
                value={formData.apartment_code || ''}
                onChange={(e) => handleChange('apartment_code', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">פרטי התקשרות נוספים</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="label">טלפון בית</label>
              <input
                type="tel"
                className="input"
                value={formData.home_phone || ''}
                onChange={(e) => handleChange('home_phone', e.target.value)}
              />
            </div>
            <div>
              <label className="label">טלפון נוסף</label>
              <input
                type="tel"
                className="input"
                value={formData.additional_phone || ''}
                onChange={(e) => handleChange('additional_phone', e.target.value)}
              />
            </div>
            <div>
              <label className="label">בית כנסת</label>
              <input
                type="text"
                className="input"
                value={formData.synagogue || ''}
                onChange={(e) => handleChange('synagogue', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Bank Details */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">פרטי בנק</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="label">שם בעל החשבון</label>
              <input
                type="text"
                className="input"
                value={formData.bank_account_name || ''}
                onChange={(e) => handleChange('bank_account_name', e.target.value)}
              />
            </div>
            <div>
              <label className="label">מספר בנק</label>
              <input
                type="text"
                className="input"
                value={formData.bank_number || ''}
                onChange={(e) => handleChange('bank_number', e.target.value)}
              />
            </div>
            <div>
              <label className="label">מספר סניף</label>
              <input
                type="text"
                className="input"
                value={formData.bank_branch || ''}
                onChange={(e) => handleChange('bank_branch', e.target.value)}
              />
            </div>
            <div>
              <label className="label">מספר חשבון</label>
              <input
                type="text"
                className="input"
                value={formData.bank_account || ''}
                onChange={(e) => handleChange('bank_account', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end gap-4">
          <Link to="/families" className="btn btn-secondary">
            ביטול
          </Link>
          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={saveMutation.isPending}
          >
            {saveMutation.isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            <span>{isEdit ? 'שמור שינויים' : 'צור משפחה'}</span>
          </button>
        </div>

        {saveMutation.isError && (
          <div className="p-4 bg-red-50 text-red-600 rounded-xl">
            שגיאה בשמירה: {(saveMutation.error as Error).message}
          </div>
        )}
      </form>
    </div>
  )
}

