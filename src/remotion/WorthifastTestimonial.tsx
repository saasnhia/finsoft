import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  Sequence,
  Easing,
} from 'remotion'

// ── Palette ──────────────────────────────────────────────────────────────────
const GREEN = '#22D3A5'
const NAVY  = '#0F172A'
const WHITE = '#FFFFFF'
const ORANGE = '#F97316'

// ── Helpers ──────────────────────────────────────────────────────────────────
function fadeIn(frame: number, start: number, duration = 12) {
  return interpolate(frame, [start, start + duration], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  })
}

function slideUp(frame: number, start: number, duration = 15) {
  return interpolate(frame, [start, start + duration], [40, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.back(1.5)),
  })
}

// ── Background ────────────────────────────────────────────────────────────────
function Background() {
  return (
    <AbsoluteFill style={{ background: 'linear-gradient(170deg, #F1F5F9 0%, #E2E8F0 60%, #CBD5E1 100%)' }}>
      {/* Desk surface suggestion */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '38%',
        background: 'linear-gradient(180deg, transparent 0%, rgba(148,163,184,0.25) 100%)',
      }} />
      {/* Plant silhouette top-right */}
      <svg style={{ position: 'absolute', top: 60, right: 60, opacity: 0.18 }} width="160" height="220" viewBox="0 0 160 220">
        <ellipse cx="80" cy="210" rx="30" ry="12" fill="#64748B" />
        <rect x="74" y="140" width="12" height="72" rx="6" fill="#64748B" />
        <ellipse cx="80" cy="110" rx="60" ry="80" fill="#34D399" />
        <ellipse cx="40" cy="140" rx="35" ry="55" fill="#10B981" />
        <ellipse cx="120" cy="140" rx="35" ry="55" fill="#10B981" />
      </svg>
      {/* Window light beam */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 80,
        width: 200,
        height: '50%',
        background: 'linear-gradient(170deg, rgba(255,255,255,0.4) 0%, transparent 100%)',
        transform: 'skewX(-8deg)',
      }} />
    </AbsoluteFill>
  )
}

// ── Founder Avatar (SVG stylisé business casual) ───────────────────────────
function Founder({ mouthOpen = 0.5, eyesBig = false }: { mouthOpen?: number; eyesBig?: boolean }) {
  const eyeH = eyesBig ? 22 : 16
  return (
    <svg width="420" height="540" viewBox="0 0 420 540" style={{ filter: 'drop-shadow(0 16px 48px rgba(0,0,0,0.18))' }}>
      {/* Body / Shirt */}
      <path d="M70 380 Q100 310 210 300 Q320 310 350 380 L370 540 L50 540 Z" fill="#3B82F6" />
      {/* Collar */}
      <path d="M170 300 L210 360 L250 300" fill="none" stroke="white" strokeWidth="6" strokeLinejoin="round" />
      {/* Neck */}
      <rect x="188" y="275" width="44" height="40" rx="10" fill="#FBBF9A" />
      {/* Head */}
      <ellipse cx="210" cy="220" rx="105" ry="120" fill="#FBBF9A" />
      {/* Hair */}
      <path d="M105 200 Q110 100 210 95 Q310 100 315 200 Q300 140 210 135 Q120 140 105 200 Z" fill="#1E293B" />
      {/* Ears */}
      <ellipse cx="106" cy="228" rx="16" ry="20" fill="#F8A980" />
      <ellipse cx="314" cy="228" rx="16" ry="20" fill="#F8A980" />
      {/* Eyes */}
      <ellipse cx="176" cy="220" rx="18" ry={eyeH} fill={WHITE} />
      <ellipse cx="244" cy="220" rx="18" ry={eyeH} fill={WHITE} />
      <circle cx="178" cy="222" r="10" fill="#1E293B" />
      <circle cx="246" cy="222" r="10" fill="#1E293B" />
      <circle cx="181" cy="219" r="4" fill={WHITE} />
      <circle cx="249" cy="219" r="4" fill={WHITE} />
      {/* Eyebrows */}
      <path d="M160 200 Q178 193 196 200" stroke="#1E293B" strokeWidth="5" fill="none" strokeLinecap="round" />
      <path d="M228 200 Q246 193 264 200" stroke="#1E293B" strokeWidth="5" fill="none" strokeLinecap="round" />
      {/* Nose */}
      <path d="M204 240 Q210 260 218 240" stroke="#C8836A" strokeWidth="3" fill="none" strokeLinecap="round" />
      {/* Mouth — mouthOpen interpolates 0→1 */}
      <path
        d={`M182 ${275 - mouthOpen * 4} Q210 ${278 + mouthOpen * 12} ${238} ${275 - mouthOpen * 4}`}
        stroke="#C8836A"
        strokeWidth="4"
        fill={mouthOpen > 0.3 ? '#fff' : 'none'}
        strokeLinecap="round"
      />
      {/* Stubble */}
      <ellipse cx="210" cy="285" rx="40" ry="10" fill="rgba(30,41,59,0.06)" />
    </svg>
  )
}

