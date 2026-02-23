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
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-4 px-6 py-4 hover:bg-white/5 transition-colors text-left"
      >
        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0">
          <Icon className={`w-5 h-5 ${agent.iconColor}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white">{agent.title}</p>
          <p className="text-xs text-neutral-400 mt-0.5 truncate">{agent.description}</p>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-neutral-500 transition-transform duration-200 flex-shrink-0 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="px-6 pb-6 border-t border-white/5">
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
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-emerald-400" />
            <h1 className="text-2xl font-bold text-white">Assistant IA FinSoft</h1>
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-900/40 border border-emerald-500/30 text-emerald-400 text-xs font-medium">
              <Lock className="w-3 h-3" />
              Données anonymisées
            </span>
          </div>
          <p className="text-sm text-neutral-400 ml-9">
            Agents IA spécialisés pour votre comptabilité — propulsés par Mistral AI (France)
          </p>
        </div>

        {/* Bandeau sécurité RGPD */}
        <div className="flex items-start gap-3 p-4 rounded-xl bg-emerald-900/20 border border-emerald-500/30">
          <Shield className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="text-sm font-medium text-emerald-300">Confidentialité garantie</p>
            <p className="text-xs text-emerald-400/70">
              Vos données sont <strong>anonymisées automatiquement</strong> avant tout envoi au modèle IA.
              Aucune donnée personnelle (nom, email, IBAN) ne quitte vos serveurs.
              Le modèle reçoit uniquement des montants, dates et catégories codifiés.
              Hébergement : <strong>Mistral AI (France)</strong>.
            </p>
          </div>
        </div>

        {/* Limite taux */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs text-neutral-500">
          <Sparkles className="w-3.5 h-3.5" />
          Limite : 10 analyses par heure et par compte.
        </div>

        {/* Agent cards */}
        <div className="space-y-3">
          {agents.map(agent => (
            <AgentSection key={agent.id} agent={agent} />
          ))}
        </div>
      </div>
    </AppShell>
  )
}
