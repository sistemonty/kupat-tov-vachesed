import { Trash2, Mail, Edit, Check, X, MoreVertical } from 'lucide-react'
import { useState } from 'react'

interface BulkActionsProps {
  selectedCount: number
  onDelete?: () => void
  onEmail?: () => void
  onEdit?: () => void
  onApprove?: () => void
  onReject?: () => void
  onStatusChange?: (status: string) => void
  availableActions?: string[]
}

export default function BulkActions({
  selectedCount,
  onDelete,
  onEmail,
  onEdit,
  onApprove,
  onReject,
  onStatusChange,
  availableActions = ['delete', 'email', 'status'],
}: BulkActionsProps) {
  const [showStatusMenu, setShowStatusMenu] = useState(false)

  if (selectedCount === 0) return null

  return (
    <div className="card bg-primary-50 border-primary-200 sticky top-20 z-20 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-primary-900">
            {selectedCount} נבחרו
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {availableActions.includes('email') && onEmail && (
            <button
              onClick={onEmail}
              className="btn btn-secondary text-sm"
            >
              <Mail className="w-4 h-4" />
              שלח מייל
            </button>
          )}

          {availableActions.includes('approve') && onApprove && (
            <button
              onClick={onApprove}
              className="btn btn-success text-sm"
            >
              <Check className="w-4 h-4" />
              אשר
            </button>
          )}

          {availableActions.includes('reject') && onReject && (
            <button
              onClick={onReject}
              className="btn btn-danger text-sm"
            >
              <X className="w-4 h-4" />
              דחה
            </button>
          )}

          {availableActions.includes('status') && onStatusChange && (
            <div className="relative">
              <button
                onClick={() => setShowStatusMenu(!showStatusMenu)}
                className="btn btn-secondary text-sm"
              >
                <MoreVertical className="w-4 h-4" />
                שנה סטטוס
              </button>
              {showStatusMenu && (
                <div className="absolute left-0 top-full mt-2 bg-white rounded-xl shadow-elegant border border-gray-200 py-2 min-w-[150px] z-30">
                  <button
                    onClick={() => { onStatusChange('active'); setShowStatusMenu(false) }}
                    className="w-full text-right px-4 py-2 hover:bg-gray-50 text-sm"
                  >
                    פעיל
                  </button>
                  <button
                    onClick={() => { onStatusChange('inactive'); setShowStatusMenu(false) }}
                    className="w-full text-right px-4 py-2 hover:bg-gray-50 text-sm"
                  >
                    לא פעיל
                  </button>
                  <button
                    onClick={() => { onStatusChange('pending'); setShowStatusMenu(false) }}
                    className="w-full text-right px-4 py-2 hover:bg-gray-50 text-sm"
                  >
                    ממתין
                  </button>
                </div>
              )}
            </div>
          )}

          {availableActions.includes('delete') && onDelete && (
            <button
              onClick={onDelete}
              className="btn btn-danger text-sm"
            >
              <Trash2 className="w-4 h-4" />
              מחק
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

