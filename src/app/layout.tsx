import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from 'react-hot-toast'

export const metadata: Metadata = {
  title: 'FinSoft | OCR Factures, SIREN & TVA — Comptabilité automatisée',
  description: 'Automatisez votre comptabilité avec OCR factures, enrichissement SIREN, validation TVA UE (VIES) et rapprochement bancaire intelligent. Logiciel local RGPD, licence perpétuelle dès 299€.',
  keywords: ['comptabilité', 'OCR factures', 'SIREN', 'TVA intracommunautaire', 'VIES', 'rapprochement bancaire', 'PME', 'cabinet comptable', 'RGPD', 'Dijon'],
  authors: [{ name: 'FinSoft' }],
  openGraph: {
    title: 'FinSoft | OCR Factures, SIREN & TVA — Comptabilité automatisée',
    description: 'Automatisez votre comptabilité avec OCR factures, SIREN, validation TVA UE et rapprochement bancaire intelligent. Licence perpétuelle dès 299€.',
    type: 'website',
    locale: 'fr_FR',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body className="font-body antialiased">
        <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
        {children}
      </body>
    </html>
  )
}
