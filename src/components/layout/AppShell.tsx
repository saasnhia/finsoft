'use client'

import { Header } from './Header'
import { Sidebar } from './Sidebar'
import { DossierProvider } from '@/contexts/DossierContext'

interface AppShellProps {
  children: React.ReactNode
}

/**
 * Main application shell: Header (top) + Sidebar (left) + Content.
 * Use this as a wrapper for all authenticated pages instead of standalone <Header />.
 */
export function AppShell({ children }: AppShellProps) {
  return (
    <DossierProvider>
      <div className="min-h-screen bg-navy-50">
        <Header />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 min-w-0">
            {children}
          </main>
        </div>
      </div>
    </DossierProvider>
  )
}
