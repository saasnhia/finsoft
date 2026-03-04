'use client'

import { useState, useEffect, useCallback } from 'react'
import { AppShell } from '@/components/layout'
import { Card } from '@/components/ui'
import { useAuth } from '@/hooks/useAuth'
import { useUserPlan } from '@/hooks/useUserPlan'
import { createClient } from '@/lib/supabase/client'
import {
  Bot, Play, Copy, Trash2, Plus, CheckCircle, XCircle, Clock,
  Sparkles, X, Loader2, Pencil, AlertTriangle,
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import Link from 'next/link'

// ─── Types ────────────────────────────────────────────────────────────────────

type TriggerType = 'facture_impayee' | 'nouveau_document' | 'fin_de_mois' | 'manuel' | 'webhook'
type ActionType = 'envoyer_email' | 'generer_document' | 'creer_ecriture' | 'resumer_document' | 'classer_piece'
type FreqMax = '1_par_jour' | '1_par_semaine' | 'illimite'

interface Agent {
  id: string
  nom: string
  description: string | null
  trigger_type: TriggerType
  trigger_config: Record<string, unknown>
  actions: ActionType[]
  prompt_template: string | null
  statut: 'actif' | 'inactif'
  freq_max: FreqMax
  created_at: string
}

interface AgentLog {
  id: string
  executed_at: string
  statut: 'success' | 'error' | 'running'
  output_data: { result?: string } | null
  error_message: string | null
}

// ─── Constantes ───────────────────────────────────────────────────────────────

const TRIGGER_LABELS: Record<TriggerType, string> = {
  facture_impayee: 'Facture impayée +Xj',
  nouveau_document: 'Nouveau document reçu',
  fin_de_mois: 'Fin de mois',
  manuel: 'Manuel',
  webhook: 'Webhook entrant',
}

const ACTION_LABELS: Record<ActionType, string> = {
  envoyer_email: '📧 Envoyer un email',
  generer_document: '📄 Générer un document',
  creer_ecriture: '📒 Créer une écriture',
  resumer_document: '✂️ Résumer un document',
  classer_piece: '🗂️ Classer une pièce',
}

const VARIABLES = ['{facture_numero}', '{client_nom}', '{montant}', '{jours_retard}', '{date}']

const TEMPLATES: Omit<Agent, 'id' | 'created_at'>[] = [
  {
    nom: 'Relance impayés',
    description: 'Envoie un email de relance aux clients avec factures en retard de +30 jours',
    trigger_type: 'facture_impayee',
    trigger_config: { jours: 30 },
    actions: ['envoyer_email'],
    prompt_template: 'Rédigez un email de relance cordial pour {client_nom} concernant la facture {facture_numero} de {montant} € en retard de {jours_retard} jours. Ton professionnel et bienveillant.',
    statut: 'inactif',
    freq_max: '1_par_jour',
  },
  {
    nom: 'Résumé mensuel',
    description: 'Envoie un résumé de fin de mois synthétisant la situation financière',
    trigger_type: 'fin_de_mois',
    trigger_config: {},
    actions: ['envoyer_email'],
    prompt_template: 'Rédigez un résumé mensuel de la situation financière. CA {montant}. {jours_retard} factures en attente. Format: bullet points clairs destinés au dirigeant.',
    statut: 'inactif',
    freq_max: '1_par_semaine',
  },
  {
    nom: 'Classement automatique',
    description: 'Analyse et classe les nouveaux documents reçus selon le PCG',
    trigger_type: 'nouveau_document',
    trigger_config: {},
    actions: ['classer_piece', 'creer_ecriture'],
    prompt_template: 'Analysez ce document comptable et proposez une classification PCG (compte débit, compte crédit, libellé). Justifiez votre choix.',
    statut: 'inactif',
    freq_max: 'illimite',
  },
  {
    nom: 'Alerte trésorerie',
    description: 'Alerte le dirigeant quand le solde bancaire passe sous un seuil',
    trigger_type: 'fin_de_mois',
    trigger_config: { seuil: 5000 },
    actions: ['envoyer_email'],
    prompt_template: 'Alertez le dirigeant que la trésorerie est à {montant} €. Proposez 3 actions correctives immédiates et concrètes.',
    statut: 'inactif',
    freq_max: '1_par_jour',
  },
]

const DEFAULT_FORM: Omit<Agent, 'id' | 'created_at'> = {
  nom: '',
  description: '',
  trigger_type: 'manuel',
  trigger_config: {},
  actions: [],
  prompt_template: '',
  statut: 'inactif',
  freq_max: 'illimite',
}

// ─── Plan gate ────────────────────────────────────────────────────────────────

function PremiumBanner() {
  return (
    <Card className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mb-4">
        <Bot className="w-8 h-8 text-amber-600" />
      </div>
      <h2 className="text-xl font-bold text-navy-900 mb-2">Agents IA sur mesure</h2>
      <p className="text-sm text-navy-500 max-w-sm mb-6">
        Automatisez vos tâches comptables avec des agents intelligents.
        Disponible avec le plan <strong>Premium</strong>.
      </p>
      <Link href="/pricing" className="px-6 py-3 bg-emerald-500 text-white rounded-xl font-semibold text-sm hover:bg-emerald-600 transition-colors">
        Passer en Premium
      </Link>
    </Card>
  )
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function AgentsPage() {
  const { user } = useAuth()
  const { plan, loading: planLoading } = useUserPlan()
  const isPremium = plan === 'premium' || plan === 'cabinet_premium'

  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState<Omit<Agent, 'id' | 'created_at'>>(DEFAULT_FORM)
  const [saving, setSaving] = useState(false)
  const [running, setRunning] = useState<string | null>(null)

  // Logs drawer
  const [logsAgent, setLogsAgent] = useState<Agent | null>(null)
  const [logs, setLogs] = useState<AgentLog[]>([])
  const [logsLoading, setLogsLoading] = useState(false)

  const fetchAgents = useCallback(async () => {
    if (!user?.id) return
    setLoading(true)
    try {
      const supabase = createClient()
      const { data } = await supabase
        .from('agents')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      setAgents((data ?? []) as Agent[])
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    if (user?.id && isPremium) void fetchAgents()
    else if (!planLoading) setLoading(false)
  }, [user?.id, isPremium, planLoading, fetchAgents])

  const openModal = (agent?: Agent) => {
    if (agent) {
      setEditId(agent.id)
      setForm({
        nom: agent.nom,
        description: agent.description ?? '',
        trigger_type: agent.trigger_type,
        trigger_config: agent.trigger_config,
        actions: agent.actions,
        prompt_template: agent.prompt_template ?? '',
        statut: agent.statut,
        freq_max: agent.freq_max,
      })
    } else {
      setEditId(null)
      setForm(DEFAULT_FORM)
    }
    setShowModal(true)
  }

  const applyTemplate = (tpl: typeof TEMPLATES[0]) => {
    setEditId(null)
    setForm({ ...tpl })
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!user?.id || !form.nom.trim()) { toast.error('Le nom est requis'); return }
    setSaving(true)
    try {
      const supabase = createClient()
      const payload = {
        nom: form.nom,
        description: form.description || null,
        trigger_type: form.trigger_type,
        trigger_config: form.trigger_config,
        actions: form.actions,
        prompt_template: form.prompt_template || null,
        statut: form.statut,
        freq_max: form.freq_max,
      }
      if (editId) {
        const { error } = await supabase.from('agents').update(payload).eq('id', editId).eq('user_id', user.id)
        if (error) throw error
        toast.success('Agent mis à jour')
      } else {
        const { error } = await supabase.from('agents').insert({ ...payload, user_id: user.id })
        if (error) throw error
        toast.success('Agent créé')
      }
      setShowModal(false)
      void fetchAgents()
    } catch {
      toast.error('Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cet agent et son historique ?')) return
    try {
      const supabase = createClient()
      await supabase.from('agents').delete().eq('id', id).eq('user_id', user?.id ?? '')
      toast.success('Agent supprimé')
      void fetchAgents()
    } catch { toast.error('Erreur') }
  }

  const handleToggle = async (agent: Agent) => {
    try {
      const supabase = createClient()
      await supabase.from('agents').update({
        statut: agent.statut === 'actif' ? 'inactif' : 'actif',
      }).eq('id', agent.id)
      void fetchAgents()
    } catch { toast.error('Erreur') }
  }

  const handleDuplicate = async (agent: Agent) => {
    if (!user?.id) return
    try {
      const supabase = createClient()
      await supabase.from('agents').insert({
        user_id: user.id,
        nom: `${agent.nom} (copie)`,
        description: agent.description,
        trigger_type: agent.trigger_type,
        trigger_config: agent.trigger_config,
        actions: agent.actions,
        prompt_template: agent.prompt_template,
        statut: 'inactif',
        freq_max: agent.freq_max,
      })
      toast.success('Agent dupliqué')
      void fetchAgents()
    } catch { toast.error('Erreur') }
  }

  const handleRun = async (agent: Agent) => {
    setRunning(agent.id)
    try {
      const res = await fetch('/api/agents/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent_id: agent.id,
          context_data: {
            facture_numero: 'FAC-2026-001',
            client_nom: 'Client Démo',
            montant: '1 250,00 €',
            jours_retard: '15',
            date: new Date().toLocaleDateString('fr-FR'),
          },
        }),
      })
      const data = await res.json() as { success: boolean; error?: string }
      if (data.success) {
        toast.success('Test exécuté — voir les logs')
        void fetchAgents()
      } else {
        toast.error(data.error ?? 'Erreur lors du test')
      }
    } catch { toast.error('Erreur réseau') }
    finally { setRunning(null) }
  }

  const openLogs = async (agent: Agent) => {
    setLogsAgent(agent)
    setLogsLoading(true)
    try {
      const supabase = createClient()
      const { data } = await supabase
        .from('agent_logs')
        .select('*')
        .eq('agent_id', agent.id)
        .order('executed_at', { ascending: false })
        .limit(50)
      setLogs((data ?? []) as AgentLog[])
    } catch { setLogs([]) }
    finally { setLogsLoading(false) }
  }

  const toggleAction = (action: ActionType) => {
    setForm(prev => ({
      ...prev,
      actions: prev.actions.includes(action)
        ? prev.actions.filter(a => a !== action)
        : [...prev.actions, action],
    }))
  }

  const insertVar = (v: string) => {
    setForm(prev => ({ ...prev, prompt_template: (prev.prompt_template ?? '') + v }))
  }

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
              <Bot className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold text-navy-900">Agents IA sur mesure</h1>
              <p className="text-sm text-navy-500">Automatisez vos tâches comptables avec l'IA</p>
            </div>
          </div>
          {isPremium && (
            <button
              onClick={() => openModal()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl font-medium text-sm hover:bg-purple-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Nouvel agent
            </button>
          )}
        </div>

        {/* Plan gate */}
        {planLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>
        ) : !isPremium ? (
          <PremiumBanner />
        ) : (
          <>
            {/* Templates (si aucun agent) */}
            {!loading && agents.length === 0 && (
              <div className="mb-8">
                <h2 className="text-sm font-semibold text-navy-600 mb-4 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  Démarrer avec un modèle
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {TEMPLATES.map((tpl, i) => (
                    <button
                      key={i}
                      onClick={() => applyTemplate(tpl)}
                      className="p-4 bg-white border border-navy-100 rounded-xl text-left hover:border-purple-300 hover:shadow-md transition-all group"
                    >
                      <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mb-3 group-hover:bg-purple-200 transition-colors">
                        <Bot className="w-4 h-4 text-purple-600" />
                      </div>
                      <p className="text-sm font-semibold text-navy-900 mb-1">{tpl.nom}</p>
                      <p className="text-xs text-navy-500 line-clamp-2 mb-3">{tpl.description}</p>
                      <span className="text-[11px] bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full">
                        {TRIGGER_LABELS[tpl.trigger_type]}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Liste agents */}
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-display font-semibold text-navy-900">
                  Mes agents ({agents.length})
                </h2>
                {agents.length > 0 && (
                  <button
                    onClick={() => openModal()}
                    className="inline-flex items-center gap-1.5 text-sm text-purple-600 hover:text-purple-700 font-medium"
                  >
                    <Plus className="w-4 h-4" /> Ajouter
                  </button>
                )}
              </div>

              {loading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => <div key={i} className="h-14 bg-navy-50 animate-pulse rounded-lg" />)}
                </div>
              ) : agents.length === 0 ? (
                <p className="text-sm text-navy-400 py-8 text-center">
                  Aucun agent. Démarrez avec un modèle ci-dessus ou créez-en un.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-xs font-medium text-navy-400 border-b border-navy-100">
                        <th className="text-left pb-2 pr-4">Nom</th>
                        <th className="text-left pb-2 pr-4">Déclencheur</th>
                        <th className="text-left pb-2 pr-4">Actions</th>
                        <th className="text-left pb-2 pr-4">Statut</th>
                        <th className="text-right pb-2">Opérations</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-navy-50">
                      {agents.map(agent => (
                        <tr key={agent.id} className="hover:bg-navy-50/50 transition-colors">
                          <td className="py-3 pr-4">
                            <p className="font-medium text-navy-900">{agent.nom}</p>
                            {agent.description && (
                              <p className="text-xs text-navy-400 truncate max-w-[180px]">{agent.description}</p>
                            )}
                          </td>
                          <td className="py-3 pr-4">
                            <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full whitespace-nowrap">
                              {TRIGGER_LABELS[agent.trigger_type]}
                            </span>
                          </td>
                          <td className="py-3 pr-4">
                            <div className="flex flex-wrap gap-1 max-w-[200px]">
                              {agent.actions.slice(0, 2).map(a => (
                                <span key={a} className="text-[11px] bg-navy-50 text-navy-600 px-1.5 py-0.5 rounded">
                                  {a.replace('_', ' ')}
                                </span>
                              ))}
                              {agent.actions.length > 2 && (
                                <span className="text-[11px] text-navy-400">+{agent.actions.length - 2}</span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 pr-4">
                            <button
                              onClick={() => void handleToggle(agent)}
                              className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full transition-colors ${
                                agent.statut === 'actif'
                                  ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                                  : 'bg-navy-100 text-navy-500 hover:bg-navy-200'
                              }`}
                            >
                              {agent.statut === 'actif'
                                ? <><CheckCircle className="w-3 h-3" /> Actif</>
                                : <><XCircle className="w-3 h-3" /> Inactif</>}
                            </button>
                          </td>
                          <td className="py-3">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => void handleRun(agent)}
                                disabled={running === agent.id}
                                title="Tester"
                                className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors disabled:opacity-40"
                              >
                                {running === agent.id
                                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  : <Play className="w-3.5 h-3.5" />}
                              </button>
                              <button
                                onClick={() => void openLogs(agent)}
                                title="Logs"
                                className="p-1.5 text-navy-500 hover:bg-navy-50 rounded-lg transition-colors"
                              >
                                <Clock className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => openModal(agent)}
                                title="Modifier"
                                className="p-1.5 text-navy-500 hover:bg-navy-50 rounded-lg transition-colors"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => void handleDuplicate(agent)}
                                title="Dupliquer"
                                className="p-1.5 text-navy-500 hover:bg-navy-50 rounded-lg transition-colors"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => void handleDelete(agent.id)}
                                title="Supprimer"
                                className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </>
        )}
      </div>

      {/* ─── Modal Create / Edit ─────────────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-navy-100">
              <h2 className="text-lg font-display font-bold text-navy-900">
                {editId ? 'Modifier l\'agent' : 'Créer un agent'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-navy-50 rounded-lg">
                <X className="w-5 h-5 text-navy-500" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Nom */}
              <div>
                <label className="block text-sm font-medium text-navy-700 mb-1">Nom de l'agent *</label>
                <input
                  type="text"
                  value={form.nom}
                  onChange={e => setForm(p => ({ ...p, nom: e.target.value }))}
                  className="w-full px-3 py-2 border border-navy-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                  placeholder="Ex: Relance impayés"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-navy-700 mb-1">Description</label>
                <input
                  type="text"
                  value={form.description ?? ''}
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-navy-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                  placeholder="Description courte"
                />
              </div>

              {/* Déclencheur */}
              <div>
                <label className="block text-sm font-medium text-navy-700 mb-2">Déclencheur</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {(Object.keys(TRIGGER_LABELS) as TriggerType[]).map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setForm(p => ({ ...p, trigger_type: t }))}
                      className={`px-3 py-2 rounded-lg text-xs font-medium border transition-colors text-left ${
                        form.trigger_type === t
                          ? 'border-purple-400 bg-purple-50 text-purple-700'
                          : 'border-navy-200 text-navy-600 hover:border-purple-200'
                      }`}
                    >
                      {TRIGGER_LABELS[t]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div>
                <label className="block text-sm font-medium text-navy-700 mb-2">Actions (multi-sélection)</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {(Object.keys(ACTION_LABELS) as ActionType[]).map(a => (
                    <button
                      key={a}
                      type="button"
                      onClick={() => toggleAction(a)}
                      className={`px-3 py-2 rounded-lg text-xs font-medium border transition-colors text-left flex items-center gap-2 ${
                        form.actions.includes(a)
                          ? 'border-emerald-400 bg-emerald-50 text-emerald-700'
                          : 'border-navy-200 text-navy-600 hover:border-emerald-200'
                      }`}
                    >
                      {form.actions.includes(a) && <CheckCircle className="w-3 h-3 flex-shrink-0" />}
                      {ACTION_LABELS[a]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Prompt IA */}
              <div>
                <label className="block text-sm font-medium text-navy-700 mb-1">Prompt IA personnalisé</label>
                <div className="flex flex-wrap gap-1 mb-2">
                  {VARIABLES.map(v => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => insertVar(v)}
                      className="text-[11px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full hover:bg-purple-200 transition-colors font-mono"
                    >
                      {v}
                    </button>
                  ))}
                </div>
                <textarea
                  value={form.prompt_template ?? ''}
                  onChange={e => setForm(p => ({ ...p, prompt_template: e.target.value }))}
                  rows={4}
                  className="w-full px-3 py-2 border border-navy-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 resize-none font-mono"
                  placeholder="Rédigez le prompt que l'IA utilisera avec les variables ci-dessus…"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Statut */}
                <div>
                  <label className="block text-sm font-medium text-navy-700 mb-1">Statut</label>
                  <div className="flex gap-2">
                    {(['actif', 'inactif'] as const).map(s => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setForm(p => ({ ...p, statut: s }))}
                        className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
                          form.statut === s
                            ? s === 'actif'
                              ? 'border-emerald-400 bg-emerald-50 text-emerald-700'
                              : 'border-navy-300 bg-navy-50 text-navy-700'
                            : 'border-navy-200 text-navy-400'
                        }`}
                      >
                        {s === 'actif' ? 'Actif' : 'Inactif'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Fréquence */}
                <div>
                  <label className="block text-sm font-medium text-navy-700 mb-1">Fréquence max</label>
                  <select
                    value={form.freq_max}
                    onChange={e => setForm(p => ({ ...p, freq_max: e.target.value as FreqMax }))}
                    className="w-full px-3 py-2 border border-navy-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                  >
                    <option value="1_par_jour">1× par jour</option>
                    <option value="1_par_semaine">1× par semaine</option>
                    <option value="illimite">Illimité</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 px-6 py-4 border-t border-navy-100">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-navy-600 hover:bg-navy-50 rounded-lg">
                Annuler
              </button>
              <button
                onClick={() => void handleSave()}
                disabled={saving || !form.nom.trim()}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {editId ? 'Mettre à jour' : 'Créer l\'agent'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Logs drawer ─────────────────────────────────────────────────────────── */}
      {logsAgent && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={() => setLogsAgent(null)} />
          <div className="w-full max-w-md bg-white flex flex-col shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-navy-100">
              <div>
                <h2 className="text-base font-display font-bold text-navy-900">Historique d'exécution</h2>
                <p className="text-xs text-navy-400">{logsAgent.nom}</p>
              </div>
              <button onClick={() => setLogsAgent(null)} className="p-2 hover:bg-navy-50 rounded-lg">
                <X className="w-5 h-5 text-navy-500" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {logsLoading ? (
                [...Array(4)].map((_, i) => <div key={i} className="h-16 bg-navy-50 animate-pulse rounded-lg" />)
              ) : logs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Clock className="w-8 h-8 text-navy-300 mb-2" />
                  <p className="text-sm text-navy-400">Aucune exécution enregistrée</p>
                  <p className="text-xs text-navy-300 mt-1">Utilisez le bouton "Tester" pour un premier run</p>
                </div>
              ) : (
                logs.map(log => (
                  <div
                    key={log.id}
                    className={`p-3 rounded-lg border ${
                      log.statut === 'success'
                        ? 'border-emerald-200 bg-emerald-50'
                        : log.statut === 'error'
                        ? 'border-red-200 bg-red-50'
                        : 'border-amber-200 bg-amber-50'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      {log.statut === 'success'
                        ? <CheckCircle className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                        : log.statut === 'error'
                        ? <XCircle className="w-3.5 h-3.5 text-red-600 flex-shrink-0" />
                        : <Loader2 className="w-3.5 h-3.5 text-amber-600 animate-spin flex-shrink-0" />}
                      <span className="text-xs font-medium text-navy-700">
                        {new Date(log.executed_at).toLocaleString('fr-FR')}
                      </span>
                    </div>
                    {log.output_data?.result && (
                      <p className="text-xs text-navy-600 line-clamp-4 whitespace-pre-wrap">{log.output_data.result}</p>
                    )}
                    {log.error_message && (
                      <p className="text-xs text-red-600 mt-1">{log.error_message}</p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </AppShell>
  )
}
