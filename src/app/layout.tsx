import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'FinPilote | Pilotez votre rentabilité',
  description: 'Calculez votre seuil de rentabilité en 30 secondes. La solution simple et efficace pour les comptables et PME.',
  keywords: ['comptabilité', 'seuil de rentabilité', 'PME', 'Dijon', 'gestion financière'],
  authors: [{ name: 'FinPilote' }],
  openGraph: {
    title: 'FinPilote | Pilotez votre rentabilité',
    description: 'Calculez votre seuil de rentabilité en 30 secondes.',
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
        {children}
      </body>
    </html>
  )
}
