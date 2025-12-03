import { useState } from 'react'
import { Filter, X, ChevronDown } from 'lucide-react'

export interface FilterRule {
  field: string
  operator: string
  value: string | number | null
  value2?: string | number | null // For "between" operations
}

interface AdvancedFiltersProps {
  fields: Array<{
    key: string
    label: string
    type: 'text' | 'number' | 'date' | 'select'
    options?: Array<{ value: string, label: string }>
  }>
  filters: FilterRule[]
  onFiltersChange: (filters: FilterRule[]) => void
}

export default function AdvancedFilters({ fields, filters, onFiltersChange }: AdvancedFiltersProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeFilters, setActiveFilters] = useState<FilterRule[]>(filters)

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

  const getOperators = (type: string) => {
    switch (type) {
      case 'text':
        return textOperators
      case 'number':
        return numberOperators
      case 'date':
        return dateOperators
      default:
        return textOperators
    }
  }

  const addFilter = () => {
    const newFilter: FilterRule = {
      field: fields[0]?.key || '',
      operator: 'contains',
      value: '',
    }
    setActiveFilters([...activeFilters, newFilter])
  }

  const removeFilter = (index: number) => {
    const newFilters = activeFilters.filter((_, i) => i !== index)
    setActiveFilters(newFilters)
    onFiltersChange(newFilters)
  }

  const updateFilter = (index: number, updates: Partial<FilterRule>) => {
    const newFilters = [...activeFilters]
    newFilters[index] = { ...newFilters[index], ...updates }
    setActiveFilters(newFilters)
  }

  const applyFilters = () => {
    onFiltersChange(activeFilters)
    setIsOpen(false)
  }

  const clearFilters = () => {
    setActiveFilters([])
    onFiltersChange([])
  }

  const getFieldType = (fieldKey: string) => {
    return fields.find(f => f.key === fieldKey)?.type || 'text'
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="btn btn-secondary flex items-center gap-2"
      >
        <Filter className="w-4 h-4" />
        <span>פילטרים מתקדמים</span>
        {filters.length > 0 && (
          <span className="bg-primary-600 text-white text-xs px-2 py-0.5 rounded-full">
            {filters.length}
          </span>
        )}
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-elegant border border-gray-200 p-4 z-50 min-w-[600px] max-w-[800px] max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">פילטרים מתקדמים</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              {activeFilters.map((filter, index) => {
                const field = fields.find(f => f.key === filter.field)
                const fieldType = getFieldType(filter.field)
                const operators = getOperators(fieldType)
                const showValue2 = filter.operator === 'between'

                return (
                  <div key={index} className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1 grid grid-cols-12 gap-2">
                      {/* Field */}
                      <select
                        className="input col-span-4"
                        value={filter.field}
                        onChange={(e) => updateFilter(index, { field: e.target.value, operator: 'contains', value: '' })}
                      >
                        {fields.map(f => (
                          <option key={f.key} value={f.key}>{f.label}</option>
                        ))}
                      </select>

                      {/* Operator */}
                      <select
                        className="input col-span-3"
                        value={filter.operator}
                        onChange={(e) => updateFilter(index, { operator: e.target.value, value: '', value2: undefined })}
                      >
                        {operators.map(op => (
                          <option key={op.value} value={op.value}>{op.label}</option>
                        ))}
                      </select>

                      {/* Value */}
                      {!['is_empty', 'is_not_empty'].includes(filter.operator) && (
                        <>
                          {fieldType === 'select' && field?.options ? (
                            <select
                              className="input col-span-4"
                              value={filter.value as string || ''}
                              onChange={(e) => updateFilter(index, { value: e.target.value })}
                            >
                              <option value="">בחר...</option>
                              {field.options.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                              ))}
                            </select>
                          ) : fieldType === 'date' ? (
                            <input
                              type="date"
                              className="input col-span-4"
                              value={filter.value as string || ''}
                              onChange={(e) => updateFilter(index, { value: e.target.value })}
                            />
                          ) : fieldType === 'number' ? (
                            <input
                              type="number"
                              className="input col-span-4"
                              value={filter.value as number || ''}
                              onChange={(e) => updateFilter(index, { value: e.target.value ? parseFloat(e.target.value) : null })}
                              placeholder="מספר"
                            />
                          ) : (
                            <input
                              type="text"
                              className="input col-span-4"
                              value={filter.value as string || ''}
                              onChange={(e) => updateFilter(index, { value: e.target.value })}
                              placeholder="ערך"
                            />
                          )}
                        </>
                      )}

                      {/* Value 2 (for "between") */}
                      {showValue2 && (
                        <>
                          {fieldType === 'date' ? (
                            <input
                              type="date"
                              className="input col-span-4"
                              value={filter.value2 as string || ''}
                              onChange={(e) => updateFilter(index, { value2: e.target.value })}
                            />
                          ) : fieldType === 'number' ? (
                            <input
                              type="number"
                              className="input col-span-4"
                              value={filter.value2 as number || ''}
                              onChange={(e) => updateFilter(index, { value2: e.target.value ? parseFloat(e.target.value) : null })}
                              placeholder="עד"
                            />
                          ) : null}
                        </>
                      )}

                      {/* Remove button */}
                      <button
                        onClick={() => removeFilter(index)}
                        className="p-2 hover:bg-red-50 text-red-600 rounded transition-colors col-span-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <button
                onClick={addFilter}
                className="btn btn-secondary text-sm"
              >
                + הוסף פילטר
              </button>
              <div className="flex gap-2">
                {activeFilters.length > 0 && (
                  <button
                    onClick={clearFilters}
                    className="btn btn-secondary text-sm"
                  >
                    נקה הכל
                  </button>
                )}
                <button
                  onClick={applyFilters}
                  className="btn btn-primary text-sm"
                >
                  החל פילטרים
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