// ── Badge animé ────────────────────────────────────────────────────────────
function Badge({ text, color = GREEN, textColor = NAVY, frame, startFrame }: {
  text: string; color?: string; textColor?: string; frame: number; startFrame: number
}) {
  const opacity = fadeIn(frame, startFrame)
  const y = slideUp(frame, startFrame)
  return (
    <div style={{
      opacity,
      transform: `translateY(${y}px)`,
      background: color,
      color: textColor,
      borderRadius: 60,
      padding: '18px 40px',
      fontFamily: 'Inter, system-ui, sans-serif',
      fontWeight: 800,
      fontSize: 36,
      letterSpacing: '-0.5px',
      boxShadow: `0 8px 32px ${color}55`,
      display: 'inline-block',
      textAlign: 'center',
    }}>
      {text}
    </div>
  )
}

// ── Subtitle sous la bouche ────────────────────────────────────────────────
function Subtitle({ text, frame, startFrame }: { text: string; frame: number; startFrame: number }) {
  const opacity = fadeIn(frame, startFrame)
  const y = slideUp(frame, startFrame, 10)
  return (
    <div style={{
      opacity,
      transform: `translateY(${y}px)`,
      fontFamily: 'Inter, system-ui, sans-serif',
      fontWeight: 700,
      fontSize: 38,
      color: WHITE,
      textAlign: 'center',
      letterSpacing: '-0.3px',
      textShadow: '0 2px 8px rgba(0,0,0,0.55), 0 0 1px rgba(0,0,0,0.9)',
      lineHeight: 1.25,
      maxWidth: 900,
      padding: '0 40px',
    }}>
      {text}
    </div>
  )
}

// ── SCÈNE 1 — "Je passais 15h/semaine…" (0–120) ──────────────────────────
function Scene1() {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const mouthOpen = Math.abs(Math.sin(frame * 0.35)) * 0.8

  return (
    <AbsoluteFill style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 120 }}>
      {/* Founder */}
      <div style={{ position: 'absolute', bottom: 260, left: '50%', transform: 'translateX(-50%)' }}>
        <Founder mouthOpen={mouthOpen} />
      </div>

      {/* Subtitle lip-sync */}
      <div style={{ position: 'absolute', bottom: 180, width: '100%', display: 'flex', justifyContent: 'center' }}>
        {frame < 50 && (
          <Subtitle text='"Je passais 15h/semaine…"' frame={frame} startFrame={5} />
        )}
        {frame >= 50 && (
          <Subtitle text="sur mes déclarations TVA…" frame={frame} startFrame={50} />
        )}
      </div>

      {/* Badge info */}
      <div style={{ position: 'absolute', top: 160, width: '100%', display: 'flex', justifyContent: 'center' }}>
        <Badge text="15h/semaine → TVA manuelle 😩" color="#FEF3C7" textColor="#92400E" frame={frame} startFrame={18} />
      </div>

      {/* Logo top */}
      <LogoTop frame={frame} />
    </AbsoluteFill>
  )
}

