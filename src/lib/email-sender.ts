/**
 * Email Sender — Abstraction for Resend (cloud) and SMTP (on-premise)
 *
 * Priority:
 * 1. If RESEND_API_KEY is set → use Resend
 * 2. If SMTP_HOST is set → use nodemailer SMTP
 * 3. Otherwise → log-only mode (no email sent)
 */

import nodemailer from 'nodemailer'

interface SendEmailParams {
  from: string
  to: string[]
  subject: string
  html: string
  text?: string
}

interface SendEmailResult {
  success: boolean
  messageId: string | null
  error: string | null
  provider: 'resend' | 'smtp' | 'none'
}

/**
 * Send an email using the best available provider.
 */
export async function sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
  // 1. Try Resend (cloud mode)
  if (process.env.RESEND_API_KEY) {
    return sendViaResend(params)
  }

  // 2. Try SMTP (on-premise mode)
  if (process.env.SMTP_HOST) {
    return sendViaSMTP(params)
  }

  // 3. No email provider configured
  console.warn('[Email] No email provider configured (set RESEND_API_KEY or SMTP_HOST)')
  return {
    success: false,
    messageId: null,
    error: 'Aucun service email configuré (RESEND_API_KEY ou SMTP_HOST requis)',
    provider: 'none',
  }
}

async function sendViaResend(params: SendEmailParams): Promise<SendEmailResult> {
  try {
    // Dynamic import to avoid requiring resend when using SMTP
    const { Resend } = await import('resend')
    const resend = new Resend(process.env.RESEND_API_KEY)

    const { data, error } = await resend.emails.send({
      from: params.from,
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: params.text,
    })

    if (error) {
      return { success: false, messageId: null, error: error.message, provider: 'resend' }
    }

    return { success: true, messageId: data?.id || null, error: null, provider: 'resend' }
  } catch (e: unknown) {
    return {
      success: false,
      messageId: null,
      error: e instanceof Error ? e.message : 'Resend error',
      provider: 'resend',
    }
  }
}

async function sendViaSMTP(params: SendEmailParams): Promise<SendEmailResult> {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: process.env.SMTP_USER
        ? {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS || '',
          }
        : undefined,
    })

    const info = await transporter.sendMail({
      from: params.from,
      to: params.to.join(', '),
      subject: params.subject,
      html: params.html,
      text: params.text,
    })

    return {
      success: true,
      messageId: info.messageId || null,
      error: null,
      provider: 'smtp',
    }
  } catch (e: unknown) {
    return {
      success: false,
      messageId: null,
      error: e instanceof Error ? e.message : 'SMTP error',
      provider: 'smtp',
    }
  }
}
