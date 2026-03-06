import {
  AbsoluteFill,
  Img,
  interpolate,
  useCurrentFrame,
  Sequence,
  Easing,
  staticFile,
} from 'remotion'

// ── Palette ──────────────────────────────────────────────────────────────────
const NAVY = '#0F172A'
const GREEN = '#22D3A5'
const WHITE = '#FFFFFF'
const GRAY = '#94A3B8'
const SLATE = '#1E293B'

// ── Animation helpers ────────────────────────────────────────────────────────

function ease(frame: number, from: number, to: number, startVal: number, endVal: number): number {
  return interpolate(frame, [from, to], [startVal, endVal], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  })
}

function fadeIn(frame: number, start: number, dur = 10): number {
  return ease(frame, start, start + dur, 0, 1)
}

function slideY(frame: number, start: number, fromY: number, dur = 14): number {
  return ease(frame, start, start + dur, fromY, 0)
}

// ── Logo Worthifast — fixe en haut à droite ─────────────────────────────────

function Logo({ frame }: { frame: number }) {
  return (
    <div style={{
      position: 'absolute', top: 44, right: 44, zIndex: 100,
      display: 'flex', alignItems: 'center', gap: 10,
      opacity: fadeIn(frame, 0, 6),
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: 12,
        background: GREEN,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'Inter, system-ui', fontWeight: 900, fontSize: 24, color: NAVY,
        boxShadow: `0 4px 20px ${GREEN}55`,
      }}>W</div>
      <span style={{
        fontFamily: 'Inter, system-ui', fontWeight: 800, fontSize: 24,
        color: WHITE, letterSpacing: '-0.3px',
      }}>Worthifast</span>
    </div>
  )
}

// ── Trust strip — RGPD / France / Conforme 2026 ────────────────────────────
// Barre de confiance persistante en bas. Essentielle pour les comptables
// qui manipulent des données sensibles.

function TrustStrip({ frame, start = 20 }: { frame: number; start?: number }) {
  const items = [
    { icon: '\u{1F1EB}\u{1F1F7}', text: 'Hébergé en France' },
    { icon: '\u{1F512}', text: 'RGPD conforme' },
    { icon: '\u2705', text: 'Conforme 2026' },
  ]

  return (
    <div style={{
      position: 'absolute', bottom: 44, left: 0, right: 0,
      display: 'flex', justifyContent: 'center', gap: 28, zIndex: 50,
      opacity: fadeIn(frame, start, 10),
    }}>
      {items.map((item, i) => (
        <div key={i} style={{
          display: 'flex', alignItems: 'center', gap: 8,
          opacity: fadeIn(frame, start + i * 4, 8),
          fontFamily: 'Inter, system-ui', fontWeight: 600, fontSize: 22,
          color: GRAY,
        }}>
          <span style={{ fontSize: 20 }}>{item.icon}</span>
          {item.text}
        </div>
      ))}
    </div>
  )
}

// ── Laptop browser mockup ───────────────────────────────────────────────────

function LaptopMockup({
  src,
  frame,
  startFrame = 0,
  tiltDeg = 2,
  floatAmplitude = 6,
  width = 940,
}: {
  src: string
  frame: number
  startFrame?: number
  tiltDeg?: number
  floatAmplitude?: number
  width?: number
}) {
  const localF = frame - startFrame
  const opacity = fadeIn(frame, startFrame, 12)
  const scale = ease(frame, startFrame, startFrame + 16, 0.9, 1)
  const floatY = Math.sin(localF * 0.055) * floatAmplitude

  const chromeH = 42
  const contentH = Math.round(width * 9 / 16)
  const radius = 16

  return (
    <div style={{
      opacity,
      transform: `scale(${scale}) translateY(${floatY}px) perspective(1200px) rotateX(${tiltDeg}deg)`,
      width,
      filter: 'drop-shadow(0 24px 48px rgba(0,0,0,0.55))',
    }}>
      {/* Browser chrome */}
      <div style={{
        background: SLATE,
        borderRadius: `${radius}px ${radius}px 0 0`,
        height: chromeH,
        display: 'flex',
        alignItems: 'center',
        padding: '0 14px',
        gap: 7,
      }}>
        <div style={{ width: 11, height: 11, borderRadius: '50%', background: '#EF4444' }} />
        <div style={{ width: 11, height: 11, borderRadius: '50%', background: '#F59E0B' }} />
        <div style={{ width: 11, height: 11, borderRadius: '50%', background: '#22C55E' }} />
        <div style={{
          flex: 1, marginLeft: 10,
          background: NAVY,
          borderRadius: 7, height: 26,
          display: 'flex', alignItems: 'center',
          padding: '0 12px',
        }}>
          <span style={{
            fontFamily: 'Inter, system-ui', fontSize: 12, color: '#64748B',
          }}>worthifast.com</span>
        </div>
      </div>

      {/* Screenshot */}
      <div style={{
        width,
        height: contentH,
        overflow: 'hidden',
        borderRadius: `0 0 ${radius}px ${radius}px`,
        background: NAVY,
      }}>
        <Img
          src={src}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'top left',
          }}
        />
      </div>
    </div>
  )
}