// ── SCÈNE 2 — "Mind blown" (120–240) ──────────────────────────────────────
function Scene2() {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const localFrame = frame
  const eyesBig = localFrame > 20
  const mouthOpen = localFrame > 20 ? 0.9 : 0.4

  const scaleIn = spring({ frame: localFrame, fps, config: { damping: 14, stiffness: 180 } })

  return (
    <AbsoluteFill style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {/* Founder excited */}
      <div style={{
        position: 'absolute', bottom: 260,
        left: '50%', transform: `translateX(-50%) scale(${interpolate(localFrame, [0, 20], [0.95, 1.05], { extrapolateRight: 'clamp' })})`,
      }}>
        <Founder mouthOpen={mouthOpen} eyesBig={eyesBig} />
      </div>

      {/* Exclamation particles */}
      {eyesBig && [0, 1, 2].map(i => (
        <div key={i} style={{
          position: 'absolute',
          top: interpolate(localFrame, [20, 80], [600, 400 - i * 60], { extrapolateRight: 'clamp' }),
          left: 200 + i * 260,
          opacity: fadeIn(localFrame, 20 + i * 8, 10),
          fontSize: 64,
        }}>
          {['✨', '🎉', '✅'][i]}
        </div>
      ))}

      {/* Main badge */}
      <div style={{ position: 'absolute', top: 140, width: '100%', display: 'flex', justifyContent: 'center' }}>
        <Badge text="⚡ 12h/semaine économisées !" color={GREEN} textColor={NAVY} frame={localFrame} startFrame={8} />
      </div>

      {/* Subtitle */}
      <div style={{ position: 'absolute', bottom: 180, width: '100%', display: 'flex', justifyContent: 'center' }}>
        <Subtitle text="Worthifast m'a libéré 12h en 1 clic !" frame={localFrame} startFrame={14} />
      </div>

      <LogoTop frame={localFrame} />
    </AbsoluteFill>
  )
}

// ── SCÈNE 3 — Dashboard "proof" (240–360) ────────────────────────────────
function Scene3() {
  const frame = useCurrentFrame()

  return (
    <AbsoluteFill style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>

      {/* Dashboard mockup */}
      <div style={{
        position: 'absolute',
        top: '18%',
        left: '50%',
        transform: `translateX(-50%) scale(${interpolate(frame, [0, 18], [0.75, 1], {
          extrapolateRight: 'clamp',
          easing: Easing.out(Easing.back(1.8)),
        })})`,
        opacity: fadeIn(frame, 0, 14),
        width: 920,
        background: 'white',
        borderRadius: 32,
        boxShadow: '0 32px 100px rgba(0,0,0,0.22)',
        overflow: 'hidden',
      }}>
        <DashboardMockup frame={frame} />
      </div>

      {/* "Founder tourne l'écran" arrow */}
      <div style={{
        position: 'absolute',
        bottom: 380,
        left: 80,
        opacity: fadeIn(frame, 20, 14),
        fontSize: 64,
        transform: `rotate(${interpolate(frame, [20, 60], [-20, 0], { extrapolateRight: 'clamp' })}deg)`,
      }}>
        👆
      </div>

      {/* Subtitle */}
      <div style={{ position: 'absolute', bottom: 220, width: '100%', display: 'flex', justifyContent: 'center' }}>
        <Subtitle text="Dashboard intelligent • Alertes proactives" frame={frame} startFrame={22} />
      </div>

      {/* Feature badges */}
      <div style={{
        position: 'absolute',
        bottom: 130,
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        gap: 20,
        opacity: fadeIn(frame, 35, 12),
      }}>
        {['TVA automatique ✓', 'Zéro impayé ✓', '+23% CA ✓'].map((label, i) => (
          <div key={i} style={{
            background: `${GREEN}20`,
            border: `2px solid ${GREEN}`,
            color: NAVY,
            borderRadius: 40,
            padding: '10px 24px',
            fontFamily: 'Inter, system-ui',
            fontWeight: 700,
            fontSize: 26,
            opacity: fadeIn(frame, 40 + i * 8, 10),
          }}>
            {label}
          </div>
        ))}
      </div>

      <LogoTop frame={frame} />
    </AbsoluteFill>
  )
}

