import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { Family, Support, SupportRequest, Child } from '../lib/database.types'

// Export families to Excel
export function exportFamiliesToExcel(families: Family[], children: Child[]) {
  const workbook = XLSX.utils.book_new()
  
  // Families sheet
  const familiesData = families.map(f => ({
    'מזהה': f.id,
    'שם משפחה': f.husband_last_name,
    'שם פרטי בעל': f.husband_first_name || '',
    'ת.ז. בעל': f.husband_id_number || '',
    'טלפון בעל': f.husband_phone || '',
    'שם פרטי אשה': f.wife_first_name || '',
    'ת.ז. אשה': f.wife_id_number || '',
    'טלפון אשה': f.wife_phone || '',
    'טלפון בית': f.home_phone || '',
    'עיר': '', // Will be filled from join
    'רחוב': '', // Will be filled from join
    'מספר בית': f.house_number || '',
    'סטטוס': f.status === 'active' ? 'פעיל' : f.status === 'inactive' ? 'לא פעיל' : 'ממתין',
    'תאריך יצירה': new Date(f.created_at).toLocaleDateString('he-IL'),
  }))
  
  const familiesSheet = XLSX.utils.json_to_sheet(familiesData)
  XLSX.utils.book_append_sheet(workbook, familiesSheet, 'משפחות')
  
  // Children sheet
  const childrenData = children.map(c => ({
    'מזהה': c.id,
    'מזהה משפחה': c.family_id,
    'שם פרטי': c.first_name,
    'שם משפחה': c.last_name || '',
    'ת.ז.': c.id_number || '',
    'תאריך לידה': c.birth_date ? new Date(c.birth_date).toLocaleDateString('he-IL') : '',
    'מגדר': c.gender === 'male' ? 'זכר' : c.gender === 'female' ? 'נקבה' : '',
    'מוסד לימודים': c.school || '',
    'שכ"ל חודשי': c.tuition_fee || 0,
  }))
  
  const childrenSheet = XLSX.utils.json_to_sheet(childrenData)
  XLSX.utils.book_append_sheet(workbook, childrenSheet, 'ילדים')
  
  // Write file
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  saveAs(blob, `משפחות_${new Date().toISOString().split('T')[0]}.xlsx`)
}

// Export supports to Excel
export function exportSupportsToExcel(supports: any[]) {
  const data = supports.map(s => ({
    'מזהה': s.id,
    'משפחה': s.families ? `${s.families.husband_first_name} ${s.families.husband_last_name}` : '',
    'סוג תמיכה': s.support_types?.name || '',
    'פרויקט': s.projects?.name || '',
    'סכום': s.amount,
    'תאריך': new Date(s.support_date).toLocaleDateString('he-IL'),
    'אופן מתן': s.payment_method === 'transfer' ? 'העברה' : 
                s.payment_method === 'check' ? 'שיק' :
                s.payment_method === 'cash' ? 'מזומן' :
                s.payment_method === 'voucher' ? 'שובר' : 'אחר',
    'סטטוס': s.status === 'completed' ? 'בוצע' : s.status === 'pending' ? 'ממתין' : 'בוטל',
    'תיאור': s.description || '',
  }))
  
  const worksheet = XLSX.utils.json_to_sheet(data)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'תמיכות')
  
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  saveAs(blob, `תמיכות_${new Date().toISOString().split('T')[0]}.xlsx`)
}

// Export to CSV
export function exportToCSV(data: any[], filename: string) {
  const csv = Papa.unparse(data)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  saveAs(blob, `${filename}_${new Date().toISOString().split('T')[0]}.csv`)
}

// Export to PDF
export function exportFamiliesToPDF(families: Family[]) {
  const doc = new jsPDF('rtl', 'mm', 'a4')
  
  // Title
  doc.setFontSize(20)
  doc.text('דוח משפחות - קופת טוב וחסד', 105, 15, { align: 'center' })
  
  doc.setFontSize(12)
  doc.text(`תאריך: ${new Date().toLocaleDateString('he-IL')}`, 105, 25, { align: 'center' })
  
  // Table data
  const tableData = families.map(f => [
    f.husband_last_name || '',
    f.husband_first_name || '',
    f.husband_phone || '',
    f.wife_first_name || '',
    f.status === 'active' ? 'פעיל' : f.status === 'inactive' ? 'לא פעיל' : 'ממתין',
  ])
  
  autoTable(doc, {
    head: [['שם משפחה', 'בעל', 'טלפון', 'אשה', 'סטטוס']],
    body: tableData,
    startY: 35,
    styles: { font: 'Arial', fontSize: 10, halign: 'right' },
    headStyles: { fillColor: [0, 115, 197], textColor: 255 },
  })
  
  doc.save(`משפחות_${new Date().toISOString().split('T')[0]}.pdf`)
}

import Papa from 'papaparse'

// Parse CSV file
export function parseCSV(file: File): Promise<any[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        resolve(results.data as any[])
      },
      error: (error) => {
        reject(error)
      }
    })
  })
}

// Parse Excel file
export function parseExcel(file: File): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array' })
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
        const jsonData = XLSX.utils.sheet_to_json(firstSheet)
        resolve(jsonData)
      } catch (error) {
        reject(error)
      }
    }
    reader.onerror = reject
    reader.readAsArrayBuffer(file)
  })
}

