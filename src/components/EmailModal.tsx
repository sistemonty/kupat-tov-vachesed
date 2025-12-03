import { useState, useEffect } from 'react'
import { X, Mail, Loader2, CheckCircle, User } from 'lucide-react'
import { sendEmail } from '../utils/email'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

interface EmailModalProps {
  isOpen: boolean
  onClose: () => void
  defaultTo?: string | string[]
  defaultSubject?: string
  defaultMessage?: string
  onSuccess?: () => void
}

export default function EmailModal({
  isOpen,
  onClose,
  defaultTo = '',
  defaultSubject = '',
  defaultMessage = '',
  onSuccess,
}: EmailModalProps) {
  const [to, setTo] = useState<string>('')
  const [toType, setToType] = useState<'manual' | 'select'>('manual')
  const [selectedFamilyId, setSelectedFamilyId] = useState<string>('')
  const [subject, setSubject] = useState(defaultSubject)
  const [message, setMessage] = useState(defaultMessage)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Fetch families for selection
  const { data: families } = useQuery({
    queryKey: ['families-for-email'],
    queryFn: async () => {
      const { data } = await supabase
        .from('families')
        .select('id, husband_first_name, husband_last_name, husband_email, wife_email')
        .eq('status', 'active')
        .order('husband_last_name')
      return data || []
    },
    enabled: isOpen && toType === 'select',
  })

  useEffect(() => {
    if (isOpen) {
      if (defaultTo) {
        if (typeof defaultTo === 'string') {
          setTo(defaultTo)
        } else {
          setTo(defaultTo.join(', '))
        }
      } else {
        setTo('')
      }
      setSubject(defaultSubject)
      setMessage(defaultMessage)
      setError('')
    }
  }, [isOpen, defaultTo, defaultSubject, defaultMessage])

  useEffect(() => {
    if (toType === 'select' && selectedFamilyId && families) {
      const family = families.find((f: any) => f.id === selectedFamilyId)
      if (family) {
        setTo(family.husband_email || family.wife_email || '')
      }
    }
  }, [selectedFamilyId, families, toType])

  const handleSend = async () => {
    if (!to.trim()) {
      setError('נא להזין כתובת אימייל')
      return
    }
    if (!subject.trim()) {
      setError('נא להזין נושא')
      return
    }
    if (!message.trim()) {
      setError('נא להזין גוף המייל')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Split multiple emails
      const emails = to.split(',').map(e => e.trim()).filter(Boolean)
      
      await sendEmail({
        to: emails.length > 1 ? emails : emails[0],
        subject: subject.trim(),
        html: message.trim().replace(/\n/g, '<br>'),
      })

      onSuccess?.()
      onClose()
    } catch (err: any) {
      setError(err.message || 'שגיאה בשליחת מייל')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-elegant w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-fade-in">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 sticky top-0 bg-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mail className="w-6 h-6 text-primary-600" />
              <h2 className="text-xl font-semibold text-gray-900">שליחת מייל</h2>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* To - Email Address */}
          <div>
            <label className="label mb-2">אל</label>
            <div className="flex gap-2 mb-2">
              <button
                onClick={() => setToType('manual')}
                className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                  toType === 'manual'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                הזנה ידנית
              </button>
              <button
                onClick={() => setToType('select')}
                className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                  toType === 'select'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                בחירה ממשפחה
              </button>
            </div>

            {toType === 'select' ? (
              <select
                className="input"
                value={selectedFamilyId}
                onChange={(e) => setSelectedFamilyId(e.target.value)}
              >
                <option value="">בחר משפחה</option>
                {families?.map((family: any) => (
                  <option key={family.id} value={family.id}>
                    {family.husband_first_name} {family.husband_last_name}
                    {family.husband_email ? ` (${family.husband_email})` : ''}
                    {!family.husband_email && family.wife_email ? ` (${family.wife_email})` : ''}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                className="input"
                placeholder="email@example.com (למספר כתובות, הפרד בפסיק)"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                dir="ltr"
              />
            )}
            <p className="text-xs text-gray-500 mt-1">
              ניתן להזין מספר כתובות מופרדות בפסיק
            </p>
          </div>

          {/* Subject */}
          <div>
            <label className="label">נושא *</label>
            <input
              type="text"
              className="input"
              placeholder="נושא המייל"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
            />
          </div>

          {/* Message */}
          <div>
            <label className="label">גוף המייל *</label>
            <textarea
              className="input min-h-[200px] font-normal"
              placeholder="כתוב את תוכן המייל כאן..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              ניתן להשתמש בשורות חדשות - הן יומרו אוטומטית ל-HTML
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-4 pt-4 border-t">
            <button 
              type="button" 
              onClick={onClose} 
              className="btn btn-secondary"
              disabled={loading}
            >
              ביטול
            </button>
            <button 
              onClick={handleSend}
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  שולח...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4" />
                  שלח מייל
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

