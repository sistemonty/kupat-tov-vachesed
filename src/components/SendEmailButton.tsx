import { useState } from 'react'
import { Mail, Loader2, CheckCircle } from 'lucide-react'
import { sendEmail, sendApprovalEmail, sendNotificationEmail } from '../utils/email'

interface SendEmailButtonProps {
  to: string
  familyName?: string
  amount?: number
  type?: 'approval' | 'notification' | 'custom'
  customSubject?: string
  customMessage?: string
  onSuccess?: () => void
}

export default function SendEmailButton({
  to,
  familyName,
  amount,
  type = 'notification',
  customSubject,
  customMessage,
  onSuccess,
}: SendEmailButtonProps) {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSend = async () => {
    if (!to) {
      alert('אין כתובת אימייל')
      return
    }

    setLoading(true)
    setSuccess(false)

    try {
      if (type === 'approval' && familyName && amount) {
        await sendApprovalEmail(to, familyName, amount, new Date().toLocaleDateString('he-IL'))
      } else if (type === 'notification') {
        await sendNotificationEmail(to, customMessage || 'עדכון מהמערכת')
      } else {
        await sendEmail({
          to,
          subject: customSubject || 'עדכון מהמערכת',
          html: customMessage || '<p>עדכון מהמערכת</p>',
        })
      }

      setSuccess(true)
      onSuccess?.()
      
      setTimeout(() => setSuccess(false), 3000)
    } catch (error: any) {
      alert(`שגיאה בשליחת מייל: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleSend}
      disabled={loading || success}
      className={`btn ${
        success ? 'btn-success' : 'btn-secondary'
      } text-sm`}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : success ? (
        <CheckCircle className="w-4 h-4" />
      ) : (
        <Mail className="w-4 h-4" />
      )}
      <span>{success ? 'נשלח!' : 'שלח מייל'}</span>
    </button>
  )
}

