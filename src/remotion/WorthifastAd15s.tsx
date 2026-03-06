import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  Sequence,
  Easing,
  staticFile,
} from 'remotion'

// ── Palette ──────────────────────────────────────────────────────────────────
const GREEN = '#22D3A5'
const NAVY = '#0F172A'
const WHITE = '#FFFFFF'
const ORANGE = '#F97316'

// ── Screenshots mapping (analysés visuellement) ─────────────────────────────
// screen1 = Dashboard KPIs top (dossiers, alertes, highlights)
// screen2 = Dashboard financier (127k€, BFR 309k€, sparklines)
// screen3 = Dashboard bottom (balance âgée, transactions, import)
// screen4 = Page Factures (drag & drop OCR, sidebar complète)
// screen5 = Page Pricing (Gratuit, 12€, 22€, 74€)

// ── Helpers ──────────────────────────────────────────────────────────────────
function fadeIn(frame: number, start: number, duration = 10) {
  return interpolate(frame, [start, start + duration], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  })
}

function fadeOut(frame: number, start: number, duration = 8) {
  return interpolate(frame, [start, start + duration], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
}

function slideFromRight(frame: number, start: number, duration = 14) {
  return interpolate(frame, [start, start + duration], [1080, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.back(1.2)),
  })
}

function scaleIn(frame: number, fps: number, delay = 0) {
  return spring({
    frame: Math.max(0, frame - delay),
    fps,
    config: { damping: 14, stiffness: 200 },
  })
}

// ── Logo coin haut droit ────────────────────────────────────────────────────
function LogoCorner({ frame }: { frame: number }) {
  return (
    <div
      style={{
        position: 'absolute',
        top: 40,
        right: 40,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        opacity: fadeIn(frame, 0, 8),
        zIndex: 50,
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 14,
          background: GREEN,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'Inter, system-ui, sans-serif',
          fontWeight: 900,
          fontSize: 26,
          color: NAVY,
          boxShadow: `0 4px 20px ${GREEN}66`,
        }}
      >
        W
      </div>
      <span
        style={{
          fontFamily: 'Inter, system-ui, sans-serif',
          fontWeight: 800,
          fontSize: 30,
          color: WHITE,
          letterSpacing: '-0.5px',
          textShadow: '0 2px 12px rgba(0,0,0,0.5)',
        }}
      >
        Worthifast
      </span>
    </div>
  )
}

// ── Texte animé (grossit + pulse) ───────────────────────────────────────────
function AnimatedText({
  text,
  frame,
  startFrame,
  fontSize = 52,
  color = WHITE,
  maxWidth = 900,
}: {
  text: string
  frame: number
  startFrame: number
  fontSize?: number
  color?: string
  maxWidth?: number
}) {
  const localF = frame - startFrame
  const opacity = fadeIn(frame, startFrame, 8)
  const scale = interpolate(localF, [0, 10, 60], [0.8, 1.05, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  })

  return (
    <div
      style={{
        opacity,
        transform: `scale(${scale})`,
        fontFamily: 'Inter, system-ui, sans-serif',
        fontWeight: 900,
        fontSize,
        color,
        textAlign: 'center',
        lineHeight: 1.2,
        maxWidth,
        textShadow: '0 4px 20px rgba(0,0,0,0.7), 0 1px 3px rgba(0,0,0,0.9)',
        letterSpacing: '-0.5px',
      }}
    >
      {text}
    </div>
  )
}

