'use client'

import { useState } from 'react'
import Link from 'next/link'
import { AppShell } from '@/components/layout'
import { Card, Button } from '@/components/ui'
import {
  Shield,
  Building2,
  Users,
  Euro,
  Calculator,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  ArrowRight,
  FileText,
  HelpCircle,
  Loader2,
  RotateCcw,
} from 'lucide-react'
import type { AuditResult } from '@/types'

const formatEuro = (n: number) =>
  new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n)

const formatNumber = (n: number) =>
  new Intl.NumberFormat('fr-FR').format(n)

const CRITERE_LABELS: Record<string, string> = {
  ca: 'Chiffre d\'affaires HT',
  bilan: 'Total du bilan',
  effectif: 'Effectif moyen',
}

const METHOD_LABELS: Record<string, string> = {
  bilan: 'Total bilan',
  ca: 'Chiffre d\'affaires',
  resultat: 'Résultat net',
}

export default function AuditSeuilsPage() {
  const [form, setForm] = useState({
    company_name: '',
    siren: '',
    secteur: '',
    chiffre_affaires_ht: '',
    total_bilan: '',
    effectif_moyen: '',
    resultat_net: '',
  })
  const [result, setResult] = useState<AuditResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const res = await fetch('/api/audit/thresholds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_name: form.company_name,
          siren: form.siren || undefined,
          secteur: form.secteur || undefined,
          exercice_debut: new Date().getFullYear() + '-01-01',
          exercice_fin: new Date().getFullYear() + '-12-31',
          chiffre_affaires_ht: parseFloat(form.chiffre_affaires_ht) || 0,
          total_bilan: parseFloat(form.total_bilan) || 0,
          effectif_moyen: parseInt(form.effectif_moyen) || 0,
          resultat_net: parseFloat(form.resultat_net) || 0,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        setError(data.error || 'Erreur lors du calcul')
      } else {
        setResult(data.result)
      }
    } catch {
      setError('Erreur de connexion au serveur')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setForm({
      company_name: '',
      siren: '',
      secteur: '',
      chiffre_affaires_ht: '',
      total_bilan: '',
      effectif_moyen: '',
      resultat_net: '',
    })
    setResult(null)
    setError(null)
  }

  return (
      <AppShell>
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 text-sm text-navy-500 mb-1">
              <Link href="/dashboard" className="hover:text-emerald-600 transition-colors">
                Dashboard
              </Link>
              <span>/</span>
              <span className="text-navy-700">Audit</span>
            </div>
            <h1 className="text-2xl font-display font-bold text-navy-900">
              Calcul des seuils d&apos;audit
            </h1>
            <p className="text-sm text-navy-500 mt-1">
              Vérifiez l&apos;obligation d&apos;audit légal et calculez les seuils de signification (NEP 320)
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/audit/comptes">
              <Button variant="outline" size="sm" icon={<FileText className="w-4 h-4" />}>
                Tri des comptes
              </Button>
            </Link>
            <Link href="/faq">
              <Button variant="ghost" size="sm" icon={<HelpCircle className="w-4 h-4" />}>
                FAQ
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Form Column */}
          <div className="lg:col-span-2">
            <Card>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <Building2 className="w-4 h-4 text-emerald-600" />
                  </div>
                  <h2 className="font-display font-semibold text-navy-900">
                    Données de l&apos;entreprise
                  </h2>
                </div>

                {/* Company Name */}
                <div>
                  <label className="block text-sm font-medium text-navy-700 mb-1">
                    Nom de l&apos;entreprise *
                  </label>
                  <input
                    type="text"
                    name="company_name"
                    value={form.company_name}
                    onChange={handleChange}
                    required
                    placeholder="Ex: SARL Dupont & Fils"
                    className="w-full px-3 py-2 border border-navy-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  />
                </div>

                {/* SIREN + Secteur */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-navy-700 mb-1">
                      SIREN
                    </label>
                    <input
                      type="text"
                      name="siren"
                      value={form.siren}
                      onChange={handleChange}
                      placeholder="123 456 789"
                      maxLength={11}
                      className="w-full px-3 py-2 border border-navy-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-navy-700 mb-1">
                      Secteur
                    </label>
                    <select
                      name="secteur"
                      value={form.secteur}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-navy-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all bg-white"
                    >
                      <option value="">Sélectionner...</option>
                      <option value="commerce">Commerce</option>
                      <option value="services">Services</option>
                      <option value="artisanat">Artisanat</option>
                      <option value="restauration">Restauration</option>
                      <option value="tech">Tech / SaaS</option>
                      <option value="btp">BTP</option>
                      <option value="sante">Santé</option>
                      <option value="industrie">Industrie</option>
                    </select>
                  </div>
                </div>

                <hr className="border-navy-100" />

                {/* Financial Data */}
                <div className="flex items-center gap-2 mb-1">
                  <Euro className="w-4 h-4 text-navy-500" />
                  <span className="text-sm font-medium text-navy-700">Données financières</span>
                </div>

                <div>
                  <label className="block text-sm font-medium text-navy-700 mb-1">
                    Chiffre d&apos;affaires HT annuel (€) *
                  </label>
                  <input
                    type="number"
                    name="chiffre_affaires_ht"
                    value={form.chiffre_affaires_ht}
                    onChange={handleChange}
                    required
                    min="0"
                    step="1"
                    placeholder="Ex: 5000000"
                    className="w-full px-3 py-2 border border-navy-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-navy-700 mb-1">
                    Total du bilan (€) *
                  </label>
                  <input
                    type="number"
                    name="total_bilan"
                    value={form.total_bilan}
                    onChange={handleChange}
                    required
                    min="0"
                    step="1"
                    placeholder="Ex: 3000000"
                    className="w-full px-3 py-2 border border-navy-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-navy-700 mb-1">
                      Effectif moyen *
                    </label>
                    <input
                      type="number"
                      name="effectif_moyen"
                      value={form.effectif_moyen}
                      onChange={handleChange}
                      required
                      min="0"
                      step="1"
                      placeholder="Ex: 35"
                      className="w-full px-3 py-2 border border-navy-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-navy-700 mb-1">
                      Résultat net (€)
                    </label>
                    <input
                      type="number"
                      name="resultat_net"
                      value={form.resultat_net}
                      onChange={handleChange}
                      step="1"
                      placeholder="Ex: 250000"
                      className="w-full px-3 py-2 border border-navy-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 p-3 bg-coral-50 border border-coral-200 rounded-xl text-sm text-coral-700">
                    <XCircle className="w-4 h-4 flex-shrink-0" />
                    {error}
                  </div>
                )}

                <div className="flex items-center gap-3 pt-2">
                  <Button type="submit" loading={loading} icon={<Calculator className="w-4 h-4" />} className="flex-1">
                    Calculer les seuils
                  </Button>
                  {result && (
                    <Button type="button" variant="ghost" size="sm" onClick={handleReset} icon={<RotateCcw className="w-4 h-4" />}>
                      Réinitialiser
                    </Button>
                  )}
                </div>
              </form>
            </Card>

            {/* Info Card */}
            <Card className="mt-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-navy-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Info className="w-4 h-4 text-navy-600" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-navy-900 mb-1">
                    Seuils légaux (Art. L823-1)
                  </h3>
                  <p className="text-xs text-navy-500 leading-relaxed">
                    L&apos;audit légal est obligatoire si l&apos;entreprise dépasse <strong>2 des 3 critères</strong> suivants
                    à la clôture de l&apos;exercice : CA HT &gt; 8 M€, Total bilan &gt; 4 M€, Effectif &gt; 50 salariés.
                  </p>
                  <Link href="/faq" className="text-xs text-emerald-600 hover:text-emerald-700 font-medium mt-2 inline-block">
                    En savoir plus →
                  </Link>
                </div>
              </div>
            </Card>
          </div>

          {/* Results Column */}
          <div className="lg:col-span-3">
            {!result && !loading && (
              <Card className="flex flex-col items-center justify-center min-h-[400px] text-center">
                <div className="w-16 h-16 bg-navy-100 rounded-2xl flex items-center justify-center mb-4">
                  <Shield className="w-8 h-8 text-navy-400" />
                </div>
                <h3 className="font-display font-semibold text-navy-900 mb-2">
                  Aucun calcul en cours
                </h3>
                <p className="text-sm text-navy-500 max-w-md">
                  Remplissez les données de l&apos;entreprise puis cliquez sur
                  &quot;Calculer les seuils&quot; pour obtenir l&apos;analyse d&apos;audit.
                </p>
              </Card>
            )}

            {loading && (
              <Card className="flex flex-col items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mb-4" />
                <p className="text-sm text-navy-500">Calcul des seuils en cours...</p>
              </Card>
            )}

            {result && (
              <div className="space-y-4">
                {/* Obligation Card */}
                <Card className={result.audit_obligatoire
                  ? 'border-coral-200 bg-gradient-to-r from-coral-50 to-white'
                  : 'border-emerald-200 bg-gradient-to-r from-emerald-50 to-white'
                }>
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      result.audit_obligatoire
                        ? 'bg-coral-100'
                        : 'bg-emerald-100'
                    }`}>
                      {result.audit_obligatoire
                        ? <AlertTriangle className="w-6 h-6 text-coral-600" />
                        : <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                      }
                    </div>
                    <div className="flex-1">
                      <h2 className="font-display font-bold text-lg text-navy-900">
                        {result.audit_obligatoire
                          ? 'Audit légal OBLIGATOIRE'
                          : 'Audit légal NON obligatoire'
                        }
                      </h2>
                      <p className="text-sm text-navy-600 mt-1">
                        {result.nombre_criteres_depasses} critère{result.nombre_criteres_depasses > 1 ? 's' : ''} sur 3 dépassé{result.nombre_criteres_depasses > 1 ? 's' : ''}
                        {result.audit_obligatoire
                          ? ' — nomination d\'un commissaire aux comptes requise.'
                          : ' — pas d\'obligation de commissaire aux comptes.'
                        }
                      </p>
                    </div>
                  </div>

                  {/* Critères Grid */}
                  <div className="grid grid-cols-3 gap-3 mt-4">
                    {result.criteres_depasses.map((c) => (
                      <div
                        key={c.critere}
                        className={`p-3 rounded-xl border ${
                          c.depasse
                            ? 'bg-coral-50 border-coral-200'
                            : 'bg-white border-navy-100'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-navy-500 uppercase">
                            {CRITERE_LABELS[c.critere]}
                          </span>
                          {c.depasse
                            ? <XCircle className="w-4 h-4 text-coral-500" />
                            : <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          }
                        </div>
                        <div className="text-lg font-mono font-bold text-navy-900">
                          {c.critere === 'effectif'
                            ? formatNumber(c.valeur)
                            : formatEuro(c.valeur)
                          }
                        </div>
                        <div className="text-xs text-navy-400 mt-0.5">
                          Seuil : {c.critere === 'effectif'
                            ? formatNumber(c.seuil)
                            : formatEuro(c.seuil)
                          }
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Thresholds Card */}
                <Card>
                  <div className="flex items-center gap-2 mb-4">
                    <Calculator className="w-5 h-5 text-emerald-600" />
                    <h3 className="font-display font-semibold text-navy-900">
                      Seuils de matérialité (NEP 320)
                    </h3>
                  </div>

                  <div className="text-xs text-navy-500 mb-4 flex items-center gap-1">
                    <Info className="w-3 h-3" />
                    Base de calcul retenue : <strong className="text-navy-700">{METHOD_LABELS[result.thresholds.signification.method]}</strong>
                    &nbsp;({result.thresholds.signification.percentage}%)
                  </div>

                  <div className="space-y-3">
                    {/* Seuil de signification */}
                    <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-coral-50 to-white border border-coral-100 rounded-xl">
                      <div className="w-10 h-10 bg-coral-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <AlertTriangle className="w-5 h-5 text-coral-600" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-navy-900">Seuil de signification</div>
                        <div className="text-xs text-navy-500">Anomalies pouvant influencer les décisions des utilisateurs</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-mono font-bold text-coral-700">
                          {formatEuro(result.thresholds.signification.value)}
                        </div>
                        <div className="text-xs text-navy-400">
                          {result.thresholds.signification.percentage}% du {METHOD_LABELS[result.thresholds.signification.method].toLowerCase()}
                        </div>
                      </div>
                    </div>

                    {/* Seuil de planification */}
                    <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-amber-50 to-white border border-amber-100 rounded-xl">
                      <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Shield className="w-5 h-5 text-amber-600" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-navy-900">Seuil de planification</div>
                        <div className="text-xs text-navy-500">Pour couvrir les anomalies non détectées (70% du seuil de signification)</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-mono font-bold text-amber-700">
                          {formatEuro(result.thresholds.planification.value)}
                        </div>
                        <div className="text-xs text-navy-400">
                          {result.thresholds.planification.percentage}% du seuil de signification
                        </div>
                      </div>
                    </div>

                    {/* Seuil d'anomalies */}
                    <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-emerald-50 to-white border border-emerald-100 rounded-xl">
                      <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-navy-900">Seuil d&apos;anomalies insignifiantes</div>
                        <div className="text-xs text-navy-500">En-dessous, les anomalies ne nécessitent pas de cumul (5% du seuil de planification)</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-mono font-bold text-emerald-700">
                          {formatEuro(result.thresholds.anomalies.value)}
                        </div>
                        <div className="text-xs text-navy-400">
                          {result.thresholds.anomalies.percentage}% du seuil de planification
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* CTA Card */}
                <Card className="bg-gradient-to-r from-navy-900 to-navy-800 text-white border-navy-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-display font-semibold">
                        Étape suivante : trier les comptes
                      </h3>
                      <p className="text-sm text-navy-300 mt-1">
                        Importez votre balance pour classer les comptes par seuils d&apos;audit
                      </p>
                    </div>
                    <Link href="/audit/comptes">
                      <Button variant="primary" size="sm" icon={<ArrowRight className="w-4 h-4" />}>
                        Tri des comptes
                      </Button>
                    </Link>
                  </div>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  )
}
