import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Download, FileSpreadsheet, FileText, FileJson, Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { exportFamiliesToExcel, exportSupportsToExcel, exportFamiliesToPDF, exportToCSV } from '../utils/export'

export default function Export() {
  const [exporting, setExporting] = useState<string | null>(null)

  const { data: families } = useQuery({
    queryKey: ['export-families'],
    queryFn: async () => {
      const { data } = await supabase
        .from('families')
        .select('*')
        .order('created_at', { ascending: false })
      return data || []
    }
  })

  const { data: children } = useQuery({
    queryKey: ['export-children'],
    queryFn: async () => {
      const { data } = await supabase
        .from('children')
        .select('*')
      return data || []
    }
  })

  const { data: supports } = useQuery({
    queryKey: ['export-supports'],
    queryFn: async () => {
      const { data } = await supabase
        .from('supports')
        .select(`
          *,
          families (husband_first_name, husband_last_name),
          support_types (name),
          projects (name)
        `)
        .order('support_date', { ascending: false })
      return data || []
    }
  })

  const { data: requests } = useQuery({
    queryKey: ['export-requests'],
    queryFn: async () => {
      const { data } = await supabase
        .from('support_requests')
        .select(`
          *,
          families (husband_first_name, husband_last_name)
        `)
        .order('created_at', { ascending: false })
      return data || []
    }
  })

  const handleExport = async (type: string, format: string) => {
    setExporting(`${type}-${format}`)
    
    try {
      await new Promise(resolve => setTimeout(resolve, 100)) // Small delay for UI
      
      switch (type) {
        case 'families':
          if (format === 'excel') {
            exportFamiliesToExcel(families || [], children || [])
          } else if (format === 'pdf') {
            exportFamiliesToPDF(families || [])
          } else if (format === 'csv') {
            exportToCSV(families || [], 'משפחות')
          }
          break
          
        case 'supports':
          if (format === 'excel') {
            exportSupportsToExcel(supports || [])
          } else if (format === 'csv') {
            exportToCSV(supports || [], 'תמיכות')
          }
          break
          
        case 'requests':
          if (format === 'excel') {
            const data = (requests || []).map((r: any) => ({
              'מזהה': r.id,
              'משפחה': r.families ? `${r.families.husband_first_name} ${r.families.husband_last_name}` : '',
              'תאריך בקשה': new Date(r.request_date).toLocaleDateString('he-IL'),
              'מטרה': r.purpose || '',
              'סכום מבוקש': r.requested_amount || 0,
              'סטטוס': r.status === 'new' ? 'חדש' : 
                       r.status === 'in_review' ? 'בטיפול' :
                       r.status === 'approved' ? 'אושר' :
                       r.status === 'rejected' ? 'נדחה' : 'הושלם',
            }))
            exportToCSV(data, 'בקשות_תמיכה')
          } else if (format === 'csv') {
            exportToCSV(requests || [], 'בקשות_תמיכה')
          }
          break
      }
    } catch (error) {
      console.error('Export error:', error)
      alert('שגיאה בייצוא. נסה שוב.')
    } finally {
      setExporting(null)
    }
  }

  const exportOptions = [
    {
      title: 'משפחות',
      description: 'ייצוא כל המשפחות עם ילדים',
      count: families?.length || 0,
      options: [
        { format: 'excel', label: 'Excel', icon: FileSpreadsheet },
        { format: 'pdf', label: 'PDF', icon: FileText },
        { format: 'csv', label: 'CSV', icon: FileJson },
      ]
    },
    {
      title: 'תמיכות',
      description: 'ייצוא כל התמיכות שניתנו',
      count: supports?.length || 0,
      options: [
        { format: 'excel', label: 'Excel', icon: FileSpreadsheet },
        { format: 'csv', label: 'CSV', icon: FileJson },
      ]
    },
    {
      title: 'בקשות תמיכה',
      description: 'ייצוא כל הבקשות',
      count: requests?.length || 0,
      options: [
        { format: 'excel', label: 'Excel', icon: FileSpreadsheet },
        { format: 'csv', label: 'CSV', icon: FileJson },
      ]
    },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-hebrew font-bold text-gray-900">ייצוא נתונים</h1>
        <p className="text-gray-500 mt-1 text-sm sm:text-base">ייצא נתונים מהמערכת בפורמטים שונים</p>
      </div>

      {/* Export Options */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {exportOptions.map((option) => (
          <div key={option.title} className="card">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{option.title}</h3>
                <p className="text-sm text-gray-500 mt-1">{option.description}</p>
              </div>
              <span className="badge badge-info">{option.count} רשומות</span>
            </div>

            <div className="space-y-2">
              {option.options.map((opt) => {
                const Icon = opt.icon
                const isExporting = exporting === `${option.title.toLowerCase()}-${opt.format}`
                
                return (
                  <button
                    key={opt.format}
                    onClick={() => handleExport(option.title.toLowerCase().replace(' ', '_'), opt.format)}
                    disabled={isExporting || (option.count === 0)}
                    className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-5 h-5 text-primary-600" />
                      <span className="font-medium">{opt.label}</span>
                    </div>
                    {isExporting ? (
                      <Loader2 className="w-4 h-4 animate-spin text-primary-600" />
                    ) : (
                      <Download className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Info */}
      <div className="card bg-blue-50 border border-blue-100">
        <h3 className="font-semibold text-blue-900 mb-2">מידע על ייצוא</h3>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>Excel - מתאים לעריכה ב-Microsoft Excel או Google Sheets</li>
          <li>PDF - מתאים להדפסה ושיתוף</li>
          <li>CSV - מתאים לייבוא למערכות אחרות</li>
          <li>כל הקבצים נשמרים עם תאריך ביצוא</li>
        </ul>
      </div>
    </div>
  )
}

