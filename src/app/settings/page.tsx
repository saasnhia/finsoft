'use client'

import { useState } from 'react'
import { AppShell } from '@/components/layout'
import { Card, Button, Input } from '@/components/ui'
import { useAuth } from '@/hooks/useAuth'
import { 
  User, 
  Building2, 
  Bell, 
  Shield, 
  LogOut,
  Loader2,
  Save,
  Trash2,
} from 'lucide-react'

export default function SettingsPage() {
  const { user, loading: authLoading, signOut } = useAuth()
  const [loading, setLoading] = useState(false)
  
  const [profileData, setProfileData] = useState({
    fullName: user?.user_metadata?.full_name || '',
    companyName: '',
    email: user?.email || '',
  })

  const handleSignOut = async () => {
    try {
      await signOut()
      window.location.href = '/'
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    // Simulate save
    await new Promise(resolve => setTimeout(resolve, 1000))
    setLoading(false)
  }

  if (authLoading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
            <p className="text-navy-500">Chargement...</p>
          </div>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-navy-900">
            Paramètres
          </h1>
          <p className="mt-1 text-navy-500">
            Gérez votre compte et vos préférences
          </p>
        </div>

        <div className="space-y-6">
          {/* Profile Settings */}
          <Card>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-navy-100 rounded-lg">
                <User className="w-5 h-5 text-navy-600" />
              </div>
              <div>
                <h2 className="text-lg font-display font-semibold text-navy-900">
                  Profil
                </h2>
                <p className="text-sm text-navy-500">
                  Informations personnelles
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <Input
                  label="Nom complet"
                  value={profileData.fullName}
                  onChange={(e) => setProfileData(d => ({ ...d, fullName: e.target.value }))}
                  placeholder="Jean Dupont"
                  disabled={!user}
                />
                <Input
                  label="Email"
                  type="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData(d => ({ ...d, email: e.target.value }))}
                  disabled
                />
              </div>

              <Button
                type="submit"
                loading={loading}
                icon={<Save className="w-4 h-4" />}
                disabled={!user}
              >
                Enregistrer
              </Button>
            </form>
          </Card>

          {/* Company Settings */}
          <Card>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-navy-100 rounded-lg">
                <Building2 className="w-5 h-5 text-navy-600" />
              </div>
              <div>
                <h2 className="text-lg font-display font-semibold text-navy-900">
                  Entreprise
                </h2>
                <p className="text-sm text-navy-500">
                  Informations de votre société
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <Input
                label="Nom de l'entreprise"
                value={profileData.companyName}
                onChange={(e) => setProfileData(d => ({ ...d, companyName: e.target.value }))}
                placeholder="Ma Société SARL"
                disabled={!user}
              />
              
              <p className="text-sm text-navy-500">
                Ces informations apparaîtront sur vos rapports exportés.
              </p>
            </div>
          </Card>

          {/* Notifications */}
          <Card>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-navy-100 rounded-lg">
                <Bell className="w-5 h-5 text-navy-600" />
              </div>
              <div>
                <h2 className="text-lg font-display font-semibold text-navy-900">
                  Notifications
                </h2>
                <p className="text-sm text-navy-500">
                  Gérez vos alertes
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <label className="flex items-center justify-between p-4 bg-navy-50 rounded-xl cursor-pointer">
                <div>
                  <p className="font-medium text-navy-900">Alerte seuil de rentabilité</p>
                  <p className="text-sm text-navy-500">
                    Recevez une alerte quand vous approchez du SR
                  </p>
                </div>
                <input
                  type="checkbox"
                  defaultChecked
                  className="w-5 h-5 rounded border-navy-300 text-emerald-600 focus:ring-emerald-500"
                  disabled={!user}
                />
              </label>

              <label className="flex items-center justify-between p-4 bg-navy-50 rounded-xl cursor-pointer">
                <div>
                  <p className="font-medium text-navy-900">Rapport mensuel</p>
                  <p className="text-sm text-navy-500">
                    Recevez un récapitulatif chaque mois
                  </p>
                </div>
                <input
                  type="checkbox"
                  defaultChecked
                  className="w-5 h-5 rounded border-navy-300 text-emerald-600 focus:ring-emerald-500"
                  disabled={!user}
                />
              </label>
            </div>
          </Card>

          {/* Security */}
          <Card>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-navy-100 rounded-lg">
                <Shield className="w-5 h-5 text-navy-600" />
              </div>
              <div>
                <h2 className="text-lg font-display font-semibold text-navy-900">
                  Sécurité
                </h2>
                <p className="text-sm text-navy-500">
                  Gérez votre compte
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {user && (
                <Button
                  variant="outline"
                  onClick={handleSignOut}
                  icon={<LogOut className="w-4 h-4" />}
                >
                  Déconnexion
                </Button>
              )}
            </div>
          </Card>

          {/* Danger Zone */}
          <Card className="border-coral-200 bg-coral-50/50">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-coral-100 rounded-lg">
                <Trash2 className="w-5 h-5 text-coral-600" />
              </div>
              <div>
                <h2 className="text-lg font-display font-semibold text-coral-900">
                  Zone dangereuse
                </h2>
                <p className="text-sm text-coral-700">
                  Actions irréversibles
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-coral-700">
                La suppression de votre compte effacera définitivement toutes vos données.
                Cette action est irréversible.
              </p>
              
              <Button
                variant="danger"
                disabled={!user}
                icon={<Trash2 className="w-4 h-4" />}
              >
                Supprimer mon compte
              </Button>
            </div>
          </Card>
        </div>
      </main>
    </AppShell>
  )
}