// ── Text components ─────────────────────────────────────────────────────────

function Title({
  text, frame, start, size = 68, color = WHITE, glow,
}: {
  text: string; frame: number; start: number;
  size?: number; color?: string; glow?: string;
}) {
  return (
    <div style={{
      opacity: fadeIn(frame, start, 10),
      transform: `translateY(${slideY(frame, start, 44, 14)}px)`,
      fontFamily: 'Inter, system-ui', fontWeight: 800, fontSize: size,
      color, textAlign: 'center', lineHeight: 1.15,
      maxWidth: 960, padding: '0 56px', letterSpacing: '-0.5px',
      textShadow: glow
        ? `0 0 40px ${glow}, 0 2px 16px rgba(0,0,0,0.4)`
        : '0 2px 16px rgba(0,0,0,0.4)',
    }}>
      {text}
    </div>
  )
}

function Caption({
  text, frame, start, size = 36, color = GRAY,
}: {
  text: string; frame: number; start: number;
  size?: number; color?: string;
}) {
  return (
    <div style={{
      opacity: fadeIn(frame, start, 10),
      transform: `translateY(${slideY(frame, start, 28, 12)}px)`,
      fontFamily: 'Inter, system-ui', fontWeight: 500, fontSize: size,
      color, textAlign: 'center', lineHeight: 1.35,
      maxWidth: 880, padding: '0 56px',
    }}>
      {text}
    </div>
  )
}