// ── Dashboard Mockup ────────────────────────────────────────────────────────
function DashboardMockup({ frame }: { frame: number }) {
  const kpis = [
    { label: 'Chiffre d\'affaires', value: '+23%', sub: '€ 84 200', color: GREEN, icon: '📈' },
    { label: 'Impayés', value: '0 €', sub: '0 factures', color: '#22C55E', icon: '✅' },
    { label: 'TVA à déclarer', value: 'OK', sub: 'Calculé auto', color: '#3B82F6', icon: '🎯' },
  ]
  return (
    <div style={{ background: '#0F172A', padding: 28 }}>
      {/* Topbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 22 }}>
        <div style={{ width: 32, height: 32, borderRadius: 10, background: GREEN, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: NAVY, fontSize: 20 }}>W</div>
        <span style={{ color: WHITE, fontWeight: 700, fontSize: 24, fontFamily: 'Inter, system-ui' }}>Worthifast</span>
        <div style={{ flex: 1 }} />
        <div style={{ width: 14, height: 14, borderRadius: '50%', background: GREEN, boxShadow: `0 0 8px ${GREEN}` }} />
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
        {kpis.map((kpi, i) => {
          const pulse = Math.sin(frame * 0.15 + i) * 0.06 + 1
          return (
            <div key={i} style={{
              flex: 1,
              background: 'rgba(255,255,255,0.06)',
              borderRadius: 18,
              padding: '18px 16px',
              border: `1.5px solid ${kpi.color}40`,
              transform: `scale(${pulse})`,
              transition: 'transform 0.1s',
            }}>
              <div style={{ fontSize: 28, marginBottom: 6 }}>{kpi.icon}</div>
              <div style={{ color: kpi.color, fontWeight: 800, fontSize: 32, fontFamily: 'Inter, system-ui' }}>{kpi.value}</div>
              <div style={{ color: '#94A3B8', fontSize: 18, fontFamily: 'Inter, system-ui', marginTop: 2 }}>{kpi.label}</div>
              <div style={{ color: WHITE, fontSize: 20, fontWeight: 600, marginTop: 4, fontFamily: 'Inter, system-ui' }}>{kpi.sub}</div>
            </div>
          )
        })}
      </div>

      {/* Mini chart */}
      <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 14, padding: '14px 18px', display: 'flex', alignItems: 'flex-end', gap: 8, height: 80 }}>
        {[40, 55, 48, 70, 62, 85, 78, 95].map((h, i) => {
          const animH = interpolate(frame, [i * 4, i * 4 + 20], [0, h], { extrapolateRight: 'clamp' })
          return (
            <div key={i} style={{
              flex: 1,
              height: `${animH}%`,
              background: `linear-gradient(180deg, ${GREEN} 0%, ${GREEN}60 100%)`,
              borderRadius: '4px 4px 0 0',
              minHeight: 4,
            }} />
          )
        })}
      </div>
    </div>
  )
}

