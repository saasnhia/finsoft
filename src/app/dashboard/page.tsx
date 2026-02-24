'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { AppShell } from '@/components/layout'
import { Card } from '@/components/ui'
import { ExportFECModal, InsightsPanel } from '@/components/dashboard'
import { useAuth } from '@/hooks/useAuth'
import {
  Clock,
  AlertCircle,
  Euro,
  Bell,
  Download,
  Loader2,
  CheckCircle2,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  ReceiptText,
  Users,
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'react-hot-toast'

// ─── Types ────────────────────────────────────────────────────────────────────

interface BalanceAgeeItem {
  id: string
  numero_facture: string
  client_nom: string
  montant_ttc: number
  resteA: number
  date_echeance: string
  joursRetard: number
  tranche: 'non_echu' | '0_30' | '31_60' | '61_90' | 'plus_90'
  statut_paiement: string
}

interface RapprochementItem {
  id: string
  montant: number
  confidence_score: number
  facture: { fournisseur: string | null; montant_ttc: number | null; date_facture: string | null } | null
  transaction: { description: string; date: string; amount: number } | null
}

interface TransactionItem {
  id: string
  date: string
  description: string
  amount: number
  category: string | null
  status: string
}

interface DashboardKPIs {
  encours_clients: number
  count_en_attente: number
  total_en_retard: number
  count_en_retard: number
  tva_nette: number | null
  tva_statut: string | null
  alertes_count: number
  alertes_critiques: number
}

interface DashboardData {
  kpis: DashboardKPIs
  balance_agee: BalanceAgeeItem[]
  rapprochements: RapprochementItem[]
  transactions: TransactionItem[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(amount)
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

const TRANCHE_LABELS: Record<string, string> = {
  non_echu: 'Non échu',
  '0_30': '0–30j',
  '31_60': '31–60j',
  '61_90': '61–90j',
  plus_90: '+90j',
}

const TRANCHE_COLORS: Record<string, string> = {
  non_echu: 'bg-navy-100 text-navy-600',
  '0_30': 'bg-amber-100 text-amber-700',
  '31_60': 'bg-orange-100 text-orange-700',
  '61_90': 'bg-red-100 text-red-700',
  plus_90: 'bg-red-200 text-red-800 font-semibold',
}

// ─── FileImportZone (inline, scope unique au dashboard) ──────────────────────

type ParsedFields = {
  chiffreAffaires?: number
  loyer?: number
  salaires?: number
  assurances?: number
  abonnements?: number
  emprunts?: number
  autres?: number
  tauxChargesVariables?: number
  detectedFields?: string[]
}

function FileImportZone() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragActive, setDragActive] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [parsed, setParsed] = useState<ParsedFields | null>(null)

  const handleFile = async (file: File) => {
    setFileName(file.name)
    setParsed(null)
    setLoading(true)
    const formData = new FormData()
    formData.append('file', file)
    try {
      const res = await fetch('/api/parse-finance', { method: 'POST', body: formData })
      const data = await res.json()
      if (res.ok) setParsed(data)
      else toast.error(data.error || 'Erreur lors du parsing')
    } catch {
      toast.error('Erreur lors du parsing du fichier')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div
        className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-colors ${
          dragActive ? 'border-emerald-500 bg-emerald-50' : 'border-navy-200 bg-navy-50 hover:border-emerald-400'
        }`}
        onDragOver={e => { e.preventDefault(); setDragActive(true) }}
        onDragLeave={e => { e.preventDefault(); setDragActive(false) }}
        onDrop={e => {
          e.preventDefault()
          setDragActive(false)
          if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0])
        }}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.xlsx,.xls,.csv,.jpg,.jpeg,.png"
          className="hidden"
          onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]) }}
        />
        <div className="flex flex-col items-center gap-2">
          <span className="text-xl">📁</span>
          <span className="text-sm font-medium text-navy-600">
            {fileName ?? 'Glissez ou cliquez pour importer'}
          </span>
          <span className="text-xs text-navy-400">PDF, Excel, CSV</span>
        </div>
      </div>
      {loading && (
        <div className="mt-3 flex items-center gap-2 text-sm text-emerald-600">
          <Loader2 className="w-4 h-4 animate-spin" />
          Analyse en cours…
        </div>
      )}
      {parsed && !loading && (
        <div className="mt-3 text-sm text-emerald-700 font-medium">
          ✅ {parsed.detectedFields?.length ?? 0} champ{(parsed.detectedFields?.length ?? 0) > 1 ? 's' : ''} détecté{(parsed.detectedFields?.length ?? 0) > 1 ? 's' : ''}
        </div>
      )}
    </div>
  )
}

// ─── KPICard ─────────────────────────────────────────────────────────────────

interface KPICardProps {
  title: string
  value: string
  subtitle: string
  icon: React.ReactNode
  accent: string
  variant: 'default' | 'danger' | 'warning' | 'success'
  loading?: boolean
}

function SimpleKPICard({ title, value, subtitle, icon, accent, variant, loading }: KPICardProps) {
  const variantBg: Record<string, string> = {
    default: 'bg-white',
    danger: 'bg-red-50',
    warning: 'bg-amber-50',
    success: 'bg-emerald-50',
  }
  const variantText: Record<string, string> = {
    default: 'text-navy-900',
    danger: 'text-red-700',
    warning: 'text-amber-700',
    success: 'text-emerald-700',
  }

  return (
    <div className={`rounded-xl border border-navy-100 ${variantBg[variant]} p-5 relative overflow-hidden`}>
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${accent} rounded-l-xl`} />
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-navy-500 uppercase tracking-wide mb-1">{title}</p>
          {loading ? (
            <div className="h-7 w-24 bg-navy-100 animate-pulse rounded" />
          ) : (
            <p className={`text-2xl font-bold font-display ${variantText[variant]}`}>{value}</p>
          )}
          <p className="text-xs text-navy-400 mt-1">{subtitle}</p>
        </div>
        <div className={`p-2 rounded-lg ${variantBg[variant]} border border-navy-100`}>
          {icon}
        </div>
      </div>
    </div>
  )
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user } = useAuth()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [showFECModal, setShowFECModal] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/dashboard/summary')
      const json = await res.json()
      if (json.success) setData(json)
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (user) fetchData()
    else setLoading(false)
  }, [user, fetchData])

  const handleValidateRapprochement = async (id: string) => {
    try {
      await fetch(`/api/rapprochement/${id}/validate`, { method: 'POST' })
      setData(prev =>
        prev
          ? { ...prev, rapprochements: prev.rapprochements.filter(r => r.id !== id) }
          : prev
      )
      toast.success('Rapprochement validé')
    } catch {
      toast.error('Erreur lors de la validation')
    }
  }

  const kpis = data?.kpis
  const balanceAgee = data?.balance_agee ?? []
  const rapprochements = data?.rapprochements ?? []
  const transactions = data?.transactions ?? []

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Bandeau e-invoicing 2026 */}
        <div className="mb-4 flex items-center gap-3 px-4 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-sm">
          <span className="text-emerald-700 font-medium">✅ FinSoft est conforme e-invoicing 2026 (Factur-X / EN16931)</span>
          <Link href="/comptabilite/factures/einvoicing" className="ml-auto flex-shrink-0 text-emerald-700 hover:underline text-xs font-medium">
            En savoir plus →
          </Link>
        </div>

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-display font-bold text-navy-900">Tableau de bord</h1>
            <p className="mt-1 text-sm text-navy-500">Situation financière du cabinet</p>
          </div>
          <button
            onClick={() => setShowFECModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-navy-600 hover:bg-navy-100 rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            Export FEC
          </button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <SimpleKPICard
            title="Encours clients"
            value={kpis ? formatCurrency(kpis.encours_clients) : '—'}
            subtitle={kpis ? `${kpis.count_en_attente} facture${kpis.count_en_attente > 1 ? 's' : ''} en attente` : 'Chargement…'}
            icon={<Users className="w-5 h-5 text-blue-600" />}
            accent="bg-blue-500"
            variant="default"
            loading={loading}
          />
          <SimpleKPICard
            title="En retard"
            value={kpis ? formatCurrency(kpis.total_en_retard) : '—'}
            subtitle={kpis ? `${kpis.count_en_retard} facture${kpis.count_en_retard > 1 ? 's' : ''} impayée${kpis.count_en_retard > 1 ? 's' : ''}` : 'Chargement…'}
            icon={<Clock className="w-5 h-5 text-red-600" />}
            accent="bg-red-500"
            variant={kpis && kpis.count_en_retard > 0 ? 'danger' : 'default'}
            loading={loading}
          />
          <SimpleKPICard
            title="TVA du mois"
            value={
              kpis?.tva_nette != null
                ? formatCurrency(kpis.tva_nette)
                : 'Aucune déclaration'
            }
            subtitle={
              kpis?.tva_statut
                ? `Statut : ${kpis.tva_statut}`
                : 'Pas de déclaration ce mois'
            }
            icon={<Euro className="w-5 h-5 text-amber-600" />}
            accent="bg-amber-500"
            variant={kpis?.tva_nette != null && kpis.tva_nette > 0 ? 'warning' : 'default'}
            loading={loading}
          />
          <SimpleKPICard
            title="Alertes actives"
            value={kpis ? String(kpis.alertes_count) : '—'}
            subtitle={
              kpis
                ? kpis.alertes_critiques > 0
                  ? `dont ${kpis.alertes_critiques} critique${kpis.alertes_critiques > 1 ? 's' : ''}`
                  : 'Aucune alerte critique'
                : 'Chargement…'
            }
            icon={<Bell className="w-5 h-5 text-purple-600" />}
            accent="bg-purple-500"
            variant={kpis && kpis.alertes_critiques > 0 ? 'danger' : 'default'}
            loading={loading}
          />
        </div>

        {/* Row 1: Balance âgée (2/3) + Rapprochements (1/3) */}
        <div className="grid lg:grid-cols-3 gap-6 mb-6">

          {/* Balance âgée clients */}
          <Card className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ReceiptText className="w-5 h-5 text-navy-500" />
                <h2 className="text-base font-display font-semibold text-navy-900">Balance âgée clients</h2>
              </div>
              <Link href="/audit/balance-agee" className="text-xs text-emerald-600 hover:underline flex items-center gap-1">
                Voir tout <ChevronRight className="w-3 h-3" />
              </Link>
            </div>

            {loading ? (
              <div className="space-y-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-10 bg-navy-50 animate-pulse rounded-lg" />
                ))}
              </div>
            ) : balanceAgee.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mb-2" />
                <p className="text-sm font-medium text-navy-600">Aucun encours client</p>
                <p className="text-xs text-navy-400 mt-1">Toutes les factures sont à jour</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs font-medium text-navy-400 border-b border-navy-100">
                      <th className="text-left pb-2">Client</th>
                      <th className="text-left pb-2">N° Facture</th>
                      <th className="text-left pb-2">Échéance</th>
                      <th className="text-right pb-2">Restant dû</th>
                      <th className="text-right pb-2">Retard</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-navy-50">
                    {balanceAgee.slice(0, 8).map(f => (
                      <tr key={f.id} className="hover:bg-navy-50/50 transition-colors">
                        <td className="py-2.5 pr-3 font-medium text-navy-800 truncate max-w-[120px]">
                          {f.client_nom}
                        </td>
                        <td className="py-2.5 pr-3 text-navy-500 font-mono text-xs">
                          {f.numero_facture}
                        </td>
                        <td className="py-2.5 pr-3 text-navy-500">
                          {formatDate(f.date_echeance)}
                        </td>
                        <td className="py-2.5 pr-3 text-right font-mono font-semibold text-navy-900">
                          {formatCurrency(f.resteA)}
                        </td>
                        <td className="py-2.5 text-right">
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[11px] ${TRANCHE_COLORS[f.tranche]}`}>
                            {TRANCHE_LABELS[f.tranche]}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {balanceAgee.length > 8 && (
                  <div className="mt-3 text-center">
                    <Link href="/audit/balance-agee" className="text-xs text-emerald-600 hover:underline">
                      + {balanceAgee.length - 8} autres factures
                    </Link>
                  </div>
                )}
              </div>
            )}
          </Card>

          {/* Rapprochements à valider */}
          <Card className="lg:col-span-1">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-display font-semibold text-navy-900">Rapprochements</h2>
              <Link href="/rapprochement" className="text-xs text-emerald-600 hover:underline flex items-center gap-1">
                Gérer <ChevronRight className="w-3 h-3" />
              </Link>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-16 bg-navy-50 animate-pulse rounded-lg" />
                ))}
              </div>
            ) : rapprochements.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CheckCircle2 className="w-7 h-7 text-emerald-400 mb-2" />
                <p className="text-sm text-navy-500">Tout est validé</p>
              </div>
            ) : (
              <div className="space-y-3">
                {rapprochements.map(r => (
                  <div key={r.id} className="p-3 bg-navy-50 rounded-lg">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-navy-700 truncate">
                          {r.facture?.fournisseur ?? 'Fournisseur inconnu'}
                        </p>
                        <p className="text-xs text-navy-400 truncate">
                          {r.transaction?.description ?? '—'}
                        </p>
                      </div>
                      <span className="text-xs font-mono font-semibold text-navy-800 whitespace-nowrap">
                        {formatCurrency(r.montant)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-navy-400">
                        Confiance : {Math.round(r.confidence_score)}%
                      </span>
                      <button
                        onClick={() => handleValidateRapprochement(r.id)}
                        className="text-[11px] font-medium text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        Valider
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Row 2: Activité récente (1/2) + Import + InsightsPanel (1/2) */}
        <div className="grid lg:grid-cols-2 gap-6">

          {/* Activité récente */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-display font-semibold text-navy-900">Activité récente</h2>
              <Link href="/transactions" className="text-xs text-emerald-600 hover:underline flex items-center gap-1">
                Toutes <ChevronRight className="w-3 h-3" />
              </Link>
            </div>

            {loading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-10 bg-navy-50 animate-pulse rounded-lg" />
                ))}
              </div>
            ) : transactions.length === 0 ? (
              <p className="text-sm text-navy-400 py-6 text-center">Aucune transaction récente</p>
            ) : (
              <div className="space-y-1">
                {transactions.map(t => (
                  <div key={t.id} className="flex items-center gap-3 py-2 border-b border-navy-50 last:border-0">
                    <div className={`p-1.5 rounded-lg ${t.amount >= 0 ? 'bg-emerald-100' : 'bg-red-100'}`}>
                      {t.amount >= 0 ? (
                        <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <ArrowDownRight className="w-3.5 h-3.5 text-red-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-navy-800 truncate">{t.description}</p>
                      <p className="text-[11px] text-navy-400">{formatDate(t.date)} · {t.category ?? 'Non catégorisé'}</p>
                    </div>
                    <span className={`text-xs font-mono font-semibold ${t.amount >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {t.amount >= 0 ? '+' : ''}{formatCurrency(t.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Import + Recommandations IA */}
          <div className="space-y-4">
            <Card>
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="w-4 h-4 text-navy-400" />
                <h2 className="text-base font-display font-semibold text-navy-900">Importer un fichier</h2>
              </div>
              <p className="text-xs text-navy-400 mb-3">PDF, Excel, CSV — détection automatique des champs</p>
              <FileImportZone />
            </Card>

            <InsightsPanel userId={user?.id} />
          </div>
        </div>
      </div>

      {showFECModal && <ExportFECModal onClose={() => setShowFECModal(false)} />}
    </AppShell>
  )
}
