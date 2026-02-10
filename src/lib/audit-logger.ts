/**
 * Audit Logger — Tracks user actions for compliance (RGPD, ISO 27001).
 */

import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'

export type AuditAction = 'login' | 'logout' | 'view' | 'create' | 'update' | 'delete' | 'export' | 'upload' | 'send_email'
export type ResourceType = 'facture' | 'transaction' | 'client' | 'declaration_tva' | 'rappel' | 'bank_account' | 'user' | 'fec'

interface AuditLogParams {
  user_id: string
  action: AuditAction
  resource_type: ResourceType
  resource_id?: string
  details?: Record<string, unknown>
  req?: NextRequest
}

/**
 * Log an audit event to the database.
 * Fails silently to avoid blocking business operations.
 */
export async function logAudit(params: AuditLogParams): Promise<void> {
  try {
    const supabase = await createClient()

    const ip_address = params.req
      ? params.req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        params.req.headers.get('x-real-ip') ||
        'unknown'
      : 'server'

    const user_agent = params.req
      ? params.req.headers.get('user-agent') || 'unknown'
      : 'server'

    await supabase.from('audit_logs').insert({
      user_id: params.user_id,
      action: params.action,
      resource_type: params.resource_type,
      resource_id: params.resource_id || null,
      ip_address,
      user_agent: user_agent.substring(0, 500),
      details: params.details || null,
    })
  } catch (error) {
    // Silent fail — audit logging should never block business operations
    console.error('[Audit] Failed to log:', error instanceof Error ? error.message : error)
  }
}
