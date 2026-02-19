'use client'

import { useState, useEffect, useCallback } from 'react'
import { AppShell } from '@/components/layout'
import { Card, Button, Input } from '@/components/ui'
import {
  FolderOpen, Plus, Search, AlertTriangle, CheckCircle,
  Clock, Euro, ArrowRightLeft, X, Building2, ChevronRight,
  Filter, TrendingUp,
} from 'lucide-react'
import Link from 'next/link'
import { useDossier } from '@/contexts/DossierContext'
import { PlanGate } from '@/components/plan/PlanGate'

interface DossierStatut {
  tva_status: 'ok' | 'retard' | 'erreur' | 'inconnu'
  tva_prochaine_echeance?: string | null
  nb_factures_attente: number
  dernier_rapprochement?: string | null
  taux_rapprochement?: number | null
  ca_annuel_estime?: number | null
}

interface DossierFull {
  id: string
  nom: string
  siren?: string | null
  secteur?: string | null
  email?: string | null
  actif: boolean
  created_at: string
  statuts?: DossierStatut | null
}

const TVA_STATUS_CONFIG = {
  ok:      { label: 'TVA OK',        color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
  retard:  { label: 'TVA en retard', color: 'bg-coral-100 text-coral-700',     icon: AlertTriangle },
  erreur:  { label: 'TVA erreur',    color: 'bg-red-100 text-red-700',          icon: AlertTriangle },
  inconnu: { label: 'TVA inconnu',   color: 'bg-navy-100 text-navy-500',        icon: Clock },
}

export default function CabinetPage() {
  const { loadDossiers } = useDossier()
  const [dossiers, setDossiers] = useState<DossierFull[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filtre, setFiltre] = useState<'tous' | 'alertes' | 'ajour'>('tous')
  const [showCreate, setShowCreate] = useState(false)
  const [newNom, setNewNom] = useState('')
  const [newSiren, setNewSiren] = useState('')
  const [creating, setCreating] = useState(false)

  const fetchDossiers = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/dossiers')
      const data = await res.json()
      setDossiers(data.dossiers ?? [])
    } catch { /* silent */ } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchDossiers() }, [fetchDossiers])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newNom.trim()) return
    setCreating(true)
    try {
      const res = await fetch('/api/dossiers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nom: newNom.trim(), siren: newSiren.trim() || null }),
      })
      if (res.ok) {
        setNewNom('')
        setNewSiren('')
        setShowCreate(false)
        await fetchDossiers()
        await loadDossiers()
      }
    } finally { setCreating(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Archiver ce dossier ?')) return
    await fetch(`/api/dossiers/${id}`, { method: 'DELETE' })
    await fetchDossiers()
    await loadDossiers()
  }

  const hasAlerte = (d: DossierFull) =>
    d.statuts?.tva_status === 'retard' ||
    d.statuts?.tva_status === 'erreur' ||
    (d.statuts?.nb_factures_attente ?? 0) > 5

  const filtered = dossiers
    .filter(d => {
      if (search) return d.nom.toLowerCase().includes(search.toLowerCase()) || d.siren?.includes(search)
      return true
    })
    .filter(d => {
      if (filtre === 'alertes') return hasAlerte(d)
      if (filtre === 'ajour') return !hasAlerte(d)
      return true
    })

  const alertCount = dossiers.filter(hasAlerte).length

  // Aggregated KPIs
  const totalCA = dossiers.reduce((s, d) => s + (d.statuts?.ca_annuel_estime ?? 0), 0)
  const totalFactures = dossiers.reduce((s, d) => s + (d.statuts?.nb_factures_attente ?? 0), 0)

  return (
    <AppShell>
      <PlanGate feature="alerts">
        <div className="p-6 max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-display font-bold text-navy-900">
                Mes dossiers clients
              </h1>
              <p className="text-sm text-navy-500 mt-1">
                {dossiers.length} dossier{dossiers.length > 1 ? 's' : ''}
                {alertCount > 0 && (
                  <span className="ml-2 text-coral-600 font-medium">
                    · {alertCount} alerte{alertCount > 1 ? 's' : ''}
                  </span>
                )}
              </p>
            </div>
            <Button
              size="sm"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => setShowCreate(true)}
            >
              Nouveau dossier
            </Button>
          </div>

          {/* KPIs agrégés */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card className="!p-4 text-center">
              <p className="text-2xl font-display font-bold text-navy-900">{dossiers.length}</p>
              <p className="text-xs text-navy-500 mt-1">Dossiers actifs</p>
            </Card>
            <Card className="!p-4 text-center">
              <p className={`text-2xl font-display font-bold ${alertCount > 0 ? 'text-coral-600' : 'text-emerald-600'}`}>
                {alertCount}
              </p>
              <p className="text-xs text-navy-500 mt-1">Alertes</p>
            </Card>
            <Card className="!p-4 text-center">
              <p className="text-2xl font-display font-bold text-navy-900">{totalFactures}</p>
              <p className="text-xs text-navy-500 mt-1">Factures en attente</p>
            </Card>
            <Card className="!p-4 text-center">
              <p className="text-2xl font-display font-bold text-navy-900">
                {totalCA > 0 ? `${(totalCA / 1000).toFixed(0)}k€` : '—'}
              </p>
              <p className="text-xs text-navy-500 mt-1">CA géré estimé</p>
            </Card>
          </div>

          {/* Search + Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Rechercher par nom ou SIREN…"
                className="w-full pl-9 pr-4 py-2 text-sm border border-navy-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400"
              />
            </div>
            <div className="flex gap-2">
              {(['tous', 'alertes', 'ajour'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFiltre(f)}
                  className={`px-3 py-2 text-sm rounded-xl border transition-colors ${
                    filtre === f
                      ? 'bg-emerald-500 text-white border-emerald-500'
                      : 'bg-white text-navy-600 border-navy-200 hover:bg-navy-50'
                  }`}
                >
                  {f === 'tous' ? 'Tous' : f === 'alertes' ? 'Alertes' : 'À jour'}
                </button>
              ))}
            </div>
          </div>

          {/* Modal créer dossier */}
          {showCreate && (
            <>
              <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setShowCreate(false)} />
              <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
                <Card className="w-full max-w-md animate-scale-in">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-display font-bold text-navy-900">Nouveau dossier</h2>
                    <button onClick={() => setShowCreate(false)} className="p-1.5 rounded-lg hover:bg-navy-50">
                      <X className="w-4 h-4 text-navy-500" />
                    </button>
                  </div>
                  <form onSubmit={handleCreate} className="space-y-4">
                    <Input
                      label="Nom du client *"
                      type="text"
                      value={newNom}
                      onChange={e => setNewNom(e.target.value)}
                      placeholder="Cabinet Dupont & Associés"
                      icon={<Building2 className="w-5 h-5" />}
                    />
                    <Input
                      label="SIREN (optionnel)"
                      type="text"
                      value={newSiren}
                      onChange={e => setNewSiren(e.target.value)}
                      placeholder="123 456 789"
                    />
                    <div className="flex gap-3 pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1"
                        onClick={() => setShowCreate(false)}
                      >
                        Annuler
                      </Button>
                      <Button type="submit" className="flex-1" loading={creating}>
                        Créer
                      </Button>
                    </div>
                  </form>
                </Card>
              </div>
            </>
          )}

          {/* Dossiers grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-48 bg-navy-100 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <FolderOpen className="w-12 h-12 text-navy-200 mx-auto mb-3" />
              <p className="text-navy-500">
                {search || filtre !== 'tous' ? 'Aucun dossier ne correspond au filtre.' : 'Aucun dossier créé.'}
              </p>
              {!search && filtre === 'tous' && (
                <button
                  onClick={() => setShowCreate(true)}
                  className="mt-4 text-emerald-600 text-sm font-medium hover:underline"
                >
                  + Créer votre premier dossier
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map(d => {
                const tvaStatus = d.statuts?.tva_status ?? 'inconnu'
                const tvaConfig = TVA_STATUS_CONFIG[tvaStatus]
                const TVAIcon = tvaConfig.icon
                const alerte = hasAlerte(d)

                return (
                  <Card key={d.id} className={`relative transition-shadow hover:shadow-md ${alerte ? 'border-coral-200' : ''}`}>
                    {alerte && (
                      <div className="absolute top-3 right-3">
                        <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-coral-100 text-coral-700">
                          <AlertTriangle className="w-3 h-3" /> ALERTE
                        </span>
                      </div>
                    )}

                    <div className="flex items-start gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-navy-100 flex items-center justify-center flex-shrink-0">
                        <FolderOpen className="w-5 h-5 text-navy-500" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-display font-semibold text-navy-900 truncate pr-8">
                          {d.nom}
                        </h3>
                        {d.siren && (
                          <p className="text-xs text-navy-400 font-mono mt-0.5">SIREN {d.siren}</p>
                        )}
                      </div>
                    </div>

                    {/* Status badges */}
                    <div className="space-y-2 mb-4">
                      <div className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-lg ${tvaConfig.color}`}>
                        <TVAIcon className="w-3.5 h-3.5 flex-shrink-0" />
                        {tvaConfig.label}
                        {d.statuts?.tva_prochaine_echeance && tvaStatus !== 'ok' && (
                          <span className="ml-auto opacity-70">
                            Échéance {new Date(d.statuts.tva_prochaine_echeance).toLocaleDateString('fr-FR')}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-xs text-navy-500">
                        <span className="flex items-center gap-1">
                          <Euro className="w-3.5 h-3.5" />
                          {d.statuts?.nb_factures_attente ?? 0} fact. en attente
                        </span>
                        {d.statuts?.taux_rapprochement != null && (
                          <span className="flex items-center gap-1">
                            <ArrowRightLeft className="w-3.5 h-3.5" />
                            {d.statuts.taux_rapprochement.toFixed(0)}% rappr.
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-3 border-t border-navy-100">
                      <Link
                        href={`/dashboard?dossier=${d.id}`}
                        className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium py-1.5 px-3 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                      >
                        Ouvrir
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                      <button
                        onClick={() => handleDelete(d.id)}
                        className="p-1.5 rounded-lg text-navy-400 hover:bg-navy-50 hover:text-coral-600 transition-colors"
                        title="Archiver"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </PlanGate>
    </AppShell>
  )
}
