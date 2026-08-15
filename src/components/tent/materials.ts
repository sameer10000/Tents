import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from 'three'
import type { PartColors } from '../../data/tent-config'
import type { PartRole, PartSurface } from '../../lib/tent-geometry'

/** Surfaces that are never picked from the palette. */
const FIXED: Partial<Record<PartSurface, string>> = {
  mesh: '#22231f',
  glass: '#b9cdd4',
  interior: '#3a3934',
  rope: '#cfc3a8',
}

/** Used when a family leaves a palette slot unset — poles on a bell tent, say. */
const BY_ROLE: Record<PartRole, string> = {
  canvas: '#d9cdb4',
  metal: '#8d9096',
  timber: '#7a5636',
  mesh: '#22231f',
  glass: '#b9cdd4',
  rope: '#cfc3a8',
}

export function surfaceColor(
  surface: PartSurface,
  role: PartRole,
  colors: PartColors,
): string {
  const fixed = FIXED[surface]
  if (fixed) return fixed
  return colors[surface as keyof PartColors] ?? BY_ROLE[role]
}

/* ── Procedural cloth ───────────────────────────────────────────────────── */

let weave: CanvasTexture | null = null
let weaveBump: CanvasTexture | null = null

function drawWeave(size: number, contrast: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) return canvas

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, size, size)

  // Warp and weft: two sets of threads at right angles, each thread slightly
  // uneven so the cloth never reads as graph paper.
  const pitch = 4
  for (let i = 0; i < size; i += pitch) {
    const wobble = (Math.sin(i * 0.7) + Math.sin(i * 0.31)) * 0.5
    const shade = 128 + wobble * 40 * contrast

    ctx.strokeStyle = `rgb(${shade},${shade},${shade})`
    ctx.lineWidth = 1.6
    ctx.beginPath()
    ctx.moveTo(i + wobble, 0)
    ctx.lineTo(i + wobble, size)
    ctx.stroke()

    ctx.strokeStyle = `rgb(${255 - shade},${255 - shade},${255 - shade})`
    ctx.beginPath()
    ctx.moveTo(0, i - wobble)
    ctx.lineTo(size, i - wobble)
    ctx.stroke()
  }

  // Slubs — the thicker flecks that make cotton canvas look like cotton.
  for (let i = 0; i < size * 1.5; i++) {
    const x = Math.random() * size
    const y = Math.random() * size
    const alpha = Math.random() * 0.12 * contrast
    ctx.fillStyle = Math.random() > 0.5 ? `rgba(0,0,0,${alpha})` : `rgba(255,255,255,${alpha})`
    ctx.fillRect(x, y, 1 + Math.random() * 3, 1 + Math.random())
  }

  return canvas
}

/**
 * The weave used by the photoreal style, built once and shared.
 *
 * It is generated rather than shipped so the configurator adds no image
 * payload to the bundle, and it tiles seamlessly enough at this scale.
 */
export function canvasWeave(): { map: CanvasTexture; bump: CanvasTexture } {
  if (!weave || !weaveBump) {
    weave = new CanvasTexture(drawWeave(256, 0.55))
    weave.colorSpace = SRGBColorSpace
    weave.wrapS = RepeatWrapping
    weave.wrapT = RepeatWrapping
    weave.repeat.set(8, 8)

    weaveBump = new CanvasTexture(drawWeave(256, 1))
    weaveBump.wrapS = RepeatWrapping
    weaveBump.wrapT = RepeatWrapping
    weaveBump.repeat.set(8, 8)
  }
  return { map: weave, bump: weaveBump }
}

/** Surface finish per role, before the style adjusts it. */
export function finishFor(role: PartRole): { roughness: number; metalness: number } {
  switch (role) {
    case 'metal':
      return { roughness: 0.42, metalness: 0.75 }
    case 'timber':
      return { roughness: 0.78, metalness: 0 }
    case 'glass':
      return { roughness: 0.15, metalness: 0 }
    case 'mesh':
      return { roughness: 0.95, metalness: 0 }
    case 'rope':
      return { roughness: 0.9, metalness: 0 }
    default:
      return { roughness: 0.94, metalness: 0 }
  }
}
