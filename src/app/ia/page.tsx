'use client'

import { useState } from 'react'
import { AppShell } from '@/components/layout'
import {
  Sparkles,
  Shield,
  ShieldCheck,
  Euro,
  ArrowRightLeft,
  Mail,
  ChevronDown,
  Lock,
} from 'lucide-react'
import { AuditAgent } from '@/components/ai/AuditAgent'
import { TVAAgent } from '@/components/ai/TVAAgent'
import { RapprochementAgent } from '@/components/ai/RapprochementAgent'
import { MailAgent } from '@/components/ai/MailAgent'

interface AgentCard {
  id: string
  icon: React.ElementType
  iconColor: string
  title: string
  description: string
  component: React.ReactNode
}

const agents: AgentCard[] = [
  {
    id: 'audit',
    icon: ShieldCheck,
    iconColor: 'text-emerald-400',
    title: 'Agent Audit',
    description: 'Détecte anomalies, doublons et incohérences selon le Plan Comptable Général.',
    component: <AuditAgent />,
  },
  {
    id: 'tva',
    icon: Euro,
    iconColor: 'text-blue-400',
    title: 'Agent TVA',
    description: 'Vérifie les taux TVA, calcule le solde CA3 et émet des conseils fiscaux.',
    component: <TVAAgent />,
  },
  {
    id: 'rapprochement',
    icon: ArrowRightLeft,
    iconColor: 'text-amber-400',
    title: 'Agent Rapprochement',
    description: 'Explique les anomalies bancaires en langage clair et propose des actions correctives.',
    component: <RapprochementAgent />,
  },
  {
    id: 'mail',
    icon: Mail,
    iconColor: 'text-purple-400',
    title: 'Agent Mail',
    description: 'Génère des rappels de paiement personnalisés et courtois pour vos clients en retard.',
    component: <MailAgent />,
  },
]

function AgentSection({ agent }: { agent: AgentCard }) {
  const [open, setOpen] = useState(false)
  const Icon = agent.icon

  return (
    <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors text-left"
      >
        <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
          <Icon className={`w-5 h-5 ${agent.iconColor}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900">{agent.title}</p>
          <p className="text-xs text-gray-600 mt-0.5 truncate">{agent.description}</p>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-gray-400 transition-transform duration-200 flex-shrink-0 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="px-6 pb-6 border-t border-gray-100">
          <div className="pt-4">
            {agent.component}
          </div>
        </div>
      )}
    </div>
  )
}

export default function IAPage() {
  return (
    <AppShell>
      <div className="min-h-full bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
          {/* Header */}
          <div className="space-y-1">
            <div className="flex items-center gap-3 flex-wrap">
              <Sparkles className="w-6 h-6 text-emerald-500" />
              <h1 className="text-2xl font-bold text-gray-900">Assistant IA FinSoft</h1>
              <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-medium">
                <Lock className="w-3 h-3" />
                Données anonymisées
              </span>
            </div>
            <p className="text-sm text-gray-500 ml-9">
              Agents IA spécialisés pour votre comptabilité — propulsés par Mistral AI (France)
            </p>
          </div>

          {/* Bandeau sécurité RGPD */}
          <div className="flex items-start gap-3 p-4 rounded-xl bg-emerald-950 border border-emerald-800">
            <Shield className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="text-sm font-bold text-emerald-400">Confidentialité garantie</p>
              <p className="text-xs text-gray-200 leading-relaxed">
                Vos données sont <strong>anonymisées automatiquement</strong> avant tout envoi au modèle IA.
                Aucune donnée personnelle (nom, email, IBAN) ne quitte vos serveurs.
                Le modèle reçoit uniquement des montants, dates et catégories codifiés.
                Hébergement : <strong>Mistral AI (France)</strong>.
              </p>
            </div>
          </div>

          {/* Limite taux */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-gray-200 text-sm text-gray-500">
            <Sparkles className="w-3.5 h-3.5 text-gray-400" />
            Limite : 10 analyses par heure et par compte.
          </div>

          {/* Agent cards */}
          <div className="space-y-3">
            {agents.map(agent => (
              <AgentSection key={agent.id} agent={agent} />
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  )
}
