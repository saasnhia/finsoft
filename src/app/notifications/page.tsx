'use client'

import { useState } from 'react'
import Link from 'next/link'
import { AppShell } from '@/components/layout'
import { Card, Button } from '@/components/ui'
import {
  OverdueTable,
  ReminderHistory,
  ClientFormModal,
  InvoiceFormModal,
  SendReminderModal,
} from '@/components/notifications'
import { useAuth } from '@/hooks/useAuth'
import { useNotifications } from '@/hooks/useNotifications'
import {
  Bell,
  Users,
  FileText,
  Mail,
  Plus,
  AlertTriangle,
  Clock,
  Euro,
  Loader2,
  RefreshCw,
} from 'lucide-react'
import toast from 'react-hot-toast'
import type { FactureEnRetard, TypeRappel } from '@/types'

type TabId = 'retards' | 'clients' | 'historique'

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'retards', label: 'Retards de paiement', icon: AlertTriangle },
  { id: 'clients', label: 'Clients', icon: Users },
  { id: 'historique', label: 'Historique rappels', icon: Mail },
]

const formatEuro = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n)

export default function NotificationsPage() {
  const { user, loading: authLoading } = useAuth()
  const {
    overdueInvoices,
    stats,
    clients,
    rappels,
    loading: dataLoading,
    createClient,
    createFacture,
    updateFacture,
    sendReminder,
    refetch,
  } = useNotifications(user?.id)

  const [activeTab, setActiveTab] = useState<TabId>('retards')
  const [showClientModal, setShowClientModal] = useState(false)
  const [showInvoiceModal, setShowInvoiceModal] = useState(false)
  const [sendReminderTarget, setSendReminderTarget] = useState<FactureEnRetard | null>(null)
  const [sendingId, setSendingId] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const loading = authLoading || dataLoading

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
            <p className="text-navy-500">Chargement des notifications...</p>
          </div>
        </div>
      </AppShell>
    )
  }

  const handleSendReminder = async (factureId: string) => {
    const facture = overdueInvoices.find(f => f.id === factureId)
    if (facture) {
      setSendReminderTarget(facture)
    }
  }

  const handleConfirmSend = async (factureId: string, typeRappel: TypeRappel) => {
    setSendingId(factureId)
    try {
      await sendReminder(factureId, typeRappel)
      toast.success('Rappel envoyé avec succès')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erreur lors de l\'envoi')
    } finally {
      setSendingId(null)
    }
  }

  const handleMarkPaid = async (factureId: string) => {
    try {
      await updateFacture(factureId, { statut_paiement: 'payee' })
      toast.success('Facture marquée comme payée')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erreur')
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await refetch()
      toast.success('Données actualisées')
    } catch {
      toast.error('Erreur lors de l\'actualisation')
    } finally {
      setRefreshing(false)
    }
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
              <span className="text-navy-700">Notifications</span>
            </div>
            <h1 className="text-2xl font-display font-bold text-navy-900">
              Notifications & Rappels de paiement
            </h1>
            <p className="text-sm text-navy-500 mt-1">
              Suivez les retards de paiement et envoyez des rappels automatiques à vos clients
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              loading={refreshing}
              icon={<RefreshCw className="w-4 h-4" />}
            >
              Actualiser
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowClientModal(true)}
              icon={<Users className="w-4 h-4" />}
            >
              Nouveau client
            </Button>
            <Button
              size="sm"
              onClick={() => setShowInvoiceModal(true)}
              icon={<Plus className="w-4 h-4" />}
            >
              Nouvelle facture
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card className="border-l-4 border-l-coral-500">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-coral-100 rounded-xl flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-coral-600" />
                </div>
                <div>
                  <div className="text-2xl font-mono font-bold text-navy-900">{stats.total_en_retard}</div>
                  <div className="text-xs text-navy-500">Factures en retard</div>
                </div>
              </div>
            </Card>

            <Card className="border-l-4 border-l-amber-500">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                  <Euro className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <div className="text-2xl font-mono font-bold text-navy-900">
                    {formatEuro(stats.montant_total_du)}
                  </div>
                  <div className="text-xs text-navy-500">Montant total dû</div>
                </div>
              </div>
            </Card>

            <Card className="border-l-4 border-l-red-500">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                  <Clock className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <div className="text-2xl font-mono font-bold text-navy-900">
                    {stats.par_niveau.critique + stats.par_niveau.contentieux}
                  </div>
                  <div className="text-xs text-navy-500">Critiques / Contentieux</div>
                </div>
              </div>
            </Card>

            <Card className="border-l-4 border-l-emerald-500">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <Mail className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <div className="text-2xl font-mono font-bold text-navy-900">{stats.rappels_envoyes_30j}</div>
                  <div className="text-xs text-navy-500">Rappels envoyés (30j)</div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Tabs */}
        <div className="flex items-center gap-1 border-b border-navy-200 mb-6">
          {TABS.map(tab => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px
                  ${isActive
                    ? 'border-emerald-500 text-emerald-700'
                    : 'border-transparent text-navy-500 hover:text-navy-700 hover:border-navy-200'
                  }
                `}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
                {tab.id === 'retards' && stats && stats.total_en_retard > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 rounded-full bg-coral-100 text-coral-700 text-[10px] font-bold">
                    {stats.total_en_retard}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Tab Content */}
        {activeTab === 'retards' && (
          <OverdueTable
            factures={overdueInvoices}
            onSendReminder={handleSendReminder}
            onMarkPaid={handleMarkPaid}
            sendingId={sendingId}
          />
        )}

        {activeTab === 'clients' && (
          <div className="space-y-4">
            {clients.length === 0 ? (
              <Card className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-14 h-14 bg-navy-100 rounded-2xl flex items-center justify-center mb-4">
                  <Users className="w-7 h-7 text-navy-400" />
                </div>
                <h3 className="font-display font-semibold text-navy-900 mb-1">
                  Aucun client enregistré
                </h3>
                <p className="text-sm text-navy-500 max-w-sm mb-4">
                  Ajoutez vos clients pour pouvoir créer des factures et envoyer des rappels de paiement.
                </p>
                <Button onClick={() => setShowClientModal(true)} icon={<Plus className="w-4 h-4" />}>
                  Ajouter un client
                </Button>
              </Card>
            ) : (
              <Card padding="none">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-navy-100 bg-navy-50/50">
                        <th className="px-4 py-3 text-left text-xs font-medium text-navy-500">Nom</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-navy-500">Email</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-navy-500">Téléphone</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-navy-500">SIREN</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-navy-500">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-navy-50">
                      {clients.map(client => (
                        <tr key={client.id} className="hover:bg-navy-50/30 transition-colors">
                          <td className="px-4 py-3 font-medium text-navy-900">{client.nom}</td>
                          <td className="px-4 py-3 text-navy-600">
                            {client.email || <span className="text-navy-300 italic">—</span>}
                          </td>
                          <td className="px-4 py-3 text-navy-600">
                            {client.telephone || <span className="text-navy-300 italic">—</span>}
                          </td>
                          <td className="px-4 py-3 font-mono text-xs text-navy-600">
                            {client.siren || <span className="text-navy-300 italic">—</span>}
                          </td>
                          <td className="px-4 py-3 text-xs text-navy-500 max-w-[200px] truncate">
                            {client.notes || '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="px-4 py-3 border-t border-navy-100 flex items-center justify-between">
                  <span className="text-xs text-navy-500">{clients.length} client{clients.length > 1 ? 's' : ''}</span>
                  <Button variant="outline" size="sm" onClick={() => setShowClientModal(true)} icon={<Plus className="w-3 h-3" />}>
                    Ajouter
                  </Button>
                </div>
              </Card>
            )}
          </div>
        )}

        {activeTab === 'historique' && (
          <ReminderHistory rappels={rappels} />
        )}
      </div>

      {/* Modals */}
      {showClientModal && (
        <ClientFormModal
          onClose={() => setShowClientModal(false)}
          onSubmit={async (data) => {
            await createClient(data)
            toast.success('Client créé avec succès')
          }}
        />
      )}

      {showInvoiceModal && (
        <InvoiceFormModal
          clients={clients}
          onClose={() => setShowInvoiceModal(false)}
          onSubmit={async (data) => {
            await createFacture(data)
            toast.success('Facture créée avec succès')
          }}
        />
      )}

      {sendReminderTarget && (
        <SendReminderModal
          facture={sendReminderTarget}
          onClose={() => setSendReminderTarget(null)}
          onSend={async (factureId, typeRappel) => {
            await handleConfirmSend(factureId, typeRappel)
            setSendReminderTarget(null)
          }}
        />
      )}
    </AppShell>
  )
}