// ── Screenshot avec swipe ───────────────────────────────────────────────────
function ScreenshotSlide({
  src,
  frame,
  borderRadius = 24,
}: {
  src: string
  frame: number
  borderRadius?: number
}) {
  const x = slideFromRight(frame, 0, 16)
  const opacity = fadeIn(frame, 0, 12)

  return (
    <div
      style={{
        opacity,
        transform: `translateX(${x}px)`,
        borderRadius,
        overflow: 'hidden',
        boxShadow: '0 24px 80px rgba(0,0,0,0.4), 0 0 0 2px rgba(255,255,255,0.1)',
        width: '100%',
        height: '100%',
      }}
    >
      <Img
        src={src}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
        }}
      />
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// SCENE 1 — Hook (0-2s = frames 0-60)
// "14h/semaine à saisir des factures ?"
// ═══════════════════════════════════════════════════════════════════════════════
function SceneHook() {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const pulseScale = interpolate(Math.sin(frame * 0.15), [-1, 1], [0.98, 1.03])

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse at 50% 40%, #1a2744 0%, ${NAVY} 70%)`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 40,
      }}
    >
      <LogoCorner frame={frame} />

      {/* Emoji triste */}
      <div
        style={{
          fontSize: 120,
          opacity: fadeIn(frame, 3, 10),
          transform: `scale(${scaleIn(frame, fps, 3)})`,
        }}
      >
        {'\uD83D\uDE29'}
      </div>

      {/* Texte principal */}
      <AnimatedText
        text="14h/semaine à saisir des factures ?"
        frame={frame}
        startFrame={6}
        fontSize={56}
      />

      {/* Sous-texte */}
      <div
        style={{
          opacity: fadeIn(frame, 20, 10),
          transform: `scale(${pulseScale})`,
          fontFamily: 'Inter, system-ui, sans-serif',
          fontWeight: 700,
          fontSize: 34,
          color: '#94A3B8',
          textAlign: 'center',
          textShadow: '0 2px 8px rgba(0,0,0,0.5)',
        }}
      >
        C'est fini.
      </div>
    </AbsoluteFill>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// SCENE 2 — TVA auto (2-5s = frames 60-150)
