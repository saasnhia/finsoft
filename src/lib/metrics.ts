/**
 * Performance Metrics Logger
 * Tracks extraction performance for monitoring and optimization.
 */

import { createClient } from '@/lib/supabase/server'

export interface PerformanceMetrics {
  user_id?: string
  extraction_time_ms: number
  confidence_score: number
  method: 'regex' | 'ai_local' | 'hybrid'
  success: boolean
  file_type?: string
  file_size_bytes?: number
  error_message?: string
}

/**
 * Log extraction performance metrics to the database.
 * Fails silently to avoid impacting user operations.
 */
export async function logMetrics(metrics: PerformanceMetrics): Promise<void> {
  try {
    const supabase = await createClient()
    await supabase.from('performance_metrics').insert({
      user_id: metrics.user_id || null,
      extraction_time_ms: metrics.extraction_time_ms,
      confidence_score: metrics.confidence_score,
      method: metrics.method,
      success: metrics.success,
      file_type: metrics.file_type || null,
      file_size_bytes: metrics.file_size_bytes || null,
      error_message: metrics.error_message || null,
    })
  } catch (error) {
    console.error('[Metrics] Failed to log:', error instanceof Error ? error.message : error)
  }
}

/**
 * Simple timer utility for measuring extraction duration.
 */
export function startTimer(): () => number {
  const start = performance.now()
  return () => Math.round(performance.now() - start)
}
