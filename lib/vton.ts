export type ZoneId = 'head' | 'torso' | 'legs' | 'feet'

export type WardrobeItem = {
  id: string
  name: string
  src: string
  aspect: number
  zone: ZoneId | null
  whiteBackground: boolean
}

export type FittedGarment = {
  instanceId: string
  itemId: string
  name: string
  src: string
  aspect: number
  zone: ZoneId | null
  whiteBackground: boolean
  x: number
  y: number
  width: number
  rotation: number
  snapping: boolean
  aiBlended: boolean
}

type Zone = {
  id: ZoneId
  label: string
  cx: number
  cy: number
  w: number
  h: number
}

/** Fractions of the stage, calibrated to the default model's proportions. */
export const DROP_ZONES: Zone[] = [
  { id: 'head', label: 'Head', cx: 0.5, cy: 0.12, w: 0.26, h: 0.14 },
  { id: 'torso', label: 'Torso', cx: 0.5, cy: 0.37, w: 0.46, h: 0.32 },
  { id: 'legs', label: 'Waist / Legs', cx: 0.5, cy: 0.655, w: 0.34, h: 0.48 },
  { id: 'feet', label: 'Feet', cx: 0.5, cy: 0.935, w: 0.3, h: 0.08 },
]

const SNAP_MARGIN = 0.07

const ZONE_KEYWORDS: Record<ZoneId, RegExp> = {
  head: /\b(hat|cap|beanie|beret|fedora|glasses|sunglasses|headband|scarf)\b/i,
  feet: /\b(shoes?|sneakers?|boots?|heels?|loafers?|sandals?|pumps|flats|trainers|mules|slippers?)\b/i,
  legs: /\b(pants|trousers|jeans|skirt|shorts|leggings|bottoms?|chinos|joggers|culottes)\b/i,
  torso: /\b(shirt|t ?shirt|tee|top|blouse|sweater|jumper|hoodie|jacket|blazer|coat|cardigan|vest|tank|dress|polo|knit)\b/i,
}

export const WARDROBE_DRAG_TYPE = 'application/x-atelier-item'

export function getZone(id: ZoneId) {
  return DROP_ZONES.find((z) => z.id === id)!
}

export function inferZone(name: string): ZoneId | null {
  for (const id of ['head', 'feet', 'legs', 'torso'] as ZoneId[]) {
    if (ZONE_KEYWORDS[id].test(name)) return id
  }
  return null
}

function distanceOutside(zone: Zone, nx: number, ny: number) {
  const dx = Math.max(0, Math.abs(nx - zone.cx) - zone.w / 2)
  const dy = Math.max(0, Math.abs(ny - zone.cy) - zone.h / 2)
  return Math.hypot(dx, dy)
}

/**
 * Picks the zone a drop should snap to. An item with a known category snaps to its own
 * zone when released near it; otherwise the closest zone under the pointer wins.
 */
export function resolveSnapZone(nx: number, ny: number, preferred: ZoneId | null): ZoneId | null {
  if (preferred && distanceOutside(getZone(preferred), nx, ny) <= SNAP_MARGIN * 1.6) return preferred
  let best: { id: ZoneId; d: number } | null = null
  for (const zone of DROP_ZONES) {
    if (distanceOutside(zone, nx, ny) > SNAP_MARGIN) continue
    const d = Math.hypot(nx - zone.cx, (ny - zone.cy) * 0.6)
    if (!best || d < best.d) best = { id: zone.id, d }
  }
  return best?.id ?? null
}

/** Centre and width (in stage px) that fit a garment of the given aspect inside a zone. */
export function fitToZone(zoneId: ZoneId, aspect: number, stageWidth: number, stageHeight: number) {
  const zone = getZone(zoneId)
  const boxW = zone.w * stageWidth
  const boxH = zone.h * stageHeight
  return {
    x: zone.cx * stageWidth,
    y: zone.cy * stageHeight,
    width: Math.min(boxW, boxH * aspect),
    rotation: 0,
  }
}

export function wait(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms))
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Could not read image'))
    img.src = src
  })
}

/** Samples the image border; mostly near-white opaque pixels means a studio white backdrop. */
function hasWhiteBackground(img: HTMLImageElement) {
  const size = 48
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return false
  ctx.drawImage(img, 0, 0, size, size)
  const { data } = ctx.getImageData(0, 0, size, size)
  let white = 0
  let total = 0
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (x > 1 && x < size - 2 && y > 1 && y < size - 2) continue
      const i = (y * size + x) * 4
      total++
      if (data[i + 3] > 200 && data[i] > 228 && data[i + 1] > 228 && data[i + 2] > 228) white++
    }
  }
  return white / total > 0.6
}

export async function analyzeImage(src: string) {
  const img = await loadImage(src)
  let whiteBackground = false
  try {
    whiteBackground = hasWhiteBackground(img)
  } catch {
    whiteBackground = false
  }
  return { aspect: img.naturalWidth / img.naturalHeight || 1, whiteBackground }
}

export async function readImageFile(file: File) {
  const src = URL.createObjectURL(file)
  try {
    return { src, ...(await analyzeImage(src)) }
  } catch (error) {
    URL.revokeObjectURL(src)
    throw error
  }
}

export function fileLabel(file: File) {
  const base = file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').trim()
  return base ? base.charAt(0).toUpperCase() + base.slice(1) : 'Untitled piece'
}
