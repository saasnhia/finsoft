/**
 * Export Worthifast logo in LinkedIn formats (PNG)
 * Run: npx tsx scripts/export-logos-linkedin.ts
 */

import sharp from 'sharp'
import { resolve } from 'path'

const OUT = resolve(process.cwd(), 'public/exports')

// ── SVG helpers ─────────────────────────────────────────────────────────────

/** Icon only (W shape) — scalable */
function iconSvg(size: number): Buffer {
  const s = size
  const r = s * 0.208 // corner radius ratio
  const sw = s * 0.073 // stroke width ratio
  // Points scaled from 48x48 base
  const scale = s / 48
  const pts1 = `${8*scale},${32*scale} ${16*scale},${16*scale} ${24*scale},${28*scale}`
  const pts2 = `${24*scale},${28*scale} ${32*scale},${16*scale} ${40*scale},${32*scale}`

  return Buffer.from(`<svg width="${s}" height="${s}" viewBox="0 0 ${s} ${s}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1a1a2e"/>
      <stop offset="100%" stop-color="#16213e"/>
    </linearGradient>
  </defs>
  <rect width="${s}" height="${s}" rx="${r}" ry="${r}" fill="url(#bg)"/>
  <polyline points="${pts1}" fill="none" stroke="#22D3A5" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"/>
  <polyline points="${pts2}" fill="none" stroke="#22D3A5" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`)
}

/** Full logo: icon + "Worthifast" text */
function fullLogoSvg(iconSize: number, fontSize: number, textColor: string): Buffer {
  const s = iconSize
  const r = s * 0.208
  const sw = s * 0.073
  const scale = s / 48
  const pts1 = `${8*scale},${32*scale} ${16*scale},${16*scale} ${24*scale},${28*scale}`
  const pts2 = `${24*scale},${28*scale} ${32*scale},${16*scale} ${40*scale},${32*scale}`
  const textX = s + s * 0.25
  const textY = s * 0.65
  const totalW = textX + fontSize * 5.5
  const totalH = s

  return Buffer.from(`<svg width="${totalW}" height="${totalH}" viewBox="0 0 ${totalW} ${totalH}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1a1a2e"/>
      <stop offset="100%" stop-color="#16213e"/>
    </linearGradient>
  </defs>
  <rect width="${s}" height="${s}" rx="${r}" ry="${r}" fill="url(#bg)"/>
  <polyline points="${pts1}" fill="none" stroke="#22D3A5" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"/>
  <polyline points="${pts2}" fill="none" stroke="#22D3A5" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"/>
  <text x="${textX}" y="${textY}" font-family="Inter, -apple-system, Segoe UI, sans-serif" font-weight="700" font-size="${fontSize}" fill="${textColor}" letter-spacing="-0.5"
    >Worthifast</text>
</svg>`)
}

async function main() {
  console.log('Generating LinkedIn logo exports...\n')

  // ── 1. Post image: 1200x627 — Logo centered on white ────────────────────
  {
    const iconSize = 160
    const fontSize = 64
    const logoSvg = fullLogoSvg(iconSize, fontSize, '#0F172A')
    const logoImg = await sharp(logoSvg).png().toBuffer()
    const { width: lw, height: lh } = await sharp(logoImg).metadata()

    await sharp({
      create: { width: 1200, height: 627, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } }
    })
      .composite([{
        input: logoImg,
        left: Math.round((1200 - (lw ?? 0)) / 2),
        top: Math.round((627 - (lh ?? 0)) / 2),
      }])
      .png()
      .toFile(resolve(OUT, 'logo-linkedin-post.png'))

    console.log('✓ logo-linkedin-post.png (1200x627)')
  }

  // ── 2. Profile image: 400x400 — Icon centered with 10% margin ──────────
  {
    const margin = 40 // 10% of 400
    const iconSize = 400 - margin * 2 // 320px
    const iconImg = await sharp(iconSvg(iconSize)).png().toBuffer()

    await sharp({
      create: { width: 400, height: 400, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } }
    })
      .composite([{
        input: iconImg,
        left: margin,
        top: margin,
      }])
      .png()
      .toFile(resolve(OUT, 'logo-linkedin-profile.png'))

    console.log('✓ logo-linkedin-profile.png (400x400)')
  }

  // ── 3. Banner: 1128x191 — Logo left + text ─────────────────────────────
  {
    const bannerH = 191
    const iconSize = Math.round(bannerH * 0.65) // ~124px
    const fontSize = Math.round(iconSize * 0.4) // ~50px
    const logoSvg = fullLogoSvg(iconSize, fontSize, '#0F172A')
    const logoImg = await sharp(logoSvg).png().toBuffer()
    const { width: lw, height: lh } = await sharp(logoImg).metadata()

    const padLeft = 40
    const topCenter = Math.round((bannerH - (lh ?? 0)) / 2)

    // Subtitle SVG
    const subtitleSvg = Buffer.from(`<svg width="500" height="30" xmlns="http://www.w3.org/2000/svg">
      <text x="0" y="22" font-family="Inter, -apple-system, Segoe UI, sans-serif" font-weight="400" font-size="18" fill="#64748B"
        >Comptabilité intelligente pour experts-comptables</text>
    </svg>`)
    const subtitleImg = await sharp(subtitleSvg).png().toBuffer()

    await sharp({
      create: { width: 1128, height: bannerH, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } }
    })
      .composite([
        {
          input: logoImg,
          left: padLeft,
          top: topCenter,
        },
        {
          input: subtitleImg,
          left: padLeft + (lw ?? 0) + 30,
          top: Math.round(bannerH / 2) + 10,
        },
      ])
      .png()
      .toFile(resolve(OUT, 'logo-linkedin-banner.png'))

    console.log('✓ logo-linkedin-banner.png (1128x191)')
  }

  console.log(`\nDone! Files in public/exports/`)
}

main()
