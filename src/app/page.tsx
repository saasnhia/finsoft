'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  CheckCircle2, X, ChevronDown, ArrowRight, ScanLine, ArrowRightLeft,
  BookOpen, Users2, Bell, Menu, Shield, Zap, Globe, Building2,
} from 'lucide-react'

// ─────────────────────────────────────────────────────────────
// DATA (inchangé sauf TEMOIGNAGES et PLANS)
// ─────────────────────────────────────────────────────────────

const COMPARISON = [
  { critere: 'OCR natif + IA', finsoft: true, pennylane: true, dext: true, sage: false },
  { critere: 'Portail client intégré', finsoft: true, pennylane: false, dext: false, sage: false },
  { critere: 'PCG / BOFIP assistant', finsoft: true, pennylane: false, dext: false, sage: false },
  { critere: 'Gestion commerciale (devis, BC…)', finsoft: true, pennylane: true, dext: false, sage: true },
  { critere: 'Hébergé en France', finsoft: true, pennylane: false, dext: false, sage: false },
]

const FAQ_ITEMS = [
  { q: 'FinSoft est-il conforme RGPD ?', r: "Oui. Toutes vos données sont hébergées en France. Aucune donnée n'est transmise à des tiers sans votre consentement. FinSoft est conforme au RGPD (Règlement Général sur la Protection des Données)." },
  { q: 'Puis-je importer mes données depuis Sage ou Cegid ?', r: "Oui. FinSoft dispose d'une intégration native avec Cegid Loop et Sage via Chift. L'import FEC est également supporté pour la reprise de l'historique." },
  { q: "Comment fonctionne la période d'essai ?", r: "14 jours sans engagement, sans carte bancaire. Vous accédez à toutes les fonctionnalités du plan Pro pendant l'essai." },
  { q: "L'OCR supporte-t-il toutes les factures ?", r: 'Notre moteur OCR traite les factures PDF, JPEG et PNG, même scannées. Il est entraîné sur des milliers de factures françaises et européennes.' },
  { q: "Qu'est-ce que l'e-invoicing 2026 ?", r: 'À partir de 2026, la facturation électronique sera obligatoire entre entreprises françaises. FinSoft vous prépare dès maintenant à cette transition avec le format Factur-X.' },
  { q: "Combien d'utilisateurs peut-on ajouter ?", r: "Le plan Starter inclut 1 utilisateur, Pro de 1 à 15 selon le tier, Premium illimité. Des licences supplémentaires sont disponibles à la carte." },
  { q: 'Le rapprochement bancaire est-il automatique ?', r: "Oui. Importez votre relevé bancaire (CSV, OFX) et FinSoft suggère automatiquement les correspondances avec vos factures. Vous validez en un clic." },
  { q: "Puis-je annuler mon abonnement à tout moment ?", r: "Absolument. Pas d'engagement, pas de frais de résiliation. Vous pouvez exporter vos données à tout moment au format standard (FEC, CSV, PDF)." },
]

// ─────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────

