'use client'

import { useState, useEffect, useCallback } from 'react'
import { AppShell } from '@/components/layout'
import { Card } from '@/components/ui'
import { useAuth } from '@/hooks/useAuth'
import { useUserPlan } from '@/hooks/useUserPlan'
import { createClient } from '@/lib/supabase/client'
import {
  FileText, AlertTriangle, Save, Download, CheckCircle2,
  Loader2, Info,
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import Link from 'next/link'

// ─── Types ────────────────────────────────────────────────────────────────────

type TypeLiasse = '2065' | '2031' | '2035'

interface LiasseData {
  [key: string]: string
}

// ─── Définition des formulaires ───────────────────────────────────────────────

interface CaseFormulaire {
  code: string
  libelle: string
  type: 'montant' | 'texte' | 'nombre'
  prefill?: string  // key into accounting data
}

const FORMULAIRES: Record<TypeLiasse, { titre: string; sections: { titre: string; cases: CaseFormulaire[] }[] }> = {
  '2065': {
    titre: 'Déclaration de résultats (IS — Sociétés)',
    sections: [
      {
        titre: 'Produits d\'exploitation',
        cases: [
          { code: 'FL', libelle: 'Chiffre d\'affaires net', type: 'montant', prefill: 'ca_ht' },
          { code: 'FN', libelle: 'Production stockée', type: 'montant' },
          { code: 'FP', libelle: 'Production immobilisée', type: 'montant' },
          { code: 'GF', libelle: 'Autres produits', type: 'montant' },
          { code: 'GG', libelle: 'Total produits d\'exploitation', type: 'montant' },
        ],
      },
      {
        titre: 'Charges d\'exploitation',
        cases: [
          { code: 'GH', libelle: 'Achats de marchandises', type: 'montant', prefill: 'charges_ht' },
          { code: 'GJ', libelle: 'Achats de matières premières', type: 'montant' },
          { code: 'GQ', libelle: 'Autres charges externes', type: 'montant' },
          { code: 'GR', libelle: 'Impôts, taxes et versements assimilés', type: 'montant' },
          { code: 'GS', libelle: 'Charges de personnel', type: 'montant' },
          { code: 'GU', libelle: 'Dotations aux amortissements', type: 'montant' },
          { code: 'GW', libelle: 'Autres charges d\'exploitation', type: 'montant' },
        ],
      },
      {
        titre: 'Résultats',
        cases: [
          { code: 'HC', libelle: 'Résultat d\'exploitation', type: 'montant' },
          { code: 'HE', libelle: 'Résultat financier', type: 'montant' },
          { code: 'HN', libelle: 'Résultat courant avant impôts', type: 'montant' },
          { code: 'HU', libelle: 'Résultat exceptionnel', type: 'montant' },
          { code: 'HP', libelle: 'Impôt sur les sociétés', type: 'montant' },
          { code: 'HX', libelle: 'Résultat de l\'exercice (bénéfice ou perte)', type: 'montant' },
        ],
      },
    ],
  },
  '2031': {
    titre: 'Déclaration de résultats BIC — Entrepreneurs individuels',
    sections: [
      {
        titre: 'Recettes et stocks',
        cases: [
          { code: '1A', libelle: 'Chiffre d\'affaires net', type: 'montant', prefill: 'ca_ht' },
          { code: '1B', libelle: 'Stock en début d\'exercice', type: 'montant' },
          { code: '1C', libelle: 'Stock en fin d\'exercice', type: 'montant' },
          { code: '1E', libelle: 'Total des achats (y compris variation de stock)', type: 'montant', prefill: 'charges_ht' },
        ],
      },
      {
        titre: 'Charges',
        cases: [
          { code: '1G', libelle: 'Salaires et traitements', type: 'montant' },
          { code: '1H', libelle: 'Cotisations sociales', type: 'montant' },
          { code: '1J', libelle: 'Charges de personnel total', type: 'montant' },
          { code: '1K', libelle: 'Impôts et taxes', type: 'montant' },
          { code: '1L', libelle: 'Autres charges', type: 'montant' },
          { code: '1M', libelle: 'Dotations aux amortissements', type: 'montant' },
        ],
      },
      {
        titre: 'Résultat',
        cases: [
          { code: '1N', libelle: 'Plus-values à long terme', type: 'montant' },
          { code: '1P', libelle: 'Résultat comptable (bénéfice ou perte)', type: 'montant' },
          { code: '1R', libelle: 'Résultat fiscal', type: 'montant' },
        ],
      },
    ],
  },
  '2035': {
    titre: 'Déclaration de résultats BNC — Professions libérales',
    sections: [
      {
        titre: 'Recettes',
        cases: [
          { code: 'AA', libelle: 'Honoraires et recettes brutes encaissées', type: 'montant', prefill: 'ca_ht' },
          { code: 'AB', libelle: 'Débours payés pour le compte des clients (déduction)', type: 'montant' },
          { code: 'AC', libelle: 'Honoraires nets (AA - AB)', type: 'montant' },
          { code: 'AD', libelle: 'Gains divers', type: 'montant' },
          { code: 'AE', libelle: 'Total des recettes (AC + AD)', type: 'montant' },
        ],
      },
      {
        titre: 'Dépenses professionnelles',
        cases: [
          { code: 'BA', libelle: 'Achats', type: 'montant', prefill: 'charges_ht' },
          { code: 'BB', libelle: 'Loyers et charges locatives', type: 'montant' },
          { code: 'BC', libelle: 'Personnel salarié', type: 'montant' },
          { code: 'BD', libelle: 'Autres frais et charges', type: 'montant' },
          { code: 'BE', libelle: 'Cotisations sociales personnelles', type: 'montant' },
          { code: 'BF', libelle: 'Amortissements', type: 'montant' },
          { code: 'BG', libelle: 'Total des dépenses', type: 'montant' },
        ],
      },
      {
        titre: 'Résultat',
        cases: [
          { code: 'CA', libelle: 'Plus-values nettes à long terme', type: 'montant' },
          { code: 'CB', libelle: 'Moins-values nettes à long terme', type: 'montant' },
          { code: 'CK', libelle: 'Bénéfice ou déficit (AE - BG)', type: 'montant' },
        ],
      },
    ],
  },
}

// ─── Plan gate ────────────────────────────────────────────────────────────────

function PremiumBanner() {
  return (
    <Card className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mb-4">
        <FileText className="w-8 h-8 text-amber-600" />
      </div>
      <h2 className="text-xl font-bold text-navy-900 mb-2">Liasses fiscales</h2>
      <p className="text-sm text-navy-500 max-w-sm mb-6">
        Préparez vos déclarations de résultats 2065, 2031 et 2035 avec pré-remplissage depuis votre comptabilité.
        Disponible avec le plan <strong>Premium</strong>.
      </p>
      <Link href="/pricing" className="px-6 py-3 bg-emerald-500 text-white rounded-xl font-semibold text-sm hover:bg-emerald-600 transition-colors">
        Passer en Premium
      </Link>
    </Card>
  )
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function LiassesPage() {
  const { user } = useAuth()
  const { plan, loading: planLoading } = useUserPlan()
  const isPremium = plan === 'premium' || plan === 'cabinet_premium'

  const [typeLiasse, setTypeLiasse] = useState<TypeLiasse>('2065')
  const [exercice, setExercice] = useState(new Date().getFullYear() - 1)
  const [donnees, setDonnees] = useState<LiasseData>({})
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [prefillData, setPrefillData] = useState<{ ca_ht: number; charges_ht: number } | null>(null)

  const currentYear = new Date().getFullYear()
  const exerciceOptions = Array.from({ length: 5 }, (_, i) => currentYear - i)

  const fetchLiasse = useCallback(async () => {
    if (!user?.id) return
    setLoading(true)
    try {
      const supabase = createClient()
      const { data } = await supabase
        .from('liasses_fiscales')
        .select('donnees')
        .eq('user_id', user.id)
        .eq('type_liasse', typeLiasse)
        .eq('exercice', exercice)
        .single()
      if (data) setDonnees((data.donnees as LiasseData) ?? {})
      else setDonnees({})
    } catch { setDonnees({}) }
    finally { setLoading(false) }
  }, [user?.id, typeLiasse, exercice])

  const fetchPrefill = useCallback(async () => {
    if (!user?.id) return
    try {
      const supabase = createClient()
      const startOfYear = `${exercice}-01-01`
      const endOfYear = `${exercice}-12-31`
      const [caRes, chargesRes] = await Promise.all([
        supabase.from('factures_clients').select('total_ht').eq('user_id', user.id)
          .gte('date_emission', startOfYear).lte('date_emission', endOfYear),
        supabase.from('factures').select('montant_ht').eq('user_id', user.id)
          .gte('date_facture', startOfYear).lte('date_facture', endOfYear),
      ])
      const ca_ht = caRes.data?.reduce((s: number, r: { total_ht: number | null }) => s + (r.total_ht ?? 0), 0) ?? 0
      const charges_ht = chargesRes.data?.reduce((s: number, r: { montant_ht: number | null }) => s + (r.montant_ht ?? 0), 0) ?? 0
      setPrefillData({ ca_ht, charges_ht })
    } catch { /* silent */ }
  }, [user?.id, exercice])

  useEffect(() => {
    if (user?.id && isPremium) {
      void fetchLiasse()
      void fetchPrefill()
    }
  }, [user?.id, isPremium, fetchLiasse, fetchPrefill])

  const handlePrefill = () => {
    if (!prefillData) return
    const formulaire = FORMULAIRES[typeLiasse]
    const updates: LiasseData = {}
    formulaire.sections.forEach(s =>
      s.cases.forEach(c => {
        if (c.prefill === 'ca_ht') updates[c.code] = String(Math.round(prefillData.ca_ht))
        if (c.prefill === 'charges_ht') updates[c.code] = String(Math.round(prefillData.charges_ht))
      })
    )
    setDonnees(prev => ({ ...prev, ...updates }))
    toast.success('Cases pré-remplies depuis votre comptabilité — vérifiez les montants')
  }

  const handleSave = async () => {
    if (!user?.id) return
    setSaving(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.from('liasses_fiscales').upsert({
        user_id: user.id,
        type_liasse: typeLiasse,
        exercice,
        donnees,
        statut: 'brouillon',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,type_liasse,exercice' })
      if (error) throw error
      toast.success('Brouillon enregistré')
    } catch {
      toast.error('Erreur lors de l\'enregistrement')
    } finally {
      setSaving(false)
    }
  }

  const handleExportPDF = () => {
    toast('Export PDF — connexion DGFiP en cours d\'intégration', { icon: '🔜' })
  }

  const formatMontant = (value: string): string => {
    const num = parseFloat(value.replace(/\s/g, '').replace(',', '.'))
    if (isNaN(num)) return value
    return num.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
  }

  const formulaire = FORMULAIRES[typeLiasse]

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
            <FileText className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-navy-900">Liasses fiscales</h1>
            <p className="text-sm text-navy-500">Aide à la préparation des déclarations de résultats</p>
          </div>
        </div>

        {/* ⚠️ BANDEAU PERMANENT */}
        <div className="mb-6 flex items-start gap-3 px-4 py-4 rounded-xl bg-amber-50 border-2 border-amber-300">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">
              Cet outil est une aide à la préparation de vos liasses fiscales.
            </p>
            <p className="text-xs text-amber-700 mt-1">
              Il ne remplace pas la validation d'un expert-comptable. Vérifiez toujours les montants avant tout dépôt auprès de l'administration fiscale. Les cases sont éditables manuellement — les montants pré-remplis sont issus de votre comptabilité et doivent être retraités.
            </p>
          </div>
        </div>

        {planLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>
        ) : !isPremium ? (
          <PremiumBanner />
        ) : (
          <>
            {/* Sélecteurs */}
            <Card className="mb-6">
              <div className="flex flex-wrap items-center gap-4">
                <div>
                  <label className="block text-xs font-medium text-navy-500 mb-1">Type de liasse</label>
                  <div className="flex gap-2">
                    {(['2065', '2031', '2035'] as TypeLiasse[]).map(t => (
                      <button
                        key={t}
                        onClick={() => setTypeLiasse(t)}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-colors ${
                          typeLiasse === t
                            ? 'border-amber-400 bg-amber-50 text-amber-700'
                            : 'border-navy-200 text-navy-600 hover:border-amber-200'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-navy-500 mb-1">Exercice fiscal</label>
                  <select
                    value={exercice}
                    onChange={e => setExercice(parseInt(e.target.value))}
                    className="px-3 py-2 border border-navy-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                  >
                    {exerciceOptions.map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>

                <div className="ml-auto flex gap-2">
                  {prefillData && (
                    <button
                      onClick={handlePrefill}
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-xs font-medium hover:bg-blue-100 transition-colors"
                    >
                      <Info className="w-3.5 h-3.5" />
                      Pré-remplir depuis comptabilité
                    </button>
                  )}
                </div>
              </div>

              <p className="text-xs text-navy-400 mt-3 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                {formulaire.titre}
              </p>
            </Card>

            {/* Formulaire */}
            {loading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => <div key={i} className="h-32 bg-navy-50 animate-pulse rounded-xl" />)}
              </div>
            ) : (
              <div className="space-y-4">
                {formulaire.sections.map((section, si) => (
                  <Card key={si}>
                    <h3 className="text-sm font-semibold text-navy-700 mb-4 pb-2 border-b border-navy-100">
                      {section.titre}
                    </h3>
                    <div className="space-y-2">
                      {section.cases.map(c => (
                        <div key={c.code} className="flex items-center gap-3">
                          <span className="w-10 text-xs font-mono font-bold text-navy-400 flex-shrink-0 text-right">
                            {c.code}
                          </span>
                          <label className="flex-1 text-sm text-navy-700 min-w-0">
                            {c.libelle}
                            {c.prefill && donnees[c.code] && (
                              <span className="ml-2 text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
                                Données compta
                              </span>
                            )}
                          </label>
                          <div className="relative w-40 flex-shrink-0">
                            <input
                              type="text"
                              value={donnees[c.code] ?? ''}
                              onChange={e => setDonnees(prev => ({ ...prev, [c.code]: e.target.value }))}
                              onBlur={e => {
                                const formatted = formatMontant(e.target.value)
                                if (formatted !== e.target.value) setDonnees(prev => ({ ...prev, [c.code]: formatted }))
                              }}
                              className="w-full px-3 py-1.5 border border-navy-200 rounded-lg text-sm text-right font-mono focus:outline-none focus:ring-2 focus:ring-amber-300"
                              placeholder="0"
                            />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-navy-400">€</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="mt-6 flex items-center justify-between">
              <p className="text-xs text-navy-400">
                Toutes les modifications sont sauvegardées en brouillon jusqu'à validation.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleExportPDF}
                  className="inline-flex items-center gap-2 px-4 py-2 border border-navy-200 text-navy-700 rounded-xl text-sm font-medium hover:bg-navy-50 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Export PDF (aperçu)
                </button>
                <button
                  onClick={() => void handleSave()}
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-xl text-sm font-medium hover:bg-amber-600 disabled:opacity-50 transition-colors"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Enregistrer le brouillon
                </button>
              </div>
            </div>

            {/* Télétransmettre */}
            <Card className="mt-6 bg-navy-50/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-navy-700">Télétransmission DGFiP</p>
                  <p className="text-xs text-navy-400 mt-0.5">Connexion directe à la DGFiP — en cours d'intégration</p>
                </div>
                <button
                  disabled
                  className="px-4 py-2 border border-navy-200 text-navy-400 rounded-xl text-sm cursor-not-allowed"
                >
                  🔜 Connecter DGFiP
                </button>
              </div>
            </Card>
          </>
        )}
      </div>
    </AppShell>
  )
}
