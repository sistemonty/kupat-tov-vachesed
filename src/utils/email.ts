import { supabase } from '../lib/supabase'

export interface EmailOptions {
  to: string | string[]
  subject: string
  html?: string
  text?: string
  template?: 'notification' | 'approval' | 'report' | 'reminder'
  data?: Record<string, any>
}

export async function sendEmail(options: EmailOptions) {
  try {
    const { data, error } = await supabase.functions.invoke('resend-email', {
      body: {
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
        template: options.template,
        data: options.data,
      },
    })

    if (error) {
      console.error('Email error:', error)
      throw error
    }

    return data
  } catch (error) {
    console.error('Failed to send email:', error)
    throw error
  }
}

// Helper functions for common email types
export async function sendApprovalEmail(familyEmail: string, familyName: string, amount: number, date: string) {
  return sendEmail({
    to: familyEmail,
    subject: 'בקשת התמיכה שלך אושרה - קופת טוב וחסד',
    template: 'approval',
    data: {
      familyName,
      amount,
      date,
    },
  })
}

export async function sendReminderEmail(to: string, message: string) {
  return sendEmail({
    to,
    subject: 'תזכורת - קופת טוב וחסד',
    template: 'reminder',
    data: {
      message,
    },
  })
}

export async function sendNotificationEmail(to: string, message: string) {
  return sendEmail({
    to,
    subject: 'עדכון מהמערכת - קופת טוב וחסד',
    template: 'notification',
    data: {
      message,
    },
  })
}

export async function sendReportEmail(to: string, reportHtml: string) {
  return sendEmail({
    to,
    subject: 'דוח חודשי - קופת טוב וחסד',
    template: 'report',
    data: {
      report: reportHtml,
    },
  })
}

