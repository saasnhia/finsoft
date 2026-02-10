'use client'

import { useState } from 'react'
import Link from 'next/link'
import { AppShell } from '@/components/layout'
import { Card } from '@/components/ui'
import {
  HelpCircle,
  ChevronDown,
  Shield,
  Calculator,
  FileText,
  Scale,
  Building2,
  ArrowLeft,
} from 'lucide-react'

interface FAQItem {
  question: string
  answer: string
}

interface FAQSection {
  title: string
  icon: React.ElementType
  items: FAQItem[]
}

const FAQ_SECTIONS: FAQSection[] = [
  {
    title: 'Obligation d\'audit légal',
    icon: Scale,
    items: [
      {
        question: 'Quand l\'audit légal est-il obligatoire ?',
        answer: 'L\'audit légal (commissariat aux comptes) est obligatoire pour les sociétés commerciales (SA, SAS, SARL) qui dépassent 2 des 3 seuils suivants à la clôture de l\'exercice : Chiffre d\'affaires HT > 8 000 000 €, Total du bilan > 4 000 000 €, Effectif moyen > 50 salariés. Ces seuils sont définis par l\'article L823-1 et R823-1 du Code de commerce.',
      },
      {
        question: 'Quels sont les seuils applicables en 2025-2026 ?',
        answer: 'Les seuils actuellement en vigueur (relevés par le décret n°2024-152) sont : CA HT > 8 M€, Total bilan > 4 M€, Effectif > 50. Ces seuils s\'appliquent aux exercices ouverts à compter du 1er janvier 2024. Ils ont été significativement relevés par rapport aux anciens seuils (3,1 M€ / 1,55 M€ / 50).',
      },
      {
        question: 'Comment se calcule le critère "effectif moyen" ?',
        answer: 'L\'effectif moyen correspond au nombre moyen de salariés employés au cours de l\'exercice, calculé selon les règles du Code du travail (art. L130-1 du Code de la sécurité sociale). Les salariés à temps partiel sont pris en compte au prorata de leur durée de travail. Les intérimaires et stagiaires ne sont pas comptabilisés.',
      },
      {
        question: 'Que se passe-t-il si l\'entreprise ne nomme pas de CAC alors qu\'elle y est tenue ?',
        answer: 'Le défaut de nomination d\'un commissaire aux comptes est un délit pénal puni de 2 ans d\'emprisonnement et 30 000 € d\'amende (art. L820-4 du Code de commerce). De plus, les délibérations prises sans que le CAC ait été régulièrement désigné peuvent être annulées.',
      },
    ],
  },
  {
    title: 'Seuils de signification (NEP 320)',
    icon: Calculator,
    items: [
      {
        question: 'Qu\'est-ce que le seuil de signification ?',
        answer: 'Le seuil de signification est le montant au-delà duquel des anomalies, individuellement ou cumulées, peuvent influencer les décisions économiques des utilisateurs des comptes. Il est défini par la NEP 320 et constitue la base de toute la planification de l\'audit. Il représente généralement entre 0,5% et 2% du total du bilan, ou 0,5% à 1% du chiffre d\'affaires.',
      },
      {
        question: 'Comment est calculé le seuil de signification ?',
        answer: 'Le seuil de signification est déterminé par le commissaire aux comptes selon son jugement professionnel. Les bases de calcul courantes sont : le total du bilan (0,5% à 2%), le chiffre d\'affaires (0,5% à 1%), ou le résultat net (5% à 10% si stable). Le pourcentage retenu dépend de la taille de l\'entité : plus elle est grande, plus le pourcentage est faible.',
      },
      {
        question: 'Qu\'est-ce que le seuil de planification ?',
        answer: 'Le seuil de planification est fixé à un montant inférieur au seuil de signification (généralement 70%) pour réduire le risque que les anomalies non détectées, cumulées aux anomalies détectées, dépassent le seuil de signification. C\'est ce seuil qui est utilisé pour dimensionner les procédures d\'audit.',
      },
      {
        question: 'À quoi sert le seuil d\'anomalies clairement insignifiantes ?',
        answer: 'Les anomalies en-dessous de ce seuil (généralement 5% du seuil de planification) n\'ont pas besoin d\'être cumulées car elles ne peuvent pas, même agrégées, avoir un impact significatif sur les comptes. Cela permet à l\'auditeur de concentrer ses efforts sur les éléments réellement significatifs.',
      },
    ],
  },
  {
    title: 'Classification des comptes',
    icon: FileText,
    items: [
      {
        question: 'Comment sont classés les comptes par rapport aux seuils ?',
        answer: 'Les comptes sont classés en 3 catégories : (1) Significatifs : solde supérieur au seuil de signification → audit détaillé avec vérification substantive requise. (2) À vérifier : solde entre le seuil de planification et le seuil de signification → procédures analytiques recommandées. (3) Insignifiants : solde inférieur au seuil de planification → revue limitée suffisante.',
      },
      {
        question: 'Un compte avec un solde faible peut-il être classé "à vérifier" ?',
        answer: 'Oui. Un compte peut avoir un solde faible en fin d\'exercice mais des mouvements très importants en cours d\'année (par exemple le compte banque). Si le total des mouvements (débit + crédit) dépasse le seuil de signification, le compte est reclassé en "à vérifier" car le volume de transactions justifie un examen plus approfondi.',
      },
      {
        question: 'Quel format de fichier pour importer la balance ?',
        answer: 'La balance peut être importée au format CSV avec un séparateur point-virgule (;). Les colonnes attendues sont : numero_compte, libelle, debit, credit. Les montants peuvent utiliser la virgule comme séparateur décimal. L\'encodage UTF-8 est recommandé. Vous pouvez aussi utiliser la balance de démonstration intégrée.',
      },
    ],
  },
  {
    title: 'Utilisation du module Audit',
    icon: Shield,
    items: [
      {
        question: 'Comment utiliser le module Audit ?',
        answer: 'Le module Audit se décompose en 2 étapes : (1) Page "Calcul des seuils" : saisissez les données financières de l\'entreprise (CA, bilan, effectif) pour vérifier l\'obligation d\'audit et calculer les seuils de signification, planification et anomalies. (2) Page "Tri des comptes" : importez la balance des comptes (CSV ou démo) pour les classer automatiquement par niveau de risque selon les seuils calculés.',
      },
      {
        question: 'Les données sont-elles sauvegardées ?',
        answer: 'Actuellement, les calculs sont effectués à la volée sans sauvegarde en base de données. Les résultats peuvent être exportés au format CSV depuis la page "Tri des comptes". Une fonctionnalité de sauvegarde des dossiers d\'audit est prévue dans une future mise à jour.',
      },
      {
        question: 'Ce module remplace-t-il un logiciel d\'audit ?',
        answer: 'Non. Ce module est un outil d\'aide à la décision et à la planification. Il ne remplace pas le jugement professionnel du commissaire aux comptes ni les logiciels d\'audit spécialisés. Les seuils calculés sont indicatifs et doivent être validés par le professionnel en charge de la mission.',
      },
    ],
  },
]

