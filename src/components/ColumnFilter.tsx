import { useState, useRef, useEffect } from 'react'
import { Filter, X, ChevronDown } from 'lucide-react'

interface ColumnFilterProps {
  field: string
  label: string
  type: 'text' | 'number' | 'date' | 'select'
  options?: Array<{ value: string, label: string }>
  value: { operator: string, value: string | number | null, value2?: string | number | null } | null
  onChange: (filter: { operator: string, value: string | number | null, value2?: string | number | null } | null) => void
}

export default function ColumnFilter({ field, label, type, options, value, onChange }: ColumnFilterProps) {
  const [isOpen, setIsOpen] = useState(false)
  const filterRef = useRef<HTMLDivElement>(null)

  const textOperators = [
    { value: 'contains', label: 'מכיל' },
    { value: 'not_contains', label: 'לא מכיל' },
    { value: 'equals', label: 'שווה' },
    { value: 'starts_with', label: 'מתחיל ב' },
    { value: 'ends_with', label: 'מסתיים ב' },
    { value: 'is_empty', label: 'ריק' },
    { value: 'is_not_empty', label: 'לא ריק' },
  ]

  const numberOperators = [
    { value: 'equals', label: 'שווה' },
    { value: 'greater_than', label: 'גדול מ' },
    { value: 'less_than', label: 'קטן מ' },
    { value: 'greater_equal', label: 'גדול או שווה' },
    { value: 'less_equal', label: 'קטן או שווה' },
    { value: 'between', label: 'בין' },
    { value: 'is_empty', label: 'ריק' },
    { value: 'is_not_empty', label: 'לא ריק' },
  ]

  const dateOperators = [
    { value: 'equals', label: 'שווה' },
    { value: 'after', label: 'אחרי' },
    { value: 'before', label: 'לפני' },
    { value: 'between', label: 'בין' },
    { value: 'is_empty', label: 'ריק' },
    { value: 'is_not_empty', label: 'לא ריק' },
  ]

  const selectOperators = [
    { value: 'equals', label: 'שווה' },
    { value: 'is_empty', label: 'ריק' },
    { value: 'is_not_empty', label: 'לא ריק' },
  ]

  const getOperators = () => {
    if (type === 'select') return selectOperators
    if (type === 'number') return numberOperators
    if (type === 'date') return dateOperators
    return textOperators
  }

  const operators = getOperators()
  const currentOperator = value?.operator || operators[0].value
  const showValue2 = currentOperator === 'between'

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleOperatorChange = (operator: string) => {
    onChange({
      operator,
      value: null,
      value2: undefined,
    })
  }

  const handleValueChange = (newValue: string | number | null) => {
    onChange({
      operator: currentOperator,
      value: newValue,
      value2: value?.value2,
    })
  }

  const handleValue2Change = (newValue: string | number | null) => {
    onChange({
      operator: currentOperator,
      value: value?.value || null,
      value2: newValue,
    })
  }

  const clearFilter = () => {
    onChange(null)
    setIsOpen(false)
  }

  const hasFilter = value && (value.value !== null && value.value !== '' || ['is_empty', 'is_not_empty'].includes(value.operator))

  return (
    <div ref={filterRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-2 py-1 text-xs border rounded hover:bg-gray-50 flex items-center justify-between gap-1 ${
          hasFilter ? 'border-primary-500 bg-primary-50' : 'border-gray-300'
        }`}
      >
        <Filter className={`w-3 h-3 ${hasFilter ? 'text-primary-600' : 'text-gray-400'}`} />
        {hasFilter && <span className="text-primary-600 text-xs">●</span>}
        <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 p-3 z-50 min-w-[280px]">
          <div className="space-y-2">
            {/* Operator */}
            <div>
              <label className="text-xs text-gray-600 mb-1 block">אופרטור</label>
              <select
                className="input text-xs w-full"
                value={currentOperator}
                onChange={(e) => handleOperatorChange(e.target.value)}
              >
                {operators.map(op => (
                  <option key={op.value} value={op.value}>{op.label}</option>
                ))}
              </select>
            </div>

            {/* Value */}
            {!['is_empty', 'is_not_empty'].includes(currentOperator) && (
              <>
                {type === 'select' && options ? (
                  <div>
                    <label className="text-xs text-gray-600 mb-1 block">ערך</label>
                    <select
                      className="input text-xs w-full"
                      value={value?.value as string || ''}
                      onChange={(e) => handleValueChange(e.target.value || null)}
                    >
                      <option value="">בחר...</option>
                      {options.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                ) : type === 'date' ? (
                  <div>
                    <label className="text-xs text-gray-600 mb-1 block">תאריך</label>
                    <input
                      type="date"
                      className="input text-xs w-full"
                      value={value?.value as string || ''}
                      onChange={(e) => handleValueChange(e.target.value || null)}
                    />
                  </div>
                ) : type === 'number' ? (
                  <div>
                    <label className="text-xs text-gray-600 mb-1 block">מספר</label>
                    <input
                      type="number"
                      className="input text-xs w-full"
                      value={value?.value as number || ''}
                      onChange={(e) => handleValueChange(e.target.value ? parseFloat(e.target.value) : null)}
                      placeholder="ערך"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="text-xs text-gray-600 mb-1 block">ערך</label>
                    <input
                      type="text"
                      className="input text-xs w-full"
                      value={value?.value as string || ''}
                      onChange={(e) => handleValueChange(e.target.value || null)}
                      placeholder="הזן ערך..."
                    />
                  </div>
                )}

                {/* Value 2 (for "between") */}
                {showValue2 && (
                  <div>
                    <label className="text-xs text-gray-600 mb-1 block">עד</label>
                    {type === 'date' ? (
                      <input
                        type="date"
                        className="input text-xs w-full"
                        value={value?.value2 as string || ''}
                        onChange={(e) => handleValue2Change(e.target.value || null)}
                      />
                    ) : type === 'number' ? (
                      <input
                        type="number"
                        className="input text-xs w-full"
                        value={value?.value2 as number || ''}
                        onChange={(e) => handleValue2Change(e.target.value ? parseFloat(e.target.value) : null)}
                        placeholder="עד"
                      />
                    ) : null}
                  </div>
                )}
              </>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-2 border-t">
              {hasFilter && (
                <button
                  onClick={clearFilter}
                  className="btn btn-secondary text-xs flex-1"
                >
                  <X className="w-3 h-3" />
                  נקה
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="btn btn-primary text-xs flex-1"
              >
                החל
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

