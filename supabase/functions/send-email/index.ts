import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const FROM_EMAIL = Deno.env.get('FROM_EMAIL') || 'noreply@kupat-tov-vachesed.co.il'

interface EmailRequest {
  to: string | string[]
  subject: string
  html: string
  text?: string
  template?: 'notification' | 'approval' | 'report' | 'reminder'
  data?: Record<string, any>
}

Deno.serve(async (req: Request) => {
  // CORS headers
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  try {
    const { to, subject, html, text, template, data } = await req.json() as EmailRequest

    if (!to || !subject || !html) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: to, subject, html' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Generate HTML from template if provided
    let finalHtml = html
    if (template && data) {
      finalHtml = generateTemplate(template, data)
    }

    // Send email via Resend
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: Array.isArray(to) ? to : [to],
        subject,
        html: finalHtml,
        text: text || stripHtml(finalHtml),
      }),
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.message || 'Failed to send email')
    }

    return new Response(
      JSON.stringify({ success: true, id: result.id }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    )
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    )
  }
})

function generateTemplate(template: string, data: Record<string, any>): string {
  const templates: Record<string, string> = {
    notification: `
      <!DOCTYPE html>
      <html dir="rtl" lang="he">
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; direction: rtl; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #0073c5; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9fafb; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>קופת טוב וחסד</h1>
          </div>
          <div class="content">
            ${data.message || ''}
          </div>
          <div class="footer">
            © ${new Date().getFullYear()} קופת טוב וחסד
          </div>
        </div>
      </body>
      </html>
    `,
    approval: `
      <!DOCTYPE html>
      <html dir="rtl" lang="he">
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; direction: rtl; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #10b981; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9fafb; }
          .info { background: white; padding: 15px; margin: 10px 0; border-radius: 8px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ בקשה אושרה</h1>
          </div>
          <div class="content">
            <p>שלום ${data.familyName || ''},</p>
            <p>בקשת התמיכה שלך אושרה!</p>
            <div class="info">
              <p><strong>סכום מאושר:</strong> ₪${data.amount?.toLocaleString() || '0'}</p>
              <p><strong>תאריך:</strong> ${data.date || ''}</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
    reminder: `
      <!DOCTYPE html>
      <html dir="rtl" lang="he">
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; direction: rtl; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f59e0b; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9fafb; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⏰ תזכורת</h1>
          </div>
          <div class="content">
            <p>${data.message || ''}</p>
          </div>
        </div>
      </body>
      </html>
    `,
    report: `
      <!DOCTYPE html>
      <html dir="rtl" lang="he">
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; direction: rtl; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #6366f1; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9fafb; }
          table { width: 100%; border-collapse: collapse; margin: 15px 0; }
          th, td { padding: 10px; text-align: right; border: 1px solid #ddd; }
          th { background: #e5e7eb; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📊 דוח חודשי</h1>
          </div>
          <div class="content">
            ${data.report || ''}
          </div>
        </div>
      </body>
      </html>
    `,
  }

  let html = templates[template] || templates.notification
  
  // Replace placeholders
  Object.keys(data).forEach(key => {
    html = html.replace(new RegExp(`\\$\\{${key}\\}`, 'g'), data[key])
  })

  return html
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ')
}