// ── SCÈNE 4 — CTA (360–450) ───────────────────────────────────────────────
function Scene4() {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const mouthOpen = Math.abs(Math.sin(frame * 0.4)) * 0.7

  // CTA button pulse
  const pulse = interpolate(
    Math.sin(frame * 0.18),
    [-1, 1],
    [0.97, 1.04]
  )

  const glowOpacity = interpolate(Math.sin(frame * 0.18), [-1, 1], [0.3, 0.8])

  return (
    <AbsoluteFill style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {/* Founder pointing at camera */}
      <div style={{ position: 'absolute', bottom: 340, left: '50%', transform: 'translateX(-50%)' }}>
        <Founder mouthOpen={mouthOpen} />
        {/* Pointing hand overlay */}
        <div style={{
          position: 'absolute',
          bottom: -30,
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: 72,
          filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))',
          opacity: fadeIn(frame, 10, 12),
          animation: 'none',
          transformOrigin: 'center',
        }}>
          👇
        </div>
      </div>

      {/* Speech bubble */}
      <div style={{
        position: 'absolute',
        top: 140,
        left: '50%',
        transform: 'translateX(-50%)',
        opacity: fadeIn(frame, 6, 14),
        background: WHITE,
        borderRadius: 28,
        padding: '22px 44px',
        boxShadow: '0 12px 48px rgba(0,0,0,0.15)',
        maxWidth: 800,
        textAlign: 'center',
      }}>
        <p style={{
          fontFamily: 'Inter, system-ui',
          fontWeight: 700,
          fontSize: 38,
          color: NAVY,
          margin: 0,
          lineHeight: 1.3,
        }}>
          &quot;Inscris-toi, teste{' '}
          <span style={{ color: GREEN }}>30 jours GRATUITS</span>
          &nbsp;!&quot;
        </p>
        {/* Bubble tail */}
        <div style={{
          position: 'absolute',
          bottom: -20,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 0,
          height: 0,
          borderLeft: '20px solid transparent',
          borderRight: '20px solid transparent',
          borderTop: '22px solid white',
        }} />
      </div>

      {/* CTA Button */}
      <div style={{
        position: 'absolute',
        bottom: 220,
        left: '50%',
        transform: `translateX(-50%) scale(${pulse})`,
        opacity: fadeIn(frame, 14, 12),
        zIndex: 10,
      }}>
        {/* Glow effect */}
        <div style={{
          position: 'absolute',
          inset: -16,
          borderRadius: 30,
          background: ORANGE,
          opacity: glowOpacity * 0.35,
          filter: 'blur(20px)',
        }} />
        <div style={{
          position: 'relative',
          background: `linear-gradient(135deg, ${ORANGE} 0%, #FB923C 100%)`,
          color: WHITE,
          borderRadius: 22,
          padding: '28px 64px',
          fontFamily: 'Inter, system-ui',
          fontWeight: 900,
          fontSize: 46,
          letterSpacing: '-0.5px',
          boxShadow: `0 8px 40px ${ORANGE}66`,
          whiteSpace: 'nowrap',
        }}>
          Essayer maintenant →
        </div>
      </div>

      {/* Micro-copy */}
      <div style={{
        position: 'absolute',
        bottom: 148,
        width: '100%',
        textAlign: 'center',
        opacity: fadeIn(frame, 20, 12),
        fontFamily: 'Inter, system-ui',
        fontWeight: 600,
        fontSize: 28,
        color: '#64748B',
        letterSpacing: '0.5px',
      }}>
        Sans carte bancaire &nbsp;•&nbsp; Résiliable à tout moment
      </div>

      {/* Domain */}
      <div style={{
        position: 'absolute',
        bottom: 70,
        width: '100%',
        textAlign: 'center',
        opacity: fadeIn(frame, 26, 12),
        fontFamily: 'Inter, system-ui',
        fontWeight: 700,
        fontSize: 30,
        color: NAVY,
      }}>
        worthifast.vercel.app
      </div>

      <LogoTop frame={frame} />
    </AbsoluteFill>
  )
}

// ── Logo top persistant ────────────────────────────────────────────────────
function LogoTop({ frame }: { frame: number }) {
  return (
    <div style={{
      position: 'absolute',
      top: 48,
      left: 60,
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      opacity: fadeIn(frame, 0, 10),
    }}>
      <div style={{
        width: 52,
        height: 52,
        borderRadius: 14,
        background: GREEN,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Inter, system-ui',
        fontWeight: 900,
        fontSize: 28,
        color: NAVY,
        boxShadow: `0 4px 16px ${GREEN}55`,
      }}>
        W
      </div>
      <span style={{
        fontFamily: 'Inter, system-ui',
        fontWeight: 800,
        fontSize: 34,
        color: NAVY,
        letterSpacing: '-0.5px',
      }}>
        Worthifast
      </span>
    </div>
  )
}

// ── Composition principale ─────────────────────────────────────────────────
export function WorthifastTestimonial() {
  const frame = useCurrentFrame()

  // Cut transition flash (frames aux frontières de scène)
  const flashOpacity = Math.max(
    interpolate(frame, [118, 122], [0, 0.6, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
    interpolate(frame, [238, 242], [0, 0.6, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
    interpolate(frame, [358, 362], [0, 0.6, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
  )

  return (
    <AbsoluteFill style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      <Background />

      {/* Scènes */}
      <Sequence from={0} durationInFrames={120}>
        <Scene1 />
      </Sequence>
      <Sequence from={120} durationInFrames={120}>
        <Scene2 />
      </Sequence>
      <Sequence from={240} durationInFrames={120}>
        <Scene3 />
      </Sequence>
      <Sequence from={360} durationInFrames={90}>
        <Scene4 />
      </Sequence>

      {/* Flash de coupure entre scènes */}
      {flashOpacity > 0 && (
        <AbsoluteFill style={{ background: WHITE, opacity: flashOpacity }} />
      )}
    </AbsoluteFill>
  )
}