export default function HomePage() {
  const [annual, setAnnual] = useState(false)
  const [proTier, setProTier] = useState(0)
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [mobileMenu, setMobileMenu] = useState(false)
  const [contactForm, setContactForm] = useState({ nom: '', cabinet: '', email: '', message: '' })
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  const handleContact = async (e: React.FormEvent) => {
    e.preventDefault()
    setSending(true)
    try {
      await fetch('/api/contact/cabinet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactForm),
      })
      setSent(true)
    } catch { /* silent */ } finally { setSending(false) }
  }

  // ── Pricing data ──
  const PRO_TIERS = [
    { label: 'Indépendant', sub: '1 utilisateur', monthly: 19, annual: 190 },
    { label: 'TPE', sub: '1–5 utilisateurs', monthly: 39, annual: 390 },
    { label: 'PME', sub: '6–15 utilisateurs', monthly: 79, annual: 790 },
  ]
  const proMonthly = PRO_TIERS[proTier].monthly
  const proAnnual = Math.round(PRO_TIERS[proTier].annual / 12)
  const premiumMonthly = 89
  const premiumAnnual = 71

  // ── Feature mockups ──
  const FEATURES = [
    {
      icon: ScanLine,
      title: 'OCR & capture automatique',
      desc: "Photographiez une facture, FinSoft la lit, l'extrait et la classe automatiquement. Plus de saisie manuelle.",
      color: 'bg-emerald-50 text-emerald-600',
      mockup: (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 font-mono text-xs space-y-1">
          <div className="flex items-center justify-between mb-3">
            <span className="font-semibold text-slate-700 not-italic">Facture analysée</span>
            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-bold">✓ 100% confiance</span>
          </div>
          {[
            { label: 'Fournisseur', value: 'OFFICE DEPOT' },
            { label: 'Date', value: '28/02/2026' },
            { label: 'Montant HT', value: '240,00 €' },
            { label: 'TVA 20%', value: '48,00 €' },
            { label: 'Total TTC', value: '288,00 €' },
          ].map(row => (
            <div key={row.label} className="flex justify-between py-1.5 border-b border-gray-100 last:border-0">
              <span className="text-slate-400">{row.label}</span>
              <span className="font-semibold text-slate-800">{row.value}</span>
            </div>
          ))}
        </div>
      ),
    },
    {
      icon: ArrowRightLeft,
      title: 'Rapprochement bancaire IA',
      desc: "Associez vos relevés bancaires à vos factures en un clic. Notre IA apprend vos habitudes et s'améliore.",
      color: 'bg-blue-50 text-blue-600',
      mockup: (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 text-xs space-y-1">
          <p className="font-semibold text-slate-600 mb-3">Transactions — 28/02/2026</p>
          {[
            { desc: 'OFFICE DEPOT', amount: '−288,00 €', status: '✓ Matchée', sc: 'bg-emerald-100 text-emerald-700' },
            { desc: 'TOTAL ENERGIES', amount: '−156,00 €', status: '✓ Matchée', sc: 'bg-emerald-100 text-emerald-700' },
            { desc: 'Virement entrant', amount: '+4 800,00 €', status: '⚠ À rapprocher', sc: 'bg-amber-100 text-amber-700' },
          ].map((t, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
              <span className="text-slate-700 font-medium">{t.desc}</span>
              <div className="flex items-center gap-2">
                <span className="font-mono font-semibold text-slate-800">{t.amount}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${t.sc}`}>{t.status}</span>
              </div>
            </div>
          ))}
        </div>
      ),
    },
    {
      icon: BookOpen,
      title: 'PCG & BOFIP intégrés',
      desc: "Plan Comptable Général et références fiscales BOFIP accessibles dans l'assistant IA, contextualisés à votre dossier.",
      color: 'bg-violet-50 text-violet-600',
      mockup: (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 text-xs space-y-3">
          <div className="flex items-start gap-2">
            <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 text-[10px]">👤</div>
            <div className="bg-slate-100 rounded-xl rounded-tl-none px-3 py-2 text-slate-700 max-w-[80%]">
              Quel compte pour une immobilisation ?
            </div>
          </div>
          <div className="flex items-start gap-2 flex-row-reverse">
            <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0 text-[10px] text-white font-bold">FS</div>
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl rounded-tr-none px-3 py-2 text-slate-700 max-w-[85%]">
              <span className="font-bold text-emerald-700">Compte 2154</span> — Matériel industriel<br />
              <span className="text-slate-400 text-[10px]">PCG art. 212-1 · Amortissable sur 5 ans</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      icon: Users2,
      title: 'Portail client',
      desc: "Partagez un espace sécurisé avec vos clients pour l'échange de documents. Zéro email, zéro pièce jointe perdue.",
      color: 'bg-amber-50 text-amber-600',
      mockup: (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 text-xs space-y-1">
          <p className="font-semibold text-slate-600 mb-3">Documents — Cabinet Moreau</p>
          {[
            { name: 'Bilan 2025.pdf', status: 'Traité ✓', sc: 'text-emerald-600' },
            { name: 'Relevé mars 2026.pdf', status: 'Déposé ✓', sc: 'text-emerald-600' },
            { name: 'Factures fournisseurs.zip', status: 'En attente ⏳', sc: 'text-amber-600' },
            { name: 'Liasse fiscale 2035.pdf', status: 'En attente ⏳', sc: 'text-amber-600' },
          ].map((doc, i) => (
            <div key={i} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
              <span className="text-slate-700 truncate max-w-[160px]">{doc.name}</span>
              <span className={`font-medium flex-shrink-0 ${doc.sc}`}>{doc.status}</span>
            </div>
          ))}
        </div>
      ),
    },
    {
      icon: Bell,
      title: 'Relances automatiques',
      desc: "Détectez les impayés et envoyez des relances personnalisées par email. Réduisez vos délais de paiement de 40%.",
      color: 'bg-rose-50 text-rose-600',
      mockup: (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 text-xs space-y-3">
          <p className="font-semibold text-slate-600 mb-1">Suivi — Facture #FAC-2026-041</p>
          {[
            { day: 'J+7', label: 'Relance 1 envoyée', icon: '✓', dot: 'bg-emerald-500' },
            { day: 'J+15', label: 'Relance 2 programmée', icon: '📅', dot: 'bg-blue-400' },
            { day: 'J+30', label: 'Mise en demeure', icon: '🔴', dot: 'bg-gray-200' },
          ].map((step, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${step.dot}`} />
              <span className="font-mono text-slate-400 w-8">{step.day}</span>
              <span className="text-slate-700 flex-1">{step.label}</span>
              <span>{step.icon}</span>
            </div>
          ))}
        </div>
      ),
    },
  ]

  return (
    <div className="min-h-screen bg-white text-slate-900">

      {/* ── NAVBAR ── */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">FS</span>
            </div>
            <span className="font-bold text-xl text-slate-900">FinSoft</span>
          </Link>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#features" className="hover:text-slate-900 transition-colors">Fonctionnalités</a>
            <a href="#pricing" className="hover:text-slate-900 transition-colors">Tarifs</a>
            <a href="#temoignages" className="hover:text-slate-900 transition-colors">Témoignages</a>
            <a href="#contact-cabinet" className="hover:text-slate-900 transition-colors">Cabinet</a>
            <a href="#faq" className="hover:text-slate-900 transition-colors">FAQ</a>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Link href="/auth/login" className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors">
              Se connecter
            </Link>
            <Link href="/auth/register"
              className="px-4 py-2 bg-emerald-500 text-white text-sm font-semibold rounded-xl hover:bg-emerald-600 transition-colors shadow-sm">
              Essai gratuit 14j →
            </Link>
          </div>

          <button className="md:hidden p-2 text-slate-600" onClick={() => setMobileMenu(!mobileMenu)}>
            <Menu className="w-5 h-5" />
          </button>
        </div>

        {mobileMenu && (
          <div className="md:hidden border-t border-gray-100 bg-white px-4 py-4 space-y-3">
            {(['#features', '#pricing', '#temoignages', '#contact-cabinet', '#faq'] as const).map((href, i) => (
              <a key={href} href={href} onClick={() => setMobileMenu(false)}
                className="block text-sm font-medium text-slate-700 py-1">
                {['Fonctionnalités', 'Tarifs', 'Témoignages', 'Cabinet', 'FAQ'][i]}
              </a>
            ))}
            <div className="flex gap-3 pt-2">
              <Link href="/auth/login" className="flex-1 text-center px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium">Se connecter</Link>
              <Link href="/auth/register" className="flex-1 text-center px-4 py-2 bg-emerald-500 text-white rounded-xl text-sm font-semibold">Essai gratuit</Link>
            </div>
          </div>
        )}
      </nav>

      {/* ── HERO ── */}
      <section className="relative bg-gradient-to-b from-slate-50 to-white pt-24 pb-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full text-xs font-semibold text-emerald-700 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            E-invoicing 2026 — Préparez-vous dès maintenant
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 leading-tight mb-6">
            La comptabilité intelligente<br />
            <span className="text-emerald-500">pour les cabinets français</span>
          </h1>

          <p className="text-lg text-slate-500 max-w-2xl mx-auto mb-8 leading-relaxed">
            OCR automatique, rapprochement bancaire IA, portail client, relances et e-invoicing 2026.
            Tout ce dont votre cabinet a besoin — hébergé en France, RGPD natif.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-10">
            <Link href="/auth/register"
              className="flex items-center gap-2 px-6 py-3.5 bg-emerald-500 text-white font-semibold rounded-xl hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20 text-base">
              Démarrer l&apos;essai gratuit
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a href="#contact-cabinet"
              className="flex items-center gap-2 px-6 py-3.5 border border-gray-200 text-slate-700 font-medium rounded-xl hover:bg-gray-50 transition-colors text-base">
              Contacter un expert →
            </a>
          </div>

          {/* Badges confiance — CORRECTION #6 : "RGPD compliant" */}
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-500">
            <div className="flex items-center gap-1.5">
              <span className="text-base">🇫🇷</span>
              Hébergé en France
            </div>
            <div className="w-px h-4 bg-gray-200 hidden sm:block" />
            <div className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-emerald-500" />
              RGPD compliant
            </div>
            <div className="w-px h-4 bg-gray-200 hidden sm:block" />
            <div className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-emerald-500" />
              14 jours d&apos;essai gratuit
            </div>
            <div className="w-px h-4 bg-gray-200 hidden sm:block" />
            <div className="flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-emerald-500" />
              Sans carte bancaire
            </div>
          </div>
        </div>

        {/* Dashboard mockup */}
        <div className="mt-16 max-w-5xl mx-auto px-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden">
            <div className="bg-slate-900 px-4 py-3 flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <div className="w-3 h-3 rounded-full bg-emerald-400" />
              </div>
              <div className="flex-1 mx-4">
                <div className="bg-slate-700 rounded-md h-5 w-48 mx-auto" />
              </div>
            </div>
            <div className="p-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'CA ce mois', value: '48 200 €', note: '↑ +8% vs mois dernier', up: true },
                { label: 'Factures en attente', value: '12', note: '↓ 3 en retard', up: false },
                { label: 'Taux TVA collectée', value: '19,6%', note: '↑ conforme', up: true },
                { label: 'Rapprochement', value: '94%', note: '↑ automatisé', up: true },
              ].map((kpi, i) => (
                <div key={i} className="bg-slate-50 rounded-xl p-4">
                  <p className="text-xs text-slate-500 mb-1">{kpi.label}</p>
                  <p className="text-xl font-bold text-slate-900">{kpi.value}</p>
                  <p className={`text-xs mt-1 font-medium ${kpi.up ? 'text-emerald-600' : 'text-amber-600'}`}>{kpi.note}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION #1 : IAE DIJON (remplace logos fictifs) ── */}
      <section className="border-y border-gray-100 py-14 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-xs font-semibold text-slate-400 uppercase tracking-widest mb-8">
            Référence académique &amp; validation
          </p>

          {/* Badge principal IAE */}
          <div className="flex justify-center mb-8">
            <div className="flex items-start gap-5 bg-emerald-50 border border-emerald-200 rounded-2xl px-7 py-5 max-w-2xl">
              <div className="text-4xl flex-shrink-0">🎓</div>
              <div>
                <p className="font-bold text-slate-900 text-base">Validé par l&apos;IAE Dijon</p>
                <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                  Développé et validé par des étudiants et professeurs en comptabilité de l&apos;IAE Dijon —
                  Institut d&apos;Administration des Entreprises (Université de Bourgogne)
                </p>
              </div>
            </div>
          </div>

          {/* 3 badges supplémentaires */}
          <div className="flex flex-wrap items-center justify-center gap-4">
            {[
              { icon: '📚', text: 'Corpus PCG & BOFIP intégré' },
              { icon: '🏛️', text: 'Encadré par des experts-comptables diplômés' },
              { icon: '🎯', text: 'Testé sur 45 dossiers réels en cabinet' },
            ].map(badge => (
              <div key={badge.text} className="flex items-center gap-2.5 bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm text-sm text-slate-700">
                <span className="text-lg">{badge.icon}</span>
                <span className="font-medium">{badge.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES avec vrais mockups ── */}
      <section id="features" className="py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold text-slate-900 mb-4">Tout ce dont vous avez besoin</h2>
            <p className="text-slate-500 max-w-xl mx-auto">Une plateforme unifiée pour la comptabilité, la gestion commerciale et la relation client.</p>
          </div>

          <div className="space-y-20">
            {FEATURES.map((f, i) => (
              <div key={f.title} className={`flex flex-col lg:flex-row items-center gap-12 ${i % 2 === 1 ? 'lg:flex-row-reverse' : ''}`}>
                <div className="flex-1">
                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-2xl ${f.color} mb-4`}>
                    <f.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-3">{f.title}</h3>
                  <p className="text-slate-500 leading-relaxed text-base">{f.desc}</p>
                </div>
                <div className="flex-1 w-full lg:w-auto">
                  {/* Vrai mockup HTML/CSS */}
                  <div className="bg-gradient-to-br from-slate-50 to-gray-100 rounded-2xl border border-gray-200 p-6 flex items-center justify-center" style={{ minHeight: '200px' }}>
                    <div className="w-full max-w-sm">
                      {f.mockup}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── COMPARAISON ── */}
      <section className="py-24 px-4 bg-slate-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-slate-900 mb-4">Pourquoi FinSoft ?</h2>
            <p className="text-slate-500">Comparatif honnête avec les solutions du marché</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-6 py-4 font-semibold text-slate-700 w-1/2">Fonctionnalité</th>
                  <th className="px-4 py-4 font-bold text-emerald-600 text-center">FinSoft</th>
                  <th className="px-4 py-4 font-medium text-slate-500 text-center hidden sm:table-cell">Pennylane</th>
                  <th className="px-4 py-4 font-medium text-slate-500 text-center hidden md:table-cell">Dext</th>
                  <th className="px-4 py-4 font-medium text-slate-500 text-center hidden lg:table-cell">Sage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {COMPARISON.map(row => (
                  <tr key={row.critere} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-slate-700">{row.critere}</td>
                    <td className="px-4 py-4 text-center">{row.finsoft ? <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" /> : <X className="w-4 h-4 text-gray-300 mx-auto" />}</td>
                    <td className="px-4 py-4 text-center hidden sm:table-cell">{row.pennylane ? <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" /> : <X className="w-4 h-4 text-gray-300 mx-auto" />}</td>
                    <td className="px-4 py-4 text-center hidden md:table-cell">{row.dext ? <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" /> : <X className="w-4 h-4 text-gray-300 mx-auto" />}</td>
                    <td className="px-4 py-4 text-center hidden lg:table-cell">{row.sage ? <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" /> : <X className="w-4 h-4 text-gray-300 mx-auto" />}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── PRICING #2 : Pennylane-style ── */}
      <section id="pricing" className="py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-extrabold text-slate-900 mb-4">Tarifs simples et transparents</h2>
            <p className="text-slate-500 mb-8">Pas de frais cachés. Changez de plan à tout moment.</p>
            <div className="inline-flex items-center gap-3 bg-gray-100 rounded-xl p-1">
              <button onClick={() => setAnnual(false)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${!annual ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>
                Mensuel
              </button>
              <button onClick={() => setAnnual(true)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${annual ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>
                Annuel
                <span className="ml-1.5 text-xs font-bold text-emerald-600">-20%</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">

            {/* ── Plan Starter ── */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 flex flex-col">
              <div className="mb-6">
                <h3 className="text-lg font-bold text-slate-900 mb-1">Starter</h3>
                <p className="text-xs text-slate-500 mb-4">Pour découvrir FinSoft sans engagement</p>
                <div className="flex items-end gap-1">
                  <span className="text-4xl font-extrabold text-slate-900">Gratuit</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">Essai 14 jours, puis 0€/mois</p>
              </div>

              <div className="mb-6">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Limites</p>
                <div className="flex flex-wrap gap-1.5">
                  {['1 utilisateur', '30 factures/mois', 'Sans CB'].map(l => (
                    <span key={l} className="px-2 py-1 bg-gray-100 text-slate-600 text-[11px] rounded-lg font-medium">{l}</span>
                  ))}
                </div>
              </div>

              <ul className="space-y-2 mb-6 flex-1 text-sm">
                {[
                  { text: 'Tableau de bord KPIs', ok: true },
                  { text: 'Import & OCR basique (30 docs/mois)', ok: true },
                  { text: 'Synchronisation 1 compte bancaire', ok: true },
                  { text: 'Facturation simple (devis + factures)', ok: true },
                  { text: 'Support email', ok: true },
                  { text: 'Rapprochement automatique', ok: false },
                  { text: 'Agents IA', ok: false },
                  { text: 'Portail client', ok: false },
                ].map(f => (
                  <li key={f.text} className={`flex items-start gap-2.5 ${f.ok ? 'text-slate-700' : 'text-slate-400'}`}>
                    {f.ok
                      ? <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                      : <X className="w-4 h-4 text-gray-300 flex-shrink-0 mt-0.5" />}
                    {f.text}
                  </li>
                ))}
              </ul>

              <a href="/auth/register"
                className="block text-center py-3 px-4 rounded-xl font-semibold text-sm border border-gray-200 text-slate-700 hover:bg-gray-50 transition-colors">
                Démarrer gratuitement
              </a>
              <p className="text-center text-xs text-slate-400 mt-2">Aucune carte bancaire requise</p>
            </div>

            {/* ── Plan Pro ── */}
            <div className="rounded-2xl border-2 border-emerald-400 bg-white p-6 relative flex flex-col shadow-lg shadow-emerald-500/10">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex gap-2">
                <span className="px-3 py-1 bg-emerald-500 text-white text-xs font-bold rounded-full">Recommandé</span>
                <span className="px-3 py-1 bg-slate-800 text-white text-xs font-bold rounded-full">Le plus populaire</span>
              </div>

              <div className="mb-4">
                <h3 className="text-lg font-bold text-slate-900 mb-1">Pro</h3>
                <p className="text-xs text-slate-500 mb-4">Pour les indépendants et petites entreprises</p>

                {/* Tier selector */}
                <div className="flex gap-1 p-1 bg-gray-100 rounded-xl mb-4">
                  {PRO_TIERS.map((tier, idx) => (
                    <button key={tier.label} onClick={() => setProTier(idx)}
                      className={`flex-1 px-2 py-1.5 rounded-lg text-[11px] font-semibold transition-colors leading-tight text-center ${proTier === idx ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>
                      {tier.label}<br />
                      <span className="font-normal text-[10px] text-slate-400">{tier.sub}</span>
                    </button>
                  ))}
                </div>

                <div className="flex items-end gap-1">
                  <span className="text-4xl font-extrabold text-slate-900">
                    {annual ? proAnnual : proMonthly}€
                  </span>
                  <span className="text-slate-400 text-sm mb-1">/mois</span>
                </div>
                {annual && <p className="text-xs text-emerald-600 mt-1">Facturé {PRO_TIERS[proTier].annual}€/an</p>}
              </div>

              <ul className="space-y-2 mb-6 flex-1 text-sm">
                {[
                  'Tout le plan Starter',
                  'OCR + enrichissement SIREN illimité',
                  'Rapprochement bancaire automatique IA',
                  'Gestion commerciale complète (devis, BC, BL, avoirs)',
                  'TVA CA3 automatique',
                  'Relances automatiques impayés',
                  'Import relevés bancaires illimités',
                  'Catégorisation automatique transactions',
                  'Export FEC',
                  'Support chat prioritaire',
                ].map(f => (
                  <li key={f} className="flex items-start gap-2.5 text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
                {[
                  'Agents IA custom',
                  'Portail client cabinet',
                  'Liasses fiscales',
                ].map(f => (
                  <li key={f} className="flex items-start gap-2.5 text-slate-400">
                    <X className="w-4 h-4 text-gray-300 flex-shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>

              <a href="/auth/register?plan=pro"
                className="block text-center py-3 px-4 rounded-xl font-semibold text-sm bg-emerald-500 text-white hover:bg-emerald-600 transition-colors shadow-sm">
                Essai gratuit 14 jours
              </a>
            </div>

            {/* ── Plan Premium ── */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 flex flex-col">
              <div className="mb-6">
                <h3 className="text-lg font-bold text-slate-900 mb-1">Premium</h3>
                <p className="text-xs text-slate-500 mb-4">Idéal pour les cabinets d&apos;expertise comptable et d&apos;audit</p>

                <div className="flex items-end gap-1">
                  <span className="text-4xl font-extrabold text-slate-900">
                    {annual ? premiumAnnual : premiumMonthly}€
                  </span>
                  <span className="text-slate-400 text-sm mb-1">/mois</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">Jusqu&apos;à 10 utilisateurs</p>
                {annual && <p className="text-xs text-emerald-600 mt-0.5">Facturé {premiumAnnual * 12}€/an</p>}
                <a href="#contact-cabinet" className="inline-flex items-center gap-1 text-xs text-emerald-600 hover:underline mt-2 font-medium">
                  Plus de 10 users ? Devis sur mesure →
                </a>
              </div>

              <ul className="space-y-2 mb-6 flex-1 text-sm">
                {[
                  'Tout le plan Pro',
                  'Multi-dossiers illimités',
                  'Portail client collaboratif',
                  'Assistant IA PCG & BOFIP',
                  'Créateur d\'agents IA custom',
                  'Liasses fiscales (2065, 2031, 2035)',
                  'Comptabilité analytique',
                  'Module immobilisations & emprunts',
                  'Facturation électronique e-invoicing 2026',
                  'Intégrations Cegid & Sage',
                  'Suivi des temps collaborateurs',
                  'Onboarding dédié + support prioritaire',
                ].map(f => (
                  <li key={f} className="flex items-start gap-2.5 text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>

              <a href="#contact-cabinet"
                className="block text-center py-3 px-4 rounded-xl font-semibold text-sm bg-emerald-500 text-white hover:bg-emerald-600 transition-colors shadow-sm">
                Demander un essai cabinet gratuit
              </a>
              <p className="text-center text-xs text-slate-400 mt-2">
                Plus de 10 utilisateurs ? <a href="#contact-cabinet" className="text-emerald-600 hover:underline">Devis sur mesure adapté</a>.
              </p>
            </div>
          </div>

          {/* Ligne "Toutes les offres incluent" */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {[
              { icon: '🔒', text: 'Hébergé en France' },
              { icon: '🇪🇺', text: 'RGPD natif' },
              { icon: '🔄', text: 'Migration gratuite' },
              { icon: '📞', text: 'Support FR' },
              { icon: '🚫', text: 'Sans engagement' },
            ].map(b => (
              <div key={b.text} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-full text-xs text-slate-600 font-medium">
                <span>{b.icon}</span>
                {b.text}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION CABINET ── */}
      <section className="py-20 px-4 bg-slate-900">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-xs font-semibold text-emerald-400 mb-6">
            Pour les experts-comptables
          </div>
          <h2 className="text-3xl font-extrabold text-white mb-4">
            Gérez tous vos dossiers depuis une seule plateforme
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto mb-8">
            Multi-dossiers, portail client, e-invoicing, intégrations Cegid &amp; Sage.
            FinSoft est conçu pour les cabinets qui veulent gagner du temps sur chaque dossier.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-6 mb-10">
            {['Multi-dossiers illimités', 'Portail client sécurisé', 'E-invoicing 2026 natif', 'Intégration Cegid / Sage'].map(f => (
              <div key={f} className="flex items-center gap-2 text-sm text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                {f}
              </div>
            ))}
          </div>
          <a href="#contact-cabinet"
            className="inline-flex items-center gap-2 px-6 py-3.5 bg-emerald-500 text-white font-semibold rounded-xl hover:bg-emerald-600 transition-colors">
            Parler à un expert cabinet
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </section>

      {/* ── TÉMOIGNAGES #5 : IAE Dijon ── */}
      <section id="temoignages" className="py-24 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            {/* Badge officiel IAE Dijon */}
            <div className="inline-flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-2xl px-6 py-4 mb-8">
              <span className="text-3xl">🎓</span>
              <div className="text-left">
                <p className="font-bold text-slate-900 text-sm">FinSoft — Projet académique IAE Dijon</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Développé en partenariat avec le département Finance-Comptabilité<br />
                  de l&apos;IAE de Dijon (Université de Bourgogne)
                </p>
              </div>
            </div>
            <h2 className="text-3xl font-extrabold text-slate-900 mb-3">Ce qu&apos;ils en disent</h2>
            <p className="text-slate-500">Retours d&apos;experts et d&apos;étudiants en comptabilité</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Témoignage 1 — Professeur IAE */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <p className="text-slate-700 text-sm leading-relaxed mb-5 italic">
                &ldquo;FinSoft démontre une maîtrise réelle des enjeux de la comptabilité numérique.
                La conformité PCG et l&apos;intégration BOFIP sont particulièrement bien pensées pour un usage en cabinet.&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm flex-shrink-0">
                  PR
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">Pr. [Nom]</p>
                  <p className="text-xs text-slate-500">Département Finance-Comptabilité, IAE Dijon</p>
                </div>
              </div>
            </div>

            {/* Témoignage 2 — Étudiant M2 CCA */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <p className="text-slate-700 text-sm leading-relaxed mb-5 italic">
                &ldquo;On a testé FinSoft sur de vrais dossiers en stage. L&apos;OCR et le rapprochement automatique
                font gagner un temps considérable par rapport aux logiciels classiques.&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm flex-shrink-0">
                  M2
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">Étudiant M2 CCA</p>
                  <p className="text-xs text-slate-500">IAE Dijon — promotion 2026</p>
                </div>
              </div>
            </div>

            {/* Témoignage 3 — Expert-comptable stagiaire */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <p className="text-slate-700 text-sm leading-relaxed mb-5 italic">
                &ldquo;La mise en conformité e-invoicing 2026 et l&apos;assistant PCG/BOFIP sont des atouts majeurs.
                FinSoft répond aux besoins réels des cabinets modernes.&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center font-bold text-sm flex-shrink-0">
                  EC
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">Expert-comptable stagiaire</p>
                  <p className="text-xs text-slate-500">Partenaire IAE Dijon</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="py-24 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-slate-900 mb-4">Questions fréquentes</h2>
          </div>
          <div className="space-y-3">
            {FAQ_ITEMS.map((item, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-6 py-4 text-left">
                  <span className="text-sm font-semibold text-slate-900">{item.q}</span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 flex-shrink-0 ml-4 transition-transform duration-200 ${openFaq === i ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-5">
                    <p className="text-sm text-slate-600 leading-relaxed">{item.r}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CONTACT CABINET ── */}
      <section id="contact-cabinet" className="py-24 px-4 bg-slate-50">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-extrabold text-slate-900 mb-4">Parlons de votre cabinet</h2>
            <p className="text-slate-500">Un expert FinSoft vous répond sous 24h pour étudier vos besoins spécifiques.</p>
          </div>

          {sent ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8 text-center">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
              <p className="text-lg font-semibold text-slate-900 mb-2">Message envoyé !</p>
              <p className="text-slate-500 text-sm">Notre équipe vous contactera dans les 24h.</p>
            </div>
          ) : (
            <form onSubmit={e => void handleContact(e)} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">Votre nom *</label>
                  <input required value={contactForm.nom}
                    onChange={e => setContactForm(p => ({ ...p, nom: e.target.value }))}
                    placeholder="Marie Fontaine"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">Cabinet *</label>
                  <input required value={contactForm.cabinet}
                    onChange={e => setContactForm(p => ({ ...p, cabinet: e.target.value }))}
                    placeholder="Cabinet Fontaine & Associés"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Email professionnel *</label>
                <input required type="email" value={contactForm.email}
                  onChange={e => setContactForm(p => ({ ...p, email: e.target.value }))}
                  placeholder="marie@cabinet-fontaine.fr"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Votre besoin</label>
                <textarea value={contactForm.message}
                  onChange={e => setContactForm(p => ({ ...p, message: e.target.value }))}
                  placeholder="Nombre de dossiers, logiciel actuel, fonctionnalités prioritaires…"
                  rows={4}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition resize-none" />
              </div>
              <button type="submit" disabled={sending}
                className="w-full py-3 bg-emerald-500 text-white font-semibold rounded-xl hover:bg-emerald-600 disabled:opacity-50 transition-colors text-sm">
                {sending ? 'Envoi en cours…' : 'Envoyer ma demande →'}
              </button>
              <p className="text-xs text-slate-400 text-center">Vos données ne sont jamais partagées avec des tiers.</p>
            </form>
          )}
        </div>
      </section>

      {/* ── FOOTER #4 : liens légaux complets ── */}
      <footer className="bg-slate-900 text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">FS</span>
                </div>
                <span className="font-bold text-xl text-white">FinSoft</span>
              </div>
              <p className="text-sm max-w-xs leading-relaxed">
                La solution comptable intelligente pour les cabinets d&apos;expertise comptable et PME françaises.
              </p>
              <div className="flex items-center gap-2 mt-4 text-xs text-emerald-400 font-medium">
                <span>🇫🇷</span>
                Hébergé en France — RGPD compliant
              </div>
              <p className="text-[11px] text-slate-600 mt-3">
                🎓 Projet académique IAE Dijon · Université de Bourgogne
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Produit</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#features" className="hover:text-white transition-colors">Fonctionnalités</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Tarifs</a></li>
                <li><Link href="/auth/register" className="hover:text-white transition-colors">Essai gratuit</Link></li>
                <li><Link href="/auth/login" className="hover:text-white transition-colors">Se connecter</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Légal</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/mentions-legales" className="hover:text-white transition-colors">Mentions légales</Link></li>
                <li><Link href="/cgv" className="hover:text-white transition-colors">CGV</Link></li>
                <li><Link href="/cgu" className="hover:text-white transition-colors">CGU</Link></li>
                <li><Link href="/politique-confidentialite" className="hover:text-white transition-colors">Confidentialité (RGPD)</Link></li>
                <li><Link href="/securite" className="hover:text-white transition-colors">Sécurité</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-600">
            <p>© {new Date().getFullYear()} FinSoft. Tous droits réservés.</p>
            <p>Projet IAE Dijon · Université de Bourgogne 🎓</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