function Badge({
  text, frame, start, bg = `${GREEN}18`, border = GREEN, color = GREEN,
}: {
  text: string; frame: number; start: number;
  bg?: string; border?: string; color?: string;
}) {
  return (
    <div style={{
      opacity: fadeIn(frame, start, 8),
      transform: `translateY(${slideY(frame, start, 20, 10)}px)`,
      background: bg, border: `2px solid ${border}`,
      borderRadius: 50, padding: '10px 26px',
      fontFamily: 'Inter, system-ui', fontWeight: 700, fontSize: 26, color,
    }}>
      {text}
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
// SCENE 1 — HOOK (0–75f = 2.5s)
// Pain point comptable + stat sourcée + premiers trust signals.
// ═════════════════════════════════════════════════════════════════════════════

function S1_Hook() {
  const frame = useCurrentFrame()

  return (
    <AbsoluteFill style={{
      background: `radial-gradient(ellipse at 50% 40%, #162033 0%, ${NAVY} 100%)`,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 36,
    }}>
      {/* Cercles décoratifs */}
      {[480, 680, 880].map((d, i) => (
        <div key={i} style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%,-50%)',
          width: d, height: d, borderRadius: '50%',
          border: `1px solid rgba(34,211,165,${0.06 - i * 0.015})`,
          opacity: fadeIn(frame, 4 + i * 4, 16),
        }} />
      ))}

      <Title
        text="Comptable, vous saisissez encore vos factures à la main ?"
        frame={frame} start={3} size={62}
      />
      <Title
        text="C'est fini."
        frame={frame} start={18} size={82} color={GREEN} glow={`${GREEN}44`}
      />

      <TrustStrip frame={frame} start={30} />
      <Logo frame={frame} />
    </AbsoluteFill>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
// SCENE 2 — DASHBOARD + RÉSULTAT (75–165f = 3s)
// Montrer la vue financière ET l'outcome concret.
// ═════════════════════════════════════════════════════════════════════════════

function S2_Dashboard() {
  const frame = useCurrentFrame()

  return (
    <AbsoluteFill style={{ background: NAVY }}>
      <div style={{
        position: 'absolute', top: 100, left: 0, right: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, zIndex: 10,
      }}>
        <Title text="Votre cabinet en un coup d'oeil" frame={frame} start={4} size={58} />
        <Caption text="Solde, marge, TVA, rapprochement — tout est automatisé" frame={frame} start={12} color={GREEN} />
      </div>

      <div style={{
        position: 'absolute', top: 340, left: '50%', transform: 'translateX(-50%)',
      }}>
        <LaptopMockup
          src={staticFile('screenshots/dashboard2.png')}
          frame={frame}
          startFrame={6}
          tiltDeg={3}
        />
      </div>

      {/* Résultat concret — ce que le comptable gagne */}
      <div style={{
        position: 'absolute', bottom: 100, left: 0, right: 0,
        display: 'flex', justifyContent: 'center', gap: 14, zIndex: 10,
      }}>
        <Badge text="3h gagnées / semaine" frame={frame} start={32} />
        <Badge text="Zéro erreur de saisie" frame={frame} start={38} />
      </div>

      <Logo frame={frame} />
    </AbsoluteFill>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
// SCENE 3 — OCR FACTURES (165–255f = 3s)
// Feature clé : import OCR + mockup repositionné (moins d'espace vide).
// ═════════════════════════════════════════════════════════════════════════════

function S3_OCR() {
  const frame = useCurrentFrame()

  return (
    <AbsoluteFill style={{ background: NAVY }}>
      <div style={{
        position: 'absolute', top: 100, left: 0, right: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, zIndex: 10,
      }}>
        <Title text={"Déposez un PDF, l'IA fait le reste"} frame={frame} start={4} size={60} />
        <Caption text="Montant, TVA, fournisseur extraits en secondes" frame={frame} start={12} />
      </div>

      {/* Mockup remonté pour combler l'espace */}
      <div style={{
        position: 'absolute', top: 320, left: '50%', transform: 'translateX(-50%)',
      }}>
        <LaptopMockup
          src={staticFile('screenshots/factureocr.png')}
          frame={frame}
          startFrame={6}
          tiltDeg={2}
          floatAmplitude={5}
        />
      </div>

      <div style={{
        position: 'absolute', bottom: 100, left: 0, right: 0,
        display: 'flex', justifyContent: 'center', gap: 14, zIndex: 10,
      }}>
        <Badge text="12 factures en 1 clic" frame={frame} start={28} />
        <Badge text="OCR 95% de confiance" frame={frame} start={34} />
      </div>

      <Logo frame={frame} />
    </AbsoluteFill>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
// SCENE 4 — CONFORMITÉ E-INVOICING 2026 (255–345f = 3s)
// C'est THE selling point pour les comptables en 2026 : la conformité
// Factur-X est obligatoire. Worthifast est déjà prêt.
// ═════════════════════════════════════════════════════════════════════════════

function S4_Conformite() {
  const frame = useCurrentFrame()

  return (
    <AbsoluteFill style={{ background: NAVY }}>
      <div style={{
        position: 'absolute', top: 100, left: 0, right: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, zIndex: 10,
      }}>
        <Title text="Conforme e-invoicing 2026" frame={frame} start={4} size={60} />
        <Caption text="Factur-X / EN16931 — prêt avant vos confrères" frame={frame} start={12} color={GREEN} />
      </div>

      <div style={{
        position: 'absolute', top: 340, left: '50%', transform: 'translateX(-50%)',
      }}>
        <LaptopMockup
          src={staticFile('screenshots/transactionn.png')}
          frame={frame}
          startFrame={6}
          tiltDeg={2}
          floatAmplitude={5}
        />
      </div>

      <div style={{
        position: 'absolute', bottom: 100, left: 0, right: 0,
        display: 'flex', justifyContent: 'center', gap: 14, zIndex: 10,
      }}>
        <Badge text="Rapprochement 100%" frame={frame} start={28} />
        <Badge text="Export FEC natif" frame={frame} start={34} />
      </div>

      <Logo frame={frame} />
    </AbsoluteFill>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
// SCENE 5 — PRICING GRATUIT (345–405f = 2s)
// Le plan Starter est GRATUIT. C'est ça qui convertit, pas "12€".
// ═════════════════════════════════════════════════════════════════════════════

function S5_Pricing() {
  const frame = useCurrentFrame()
  const pulse = interpolate(Math.sin(frame * 0.2), [-1, 1], [0.97, 1.04])

  return (
    <AbsoluteFill style={{ background: NAVY }}>
      <div style={{
        position: 'absolute', top: 130, left: 0, right: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, zIndex: 10,
      }}>
        <div style={{ transform: `scale(${pulse})` }}>
          <Title text="Gratuit. Pour toujours." frame={frame} start={3} size={78} color={GREEN} glow={`${GREEN}55`} />
        </div>
        <Caption text={'Plan Starter 0\u20AC \u2014 sans carte bancaire'} frame={frame} start={10} size={38} />
        <Caption text={'Passez au Pro quand vous \u00EAtes pr\u00EAt'} frame={frame} start={18} size={32} />
      </div>

      <div style={{
        position: 'absolute', top: 440, left: '50%', transform: 'translateX(-50%)',
      }}>
        <LaptopMockup
          src={staticFile('screenshots/screen5.png')}
          frame={frame}
          startFrame={5}
          tiltDeg={2}
          floatAmplitude={4}
          width={900}
        />
      </div>

      <Logo frame={frame} />
    </AbsoluteFill>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
// SCENE 6 — CTA (405–450f = 1.5s)
// CTA net + trust badges. Plus de URL ".vercel.app".
// ═════════════════════════════════════════════════════════════════════════════

function S6_CTA() {
  const frame = useCurrentFrame()

  const btnPulse = interpolate(Math.sin(frame * 0.4), [-1, 1], [0.95, 1.06])
  const glowInt = interpolate(Math.sin(frame * 0.4), [-1, 1], [0.12, 0.55])

  return (
    <AbsoluteFill style={{
      background: `radial-gradient(ellipse at 50% 50%, ${GREEN}14 0%, ${NAVY} 70%)`,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 44,
    }}>
      {/* Glow orb */}
      <div style={{
        position: 'absolute', top: '45%', left: '50%',
        transform: 'translate(-50%,-50%)',
        width: 500, height: 500, borderRadius: '50%',
        background: GREEN, opacity: glowInt * 0.1, filter: 'blur(100px)',
      }} />

      <Title text="Créez votre compte gratuit" frame={frame} start={0} size={72} glow={`${GREEN}44`} />

      {/* Bouton CTA */}
      <div style={{
        opacity: fadeIn(frame, 2, 5),
        transform: `scale(${btnPulse})`,
        position: 'relative', zIndex: 10,
      }}>
        <div style={{
          position: 'absolute', inset: -20, borderRadius: 26,
          background: GREEN, opacity: glowInt * 0.45, filter: 'blur(28px)',
        }} />
        <div style={{
          position: 'relative',
          background: `linear-gradient(135deg, ${GREEN} 0%, #10B981 100%)`,
          color: NAVY, borderRadius: 22, padding: '24px 48px',
          fontFamily: 'Inter, system-ui', fontWeight: 900, fontSize: 40,
          letterSpacing: '-0.3px',
          boxShadow: `0 10px 40px ${GREEN}55`,
        }}>
          ESSAI GRATUIT — 30 JOURS
        </div>
      </div>

      {/* Trust strip finale */}
      <TrustStrip frame={frame} start={4} />

      <Logo frame={frame} />
    </AbsoluteFill>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
// Composition — 450 frames @ 30fps = 15s
//
// S1 Hook          0–75   (2.5s)  Pain point + "C'est fini" + trust
// S2 Dashboard    75–165  (3.0s)  Vue financière + outcomes concrets
// S3 OCR         165–255  (3.0s)  Import IA + badges
// S4 Conformité  255–345  (3.0s)  E-invoicing 2026 + rapprochement
// S5 Pricing     345–405  (2.0s)  GRATUIT (pas 12€) + pricing page
// S6 CTA         405–450  (1.5s)  Bouton + trust strip
// ═════════════════════════════════════════════════════════════════════════════

export function WorthifastAd15sPRO() {
  const frame = useCurrentFrame()

  // Flash blanc entre les scènes
  const cuts = [73, 163, 253, 343, 403]
  const flash = cuts.reduce((mx, c) => {
    const v = interpolate(frame, [c, c + 2, c + 4], [0, 0.4, 0], {
      extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    })
    return Math.max(mx, v)
  }, 0)

  return (
    <AbsoluteFill style={{ fontFamily: 'Inter, system-ui, sans-serif', background: NAVY }}>
      <Sequence from={0} durationInFrames={75}><S1_Hook /></Sequence>
      <Sequence from={75} durationInFrames={90}><S2_Dashboard /></Sequence>
      <Sequence from={165} durationInFrames={90}><S3_OCR /></Sequence>
      <Sequence from={255} durationInFrames={90}><S4_Conformite /></Sequence>
      <Sequence from={345} durationInFrames={60}><S5_Pricing /></Sequence>
      <Sequence from={405} durationInFrames={45}><S6_CTA /></Sequence>

      {flash > 0 && (
        <AbsoluteFill style={{ background: WHITE, opacity: flash, zIndex: 200 }} />
      )}
    </AbsoluteFill>
  )
}
