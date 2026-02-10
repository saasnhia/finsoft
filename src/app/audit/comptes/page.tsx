'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { AppShell } from '@/components/layout'
import { Card, Button } from '@/components/ui'
import {
  FileText,
  Upload,
  Shield,
  AlertTriangle,
  CheckCircle2,
  Eye,
  Search,
  ArrowLeft,
  HelpCircle,
  Loader2,
  Info,
  XCircle,
  Download,
  Filter,
} from 'lucide-react'
import type { AccountRisk, AuditThresholds, AccountBalance } from '@/types'

const formatEuro = (n: number) =>
  new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n)

const RISK_CONFIG = {
  high: { label: 'Significatif', color: 'coral', icon: AlertTriangle, bg: 'bg-coral-50', border: 'border-coral-200', text: 'text-coral-700', badge: 'bg-coral-100 text-coral-700' },
  medium: { label: 'À vérifier', color: 'amber', icon: Eye, bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', badge: 'bg-amber-100 text-amber-700' },
  low: { label: 'Insignifiant', color: 'emerald', icon: CheckCircle2, bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-700' },
}

const CLASSE_LABELS: Record<number, string> = {
  1: 'Capitaux',
  2: 'Immobilisations',
  3: 'Stocks',
  4: 'Tiers',
  5: 'Financier',
  6: 'Charges',
  7: 'Produits',
}

// Example balance for demo
const DEMO_BALANCE: AccountBalance[] = [
  { numero_compte: '101000', libelle: 'Capital social', classe: 1, solde_debiteur: 0, solde_crediteur: 500000, solde_net: -500000, mouvement_debit: 0, mouvement_credit: 500000 },
  { numero_compte: '164000', libelle: 'Emprunts auprès des éts de crédit', classe: 1, solde_debiteur: 0, solde_crediteur: 1200000, solde_net: -1200000, mouvement_debit: 150000, mouvement_credit: 1350000 },
  { numero_compte: '213100', libelle: 'Constructions', classe: 2, solde_debiteur: 2500000, solde_crediteur: 0, solde_net: 2500000, mouvement_debit: 2500000, mouvement_credit: 0 },
  { numero_compte: '218200', libelle: 'Matériel de transport', classe: 2, solde_debiteur: 180000, solde_crediteur: 0, solde_net: 180000, mouvement_debit: 230000, mouvement_credit: 50000 },
  { numero_compte: '281310', libelle: 'Amort. constructions', classe: 2, solde_debiteur: 0, solde_crediteur: 750000, solde_net: -750000, mouvement_debit: 0, mouvement_credit: 125000 },
  { numero_compte: '370000', libelle: 'Stocks de marchandises', classe: 3, solde_debiteur: 450000, solde_crediteur: 0, solde_net: 450000, mouvement_debit: 3200000, mouvement_credit: 2750000 },
  { numero_compte: '411000', libelle: 'Clients', classe: 4, solde_debiteur: 850000, solde_crediteur: 0, solde_net: 850000, mouvement_debit: 6500000, mouvement_credit: 5650000 },
  { numero_compte: '401000', libelle: 'Fournisseurs', classe: 4, solde_debiteur: 0, solde_crediteur: 620000, solde_net: -620000, mouvement_debit: 4800000, mouvement_credit: 5420000 },
  { numero_compte: '421000', libelle: 'Personnel - Rémunérations dues', classe: 4, solde_debiteur: 0, solde_crediteur: 95000, solde_net: -95000, mouvement_debit: 1100000, mouvement_credit: 1195000 },
  { numero_compte: '445710', libelle: 'TVA collectée', classe: 4, solde_debiteur: 0, solde_crediteur: 180000, solde_net: -180000, mouvement_debit: 1080000, mouvement_credit: 1260000 },
  { numero_compte: '512000', libelle: 'Banque', classe: 5, solde_debiteur: 320000, solde_crediteur: 0, solde_net: 320000, mouvement_debit: 8500000, mouvement_credit: 8180000 },
  { numero_compte: '607000', libelle: 'Achats de marchandises', classe: 6, solde_debiteur: 3200000, solde_crediteur: 0, solde_net: 3200000, mouvement_debit: 3200000, mouvement_credit: 0 },
  { numero_compte: '641000', libelle: 'Rémunérations du personnel', classe: 6, solde_debiteur: 1200000, solde_crediteur: 0, solde_net: 1200000, mouvement_debit: 1200000, mouvement_credit: 0 },
  { numero_compte: '613200', libelle: 'Locations immobilières', classe: 6, solde_debiteur: 96000, solde_crediteur: 0, solde_net: 96000, mouvement_debit: 96000, mouvement_credit: 0 },
  { numero_compte: '616000', libelle: 'Primes d\'assurance', classe: 6, solde_debiteur: 24000, solde_crediteur: 0, solde_net: 24000, mouvement_debit: 24000, mouvement_credit: 0 },
  { numero_compte: '707000', libelle: 'Ventes de marchandises', classe: 7, solde_debiteur: 0, solde_crediteur: 6500000, solde_net: -6500000, mouvement_debit: 0, mouvement_credit: 6500000 },
  { numero_compte: '708500', libelle: 'Ports et frais facturés', classe: 7, solde_debiteur: 0, solde_crediteur: 45000, solde_net: -45000, mouvement_debit: 0, mouvement_credit: 45000 },
]

export default function AuditComptesPage() {
  const [form, setForm] = useState({
    chiffre_affaires_ht: '',
    total_bilan: '',
    effectif_moyen: '',
    resultat_net: '',
  })
  const [balance, setBalance] = useState<AccountBalance[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [results, setResults] = useState<{
    significatifs: AccountRisk[]
    aVerifier: AccountRisk[]
    insignifiants: AccountRisk[]
    thresholds: AuditThresholds
  } | null>(null)
  const [filterClasse, setFilterClasse] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleLoadDemo = () => {
    setBalance(DEMO_BALANCE)
    setForm({
      chiffre_affaires_ht: '6545000',
      total_bilan: '5200000',
      effectif_moyen: '35',
      resultat_net: '250000',
    })
  }

  const handleCSVImport = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const text = evt.target?.result as string
        const lines = text.split('\n').filter(l => l.trim())
        if (lines.length < 2) {
          setError('Le fichier CSV doit contenir au moins un en-tête et une ligne de données')
          return
        }

        const headers = lines[0].split(';').map(h => h.trim().toLowerCase())
        const parsed: AccountBalance[] = []

        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(';').map(c => c.trim())
          if (cols.length < 4) continue

          const numIndex = headers.findIndex(h => h.includes('compte') || h.includes('numero'))
          const libIndex = headers.findIndex(h => h.includes('libelle') || h.includes('lib'))
          const debitIndex = headers.findIndex(h => h.includes('debit') || h.includes('débit'))
          const creditIndex = headers.findIndex(h => h.includes('credit') || h.includes('crédit'))

          if (numIndex === -1 || debitIndex === -1 || creditIndex === -1) {
            setError('Colonnes requises : numero_compte, libelle, debit, credit')
            return
          }

          const numero = cols[numIndex] || ''
          const debit = parseFloat(cols[debitIndex]?.replace(/\s/g, '').replace(',', '.')) || 0
          const credit = parseFloat(cols[creditIndex]?.replace(/\s/g, '').replace(',', '.')) || 0
          const classe = parseInt(numero[0]) || 0

          parsed.push({
            numero_compte: numero,
            libelle: cols[libIndex] || numero,
            classe,
            solde_debiteur: debit,
            solde_crediteur: credit,
            solde_net: debit - credit,
            mouvement_debit: debit,
            mouvement_credit: credit,
          })
        }

        if (parsed.length === 0) {
          setError('Aucun compte valide trouvé dans le fichier')
          return
        }

        setBalance(parsed)
        setError(null)
      } catch {
        setError('Erreur lors de la lecture du fichier CSV')
      }
    }
    reader.readAsText(file, 'utf-8')
    e.target.value = ''
  }, [])

  const handleAnalyze = async () => {
    if (balance.length === 0) {
      setError('Veuillez d\'abord importer une balance des comptes')
      return
    }
    if (!form.total_bilan || !form.chiffre_affaires_ht) {
      setError('Le CA HT et le total bilan sont requis')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/audit/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chiffre_affaires_ht: parseFloat(form.chiffre_affaires_ht) || 0,
          total_bilan: parseFloat(form.total_bilan) || 0,
          effectif_moyen: parseInt(form.effectif_moyen) || 0,
          resultat_net: parseFloat(form.resultat_net) || 0,
          balance,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        setError(data.error || 'Erreur lors de l\'analyse')
      } else {
        setResults({
          significatifs: data.comptes_significatifs,
          aVerifier: data.comptes_a_verifier,
          insignifiants: data.comptes_insignifiants,
          thresholds: data.thresholds,
        })
      }
    } catch {
      setError('Erreur de connexion au serveur')
    } finally {
      setLoading(false)
    }
  }

  const handleExportCSV = () => {
    if (!results) return
    const allAccounts = [
      ...results.significatifs,
      ...results.aVerifier,
      ...results.insignifiants,
    ]

    const header = 'Compte;Libellé;Classe;Solde Net;Mouvement Total;Ratio Bilan %;Risque;Classification;Notes'
    const rows = allAccounts.map(a =>
      `${a.numero_compte};${a.libelle};${a.classe};${a.solde_net};${a.mouvement_total};${a.ratio_bilan};${a.risk_level};${a.classification};${a.notes || ''}`
    )

    const csv = [header, ...rows].join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `audit-comptes-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const filterAccounts = (accounts: AccountRisk[]) => {
    return accounts.filter(a => {
      if (filterClasse !== null && a.classe !== filterClasse) return false
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        return a.numero_compte.includes(q) || a.libelle.toLowerCase().includes(q)
      }
      return true
    })
  }

  return (
      <AppShell>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 text-sm text-navy-500 mb-1">
              <Link href="/dashboard" className="hover:text-emerald-600 transition-colors">Dashboard</Link>
              <span>/</span>
              <Link href="/audit/seuils" className="hover:text-emerald-600 transition-colors">Audit</Link>
              <span>/</span>
              <span className="text-navy-700">Tri des comptes</span>
            </div>
            <h1 className="text-2xl font-display font-bold text-navy-900">
              Tri des comptes par seuils d&apos;audit
            </h1>
            <p className="text-sm text-navy-500 mt-1">
              Classez les comptes de la balance en significatifs, à vérifier et insignifiants
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/audit/seuils">
              <Button variant="outline" size="sm" icon={<ArrowLeft className="w-4 h-4" />}>
                Calcul seuils
              </Button>
            </Link>
            <Link href="/faq">
              <Button variant="ghost" size="sm" icon={<HelpCircle className="w-4 h-4" />}>
                FAQ
              </Button>
            </Link>
          </div>
        </div>

        {/* Input Section */}
        {!results && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Financial Data */}
            <Card>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <Shield className="w-4 h-4 text-emerald-600" />
                </div>
                <h2 className="font-display font-semibold text-navy-900 text-sm">
                  Données financières
                </h2>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-navy-600 mb-1">CA HT annuel (€) *</label>
                  <input type="number" name="chiffre_affaires_ht" value={form.chiffre_affaires_ht} onChange={handleChange} required min="0" placeholder="6 545 000"
                    className="w-full px-3 py-2 border border-navy-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-navy-600 mb-1">Total bilan (€) *</label>
                  <input type="number" name="total_bilan" value={form.total_bilan} onChange={handleChange} required min="0" placeholder="5 200 000"
                    className="w-full px-3 py-2 border border-navy-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-navy-600 mb-1">Effectif</label>
                    <input type="number" name="effectif_moyen" value={form.effectif_moyen} onChange={handleChange} min="0" placeholder="35"
                      className="w-full px-3 py-2 border border-navy-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-navy-600 mb-1">Résultat net (€)</label>
                    <input type="number" name="resultat_net" value={form.resultat_net} onChange={handleChange} placeholder="250 000"
                      className="w-full px-3 py-2 border border-navy-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
                  </div>
                </div>
              </div>
            </Card>

            {/* Balance Import */}
            <Card className="lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-navy-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-4 h-4 text-navy-600" />
                  </div>
                  <h2 className="font-display font-semibold text-navy-900 text-sm">
                    Balance des comptes
                  </h2>
                </div>
                {balance.length > 0 && (
                  <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                    {balance.length} comptes chargés
                  </span>
                )}
              </div>

              {balance.length === 0 ? (
                <div className="border-2 border-dashed border-navy-200 rounded-xl p-8 text-center">
                  <Upload className="w-10 h-10 text-navy-300 mx-auto mb-3" />
                  <p className="text-sm text-navy-600 mb-1 font-medium">
                    Importez votre balance des comptes
                  </p>
                  <p className="text-xs text-navy-400 mb-4">
                    CSV, Excel ou TXT avec colonnes : numero_compte, libelle, debit, credit
                  </p>
                  <div className="flex items-center justify-center gap-3">
                    <label className="cursor-pointer">
                      <input type="file" accept=".csv,.xlsx,.xls,.txt" onChange={handleCSVImport} className="hidden" />
                      <Button variant="primary" size="sm" icon={<Upload className="w-4 h-4" />} onClick={() => {}}>
                        Importer CSV
                      </Button>
                    </label>
                    <Button variant="outline" size="sm" onClick={handleLoadDemo}>
                      Charger la démo
                    </Button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="max-h-48 overflow-y-auto border border-navy-100 rounded-xl">
                    <table className="w-full text-xs">
                      <thead className="bg-navy-50 sticky top-0">
                        <tr>
                          <th className="px-3 py-2 text-left text-navy-600 font-medium">Compte</th>
                          <th className="px-3 py-2 text-left text-navy-600 font-medium">Libellé</th>
                          <th className="px-3 py-2 text-right text-navy-600 font-medium">Débit</th>
                          <th className="px-3 py-2 text-right text-navy-600 font-medium">Crédit</th>
                          <th className="px-3 py-2 text-right text-navy-600 font-medium">Solde net</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-navy-50">
                        {balance.map((a, i) => (
                          <tr key={i} className="hover:bg-navy-50/50">
                            <td className="px-3 py-1.5 font-mono text-navy-800">{a.numero_compte}</td>
                            <td className="px-3 py-1.5 text-navy-600 truncate max-w-[200px]">{a.libelle}</td>
                            <td className="px-3 py-1.5 text-right font-mono text-navy-800">{a.solde_debiteur > 0 ? formatEuro(a.solde_debiteur) : '-'}</td>
                            <td className="px-3 py-1.5 text-right font-mono text-navy-800">{a.solde_crediteur > 0 ? formatEuro(a.solde_crediteur) : '-'}</td>
                            <td className={`px-3 py-1.5 text-right font-mono font-medium ${a.solde_net >= 0 ? 'text-navy-900' : 'text-coral-600'}`}>
                              {formatEuro(a.solde_net)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <Button variant="ghost" size="sm" onClick={() => setBalance([])}>
                      Vider la balance
                    </Button>
                    <label className="cursor-pointer">
                      <input type="file" accept=".csv,.xlsx,.xls,.txt" onChange={handleCSVImport} className="hidden" />
                      <Button variant="outline" size="sm" icon={<Upload className="w-3 h-3" />} onClick={() => {}}>
                        Réimporter
                      </Button>
                    </label>
                  </div>
                </div>
              )}
            </Card>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-coral-50 border border-coral-200 rounded-xl text-sm text-coral-700 mb-4">
            <XCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Analyze Button */}
        {!results && (
          <div className="flex justify-center mb-8">
            <Button onClick={handleAnalyze} loading={loading} icon={<Shield className="w-4 h-4" />} size="lg">
              Analyser et classer les comptes
            </Button>
          </div>
        )}

        {/* Results */}
        {results && (
          <div className="space-y-6">
            {/* Summary Bar */}
            <Card className="bg-gradient-to-r from-navy-900 to-navy-800 text-white border-navy-700">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h3 className="font-display font-semibold">Résultat de l&apos;analyse</h3>
                  <p className="text-sm text-navy-300 mt-0.5">
                    Seuil de signification : <strong className="text-white">{formatEuro(results.thresholds.signification.value)}</strong>
                    &nbsp;|&nbsp;Planification : <strong className="text-white">{formatEuro(results.thresholds.planification.value)}</strong>
                    &nbsp;|&nbsp;Anomalies : <strong className="text-white">{formatEuro(results.thresholds.anomalies.value)}</strong>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="primary" size="sm" onClick={handleExportCSV} icon={<Download className="w-4 h-4" />}>
                    Export CSV
                  </Button>
                  <Button variant="ghost" size="sm" className="text-white hover:bg-navy-700" onClick={() => setResults(null)}>
                    Modifier
                  </Button>
                </div>
              </div>
            </Card>

            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-4">
              {([
                { key: 'significatifs', count: results.significatifs.length, config: RISK_CONFIG.high },
                { key: 'aVerifier', count: results.aVerifier.length, config: RISK_CONFIG.medium },
                { key: 'insignifiants', count: results.insignifiants.length, config: RISK_CONFIG.low },
              ] as const).map(({ key, count, config }) => (
                <Card key={key} className={`${config.bg} ${config.border}`}>
                  <div className="flex items-center gap-3">
                    <config.icon className={`w-5 h-5 ${config.text}`} />
                    <div>
                      <div className={`text-2xl font-mono font-bold ${config.text}`}>{count}</div>
                      <div className="text-xs text-navy-500">{config.label}</div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Filters */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative flex-1 max-w-xs">
                <Search className="w-4 h-4 text-navy-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher un compte..."
                  className="w-full pl-9 pr-3 py-2 border border-navy-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
              <div className="flex items-center gap-1">
                <Filter className="w-4 h-4 text-navy-400" />
                <button
                  onClick={() => setFilterClasse(null)}
                  className={`px-2.5 py-1 text-xs rounded-lg transition-colors ${
                    filterClasse === null ? 'bg-emerald-100 text-emerald-700 font-medium' : 'text-navy-500 hover:bg-navy-100'
                  }`}
                >
                  Tous
                </button>
                {[1, 2, 3, 4, 5, 6, 7].map(c => (
                  <button
                    key={c}
                    onClick={() => setFilterClasse(filterClasse === c ? null : c)}
                    className={`px-2.5 py-1 text-xs rounded-lg transition-colors ${
                      filterClasse === c ? 'bg-emerald-100 text-emerald-700 font-medium' : 'text-navy-500 hover:bg-navy-100'
                    }`}
                  >
                    Cl.{c}
                  </button>
                ))}
              </div>
            </div>

            {/* Account Tables */}
            {([
              { title: 'Comptes significatifs — Audit détaillé requis', data: filterAccounts(results.significatifs), config: RISK_CONFIG.high },
              { title: 'Comptes à vérifier — Procédures analytiques', data: filterAccounts(results.aVerifier), config: RISK_CONFIG.medium },
              { title: 'Comptes insignifiants — Revue limitée', data: filterAccounts(results.insignifiants), config: RISK_CONFIG.low },
            ] as const).map(({ title, data, config }) => (
              <Card key={title} padding="none">
                <div className={`px-4 py-3 border-b ${config.border} ${config.bg} rounded-t-2xl`}>
                  <div className="flex items-center gap-2">
                    <config.icon className={`w-4 h-4 ${config.text}`} />
                    <h3 className={`text-sm font-semibold ${config.text}`}>{title}</h3>
                    <span className={`ml-auto text-xs font-medium px-2 py-0.5 rounded-full ${config.badge}`}>
                      {data.length} compte{data.length > 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
                {data.length === 0 ? (
                  <div className="px-4 py-6 text-center text-sm text-navy-400">
                    Aucun compte dans cette catégorie
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-navy-100">
                          <th className="px-4 py-2.5 text-left text-xs font-medium text-navy-500">Compte</th>
                          <th className="px-4 py-2.5 text-left text-xs font-medium text-navy-500">Libellé</th>
                          <th className="px-4 py-2.5 text-center text-xs font-medium text-navy-500">Classe</th>
                          <th className="px-4 py-2.5 text-right text-xs font-medium text-navy-500">Solde net</th>
                          <th className="px-4 py-2.5 text-right text-xs font-medium text-navy-500">Mouvements</th>
                          <th className="px-4 py-2.5 text-right text-xs font-medium text-navy-500">% Bilan</th>
                          <th className="px-4 py-2.5 text-left text-xs font-medium text-navy-500">Notes</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-navy-50">
                        {data.map((a, i) => (
                          <tr key={i} className="hover:bg-navy-50/50 transition-colors">
                            <td className="px-4 py-2 font-mono text-navy-800 text-xs">{a.numero_compte}</td>
                            <td className="px-4 py-2 text-navy-700">{a.libelle}</td>
                            <td className="px-4 py-2 text-center">
                              <span className="text-xs bg-navy-100 text-navy-600 px-2 py-0.5 rounded-full">
                                {a.classe} - {CLASSE_LABELS[a.classe] || '?'}
                              </span>
                            </td>
                            <td className={`px-4 py-2 text-right font-mono font-medium ${a.solde_net >= 0 ? 'text-navy-900' : 'text-coral-600'}`}>
                              {formatEuro(a.solde_net)}
                            </td>
                            <td className="px-4 py-2 text-right font-mono text-navy-600 text-xs">
                              {formatEuro(a.mouvement_total)}
                            </td>
                            <td className="px-4 py-2 text-right font-mono text-navy-500 text-xs">
                              {a.ratio_bilan}%
                            </td>
                            <td className="px-4 py-2 text-xs text-navy-500 max-w-[200px] truncate" title={a.notes}>
                              {a.notes || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  )
}
