import { useState } from 'react'
import { Mail } from 'lucide-react'
import EmailModal from './EmailModal'

interface SendEmailButtonProps {
  to?: string | string[]
  familyId?: string
  familyName?: string
  amount?: number
  type?: 'approval' | 'notification' | 'custom'
  customSubject?: string
  customMessage?: string
  onSuccess?: () => void
}

export default function SendEmailButton({
  to,
  familyId,
  familyName,
  amount,
  type = 'notification',
  customSubject,
  customMessage,
  onSuccess,
}: SendEmailButtonProps) {
  const [showModal, setShowModal] = useState(false)

  const getDefaultSubject = () => {
    if (customSubject) return customSubject
    if (type === 'approval') return 'בקשת התמיכה שלך אושרה - קופת טוב וחסד'
    return 'עדכון מהמערכת - קופת טוב וחסד'
  }

  const getDefaultMessage = () => {
    if (customMessage) return customMessage
    if (type === 'approval' && familyName && amount) {
      return `שלום ${familyName},\n\nבקשת התמיכה שלך אושרה!\n\nסכום מאושר: ₪${amount.toLocaleString()}\nתאריך: ${new Date().toLocaleDateString('he-IL')}\n\nבברכה,\nקופת טוב וחסד`
    }
    return 'עדכון מהמערכת'
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="btn btn-secondary text-sm"
      >
        <Mail className="w-4 h-4" />
        <span>שלח מייל</span>
      </button>

      <EmailModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        defaultTo={to}
        defaultSubject={getDefaultSubject()}
        defaultMessage={getDefaultMessage()}
        familyId={familyId}
        onSuccess={() => {
          setShowModal(false)
          onSuccess?.()
        }}
      />
    </>
  )
}

