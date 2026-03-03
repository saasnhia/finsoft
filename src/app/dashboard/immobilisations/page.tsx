'use client'

import { useState, useEffect } from 'react'
import { AppShell } from '@/components/layout'
import { Card } from '@/components/ui'
import { useAuth } from '@/hooks/useAuth'
import { useUserPlan } from '@/hooks/useUserPlan'
import { createClient } from '@/lib/supabase/client'
import {
  Building2, Plus, ChevronDown, ChevronUp, Download, AlertCircle, Landmark,
} from 'lucide-react'
import Link from 'next/link'
import React from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Immobilisation {
  id: string
  designation: string
  categorie: string
  date_acquisition: string
  valeur_brute: number
  duree_amortissement: number
  created_at: string
}

interface Emprunt {
  id: string
  libelle: string
  banque: string
  capital_initial: number
  capital_restant: number
  taux_annuel: number
  duree_mois: number
  date_debut: string
  assurance_mensuelle: number
  created_at: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { label: 'Matériel informatique', duree: 3 },
  { label: 'Mobilier', duree: 10 },
  { label: 'Véhicule', duree: 5 },
  { label: 'Logiciel', duree: 3 },
  { label: 'Agencement', duree: 10 },
  { label: 'Autre', duree: 5 },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(n: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function calcDotationAnnuelle(valeurBrute: number, duree: number): number {
  if (duree <= 0) return 0
  return valeurBrute / duree
}

function calcAnneesEcoulees(dateAcquisition: string): number {
  const date = new Date(dateAcquisition)
  const now = new Date()
  return (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24 * 365.25)
}

function calcVNC(valeurBrute: number, duree: number, dateAcquisition: string): number {
  if (duree <= 0) return valeurBrute
  const dotation = calcDotationAnnuelle(valeurBrute, duree)
  const annees = calcAnneesEcoulees(dateAcquisition)
  return Math.max(0, valeurBrute - dotation * annees)
}

function calcMensualite(capital: number, tauxAnnuel: number, dureeMois: number): number {
  if (dureeMois <= 0 || capital <= 0) return 0
  if (tauxAnnuel === 0) return capital / dureeMois
  const r = tauxAnnuel / 100 / 12
  return (capital * r) / (1 - Math.pow(1 + r, -dureeMois))
}

function getAmortissementPlan(immo: Immobilisation) {
  const dotation = calcDotationAnnuelle(immo.valeur_brute, immo.duree_amortissement)
  return Array.from({ length: immo.duree_amortissement }, (_, i) => ({
    annee: i + 1,
    dotation,
    vncDebut: Math.max(0, immo.valeur_brute - dotation * i),
    vncFin: Math.max(0, immo.valeur_brute - dotation * (i + 1)),
  }))
}

function getLoanPlan(emprunt: Emprunt) {
  const r = emprunt.taux_annuel / 100 / 12
  const n = emprunt.duree_mois
  const mensualite = calcMensualite(emprunt.capital_initial, emprunt.taux_annuel, n)
  let crd = emprunt.capital_initial
  return Array.from({ length: Math.min(n, 12) }, (_, i) => {
    const interets = r > 0 ? crd * r : 0
    const capital = mensualite - interets
    crd = Math.max(0, crd - capital)
    return { mois: i + 1, mensualite, capital, interets, assurance: emprunt.assurance_mensuelle, crd }
  })
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

export default function ImmobilisationsPage() {
  const { user } = useAuth()
  const { plan, loading: planLoading } = useUserPlan()
  const [immobilisations, setImmobilisations] = useState<Immobilisation[]>([])
  const [emprunts, setEmprunts] = useState<Emprunt[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddImmo, setShowAddImmo] = useState(false)
  const [showAddEmprunt, setShowAddEmprunt] = useState(false)
  const [expandedImmo, setExpandedImmo] = useState<string | null>(null)
  const [expandedEmprunt, setExpandedEmprunt] = useState<string | null>(null)
  const [filterCat, setFilterCat] = useState('Tous')
  const [filterStatut, setFilterStatut] = useState('Tous')

  const [immoForm, setImmoForm] = useState({
    designation: '', categorie: 'Matériel informatique',
    date_acquisition: '', valeur_brute: '', duree_amortissement: '3',
  })
  const [empruntForm, setEmpruntForm] = useState({
    libelle: '', banque: '', capital_initial: '',
    taux_annuel: '', duree_mois: '', date_debut: '', assurance_mensuelle: '0',
  })

  useEffect(() => {
    if (!user) return
    const supabase = createClient()
    void (async () => {
      const [immoRes, empruntRes] = await Promise.all([
        supabase.from('immobilisations').select('*').eq('user_id', user.id).order('date_acquisition', { ascending: false }),
        supabase.from('emprunts').select('*').eq('user_id', user.id).order('date_debut', { ascending: false }),
      ])
      setImmobilisations((immoRes.data ?? []) as Immobilisation[])
      setEmprunts((empruntRes.data ?? []) as Emprunt[])
      setLoading(false)
    })()
  }, [user])

  const handleAddImmo = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    const supabase = createClient()
    const { data } = await supabase.from('immobilisations').insert({
      user_id: user.id,
      designation: immoForm.designation,
      categorie: immoForm.categorie,
      date_acquisition: immoForm.date_acquisition,
      valeur_brute: parseFloat(immoForm.valeur_brute),
      duree_amortissement: parseInt(immoForm.duree_amortissement),
    }).select().single()
    if (data) {
      setImmobilisations(prev => [data as Immobilisation, ...prev])
      setShowAddImmo(false)
      setImmoForm({ designation: '', categorie: 'Matériel informatique', date_acquisition: '', valeur_brute: '', duree_amortissement: '3' })
    }
  }

  const handleAddEmprunt = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    const supabase = createClient()
    const capital = parseFloat(empruntForm.capital_initial)
    const { data } = await supabase.from('emprunts').insert({
      user_id: user.id,
      libelle: empruntForm.libelle,
      banque: empruntForm.banque,
      capital_initial: capital,
      capital_restant: capital,
      taux_annuel: parseFloat(empruntForm.taux_annuel),
      duree_mois: parseInt(empruntForm.duree_mois),
      date_debut: empruntForm.date_debut,
      assurance_mensuelle: parseFloat(empruntForm.assurance_mensuelle),
    }).select().single()
    if (data) {
      setEmprunts(prev => [data as Emprunt, ...prev])
      setShowAddEmprunt(false)
      setEmpruntForm({ libelle: '', banque: '', capital_initial: '', taux_annuel: '', duree_mois: '', date_debut: '', assurance_mensuelle: '0' })
    }
  }

  const filteredImmos = immobilisations.filter(i => {
    const vnc = calcVNC(i.valeur_brute, i.duree_amortissement, i.date_acquisition)
    const statut = vnc <= 0 ? 'Amorti' : 'En cours'
    return (filterCat === 'Tous' || i.categorie === filterCat) &&
           (filterStatut === 'Tous' || statut === filterStatut)
  })

  const handleExportCSV = () => {
    const headers = ['Désignation', 'Catégorie', 'Date acquisition', 'Valeur brute', 'Durée (ans)', 'Dotation annuelle', 'VNC', 'Statut']
    const rows = filteredImmos.map(i => {
      const dotation = calcDotationAnnuelle(i.valeur_brute, i.duree_amortissement)
      const vnc = calcVNC(i.valeur_brute, i.duree_amortissement, i.date_acquisition)
      return [i.designation, i.categorie, i.date_acquisition, i.valeur_brute.toString(), i.duree_amortissement.toString(), dotation.toFixed(2), vnc.toFixed(2), vnc <= 0 ? 'Amorti' : 'En cours']
    })
    const csv = [headers, ...rows].map(r => r.join(';')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'immobilisations.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  const isPremium = plan === 'pro'

  if (planLoading) return null

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-navy-900">Immobilisations &amp; Emprunts</h1>
          <p className="text-sm text-navy-500 mt-1">Gérez vos actifs immobilisés et vos financements</p>
        </div>

        {!isPremium && (
          <PlanRequiredBanner required="Premium" current={plan === 'starter' ? 'Starter' : 'Essentiel'} />
        )}

        {/* ── IMMOBILISATIONS ─────────────────────────────────── */}
        <Card className="mb-8">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-navy-500" />
              <h2 className="text-lg font-semibold text-navy-900">Tableau des immobilisations</h2>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
                className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-slate-600 bg-white">
                <option>Tous</option>
                {CATEGORIES.map(c => <option key={c.label}>{c.label}</option>)}
              </select>
              <select value={filterStatut} onChange={e => setFilterStatut(e.target.value)}
                className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-slate-600 bg-white">
                <option>Tous</option>
                <option>En cours</option>
                <option>Amorti</option>
              </select>
              <button onClick={handleExportCSV}
                className="flex items-center gap-1 text-xs px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 text-slate-600">
                <Download className="w-3.5 h-3.5" />CSV
              </button>
              <button onClick={() => setShowAddImmo(true)} disabled={!isPremium}
                className="flex items-center gap-1 text-xs px-3 py-1.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed">
                <Plus className="w-3.5 h-3.5" />Ajouter
              </button>
            </div>
          </div>

          {loading ? (
            <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-10 bg-navy-50 animate-pulse rounded-lg" />)}</div>
          ) : filteredImmos.length === 0 ? (
            <p className="text-sm text-navy-400 text-center py-8">Aucune immobilisation enregistrée</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs font-medium text-navy-400 border-b border-navy-100">
                    <th className="text-left pb-2 pr-4">Désignation</th>
                    <th className="text-left pb-2 pr-4">Catégorie</th>
                    <th className="text-left pb-2 pr-4">Date acq.</th>
                    <th className="text-right pb-2 pr-4">Valeur brute</th>
                    <th className="text-right pb-2 pr-4">Durée</th>
                    <th className="text-right pb-2 pr-4">Dotation/an</th>
                    <th className="text-right pb-2 pr-4">VNC</th>
                    <th className="text-center pb-2 pr-4">Statut</th>
                    <th className="pb-2 w-8" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy-50">
                  {filteredImmos.map(immo => {
                    const dotation = calcDotationAnnuelle(immo.valeur_brute, immo.duree_amortissement)
                    const vnc = calcVNC(immo.valeur_brute, immo.duree_amortissement, immo.date_acquisition)
                    const statut = vnc <= 0 ? 'Amorti' : 'En cours'
                    const isExpanded = expandedImmo === immo.id
                    return (
                      <React.Fragment key={immo.id}>
                        <tr className="hover:bg-navy-50/50 transition-colors">
                          <td className="py-3 pr-4 font-medium text-navy-800">{immo.designation}</td>
                          <td className="py-3 pr-4 text-navy-500 text-xs">{immo.categorie}</td>
                          <td className="py-3 pr-4 text-navy-500">{formatDate(immo.date_acquisition)}</td>
                          <td className="py-3 pr-4 text-right font-mono text-navy-800">{formatCurrency(immo.valeur_brute)}</td>
                          <td className="py-3 pr-4 text-right text-navy-500">{immo.duree_amortissement} ans</td>
                          <td className="py-3 pr-4 text-right font-mono text-navy-600">{formatCurrency(dotation)}</td>
                          <td className="py-3 pr-4 text-right font-mono font-semibold text-navy-900">{formatCurrency(vnc)}</td>
                          <td className="py-3 pr-4 text-center">
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${statut === 'Amorti' ? 'bg-gray-100 text-gray-600' : 'bg-emerald-100 text-emerald-700'}`}>
                              {statut}
                            </span>
                          </td>
                          <td className="py-3">
                            <button onClick={() => setExpandedImmo(isExpanded ? null : immo.id)}
                              className="text-navy-400 hover:text-navy-600 transition-colors">
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr>
                            <td colSpan={9} className="pb-4 px-2 bg-slate-50/50">
                              <div className="bg-slate-50 rounded-xl p-4 mt-1">
                                <p className="text-xs font-semibold text-navy-600 mb-3">Plan d&apos;amortissement linéaire</p>
                                <div className="overflow-x-auto">
                                  <table className="w-full text-xs">
                                    <thead>
                                      <tr className="text-navy-400 border-b border-slate-200">
                                        <th className="text-left pb-1.5">Année</th>
                                        <th className="text-right pb-1.5">Dotation</th>
                                        <th className="text-right pb-1.5">VNC début</th>
                                        <th className="text-right pb-1.5">VNC fin</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                      {getAmortissementPlan(immo).map(row => (
                                        <tr key={row.annee}>
                                          <td className="py-1.5 text-navy-600 font-medium">Année {row.annee}</td>
                                          <td className="py-1.5 text-right font-mono text-navy-700">{formatCurrency(row.dotation)}</td>
                                          <td className="py-1.5 text-right font-mono text-navy-500">{formatCurrency(row.vncDebut)}</td>
                                          <td className="py-1.5 text-right font-mono font-semibold text-navy-900">{formatCurrency(row.vncFin)}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* ── EMPRUNTS ─────────────────────────────────────────── */}
        <Card>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Landmark className="w-5 h-5 text-navy-500" />
              <h2 className="text-lg font-semibold text-navy-900">Tableau des emprunts</h2>
            </div>
            <button onClick={() => setShowAddEmprunt(true)} disabled={!isPremium}
              className="flex items-center gap-1 text-xs px-3 py-1.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed">
              <Plus className="w-3.5 h-3.5" />Ajouter un emprunt
            </button>
          </div>

          {emprunts.length === 0 ? (
            <p className="text-sm text-navy-400 text-center py-8">Aucun emprunt enregistré</p>
          ) : (
            <div className="space-y-3">
              {emprunts.map(emprunt => {
                const mensualite = calcMensualite(emprunt.capital_initial, emprunt.taux_annuel, emprunt.duree_mois)
                const progression = emprunt.capital_initial > 0
                  ? ((emprunt.capital_initial - emprunt.capital_restant) / emprunt.capital_initial) * 100
                  : 0
                const isExpanded = expandedEmprunt === emprunt.id
                const dateDebut = new Date(emprunt.date_debut)
                const now = new Date()
                const moisEcoules = Math.max(0, Math.floor((now.getTime() - dateDebut.getTime()) / (1000 * 60 * 60 * 24 * 30)))
                const prochEch = new Date(dateDebut)
                prochEch.setMonth(prochEch.getMonth() + moisEcoules + 1)
                const daysUntil = Math.ceil((prochEch.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
                const isAlerte = daysUntil >= 0 && daysUntil <= 7

                return (
                  <div key={emprunt.id} className="border border-navy-100 rounded-xl overflow-hidden">
                    <div className="p-4">
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 items-start">
                        <div>
                          <p className="text-xs text-navy-400 mb-0.5">Libellé / Banque</p>
                          <p className="text-sm font-semibold text-navy-900">{emprunt.libelle}</p>
                          <p className="text-xs text-navy-500">{emprunt.banque}</p>
                        </div>
                        <div>
                          <p className="text-xs text-navy-400 mb-0.5">Capital initial</p>
                          <p className="text-sm font-mono font-semibold text-navy-800">{formatCurrency(emprunt.capital_initial)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-navy-400 mb-0.5">Capital restant dû</p>
                          <p className="text-sm font-mono font-semibold text-red-700">{formatCurrency(emprunt.capital_restant)}</p>
                          <div className="mt-1.5 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${progression}%` }} />
                          </div>
                          <p className="text-[10px] text-navy-400 mt-0.5">{Math.round(progression)}% remboursé</p>
                        </div>
                        <div>
                          <p className="text-xs text-navy-400 mb-0.5">Mensualité (+ assurance)</p>
                          <p className="text-sm font-mono font-semibold text-navy-800">{formatCurrency(mensualite + emprunt.assurance_mensuelle)}</p>
                          <p className="text-[10px] text-navy-400">{emprunt.taux_annuel}% · {emprunt.duree_mois} mois</p>
                        </div>
                        <div>
                          <p className="text-xs text-navy-400 mb-0.5">Prochaine échéance</p>
                          <p className={`text-sm font-medium ${isAlerte ? 'text-red-600' : 'text-navy-800'}`}>
                            {formatDate(prochEch.toISOString())}
                          </p>
                          {isAlerte && (
                            <p className="text-[10px] text-red-500 font-semibold">⚠ dans {daysUntil}j</p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="border-t border-navy-50 px-4 py-2 flex justify-end bg-slate-50/50">
                      <button onClick={() => setExpandedEmprunt(isExpanded ? null : emprunt.id)}
                        className="flex items-center gap-1 text-xs text-navy-400 hover:text-navy-600 transition-colors">
                        {isExpanded
                          ? <><ChevronUp className="w-3.5 h-3.5" />Masquer plan</>
                          : <><ChevronDown className="w-3.5 h-3.5" />Voir plan d&apos;amortissement (12 premières échéances)</>}
                      </button>
                    </div>
                    {isExpanded && (
                      <div className="border-t border-navy-50 p-4 bg-slate-50">
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="text-navy-400 border-b border-slate-200">
                                <th className="text-left pb-1.5">Mois</th>
                                <th className="text-right pb-1.5">Mensualité</th>
                                <th className="text-right pb-1.5">Capital</th>
                                <th className="text-right pb-1.5">Intérêts</th>
                                <th className="text-right pb-1.5">Assurance</th>
                                <th className="text-right pb-1.5">CRD</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {getLoanPlan(emprunt).map(row => (
                                <tr key={row.mois}>
                                  <td className="py-1.5 text-navy-600 font-medium">M{row.mois}</td>
                                  <td className="py-1.5 text-right font-mono text-navy-700">{formatCurrency(row.mensualite)}</td>
                                  <td className="py-1.5 text-right font-mono text-emerald-700">{formatCurrency(row.capital)}</td>
                                  <td className="py-1.5 text-right font-mono text-red-600">{formatCurrency(row.interets)}</td>
                                  <td className="py-1.5 text-right font-mono text-amber-600">{formatCurrency(row.assurance)}</td>
                                  <td className="py-1.5 text-right font-mono font-semibold text-navy-900">{formatCurrency(row.crd)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </Card>
      </div>

      {/* ── MODAL IMMOBILISATION ──────────────────────────────── */}
      {showAddImmo && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-semibold text-navy-900 mb-4">Ajouter une immobilisation</h3>
            <form onSubmit={e => void handleAddImmo(e)} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-navy-700 mb-1 block">Désignation *</label>
                <input required value={immoForm.designation}
                  onChange={e => setImmoForm(p => ({ ...p, designation: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="text-xs font-medium text-navy-700 mb-1 block">Catégorie *</label>
                <select value={immoForm.categorie}
                  onChange={e => {
                    const cat = CATEGORIES.find(c => c.label === e.target.value)
                    setImmoForm(p => ({ ...p, categorie: e.target.value, duree_amortissement: cat ? String(cat.duree) : p.duree_amortissement }))
                  }}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white">
                  {CATEGORIES.map(c => <option key={c.label}>{c.label}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-navy-700 mb-1 block">Date acquisition *</label>
                  <input required type="date" value={immoForm.date_acquisition}
                    onChange={e => setImmoForm(p => ({ ...p, date_acquisition: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="text-xs font-medium text-navy-700 mb-1 block">Valeur brute HT (€) *</label>
                  <input required type="number" min="0" step="0.01" value={immoForm.valeur_brute}
                    onChange={e => setImmoForm(p => ({ ...p, valeur_brute: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-navy-700 mb-1 block">Durée d&apos;amortissement (années) *</label>
                <input required type="number" min="1" max="50" value={immoForm.duree_amortissement}
                  onChange={e => setImmoForm(p => ({ ...p, duree_amortissement: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              {immoForm.valeur_brute && immoForm.duree_amortissement && parseInt(immoForm.duree_amortissement) > 0 && (
                <div className="bg-emerald-50 rounded-xl p-3 text-xs text-emerald-700">
                  Dotation annuelle estimée : <strong>{formatCurrency(parseFloat(immoForm.valeur_brute || '0') / parseInt(immoForm.duree_amortissement))}</strong>
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAddImmo(false)}
                  className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-navy-600 hover:bg-gray-50">
                  Annuler
                </button>
                <button type="submit"
                  className="flex-1 py-2.5 bg-emerald-500 text-white rounded-xl text-sm font-semibold hover:bg-emerald-600">
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL EMPRUNT ─────────────────────────────────────── */}
      {showAddEmprunt && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-semibold text-navy-900 mb-4">Ajouter un emprunt</h3>
            <form onSubmit={e => void handleAddEmprunt(e)} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-navy-700 mb-1 block">Libellé *</label>
                  <input required value={empruntForm.libelle}
                    onChange={e => setEmpruntForm(p => ({ ...p, libelle: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="text-xs font-medium text-navy-700 mb-1 block">Banque *</label>
                  <input required value={empruntForm.banque}
                    onChange={e => setEmpruntForm(p => ({ ...p, banque: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-navy-700 mb-1 block">Capital initial (€) *</label>
                  <input required type="number" min="0" step="0.01" value={empruntForm.capital_initial}
                    onChange={e => setEmpruntForm(p => ({ ...p, capital_initial: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="text-xs font-medium text-navy-700 mb-1 block">Taux annuel (%) *</label>
                  <input required type="number" min="0" max="100" step="0.01" value={empruntForm.taux_annuel}
                    onChange={e => setEmpruntForm(p => ({ ...p, taux_annuel: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-navy-700 mb-1 block">Durée (mois) *</label>
                  <input required type="number" min="1" value={empruntForm.duree_mois}
                    onChange={e => setEmpruntForm(p => ({ ...p, duree_mois: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="text-xs font-medium text-navy-700 mb-1 block">Date de début *</label>
                  <input required type="date" value={empruntForm.date_debut}
                    onChange={e => setEmpruntForm(p => ({ ...p, date_debut: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-navy-700 mb-1 block">Assurance mensuelle (€)</label>
                <input type="number" min="0" step="0.01" value={empruntForm.assurance_mensuelle}
                  onChange={e => setEmpruntForm(p => ({ ...p, assurance_mensuelle: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              {empruntForm.capital_initial && empruntForm.taux_annuel && empruntForm.duree_mois && (
                <div className="bg-emerald-50 rounded-xl p-3 text-xs text-emerald-700">
                  Mensualité estimée (hors assurance) : <strong>
                    {formatCurrency(calcMensualite(
                      parseFloat(empruntForm.capital_initial),
                      parseFloat(empruntForm.taux_annuel),
                      parseInt(empruntForm.duree_mois),
                    ))}
                  </strong>
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAddEmprunt(false)}
                  className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-navy-600 hover:bg-gray-50">
                  Annuler
                </button>
                <button type="submit"
                  className="flex-1 py-2.5 bg-emerald-500 text-white rounded-xl text-sm font-semibold hover:bg-emerald-600">
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  )
}
