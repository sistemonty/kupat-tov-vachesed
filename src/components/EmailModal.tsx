import { useState, useEffect, useRef } from 'react'
import { X, Mail, Loader2, CheckCircle, User, ChevronDown } from 'lucide-react'
import { sendEmail } from '../utils/email'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

interface EmailModalProps {
  isOpen: boolean
  onClose: () => void
  defaultTo?: string | string[]
  defaultSubject?: string
  defaultMessage?: string
  familyId?: string // אם יש משפחה שנבחרה
  onSuccess?: () => void
}

export default function EmailModal({
  isOpen,
  onClose,
  defaultTo = '',
  defaultSubject = '',
  defaultMessage = '',
  familyId,
  onSuccess,
}: EmailModalProps) {
  const [to, setTo] = useState<string>('')
  const [toType, setToType] = useState<'manual' | 'select' | 'family'>('manual')
  const [selectedFamilyId, setSelectedFamilyId] = useState<string>('')
  const [selectedEmails, setSelectedEmails] = useState<{ husband: boolean, wife: boolean }>({ husband: true, wife: false })
  const [subject, setSubject] = useState(defaultSubject)
  const [message, setMessage] = useState(defaultMessage)
  const [showVariables, setShowVariables] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Fetch selected family data
  const { data: selectedFamily } = useQuery({
    queryKey: ['family-for-email', familyId || selectedFamilyId],
    queryFn: async () => {
      if (!familyId && !selectedFamilyId) return null
      const { data } = await supabase
        .from('families')
        .select('id, husband_first_name, husband_last_name, husband_email, wife_email, wife_first_name, wife_last_name, husband_phone, wife_phone, house_number, city_id, cities(name)')
        .eq('id', familyId || selectedFamilyId)
        .single()
      return data
    },
    enabled: isOpen && (!!familyId || !!selectedFamilyId),
  })

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
    enabled: isOpen && toType === 'select' && !familyId,
  })

  useEffect(() => {
    if (isOpen) {
      if (familyId) {
        setToType('family')
      } else if (defaultTo) {
        if (typeof defaultTo === 'string') {
          setTo(defaultTo)
        } else {
          setTo(defaultTo.join(', '))
        }
        setToType('manual')
      } else {
        setTo('')
        setToType('manual')
      }
      setSubject(defaultSubject)
      setMessage(defaultMessage)
      setError('')
    }
  }, [isOpen, defaultTo, defaultSubject, defaultMessage, familyId])

  // Update emails when family is selected
  useEffect(() => {
    if (selectedFamily && (toType === 'family' || toType === 'select')) {
      const emails: string[] = []
      if (selectedEmails.husband && selectedFamily.husband_email) {
        emails.push(selectedFamily.husband_email)
      }
      if (selectedEmails.wife && selectedFamily.wife_email) {
        emails.push(selectedFamily.wife_email)
      }
      setTo(emails.join(', '))
    }
  }, [selectedFamily, selectedEmails, toType])

  useEffect(() => {
    if (toType === 'select' && selectedFamilyId && families) {
      const family = families.find((f: any) => f.id === selectedFamilyId)
      if (family) {
        setSelectedEmails({
          husband: !!family.husband_email,
          wife: !!family.wife_email && !family.husband_email
        })
      }
    }
  }, [selectedFamilyId, families, toType])

  // Available variables for email template
  const availableVariables = [
    { key: '{שם_משפחה}', label: 'שם משפחה', value: selectedFamily?.husband_last_name || '' },
    { key: '{שם_פרטי_בעל}', label: 'שם פרטי בעל', value: selectedFamily?.husband_first_name || '' },
    { key: '{שם_מלא_בעל}', label: 'שם מלא בעל', value: `${selectedFamily?.husband_first_name || ''} ${selectedFamily?.husband_last_name || ''}`.trim() },
    { key: '{שם_פרטי_אשה}', label: 'שם פרטי אשה', value: selectedFamily?.wife_first_name || '' },
    { key: '{שם_מלא_אשה}', label: 'שם מלא אשה', value: `${selectedFamily?.wife_first_name || ''} ${selectedFamily?.wife_last_name || selectedFamily?.husband_last_name || ''}`.trim() },
    { key: '{טלפון_בעל}', label: 'טלפון בעל', value: selectedFamily?.husband_phone || '' },
    { key: '{טלפון_אשה}', label: 'טלפון אשה', value: selectedFamily?.wife_phone || '' },
    { key: '{עיר}', label: 'עיר', value: (selectedFamily?.cities as any)?.name || '' },
    { key: '{מספר_בית}', label: 'מספר בית', value: selectedFamily?.house_number || '' },
  ]

  const insertVariable = (variable: string) => {
    if (textareaRef.current) {
      const start = textareaRef.current.selectionStart
      const end = textareaRef.current.selectionEnd
      const text = message
      const newText = text.substring(0, start) + variable + text.substring(end)
      setMessage(newText)
      // Set cursor position after inserted variable
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + variable.length
          textareaRef.current.focus()
        }
      }, 0)
    }
    setShowVariables(false)
  }

  const replaceVariables = (text: string): string => {
    let result = text
    availableVariables.forEach(({ key, value }) => {
      result = result.replace(new RegExp(key.replace(/[{}]/g, '\\$&'), 'g'), value)
    })
    return result
  }

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
      
      // Replace variables in subject and message
      const finalSubject = replaceVariables(subject.trim())
      const finalMessage = replaceVariables(message.trim()).replace(/\n/g, '<br>')
      
      await sendEmail({
        to: emails.length > 1 ? emails : emails[0],
        subject: finalSubject,
        html: finalMessage,
      })

      onSuccess?.()
      onClose()
    } catch (err: any) {
      console.error('Email send error:', err)
      // Extract error message
      let errorMessage = 'שגיאה בשליחת מייל'
      if (err.message) {
        errorMessage = err.message
        // If it's a domain error, show helpful message
        if (err.message.includes('domain is not verified')) {
          errorMessage = 'ה-domain לא מאומת ב-Resend. אנא הוסף domain ב-Resend Dashboard.'
        } else if (err.message.includes('RESEND_API_KEY')) {
          errorMessage = 'API Key לא מוגדר. אנא הגדר RESEND_API_KEY ב-Supabase Secrets.'
        }
      }
      setError(errorMessage)
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
            {familyId || toType === 'family' ? (
              // Family emails selection
              <div className="space-y-3">
                <div className="text-sm text-gray-600 mb-2">
                  משפחת {selectedFamily?.husband_last_name || ''}
                </div>
                <div className="space-y-2">
                  {selectedFamily?.husband_email && (
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedEmails.husband}
                        onChange={(e) => setSelectedEmails({ ...selectedEmails, husband: e.target.checked })}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">
                        בעל: {selectedFamily.husband_email}
                      </span>
                    </label>
                  )}
                  {selectedFamily?.wife_email && (
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedEmails.wife}
                        onChange={(e) => setSelectedEmails({ ...selectedEmails, wife: e.target.checked })}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">
                        אשה: {selectedFamily.wife_email}
                      </span>
                    </label>
                  )}
                  {!selectedFamily?.husband_email && !selectedFamily?.wife_email && (
                    <p className="text-sm text-red-500">אין כתובות אימייל למשפחה זו</p>
                  )}
                </div>
              </div>
            ) : (
              <>
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
                  <div className="space-y-3">
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
                    {selectedFamily && (
                      <div className="space-y-2 p-3 bg-gray-50 rounded-lg">
                        <div className="text-sm font-medium text-gray-700 mb-2">בחר כתובות:</div>
                        {selectedFamily.husband_email && (
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedEmails.husband}
                              onChange={(e) => setSelectedEmails({ ...selectedEmails, husband: e.target.checked })}
                              className="w-4 h-4"
                            />
                            <span className="text-sm">בעל: {selectedFamily.husband_email}</span>
                          </label>
                        )}
                        {selectedFamily.wife_email && (
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedEmails.wife}
                              onChange={(e) => setSelectedEmails({ ...selectedEmails, wife: e.target.checked })}
                              className="w-4 h-4"
                            />
                            <span className="text-sm">אשה: {selectedFamily.wife_email}</span>
                          </label>
                        )}
                      </div>
                    )}
                  </div>
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
              </>
            )}
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
            <div className="flex items-center justify-between mb-2">
              <label className="label mb-0">גוף המייל *</label>
              {(familyId || selectedFamilyId) && (
                <div className="relative">
                  <button
                    onClick={() => setShowVariables(!showVariables)}
                    className="btn btn-secondary text-xs"
                    type="button"
                  >
                    <ChevronDown className="w-3 h-3" />
                    הוסף משתנה
                  </button>
                  {showVariables && (
                    <div className="absolute left-0 top-full mt-2 bg-white rounded-xl shadow-elegant border border-gray-200 py-2 min-w-[200px] z-30 max-h-60 overflow-y-auto">
                      {availableVariables.map((variable) => (
                        <button
                          key={variable.key}
                          onClick={() => insertVariable(variable.key)}
                          className="w-full text-right px-4 py-2 hover:bg-gray-50 text-sm flex items-center justify-between"
                          type="button"
                        >
                          <span className="text-primary-600 font-mono">{variable.key}</span>
                          <span className="text-gray-500 text-xs">{variable.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            <textarea
              ref={textareaRef}
              className="input min-h-[200px] font-normal"
              placeholder="כתוב את תוכן המייל כאן... (אפשר להשתמש במשתנים כמו {שם_משפחה})"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              ניתן להשתמש בשורות חדשות - הן יומרו אוטומטית ל-HTML
              {(familyId || selectedFamilyId) && ' • לחץ על "הוסף משתנה" להוספת שדות מהמשפחה'}
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

