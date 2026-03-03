'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const SLIDES = [
  {
    src: '/screenshots/dashboard.png',
    title: 'Tableau de bord complet',
    description: 'KPIs en temps réel, balance âgée clients/fournisseurs, activité récente et recommandations IA',
  },
  {
    src: '/screenshots/relances.png',
    title: 'Relances automatiques',
    description: 'Suivi des impayés par niveau J+7, J+30, mise en demeure — sans aucune saisie manuelle',
  },
  {
    src: '/screenshots/assistant.png',
    title: 'Assistant PCG & BOFIP',
    description: 'Réponses réglementaires instantanées, entraîné sur le droit fiscal français, données anonymisées',
  },
  {
    src: '/screenshots/einvoicing.png',
    title: 'E-invoicing 2026 conforme',
    description: 'Norme Factur-X, profil EN16931, validation automatique des 16 champs obligatoires DGFiP',
  },
]

export function ScreenshotCarousel() {
  const [current, setCurrent] = useState(0)

  const next = useCallback(() => {
    setCurrent(prev => (prev + 1) % SLIDES.length)
  }, [])

  const prev = useCallback(() => {
    setCurrent(prev => (prev - 1 + SLIDES.length) % SLIDES.length)
  }, [])

  useEffect(() => {
    const timer = setInterval(next, 5000)
    return () => clearInterval(timer)
  }, [next])

  const slide = SLIDES[current]

  return (
    <div className="relative">
      {/* Slide container */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden">
        {/* Browser chrome */}
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

        {/* Slide content — real screenshot */}
        <div className="relative aspect-[16/9]">
          <Image
            src={slide.src}
            alt={slide.title}
            fill
            className="object-cover object-top"
            priority={current === 0}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 60vw"
          />
          {/* Overlay gradient for title readability */}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent pt-16 pb-4 px-6">
            <p className="text-lg font-bold text-white mb-1">{slide.title}</p>
            <p className="text-slate-200 text-sm">{slide.description}</p>
          </div>
        </div>
      </div>

      {/* Navigation arrows */}
      <button
        onClick={prev}
        className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 rounded-full shadow-lg flex items-center justify-center hover:bg-white transition-colors"
        aria-label="Slide précédente"
      >
        <ChevronLeft className="w-5 h-5 text-slate-700" />
      </button>
      <button
        onClick={next}
        className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 rounded-full shadow-lg flex items-center justify-center hover:bg-white transition-colors"
        aria-label="Slide suivante"
      >
        <ChevronRight className="w-5 h-5 text-slate-700" />
      </button>

      {/* Dots */}
      <div className="flex items-center justify-center gap-2 mt-4">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`w-2 h-2 rounded-full transition-colors ${
              i === current ? 'bg-emerald-500' : 'bg-gray-300'
            }`}
            aria-label={`Aller à la slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  )
}
