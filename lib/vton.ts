export type WardrobeItem = {
  id: string
  name: string
  src: string
  aspect: number
}

export type FittedGarment = {
  instanceId: string
  itemId: string
  name: string
  src: string
  aspect: number
  x: number
  y: number
  width: number
  rotation: number
}

export const WARDROBE_DRAG_TYPE = 'application/x-atelier-item'

export function wait(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms))
}

export function readImageFile(file: File): Promise<{ src: string; aspect: number }> {
  return new Promise((resolve, reject) => {
    const src = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => resolve({ src, aspect: img.naturalWidth / img.naturalHeight || 1 })
    img.onerror = () => {
      URL.revokeObjectURL(src)
      reject(new Error('Could not read image'))
    }
    img.src = src
  })
}

export function fileLabel(file: File) {
  const base = file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').trim()
  return base ? base.charAt(0).toUpperCase() + base.slice(1) : 'Untitled piece'
}
