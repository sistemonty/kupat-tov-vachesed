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
      // Extract error message from Supabase error
      const errorMessage = error.message || error.error?.message || 'Failed to send email'
      const errorDetails = error.error?.details || error.error
      throw new Error(errorDetails ? `${errorMessage}: ${JSON.stringify(errorDetails)}` : errorMessage)
    }

    // Check if response has error
    if (data && data.error) {
      throw new Error(data.error + (data.details ? `: ${JSON.stringify(data.details)}` : ''))
    }

    return data
  } catch (error: any) {
    console.error('Failed to send email:', error)
    // Re-throw with better error message
    if (error.message) {
      throw error
    }
    throw new Error(error.toString() || 'Failed to send email')
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

