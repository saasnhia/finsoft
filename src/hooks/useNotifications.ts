'use client'

import { useState, useEffect, useCallback } from 'react'
import type { FactureEnRetard, NotificationStats, Client, FactureClient, RappelEmail } from '@/types'

export function useNotifications(userId: string | undefined) {
  const [overdueInvoices, setOverdueInvoices] = useState<FactureEnRetard[]>([])
  const [stats, setStats] = useState<NotificationStats | null>(null)
  const [clients, setClients] = useState<Client[]>([])
  const [factures, setFactures] = useState<FactureClient[]>([])
  const [rappels, setRappels] = useState<RappelEmail[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // ─── Fetch overdue invoices + stats ───
  const fetchOverdue = useCallback(async () => {
    if (!userId) return
    try {
      const res = await fetch('/api/notifications/overdue')
      const data = await res.json()
      if (data.success) {
        setOverdueInvoices(data.factures || [])
        setStats(data.stats || null)
      }
    } catch {
      setError('Erreur chargement des retards')
    }
  }, [userId])

  // ─── Fetch clients ───
  const fetchClients = useCallback(async () => {
    if (!userId) return
    try {
      const res = await fetch('/api/notifications/clients')
      const data = await res.json()
      if (data.success) setClients(data.clients || [])
    } catch {
      setError('Erreur chargement des clients')
    }
  }, [userId])

  // ─── Fetch all factures ───
  const fetchFactures = useCallback(async () => {
    if (!userId) return
    try {
      const res = await fetch('/api/notifications/factures')
      const data = await res.json()
      if (data.success) setFactures(data.factures || [])
    } catch {
      setError('Erreur chargement des factures')
    }
  }, [userId])

  // ─── Fetch rappels history ───
  const fetchRappels = useCallback(async () => {
    if (!userId) return
    try {
      const res = await fetch('/api/notifications/rappels')
      const data = await res.json()
      if (data.success) setRappels(data.rappels || [])
    } catch {
      // Route may not exist yet, silently fail
    }
  }, [userId])

  // ─── Create client ───
  const createClient = useCallback(async (clientData: Partial<Client>) => {
    const res = await fetch('/api/notifications/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(clientData),
    })
    const data = await res.json()
    if (!data.success) throw new Error(data.error)
    await fetchClients()
    return data.client
  }, [fetchClients])

  // ─── Create facture client ───
  const createFacture = useCallback(async (factureData: Record<string, unknown>) => {
    const res = await fetch('/api/notifications/factures', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(factureData),
    })
    const data = await res.json()
    if (!data.success) throw new Error(data.error)
    await Promise.all([fetchFactures(), fetchOverdue()])
    return data.facture
  }, [fetchFactures, fetchOverdue])

  // ─── Update facture (paiement, statut) ───
  const updateFacture = useCallback(async (factureId: string, updates: Record<string, unknown>) => {
    const res = await fetch(`/api/notifications/factures/${factureId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
    const data = await res.json()
    if (!data.success) throw new Error(data.error)
    await Promise.all([fetchFactures(), fetchOverdue()])
    return data.facture
  }, [fetchFactures, fetchOverdue])

  // ─── Send reminder email ───
  const sendReminder = useCallback(async (factureClientId: string, typeRappel?: string) => {
    const res = await fetch('/api/notifications/send-reminder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ facture_client_id: factureClientId, type_rappel: typeRappel }),
    })
    const data = await res.json()
    if (!data.success) throw new Error(data.error)
    await Promise.all([fetchOverdue(), fetchRappels()])
    return data.rappel
  }, [fetchOverdue, fetchRappels])

  // ─── Delete facture ───
  const deleteFacture = useCallback(async (factureId: string) => {
    const res = await fetch(`/api/notifications/factures/${factureId}`, { method: 'DELETE' })
    const data = await res.json()
    if (!data.success) throw new Error(data.error)
    await Promise.all([fetchFactures(), fetchOverdue()])
  }, [fetchFactures, fetchOverdue])

  // ─── Initial load ───
  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }

    setLoading(true)
    Promise.all([fetchOverdue(), fetchClients(), fetchFactures(), fetchRappels()])
      .finally(() => setLoading(false))
  }, [userId, fetchOverdue, fetchClients, fetchFactures, fetchRappels])

  return {
    overdueInvoices,
    stats,
    clients,
    factures,
    rappels,
    loading,
    error,
    createClient,
    createFacture,
    updateFacture,
    deleteFacture,
    sendReminder,
    refetch: () => Promise.all([fetchOverdue(), fetchClients(), fetchFactures(), fetchRappels()]),
  }
}
