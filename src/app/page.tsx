'use client'

import Link from 'next/link'
import { Button, Card } from '@/components/ui'
import { Header, Footer } from '@/components/layout'
import { 
  Target, 
  TrendingUp, 
  PieChart, 
  Zap,
  Shield,
  Clock,
  ArrowRight,
  CheckCircle2,
  BarChart3,
} from 'lucide-react'

export default function HomePage() {
  const features = [
    {
      icon: <Target className="w-6 h-6" />,
      title: 'Seuil de Rentabilité',
      description: 'Calculez votre point mort en quelques clics. Visualisez exactement combien vous devez générer pour couvrir vos charges.',
      color: 'emerald',
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: 'Suivi Temps Réel',
      description: 'Suivez l\'évolution de vos KPIs mois après mois. Anticipez les difficultés avant qu\'elles n\'arrivent.',
      color: 'gold',
    },
    {
      icon: <PieChart className="w-6 h-6" />,
      title: 'Analyse des Coûts',
      description: 'Distinguez charges fixes et variables. Identifiez les leviers pour améliorer votre rentabilité.',
      color: 'coral',
    },
  ]

  const benefits = [
    'Calcul automatique du seuil de rentabilité',
    'Visualisation graphique de vos finances',
    'Marge de sécurité en temps réel',
    'Point mort calculé en jours',
    'Historique sur 6 mois',
    'Export de vos données',
  ]

  const colorStyles: Record<string, { bg: string; text: string; border: string }> = {
    emerald: { bg: 'bg-emerald-100', text: 'text-emerald-600', border: 'border-emerald-200' },
    gold: { bg: 'bg-gold-100', text: 'text-gold-600', border: 'border-gold-200' },
    coral: { bg: 'bg-coral-100', text: 'text-coral-600', border: 'border-coral-200' },
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden gradient-bg">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-3xl" />
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
            <div className="text-center max-w-4xl mx-auto">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-6 animate-fade-in">
                <Zap className="w-4 h-4 text-emerald-400" />
                <span className="text-sm text-emerald-300 font-medium">
                  Nouveau : Mode simulation disponible
                </span>
              </div>

              <h1 className="text-4xl md:text-6xl lg:text-7xl font-display font-bold text-white leading-tight animate-slide-up">
                Connaître ton
                <span className="text-gradient block">seuil de rentabilité</span>
                en 30 secondes
              </h1>

              <p className="mt-6 text-lg md:text-xl text-navy-300 max-w-2xl mx-auto animate-slide-up stagger-1">
                FinPilote remplace Excel pour piloter la santé financière de votre entreprise. 
                Simple, visuel, efficace.
              </p>

              <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center animate-slide-up stagger-2">
                <Link href="/signup">
                  <Button size="lg" icon={<ArrowRight className="w-5 h-5" />}>
                    Démarrer gratuitement
                  </Button>
                </Link>
                <Link href="/login">
                  <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10 hover:border-white/30">
                    Se connecter
                  </Button>
                </Link>
              </div>

              <p className="mt-6 text-sm text-navy-400 animate-slide-up stagger-3">
                Pas de carte bancaire requise • Données sécurisées
              </p>
            </div>

            {/* Dashboard Preview */}
            <div className="mt-16 relative animate-slide-up stagger-4">
              <div className="absolute inset-0 bg-gradient-to-t from-navy-950 via-transparent to-transparent z-10 pointer-events-none" />
              <Card className="overflow-hidden shadow-2xl border-navy-700/50" variant="glass" padding="none">
                <div className="p-6 bg-navy-900/50">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-3 h-3 rounded-full bg-coral-500" />
                    <div className="w-3 h-3 rounded-full bg-gold-500" />
                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-navy-800/50 rounded-lg p-4">
                      <p className="text-xs text-navy-400 mb-1">Seuil de rentabilité</p>
                      <p className="text-2xl font-display font-bold text-emerald-400">20 000 €</p>
                    </div>
                    <div className="bg-navy-800/50 rounded-lg p-4">
                      <p className="text-xs text-navy-400 mb-1">CA Actuel</p>
                      <p className="text-2xl font-display font-bold text-white">25 000 €</p>
                    </div>
                    <div className="bg-navy-800/50 rounded-lg p-4">
                      <p className="text-xs text-navy-400 mb-1">Marge de sécurité</p>
                      <p className="text-2xl font-display font-bold text-gold-400">+20%</p>
                    </div>
                  </div>
                  <div className="mt-4 h-32 bg-navy-800/30 rounded-lg flex items-end justify-around px-4 pb-4">
                    {[40, 65, 45, 80, 60, 90, 75].map((h, i) => (
                      <div 
                        key={i} 
                        className="w-8 bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t"
                        style={{ height: `${h}%` }}
                      />
                    ))}
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-display font-bold text-navy-900">
                Tout ce dont vous avez besoin
              </h2>
              <p className="mt-4 text-lg text-navy-500 max-w-2xl mx-auto">
                FinPilote vous donne une vue claire et actionnable de la santé financière de votre entreprise.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <Card 
                  key={index} 
                  hover 
                  className="text-center"
                >
                  <div className={`inline-flex p-4 rounded-2xl ${colorStyles[feature.color].bg} mb-6`}>
                    <div className={colorStyles[feature.color].text}>
                      {feature.icon}
                    </div>
                  </div>
                  <h3 className="text-xl font-display font-semibold text-navy-900 mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-navy-500">
                    {feature.description}
                  </p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-24 bg-navy-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-display font-bold text-navy-900 mb-6">
                  Dites adieu aux tableurs Excel
                </h2>
                <p className="text-lg text-navy-600 mb-8">
                  Fini les formules complexes et les fichiers qui se perdent. FinPilote calcule 
                  automatiquement vos indicateurs clés et les présente de manière claire.
                </p>

                <ul className="space-y-4">
                  {benefits.map((benefit, index) => (
                    <li key={index} className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      </div>
                      <span className="text-navy-700">{benefit}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-10">
                  <Link href="/signup">
                    <Button size="lg" icon={<ArrowRight className="w-5 h-5" />}>
                      Essayer maintenant
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-gold-500/20 rounded-3xl blur-3xl" />
                <Card className="relative" variant="gradient" padding="lg">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                      <BarChart3 className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-sm text-navy-300">Performance ce mois</p>
                      <p className="text-2xl font-display font-bold text-white">+125%</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-navy-300">Objectif mensuel</span>
                        <span className="text-emerald-400">125%</span>
                      </div>
                      <div className="h-2 bg-navy-700 rounded-full overflow-hidden">
                        <div className="h-full w-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full" />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-navy-300">Charges maîtrisées</span>
                        <span className="text-gold-400">92%</span>
                      </div>
                      <div className="h-2 bg-navy-700 rounded-full overflow-hidden">
                        <div className="h-full w-[92%] bg-gradient-to-r from-gold-500 to-gold-400 rounded-full" />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-navy-300">Marge de sécurité</span>
                        <span className="text-emerald-400">20%</span>
                      </div>
                      <div className="h-2 bg-navy-700 rounded-full overflow-hidden">
                        <div className="h-full w-[20%] bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full" />
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Trust Section */}
        <section className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div>
                <div className="inline-flex p-4 rounded-2xl bg-navy-100 mb-4">
                  <Shield className="w-8 h-8 text-navy-600" />
                </div>
                <h3 className="text-lg font-display font-semibold text-navy-900 mb-2">
                  Données Sécurisées
                </h3>
                <p className="text-navy-500 text-sm">
                  Vos données financières sont chiffrées et hébergées en France
                </p>
              </div>
              <div>
                <div className="inline-flex p-4 rounded-2xl bg-navy-100 mb-4">
                  <Clock className="w-8 h-8 text-navy-600" />
                </div>
                <h3 className="text-lg font-display font-semibold text-navy-900 mb-2">
                  30 Secondes
                </h3>
                <p className="text-navy-500 text-sm">
                  C&apos;est le temps qu&apos;il faut pour calculer votre seuil de rentabilité
                </p>
              </div>
              <div>
                <div className="inline-flex p-4 rounded-2xl bg-navy-100 mb-4">
                  <Zap className="w-8 h-8 text-navy-600" />
                </div>
                <h3 className="text-lg font-display font-semibold text-navy-900 mb-2">
                  100% Gratuit
                </h3>
                <p className="text-navy-500 text-sm">
                  Toutes les fonctionnalités essentielles sans frais cachés
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 gradient-bg">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-6">
              Prêt à piloter votre rentabilité ?
            </h2>
            <p className="text-lg text-navy-300 mb-10 max-w-2xl mx-auto">
              Rejoignez les comptables et PME qui utilisent déjà FinPilote pour prendre 
              de meilleures décisions financières.
            </p>
            <Link href="/signup">
              <Button size="lg" icon={<ArrowRight className="w-5 h-5" />}>
                Créer mon compte gratuit
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