// screen2: Dashboard financier 127k€ + BFR
// ═══════════════════════════════════════════════════════════════════════════════
function SceneTVA() {
  const frame = useCurrentFrame()

  return (
    <AbsoluteFill
      style={{
        background: NAVY,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <LogoCorner frame={frame} />

      {/* Screenshot */}
      <div
        style={{
          position: 'absolute',
          top: 120,
          left: 40,
          right: 40,
          height: 1200,
        }}
      >
        <ScreenshotSlide
          src={staticFile('screenshots/screen2.png')}
          frame={frame}
        />
      </div>

      {/* Overlay gradient bottom */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 700,
          background: `linear-gradient(transparent, ${NAVY} 60%)`,
        }}
      />

      {/* Texte */}
      <div
        style={{
          position: 'absolute',
          bottom: 200,
          left: 0,
          right: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 20,
        }}
      >
        <AnimatedText
          text="Worthifast d\u00e9tecte votre TVA automatiquement !"
          frame={frame}
          startFrame={10}
          fontSize={48}
        />
        <div
          style={{
            opacity: fadeIn(frame, 20, 10),
            fontFamily: 'Inter, system-ui, sans-serif',
            fontWeight: 800,
            fontSize: 72,
            textShadow: '0 4px 20px rgba(0,0,0,0.7)',
          }}
        >
          {'\uD83D\uDCB0'}
        </div>
      </div>
    </AbsoluteFill>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// SCENE 3 — OCR (5-8s = frames 150-240)
// screen4: Page Factures drag & drop
// ═══════════════════════════════════════════════════════════════════════════════
function SceneOCR() {
  const frame = useCurrentFrame()

  return (
    <AbsoluteFill
      style={{
        background: NAVY,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <LogoCorner frame={frame} />

      {/* Screenshot */}
      <div
        style={{
          position: 'absolute',
          top: 120,
          left: 40,
          right: 40,
          height: 1200,
        }}
      >
        <ScreenshotSlide
          src={staticFile('screenshots/screen4.png')}
          frame={frame}
        />
      </div>

      {/* Overlay gradient */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 700,
          background: `linear-gradient(transparent, ${NAVY} 60%)`,
        }}
      />

      {/* Texte */}
      <div
        style={{
          position: 'absolute',
          bottom: 200,
          left: 0,
          right: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 20,
        }}
      >
        <AnimatedText
          text="Drag PDF \u2192 OCR 98% instantan\u00e9 !"
          frame={frame}
          startFrame={8}
          fontSize={52}
        />
        <div
          style={{
            opacity: fadeIn(frame, 18, 10),
            fontSize: 72,
            textShadow: '0 4px 20px rgba(0,0,0,0.7)',
          }}
        >
          {'\u2728'}
        </div>
      </div>
    </AbsoluteFill>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// SCENE 4 — Pricing (8-11s = frames 240-330)
// screen5: Pricing page
// ═══════════════════════════════════════════════════════════════════════════════
function ScenePricing() {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const pulse = interpolate(Math.sin(frame * 0.2), [-1, 1], [0.97, 1.04])

  return (
    <AbsoluteFill
      style={{
        background: NAVY,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <LogoCorner frame={frame} />

      {/* Screenshot */}
      <div
        style={{
          position: 'absolute',
          top: 120,
          left: 40,
          right: 40,
          height: 1100,
        }}
      >
        <ScreenshotSlide
          src={staticFile('screenshots/screen5.png')}
          frame={frame}
        />
      </div>

      {/* Overlay gradient */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 800,
          background: `linear-gradient(transparent, ${NAVY} 55%)`,
        }}
      />

      {/* Texte prix */}
      <div
        style={{
          position: 'absolute',
          bottom: 280,
          left: 0,
          right: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 24,
        }}
      >
        <AnimatedText
          text={`D\u00e8s 12\u20AC/mois \u2022 30 jours GRATUIT !`}
          frame={frame}
          startFrame={8}
          fontSize={50}
        />
        <div
          style={{
            opacity: fadeIn(frame, 18, 10),
            fontSize: 64,
          }}
        >
          {'\uD83D\uDD25'}
        </div>
      </div>

      {/* Badge "Sans carte bancaire" */}
      <div
        style={{
          position: 'absolute',
          bottom: 160,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          opacity: fadeIn(frame, 28, 10),
        }}
      >
        <div
          style={{
            transform: `scale(${pulse})`,
            background: `${GREEN}25`,
            border: `2px solid ${GREEN}`,
            borderRadius: 50,
            padding: '14px 36px',
            fontFamily: 'Inter, system-ui, sans-serif',
            fontWeight: 700,
            fontSize: 28,
            color: GREEN,
            textShadow: '0 2px 8px rgba(0,0,0,0.3)',
          }}
        >
          Sans carte bancaire
        </div>
      </div>
    </AbsoluteFill>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// SCENE 5 — Dashboard ready (11-14s = frames 330-420)
// screen1: Dashboard KPIs top
// ═══════════════════════════════════════════════════════════════════════════════
function SceneDashboard() {
  const frame = useCurrentFrame()

  return (
    <AbsoluteFill
      style={{
        background: NAVY,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <LogoCorner frame={frame} />

      {/* Screenshot */}
      <div
        style={{
          position: 'absolute',
          top: 120,
          left: 40,
          right: 40,
          height: 1200,
        }}
      >
        <ScreenshotSlide
          src={staticFile('screenshots/screen1.png')}
          frame={frame}
        />
      </div>

      {/* Overlay gradient */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 700,
          background: `linear-gradient(transparent, ${NAVY} 60%)`,
        }}
      />

      {/* Texte */}
      <div
        style={{
          position: 'absolute',
          bottom: 200,
          left: 0,
          right: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 20,
        }}
      >
        <AnimatedText
          text={`Tableau de bord pr\u00eat en 45s !`}
          frame={frame}
          startFrame={8}
          fontSize={52}
        />
        <div
          style={{
            opacity: fadeIn(frame, 18, 10),
            fontSize: 72,
          }}
        >
          {'\uD83D\uDCCA'}
        </div>
      </div>
    </AbsoluteFill>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// SCENE 6 — CTA (14-15s = frames 420-450)
// "Test GRATUIT maintenant → worthifast.vercel.app"
// ═══════════════════════════════════════════════════════════════════════════════
function SceneCTA() {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const btnPulse = interpolate(Math.sin(frame * 0.25), [-1, 1], [0.96, 1.06])
  const glowOpacity = interpolate(Math.sin(frame * 0.25), [-1, 1], [0.2, 0.7])

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse at 50% 30%, #1a3a2e 0%, ${NAVY} 70%)`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 50,
      }}
    >
      <LogoCorner frame={frame} />

      {/* Titre */}
      <AnimatedText
        text="Test GRATUIT maintenant"
        frame={frame}
        startFrame={0}
        fontSize={58}
      />

      {/* Target emoji */}
      <div
        style={{
          fontSize: 80,
          opacity: fadeIn(frame, 4, 8),
          transform: `scale(${scaleIn(frame, fps, 4)})`,
        }}
      >
        {'\uD83C\uDFAF'}
      </div>

      {/* CTA Button */}
      <div
        style={{
          transform: `scale(${btnPulse})`,
          opacity: fadeIn(frame, 6, 8),
          position: 'relative',
        }}
      >
        {/* Glow */}
        <div
          style={{
            position: 'absolute',
            inset: -20,
            borderRadius: 30,
            background: GREEN,
            opacity: glowOpacity * 0.4,
            filter: 'blur(24px)',
          }}
        />
        <div
          style={{
            position: 'relative',
            background: `linear-gradient(135deg, ${GREEN} 0%, #10B981 100%)`,
            color: NAVY,
            borderRadius: 24,
            padding: '28px 56px',
            fontFamily: 'Inter, system-ui, sans-serif',
            fontWeight: 900,
            fontSize: 42,
            letterSpacing: '-0.5px',
            boxShadow: `0 8px 40px ${GREEN}55`,
          }}
        >
          Essayer gratuitement {'\u2192'}
        </div>
      </div>

      {/* URL */}
      <div
        style={{
          opacity: fadeIn(frame, 10, 8),
          fontFamily: 'Inter, system-ui, sans-serif',
          fontWeight: 700,
          fontSize: 32,
          color: WHITE,
          letterSpacing: '1px',
          textShadow: '0 2px 12px rgba(0,0,0,0.5)',
        }}
      >
        worthifast.vercel.app
      </div>
    </AbsoluteFill>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// Composition principale — 15s TikTok Ad
// ═══════════════════════════════════════════════════════════════════════════════
export function WorthifastAd15s() {
  const frame = useCurrentFrame()

  // Flash blanc entre les scènes
  const sceneBreaks = [58, 148, 238, 328, 418]
  const flashOpacity = sceneBreaks.reduce((max, br) => {
    const v = interpolate(frame, [br, br + 2, br + 4], [0, 0.7, 0], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    })
    return Math.max(max, v)
  }, 0)

  return (
    <AbsoluteFill style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Scene 1 — Hook (0-60 frames = 0-2s) */}
      <Sequence from={0} durationInFrames={60}>
        <SceneHook />
      </Sequence>

      {/* Scene 2 — TVA (60-150 frames = 2-5s) */}
      <Sequence from={60} durationInFrames={90}>
        <SceneTVA />
      </Sequence>

      {/* Scene 3 — OCR (150-240 frames = 5-8s) */}
      <Sequence from={150} durationInFrames={90}>
        <SceneOCR />
      </Sequence>

      {/* Scene 4 — Pricing (240-330 frames = 8-11s) */}
      <Sequence from={240} durationInFrames={90}>
        <ScenePricing />
      </Sequence>

      {/* Scene 5 — Dashboard (330-420 frames = 11-14s) */}
      <Sequence from={330} durationInFrames={90}>
        <SceneDashboard />
      </Sequence>

      {/* Scene 6 — CTA (420-450 frames = 14-15s) */}
      <Sequence from={420} durationInFrames={30}>
        <SceneCTA />
      </Sequence>

      {/* Flash transitions */}
      {flashOpacity > 0 && (
        <AbsoluteFill style={{ background: WHITE, opacity: flashOpacity }} />
      )}
    </AbsoluteFill>
  )
}
