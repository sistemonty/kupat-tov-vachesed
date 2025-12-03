import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Upload, FileSpreadsheet, FileJson, CheckCircle, XCircle, Loader2, AlertCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { parseExcel, parseCSV } from '../utils/export'

type ImportType = 'families' | 'children' | 'supports'

export default function Import() {
  const [importType, setImportType] = useState<ImportType>('families')
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<any[]>([])
  const [errors, setErrors] = useState<string[]>([])
  const queryClient = useQueryClient()

  const importMutation = useMutation({
    mutationFn: async (data: any[]) => {
      let inserted = 0
      let errors: string[] = []

      switch (importType) {
        case 'families':
          for (const row of data) {
            try {
              const familyData: any = {
                husband_last_name: row['שם משפחה'] || row['שם_משפחה'] || '',
                husband_first_name: row['שם פרטי בעל'] || row['שם_פרטי_בעל'] || '',
                husband_id_number: row['ת.ז. בעל'] || row['תז_בעל'] || '',
                husband_phone: row['טלפון בעל'] || row['טלפון_בעל'] || '',
                wife_first_name: row['שם פרטי אשה'] || row['שם_פרטי_אשה'] || '',
                wife_id_number: row['ת.ז. אשה'] || row['תז_אשה'] || '',
                wife_phone: row['טלפון אשה'] || row['טלפון_אשה'] || '',
                home_phone: row['טלפון בית'] || row['טלפון_בית'] || '',
                house_number: row['מספר בית'] || row['מספר_בית'] || '',
                status: row['סטטוס'] === 'פעיל' ? 'active' : 
                       row['סטטוס'] === 'לא פעיל' ? 'inactive' : 'pending',
              }

              const { error } = await supabase
                .from('families')
                .insert(familyData)

              if (error) {
                errors.push(`שורה ${inserted + 1}: ${error.message}`)
              } else {
                inserted++
              }
            } catch (err: any) {
              errors.push(`שורה ${inserted + 1}: ${err.message}`)
            }
          }
          break

        case 'children':
          for (const row of data) {
            try {
              // Need family_id - will need to match by name or ID
              const familyId = row['מזהה משפחה'] || row['מזהה_משפחה']
              
              if (!familyId) {
                errors.push(`שורה ${inserted + 1}: חסר מזהה משפחה`)
                continue
              }

              const childData: any = {
                family_id: familyId,
                first_name: row['שם פרטי'] || row['שם_פרטי'] || '',
                last_name: row['שם משפחה'] || row['שם_משפחה'] || '',
                id_number: row['ת.ז.'] || row['תז'] || '',
                birth_date: row['תאריך לידה'] || row['תאריך_לידה'] || null,
                gender: row['מגדר'] === 'זכר' ? 'male' : row['מגדר'] === 'נקבה' ? 'female' : null,
                school: row['מוסד לימודים'] || row['מוסד_לימודים'] || '',
                tuition_fee: parseFloat(row['שכ"ל חודשי'] || row['שכל_חודשי'] || '0') || 0,
              }

              const { error } = await supabase
                .from('children')
                .insert(childData)

              if (error) {
                errors.push(`שורה ${inserted + 1}: ${error.message}`)
              } else {
                inserted++
              }
            } catch (err: any) {
              errors.push(`שורה ${inserted + 1}: ${err.message}`)
            }
          }
          break
      }

      return { inserted, errors }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['families'] })
      queryClient.invalidateQueries({ queryKey: ['children'] })
      queryClient.invalidateQueries({ queryKey: ['supports'] })
      
      if (result.errors.length > 0) {
        setErrors(result.errors)
      }
      
      alert(`הוכנסו ${result.inserted} רשומות בהצלחה!`)
      setFile(null)
      setPreview([])
    }
  })

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    setFile(selectedFile)
    setErrors([])
    setPreview([])

    try {
      let data: any[] = []
      
      if (selectedFile.name.endsWith('.xlsx') || selectedFile.name.endsWith('.xls')) {
        data = await parseExcel(selectedFile)
      } else if (selectedFile.name.endsWith('.csv')) {
        data = await parseCSV(selectedFile)
      } else {
        alert('קובץ לא נתמך. השתמש ב-Excel (.xlsx) או CSV (.csv)')
        return
      }

      setPreview(data.slice(0, 5)) // Show first 5 rows
    } catch (error) {
      console.error('Parse error:', error)
      alert('שגיאה בקריאת הקובץ')
    }
  }

  const handleImport = () => {
    if (!file || preview.length === 0) {
      alert('בחר קובץ תחילה')
      return
    }

    if (!confirm(`האם להכניס ${preview.length} רשומות?`)) {
      return
    }

    // Re-parse the full file
    const parseFile = async () => {
      try {
        let data: any[] = []
        
        if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
          data = await parseExcel(file)
        } else if (file.name.endsWith('.csv')) {
          data = await parseCSV(file)
        }

        importMutation.mutate(data)
      } catch (error) {
        alert('שגיאה בקריאת הקובץ')
      }
    }

    parseFile()
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-hebrew font-bold text-gray-900">יבוא נתונים</h1>
        <p className="text-gray-500 mt-1 text-sm sm:text-base">העלה קבצי Excel או CSV להכנסה למערכת</p>
      </div>

      {/* Import Type Selection */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">סוג יבוא</h2>
        <div className="flex gap-4">
          {[
            { value: 'families', label: 'משפחות' },
            { value: 'children', label: 'ילדים' },
            { value: 'supports', label: 'תמיכות' },
          ].map((type) => (
            <label key={type.value} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="importType"
                value={type.value}
                checked={importType === type.value}
                onChange={(e) => setImportType(e.target.value as ImportType)}
                className="w-4 h-4 text-primary-600"
              />
              <span>{type.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* File Upload */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">בחר קובץ</h2>
        
        <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-primary-400 transition-colors">
          <input
            type="file"
            id="file-upload"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileSelect}
            className="hidden"
          />
          <label htmlFor="file-upload" className="cursor-pointer">
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">
              לחץ לבחירת קובץ או גרור לכאן
            </p>
            <p className="text-sm text-gray-400">
              תמיכה ב-Excel (.xlsx, .xls) ו-CSV (.csv)
            </p>
          </label>
        </div>

        {file && (
          <div className="mt-4 p-4 bg-gray-50 rounded-xl">
            <div className="flex items-center gap-3">
              {file.name.endsWith('.csv') ? (
                <FileJson className="w-5 h-5 text-green-600" />
              ) : (
                <FileSpreadsheet className="w-5 h-5 text-blue-600" />
              )}
              <div className="flex-1">
                <p className="font-medium">{file.name}</p>
                <p className="text-sm text-gray-500">
                  {(file.size / 1024).toFixed(2)} KB
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Preview */}
      {preview.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            תצוגה מקדימה ({preview.length} שורות ראשונות)
          </h2>
          
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  {Object.keys(preview[0] || {}).map((key) => (
                    <th key={key}>{key}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.map((row, idx) => (
                  <tr key={idx}>
                    {Object.values(row).map((val: any, i) => (
                      <td key={i}>{String(val || '')}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            onClick={handleImport}
            disabled={importMutation.isPending}
            className="btn btn-primary w-full mt-4"
          >
            {importMutation.isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Upload className="w-5 h-5" />
            )}
            <span>הכנס למערכת</span>
          </button>
        </div>
      )}

      {/* Errors */}
      {errors.length > 0 && (
        <div className="card bg-red-50 border border-red-100">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <h3 className="font-semibold text-red-900">שגיאות ביבוא</h3>
          </div>
          <ul className="text-sm text-red-800 space-y-1 max-h-60 overflow-y-auto">
            {errors.map((error, idx) => (
              <li key={idx}>• {error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Instructions */}
      <div className="card bg-blue-50 border border-blue-100">
        <h3 className="font-semibold text-blue-900 mb-3">הוראות יבוא</h3>
        <div className="text-sm text-blue-800 space-y-2">
          <p><strong>למשפחות:</strong> הקובץ צריך לכלול עמודות: שם משפחה, שם פרטי בעל, טלפון בעל, וכו'</p>
          <p><strong>לילדים:</strong> הקובץ צריך לכלול: מזהה משפחה, שם פרטי, תאריך לידה, וכו'</p>
          <p><strong>פורמט:</strong> Excel או CSV עם כותרות בעברית</p>
          <p><strong>קידוד:</strong> UTF-8 (עברית תתמוך)</p>
        </div>
      </div>
    </div>
  )
}

