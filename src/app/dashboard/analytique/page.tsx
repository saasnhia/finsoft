'use client'

import { useState, useEffect } from 'react'
import { AppShell } from '@/components/layout'
import { Card } from '@/components/ui'
import { useAuth } from '@/hooks/useAuth'
import { useUserPlan } from '@/hooks/useUserPlan'
import { createClient } from '@/lib/supabase/client'
import {
  PieChart, Plus, Trash2, AlertCircle, BarChart3, ChevronDown, ChevronUp,
} from 'lucide-react'
import Link from 'next/link'

// ─── Types ────────────────────────────────────────────────────────────────────

interface AxeAnalytique {
  id: string
  nom: string
  created_at: string
}

interface CodeAnalytique {
  id: string
  axe_id: string
  code: string
  libelle: string
  created_at: string
}

interface Affectation {
  id: string
  code_analytique_id: string
  pourcentage: number
  montant: number
  created_at: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(n: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)
}

// ─── Plan banner ──────────────────────────────────────────────────────────────

function PlanRequiredBanner({ required, current }: { required: string; current: string }) {
  return (
    <div className="flex items-center gap-4 p-4 bg-amber-50 border border-amber-200 rounded-xl mb-6">
      <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
      <div className="flex-1">
        <p className="text-sm font-semibold text-amber-800">
          Cette fonctionnalité est disponible à partir du plan {required}.
        </p>
        <p className="text-xs text-amber-600 mt-0.5">Votre plan actuel : {current}</p>
      </div>
      <Link href="/#pricing" className="px-3 py-1.5 bg-amber-600 text-white text-xs font-semibold rounded-lg hover:bg-amber-700 transition-colors">
        Mettre à niveau →
      </Link>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AnalytiquePage() {
  const { user } = useAuth()
  const { plan, loading: planLoading } = useUserPlan()
  const [axes, setAxes] = useState<AxeAnalytique[]>([])
  const [codes, setCodes] = useState<CodeAnalytique[]>([])
  const [affectations, setAffectations] = useState<Affectation[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedAxe, setExpandedAxe] = useState<string | null>(null)

  const [showAddAxe, setShowAddAxe] = useState(false)
  const [showAddCode, setShowAddCode] = useState<string | null>(null)
  const [showAddAffectation, setShowAddAffectation] = useState(false)

  const [axeForm, setAxeForm] = useState({ nom: '' })
  const [codeForm, setCodeForm] = useState({ code: '', libelle: '' })
  const [affForm, setAffForm] = useState({ code_analytique_id: '', pourcentage: '100', montant: '' })

  const [filterAxe, setFilterAxe] = useState('Tous')
  const [filterPeriode, setFilterPeriode] = useState('all')

  useEffect(() => {
    if (!user) return
    const supabase = createClient()
    void (async () => {
      const [axesRes, codesRes, affRes] = await Promise.all([
        supabase.from('axes_analytiques').select('*').eq('user_id', user.id).order('created_at'),
        supabase.from('codes_analytiques').select('*, axes_analytiques!inner(user_id)').eq('axes_analytiques.user_id', user.id),
        supabase.from('affectations_analytiques').select('*').order('created_at', { ascending: false }).limit(200),
      ])
      setAxes((axesRes.data ?? []) as AxeAnalytique[])
      setCodes((codesRes.data ?? []) as CodeAnalytique[])
      setAffectations((affRes.data ?? []) as Affectation[])
      setLoading(false)
    })()
  }, [user])

  const handleAddAxe = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    const supabase = createClient()
    const { data } = await supabase.from('axes_analytiques').insert({ user_id: user.id, nom: axeForm.nom }).select().single()
    if (data) {
      setAxes(prev => [...prev, data as AxeAnalytique])
      setShowAddAxe(false)
      setAxeForm({ nom: '' })
    }
  }

  const handleAddCode = async (e: React.FormEvent, axeId: string) => {
    e.preventDefault()
    const supabase = createClient()
    const { data } = await supabase.from('codes_analytiques').insert({
      axe_id: axeId, code: codeForm.code, libelle: codeForm.libelle,
    }).select().single()
    if (data) {
      setCodes(prev => [...prev, data as CodeAnalytique])
      setShowAddCode(null)
      setCodeForm({ code: '', libelle: '' })
    }
  }

  const handleAddAffectation = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    const { data } = await supabase.from('affectations_analytiques').insert({
      code_analytique_id: affForm.code_analytique_id,
      pourcentage: parseFloat(affForm.pourcentage),
      montant: parseFloat(affForm.montant),
    }).select().single()
    if (data) {
      setAffectations(prev => [data as Affectation, ...prev])
      setShowAddAffectation(false)
      setAffForm({ code_analytique_id: '', pourcentage: '100', montant: '' })
    }
  }

  const handleDeleteAxe = async (id: string) => {
    const supabase = createClient()
    await supabase.from('axes_analytiques').delete().eq('id', id)
    setAxes(prev => prev.filter(a => a.id !== id))
    setCodes(prev => prev.filter(c => c.axe_id !== id))
  }

  const handleDeleteCode = async (id: string) => {
    const supabase = createClient()
    await supabase.from('codes_analytiques').delete().eq('id', id)
    setCodes(prev => prev.filter(c => c.id !== id))
  }

  // Compute totals per code
  const totalParCode: Record<string, number> = {}
  affectations.forEach(a => {
    totalParCode[a.code_analytique_id] = (totalParCode[a.code_analytique_id] ?? 0) + a.montant
  })

  const filteredAxes = axes.filter(a => filterAxe === 'Tous' || a.id === filterAxe)

  const allCodes = filterAxe === 'Tous' ? codes : codes.filter(c => c.axe_id === filterAxe)

  // Export FEC analytique (CSV)
  const handleExportFEC = () => {
    const header = ['JournalCode', 'EcritureDate', 'CompteNum', 'CodeAnalytique', 'Libelle', 'Debit', 'Credit']
    const rows = affectations.map(a => {
      const code = codes.find(c => c.id === a.code_analytique_id)
      return ['', new Date(a.created_at).toLocaleDateString('fr-FR'), '', code?.code ?? '', code?.libelle ?? '', a.montant > 0 ? a.montant.toFixed(2) : '', a.montant < 0 ? Math.abs(a.montant).toFixed(2) : '']
    })
    const csv = [header, ...rows].map(r => r.join(';')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'analytique-fec.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  const isPremium = plan === 'pro' || plan === 'cabinet'
  const isTrial = !isPremium // Show trial banner if not on a paid plan that includes this feature

  if (planLoading) return null

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-navy-900">Comptabilité analytique</h1>
            <p className="text-sm text-navy-500 mt-1">Répartissez vos charges et produits par axe analytique</p>
          </div>
          <button onClick={handleExportFEC}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 text-slate-600">
            <BarChart3 className="w-3.5 h-3.5" />Export FEC analytique
          </button>
        </div>

        {isTrial && (
          <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-xl mb-6">
            <AlertCircle className="w-4 h-4 text-blue-500 flex-shrink-0" />
            <p className="text-sm text-blue-700">
              Vous testez cette fonctionnalité — disponible sur tous les plans payants.
            </p>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* ── Colonne gauche: Axes & codes ─────────────────── */}
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-navy-500" />
                  <h2 className="text-base font-semibold text-navy-900">Axes analytiques</h2>
                </div>
                <button onClick={() => setShowAddAxe(true)} disabled={!isPremium}
                  className="flex items-center gap-1 text-xs px-2.5 py-1.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-50">
                  <Plus className="w-3.5 h-3.5" />Axe
                </button>
              </div>

              {loading ? (
                <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-8 bg-navy-50 animate-pulse rounded" />)}</div>
              ) : axes.length === 0 ? (
                <p className="text-xs text-navy-400 text-center py-4">Aucun axe analytique</p>
              ) : (
                <div className="space-y-2">
                  {axes.map(axe => {
                    const axeCodes = codes.filter(c => c.axe_id === axe.id)
                    const isExpanded = expandedAxe === axe.id
                    return (
                      <div key={axe.id} className="border border-navy-100 rounded-xl overflow-hidden">
                        <div className="flex items-center justify-between px-3 py-2.5">
                          <button onClick={() => setExpandedAxe(isExpanded ? null : axe.id)}
                            className="flex items-center gap-2 flex-1 text-left">
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-navy-400" /> : <ChevronDown className="w-3.5 h-3.5 text-navy-400" />}
                            <span className="text-sm font-medium text-navy-800">{axe.nom}</span>
                            <span className="text-xs text-navy-400">({axeCodes.length})</span>
                          </button>
                          <button onClick={() => void handleDeleteAxe(axe.id)}
                            className="text-gray-300 hover:text-red-400 transition-colors ml-2">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        {isExpanded && (
                          <div className="border-t border-navy-50 px-3 pb-3">
                            <div className="space-y-1 mt-2">
                              {axeCodes.map(code => (
                                <div key={code.id} className="flex items-center justify-between py-1">
                                  <div>
                                    <span className="text-xs font-mono font-semibold text-emerald-700 mr-2">{code.code}</span>
                                    <span className="text-xs text-navy-600">{code.libelle}</span>
                                  </div>
                                  <button onClick={() => void handleDeleteCode(code.id)}
                                    className="text-gray-300 hover:text-red-400 transition-colors">
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                            {showAddCode === axe.id ? (
                              <form onSubmit={e => void handleAddCode(e, axe.id)} className="mt-2 space-y-2">
                                <div className="grid grid-cols-2 gap-2">
                                  <input required value={codeForm.code} placeholder="CODE"
                                    onChange={e => setCodeForm(p => ({ ...p, code: e.target.value }))}
                                    className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500" />
                                  <input required value={codeForm.libelle} placeholder="Libellé"
                                    onChange={e => setCodeForm(p => ({ ...p, libelle: e.target.value }))}
                                    className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500" />
                                </div>
                                <div className="flex gap-2">
                                  <button type="button" onClick={() => setShowAddCode(null)}
                                    className="flex-1 py-1.5 border border-gray-200 rounded-lg text-xs text-navy-600 hover:bg-gray-50">Annuler</button>
                                  <button type="submit"
                                    className="flex-1 py-1.5 bg-emerald-500 text-white rounded-lg text-xs font-semibold hover:bg-emerald-600">Ajouter</button>
                                </div>
                              </form>
                            ) : (
                              <button onClick={() => setShowAddCode(axe.id)} disabled={!isPremium}
                                className="mt-2 flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 disabled:opacity-50">
                                <Plus className="w-3 h-3" />Ajouter un code
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </Card>
          </div>

          {/* ── Colonne droite: Tableau croisé + affectations ── */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tableau croisé */}
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-navy-900">Vue analytique par code</h2>
                <div className="flex items-center gap-2">
                  <select value={filterAxe} onChange={e => setFilterAxe(e.target.value)}
                    className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-slate-600 bg-white">
                    <option value="Tous">Tous les axes</option>
                    {axes.map(a => <option key={a.id} value={a.id}>{a.nom}</option>)}
                  </select>
                  <select value={filterPeriode} onChange={e => setFilterPeriode(e.target.value)}
                    className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-slate-600 bg-white">
                    <option value="all">Toute la période</option>
                    <option value="month">Ce mois</option>
                    <option value="year">Cette année</option>
                  </select>
                </div>
              </div>

              {allCodes.length === 0 ? (
                <p className="text-sm text-navy-400 text-center py-8">
                  Créez des axes et des codes analytiques pour commencer
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-xs font-medium text-navy-400 border-b border-navy-100">
                        <th className="text-left pb-2 pr-4">Code</th>
                        <th className="text-left pb-2 pr-4">Libellé</th>
                        <th className="text-left pb-2 pr-4">Axe</th>
                        <th className="text-right pb-2 pr-4">Nb affectations</th>
                        <th className="text-right pb-2">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-navy-50">
                      {allCodes.map(code => {
                        const axe = axes.find(a => a.id === code.axe_id)
                        const total = totalParCode[code.id] ?? 0
                        const nb = affectations.filter(a => a.code_analytique_id === code.id).length
                        return (
                          <tr key={code.id} className="hover:bg-navy-50/50 transition-colors">
                            <td className="py-3 pr-4 font-mono font-semibold text-emerald-700 text-xs">{code.code}</td>
                            <td className="py-3 pr-4 text-navy-800">{code.libelle}</td>
                            <td className="py-3 pr-4">
                              <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-100 text-blue-700">
                                {axe?.nom ?? '—'}
                              </span>
                            </td>
                            <td className="py-3 pr-4 text-right text-navy-500">{nb}</td>
                            <td className="py-3 text-right font-mono font-semibold text-navy-900">{formatCurrency(total)}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-navy-100">
                        <td colSpan={4} className="pt-2 text-xs font-semibold text-navy-600">Total</td>
                        <td className="pt-2 text-right font-mono font-bold text-navy-900">
                          {formatCurrency(allCodes.reduce((s, c) => s + (totalParCode[c.id] ?? 0), 0))}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </Card>

            {/* Saisie d'affectation */}
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-navy-900">Affectations analytiques</h2>
                <button onClick={() => setShowAddAffectation(true)} disabled={!isPremium || codes.length === 0}
                  className="flex items-center gap-1 text-xs px-3 py-1.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed">
                  <Plus className="w-3.5 h-3.5" />Nouvelle affectation
                </button>
              </div>

              {affectations.length === 0 ? (
                <p className="text-sm text-navy-400 text-center py-6">Aucune affectation enregistrée</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-navy-400 border-b border-navy-100">
                        <th className="text-left pb-2 pr-3">Code</th>
                        <th className="text-left pb-2 pr-3">Libellé</th>
                        <th className="text-right pb-2 pr-3">%</th>
                        <th className="text-right pb-2 pr-3">Montant</th>
                        <th className="text-left pb-2">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-navy-50">
                      {affectations.slice(0, 20).map(aff => {
                        const code = codes.find(c => c.id === aff.code_analytique_id)
                        return (
                          <tr key={aff.id} className="hover:bg-navy-50/50">
                            <td className="py-2 pr-3 font-mono font-semibold text-emerald-700">{code?.code ?? '—'}</td>
                            <td className="py-2 pr-3 text-navy-700">{code?.libelle ?? '—'}</td>
                            <td className="py-2 pr-3 text-right text-navy-500">{aff.pourcentage}%</td>
                            <td className="py-2 pr-3 text-right font-mono font-semibold text-navy-900">{formatCurrency(aff.montant)}</td>
                            <td className="py-2 text-navy-400">{new Date(aff.created_at).toLocaleDateString('fr-FR')}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>

      {/* ── MODAL AXEANALYTIQUE ──────────────────────────────── */}
      {showAddAxe && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-lg font-semibold text-navy-900 mb-4">Nouvel axe analytique</h3>
            <form onSubmit={e => void handleAddAxe(e)} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-navy-700 mb-1 block">Nom de l&apos;axe *</label>
                <input required value={axeForm.nom} placeholder="ex. Projet, Centre de coût, Département…"
                  onChange={e => setAxeForm({ nom: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowAddAxe(false)}
                  className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-navy-600 hover:bg-gray-50">Annuler</button>
                <button type="submit"
                  className="flex-1 py-2.5 bg-emerald-500 text-white rounded-xl text-sm font-semibold hover:bg-emerald-600">Créer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL AFFECTATION ────────────────────────────────── */}
      {showAddAffectation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-lg font-semibold text-navy-900 mb-4">Nouvelle affectation</h3>
            <form onSubmit={e => void handleAddAffectation(e)} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-navy-700 mb-1 block">Code analytique *</label>
                <select required value={affForm.code_analytique_id}
                  onChange={e => setAffForm(p => ({ ...p, code_analytique_id: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white">
                  <option value="">-- Sélectionner --</option>
                  {axes.map(axe => (
                    <optgroup key={axe.id} label={axe.nom}>
                      {codes.filter(c => c.axe_id === axe.id).map(c => (
                        <option key={c.id} value={c.id}>{c.code} — {c.libelle}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-navy-700 mb-1 block">Pourcentage (%)</label>
                  <input type="number" min="0" max="100" step="0.01" value={affForm.pourcentage}
                    onChange={e => setAffForm(p => ({ ...p, pourcentage: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="text-xs font-medium text-navy-700 mb-1 block">Montant (€) *</label>
                  <input required type="number" step="0.01" value={affForm.montant}
                    onChange={e => setAffForm(p => ({ ...p, montant: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowAddAffectation(false)}
                  className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-navy-600 hover:bg-gray-50">Annuler</button>
                <button type="submit"
                  className="flex-1 py-2.5 bg-emerald-500 text-white rounded-xl text-sm font-semibold hover:bg-emerald-600">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  )
}