export default function FAQPage() {
  const [openItems, setOpenItems] = useState<Set<string>>(new Set())

  const toggleItem = (key: string) => {
    setOpenItems(prev => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  const expandAll = () => {
    const allKeys = new Set<string>()
    FAQ_SECTIONS.forEach((section, si) => {
      section.items.forEach((_, qi) => {
        allKeys.add(`${si}-${qi}`)
      })
    })
    setOpenItems(allKeys)
  }

  const collapseAll = () => setOpenItems(new Set())

  return (
      <AppShell>
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 text-sm text-navy-500 mb-1">
              <Link href="/dashboard" className="hover:text-emerald-600 transition-colors">Dashboard</Link>
              <span>/</span>
              <span className="text-navy-700">FAQ</span>
            </div>
            <h1 className="text-2xl font-display font-bold text-navy-900 flex items-center gap-2">
              <HelpCircle className="w-6 h-6 text-emerald-600" />
              Foire aux questions — Module Audit
            </h1>
            <p className="text-sm text-navy-500 mt-1">
              Tout savoir sur l&apos;obligation d&apos;audit, les seuils de signification et la classification des comptes
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={expandAll} className="text-xs text-emerald-600 hover:text-emerald-700 font-medium">
              Tout ouvrir
            </button>
            <span className="text-navy-300">|</span>
            <button onClick={collapseAll} className="text-xs text-navy-500 hover:text-navy-700 font-medium">
              Tout fermer
            </button>
          </div>
        </div>

        {/* FAQ Sections */}
        <div className="space-y-6">
          {FAQ_SECTIONS.map((section, si) => (
            <Card key={si}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <section.icon className="w-5 h-5 text-emerald-600" />
                </div>
                <h2 className="font-display font-semibold text-navy-900">
                  {section.title}
                </h2>
              </div>

              <div className="space-y-1">
                {section.items.map((item, qi) => {
                  const key = `${si}-${qi}`
                  const isOpen = openItems.has(key)

                  return (
                    <div key={qi} className="border border-navy-100 rounded-xl overflow-hidden">
                      <button
                        onClick={() => toggleItem(key)}
                        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-navy-50 transition-colors"
                      >
                        <span className="text-sm font-medium text-navy-800 pr-4">
                          {item.question}
                        </span>
                        <ChevronDown className={`w-4 h-4 text-navy-400 flex-shrink-0 transition-transform duration-200 ${
                          isOpen ? 'rotate-180' : ''
                        }`} />
                      </button>
                      {isOpen && (
                        <div className="px-4 pb-4 pt-0">
                          <p className="text-sm text-navy-600 leading-relaxed">
                            {item.answer}
                          </p>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </Card>
          ))}
        </div>

        {/* Back Link */}
        <div className="mt-8 flex justify-center">
          <Link href="/audit/seuils">
            <button className="flex items-center gap-2 text-sm text-emerald-600 hover:text-emerald-700 font-medium transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Retour au module Audit
            </button>
          </Link>
        </div>
      </div>
    </AppShell>
  )
}
