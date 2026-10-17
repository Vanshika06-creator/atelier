'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Camera, Check, ChevronDown, Grid2x2X as Grid2X2, Hand, ImagePlus, Layers as Layers3, Loader as Loader2, Minus, Plus, RotateCw, Sparkles, Trash2, Upload, Wand as Wand2, X } from 'lucide-react'

import { Button } from '@/components/ui/button'

type Category = 'Tops' | 'Bottoms' | 'Footwear'
type PlacedItem = {
  id: string
  name: string
  image: string
  category: Category
  x: number
  y: number
  width: number
  height: number
  rotation: number
  z: number
  snapped: boolean
  blended: boolean
}
type PanelItem = {
  id: string
  name: string
  image: string
  category: Category
  processing: boolean
}

type DropZone = {
  id: Category | 'Head'
  label: string
  top: number
  height: number
  snapWidth: number
  snapY: number
}

const DEFAULT_MODEL =
  'https://images.pexels.com/photos/7505312/pexels-photo-7505312.jpeg?auto=compress&cs=tinysrgb&w=900'

const DROP_ZONES: DropZone[] = [
  { id: 'Head', label: 'Head', top: 4, height: 14, snapWidth: 22, snapY: 6 },
  { id: 'Tops', label: 'Torso', top: 18, height: 34, snapWidth: 36, snapY: 24 },
  { id: 'Bottoms', label: 'Waist & Legs', top: 52, height: 32, snapWidth: 38, snapY: 56 },
  { id: 'Footwear', label: 'Feet', top: 84, height: 14, snapWidth: 34, snapY: 86 },
]

export default function Page() {
  const [onboarded, setOnboarded] = useState(false)
  const [onboardingState, setOnboardingState] = useState<'idle' | 'uploading' | 'generating'>('idle')
  const [pendingPhoto, setPendingPhoto] = useState<string | null>(null)
  const [modelImage, setModelImage] = useState<string>(DEFAULT_MODEL)
  const [avatarUploading, setAvatarUploading] = useState(false)

  const [panelItems, setPanelItems] = useState<PanelItem[]>([])
  const [placedItems, setPlacedItems] = useState<PlacedItem[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [draggingFromPanel, setDraggingFromPanel] = useState<string | null>(null)
  const [dragOverZone, setDragOverZone] = useState<string | null>(null)
  const [aiProcessing, setAiProcessing] = useState(false)
  const [aiDone, setAiDone] = useState(false)
  const [showTrash, setShowTrash] = useState(false)

  const stageRef = useRef<HTMLDivElement>(null)
  const zCounter = useRef(1)

  const selected = useMemo(
    () => placedItems.find((p) => p.id === selectedId) ?? null,
    [placedItems, selectedId],
  )

  function startOnboarding(file: File) {
    const url = URL.createObjectURL(file)
    setPendingPhoto(url)
    setOnboardingState('uploading')
    setTimeout(() => {
      setOnboardingState('generating')
      setTimeout(() => {
        setOnboarded(true)
        setModelImage(url)
      }, 3000)
    }, 700)
  }

  function replaceAvatar(file: File) {
    const url = URL.createObjectURL(file)
    setAvatarUploading(true)
    setTimeout(() => {
      setModelImage(url)
      setAvatarUploading(false)
    }, 1200)
  }

  function addClothingFromUpload(file: File) {
    const url = URL.createObjectURL(file)
    const id = `clothing-${Date.now()}`
    const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
    const isLikelyPng = ext === 'png'
    setPanelItems((current) => [
      ...current,
      {
        id,
        name: file.name.replace(/\.[^.]+$/, ''),
        image: url,
        category: guessCategory(file.name),
        processing: true,
      },
    ])
    setTimeout(() => {
      setPanelItems((current) =>
        current.map((p) => (p.id === id ? { ...p, processing: false } : p)),
      )
    }, 2000)
  }

  function guessCategory(name: string): Category {
    const n = name.toLowerCase()
    if (/(shoe|sneaker|boot|loafer|heel|sandal)/.test(n)) return 'Footwear'
    if (/(pant|jean|trouser|short|skirt|leg)/.test(n)) return 'Bottoms'
    return 'Tops'
  }

  const stageRect = useCallback(() => stageRef.current?.getBoundingClientRect(), [])

  function placeItem(panelItem: PanelItem, clientX: number, clientY: number) {
    const rect = stageRect()
    if (!rect) return
    const relX = ((clientX - rect.left) / rect.width) * 100
    const relY = ((clientY - rect.top) / rect.height) * 100

    const zone = DROP_ZONES.reduce((best, z) => {
      const dist = Math.abs(relY - (z.top + z.height / 2))
      return dist < best.dist ? { zone: z, dist } : best
    }, { zone: DROP_ZONES[0], dist: Infinity }).zone

    const isMatchingZone = zone.id === panelItem.category
    const snapWidth = isMatchingZone ? zone.snapWidth : 32
    const snapY = isMatchingZone ? zone.snapY : Math.min(88, Math.max(6, relY - 18))
    const snapX = isMatchingZone ? (100 - snapWidth) / 2 : Math.max(5, Math.min(60, relX - snapWidth / 2))

    const id = `placed-${Date.now()}`
    zCounter.current += 1
    setPlacedItems((current) => [
      ...current,
      {
        id,
        name: panelItem.name,
        image: panelItem.image,
        category: panelItem.category,
        x: snapX,
        y: snapY,
        width: snapWidth,
        height: snapWidth * 1.2,
        rotation: 0,
        z: zCounter.current,
        snapped: isMatchingZone,
        blended: false,
      },
    ])
    setSelectedId(id)
  }

  function updatePlaced(id: string, patch: Partial<PlacedItem>) {
    setPlacedItems((current) =>
      current.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    )
  }

  function removePlaced(id: string) {
    setPlacedItems((current) => current.filter((p) => p.id !== id))
    setSelectedId((cur) => (cur === id ? null : cur))
  }

  function bringToFront(id: string) {
    zCounter.current += 1
    updatePlaced(id, { z: zCounter.current })
  }

  function handleDragMove(item: PlacedItem, e: PointerEvent) {
    const rect = stageRect()
    if (!rect) return
    const dx = ((e.clientX - dragState.current.startX) / rect.width) * 100
    const dy = ((e.clientY - dragState.current.startY) / rect.height) * 100
    updatePlaced(item.id, {
      x: Math.max(-10, Math.min(95, dragState.current.originX + dx)),
      y: Math.max(-10, Math.min(95, dragState.current.originY + dy)),
      snapped: false,
    })
  }

  const dragState = useRef({ startX: 0, startY: 0, originX: 0, originY: 0 })

  function onPlacedPointerDown(e: React.PointerEvent, item: PlacedItem) {
    if ((e.target as HTMLElement).closest('button')) return
    e.stopPropagation()
    setSelectedId(item.id)
    bringToFront(item.id)
    dragState.current = { startX: e.clientX, startY: e.clientY, originX: item.x, originY: item.y }
    const move = (ev: PointerEvent) => handleDragMove(item, ev)
    const up = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  function onResizePointerDown(e: React.PointerEvent, item: PlacedItem) {
    e.stopPropagation()
    const rect = stageRect()
    if (!rect) return
    const startX = e.clientX
    const startY = e.clientY
    const startW = item.width
    const startH = item.height
    const move = (ev: PointerEvent) => {
      const dw = ((ev.clientX - startX) / rect.width) * 100
      const dh = ((ev.clientY - startY) / rect.height) * 100
      updatePlaced(item.id, {
        width: Math.max(10, Math.min(70, startW + dw)),
        height: Math.max(10, Math.min(90, startH + dh)),
        snapped: false,
      })
    }
    const up = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  function onRotatePointerDown(e: React.PointerEvent, item: PlacedItem) {
    e.stopPropagation()
    const rect = stageRect()
    if (!rect) return
    const cx = rect.left + (item.x + item.width / 2) * (rect.width / 100)
    const cy = rect.top + (item.y + item.height / 2) * (rect.height / 100)
    const startAngle = Math.atan2(e.clientY - cy, e.clientX - cx) * (180 / Math.PI)
    const startRot = item.rotation
    const move = (ev: PointerEvent) => {
      const ang = Math.atan2(ev.clientY - cy, ev.clientX - cx) * (180 / Math.PI)
      updatePlaced(item.id, { rotation: startRot + (ang - startAngle), snapped: false })
    }
    const up = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  function runAiTryOn() {
    setAiProcessing(true)
    setAiDone(false)
    setTimeout(() => {
      setPlacedItems((current) => current.map((p) => ({ ...p, blended: true })))
      setAiProcessing(false)
      setAiDone(true)
      setTimeout(() => setAiDone(false), 2500)
    }, 4000)
  }

  const orderedPlaced = useMemo(
    () => [...placedItems].sort((a, b) => a.z - b.z),
    [placedItems],
  )

  // --- ONBOARDING SCREEN ---
  if (!onboarded) {
    return (
      <Onboarding
        state={onboardingState}
        onFile={startOnboarding}
      />
    )
  }

  // --- FITTING ROOM ---
  return (
    <div className="min-h-screen bg-[#0b0b0e] text-white flex flex-col" onClick={() => setSelectedId(null)}>
      {/* Header */}
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-white/[0.06] px-5 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex size-8 items-center justify-center rounded-full bg-white text-black">
            <Sparkles className="size-3.5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em]">Atelier</p>
            <p className="text-[10px] text-white/40">Virtual Try-On</p>
          </div>
        </div>
        <div className="hidden items-center gap-6 text-xs text-white/40 md:flex">
          <span className="text-white">Fitting Room</span>
          <span>Saved Looks</span>
          <span>Profile</span>
        </div>
        <Button
          variant="outline"
          className="h-8 rounded-full border-white/15 bg-white/[0.03] px-4 text-xs text-white/80 hover:bg-white/[0.08]"
          onClick={(e) => e.stopPropagation()}
        >
          <Check data-icon="inline-start" /> Save Look
        </Button>
      </header>

      {/* Main */}
      <div className="flex flex-1 flex-col lg:flex-row min-h-0">
        {/* Left: wardrobe list (optional, collapsed) */}
        <aside className="hidden w-[230px] shrink-0 flex-col border-r border-white/[0.06] p-5 xl:flex">
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/35">Your Collection</p>
          <p className="font-serif text-xl tracking-[-0.03em]">{panelItems.length} items</p>
          <div className="mt-4 space-y-2">
            {panelItems.slice(0, 6).map((p) => (
              <div key={p.id} className="flex items-center gap-2 text-xs text-white/50">
                <img src={p.image} alt="" className="size-8 rounded object-cover opacity-80" />
                <span className="truncate">{p.name}</span>
              </div>
            ))}
            {panelItems.length === 0 && (
              <p className="text-xs text-white/30">Upload items to begin.</p>
            )}
          </div>
        </aside>

        {/* Center stage */}
        <section
          className="relative flex flex-1 flex-col items-center justify-center p-4 lg:p-8"
          onClick={() => setSelectedId(null)}
        >
          <div className="mb-4 flex w-full max-w-[460px] items-center justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/35">Live Preview</p>
              <h2 className="font-serif text-2xl tracking-[-0.04em]">Fitting Room</h2>
            </div>
            <Button
              size="sm"
              className="h-8 rounded-full bg-white px-3 text-xs text-black hover:bg-white/85"
              onClick={(e) => { e.stopPropagation(); document.getElementById('avatar-upload')?.click() }}
            >
              <Camera data-icon="inline-start" /> Upload My Photo
            </Button>
            <input
              id="avatar-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) replaceAvatar(f) }}
            />
          </div>

          {/* Stage */}
          <div
            ref={stageRef}
            className="relative aspect-[3/4.4] w-full max-w-[460px] overflow-hidden rounded-3xl border border-white/[0.07] bg-gradient-to-b from-[#15151a] to-[#0c0c10] shadow-[0_30px_80px_rgba(0,0,0,0.5)]"
            onDragOver={(e) => { e.preventDefault(); }}
            onDrop={(e) => {
              e.preventDefault()
              const id = e.dataTransfer.getData('text/plain')
              const item = panelItems.find((p) => p.id === id)
              if (item) placeItem(item, e.clientX, e.clientY)
              setDraggingFromPanel(null)
              setDragOverZone(null)
            }}
            onPointerEnter={() => setShowTrash(true)}
            onPointerLeave={() => setShowTrash(false)}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drop zone guides */}
            <AnimatePresence>
              {draggingFromPanel && (
                <div className="pointer-events-none absolute inset-0 z-20">
                  {DROP_ZONES.map((z) => (
                    <motion.div
                      key={z.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className={`absolute left-[8%] right-[8%] rounded-xl border border-dashed transition-colors ${
                        dragOverZone === z.id ? 'border-emerald-400/70 bg-emerald-400/10' : 'border-white/15 bg-white/[0.02]'
                      }`}
                      style={{ top: `${z.top}%`, height: `${z.height}%` }}
                      onPointerEnter={() => setDragOverZone(z.id)}
                      onPointerLeave={() => setDragOverZone((cur) => (cur === z.id ? null : cur))}
                    >
                      <span className="absolute left-3 top-2 text-[9px] font-semibold uppercase tracking-[0.2em] text-white/40">
                        {z.label}
                      </span>
                    </motion.div>
                  ))}
                </div>
              )}
            </AnimatePresence>

            {/* Avatar */}
            {avatarUploading ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white/60">
                <Loader2 className="size-6 animate-spin" />
                <p className="text-xs">Updating avatar…</p>
              </div>
            ) : (
              <img
                src={modelImage}
                alt="Avatar"
                className="pointer-events-none absolute inset-0 h-full w-full object-cover object-top"
                draggable={false}
              />
            )}

            {/* Placed clothing */}
            {orderedPlaced.map((item) => (
              <div
                key={item.id}
                onPointerDown={(e) => onPlacedPointerDown(e, item)}
                className={`absolute touch-none select-none ${selectedId === item.id ? 'z-30' : ''}`}
                style={{
                  left: `${item.x}%`,
                  top: `${item.y}%`,
                  width: `${item.width}%`,
                  height: `${item.height}%`,
                  zIndex: item.z,
                }}
              >
                <div
                  className="relative h-full w-full"
                  style={{
                    transform: `rotate(${item.rotation}deg)`,
                    transition: draggingFromPanel ? 'none' : 'transform 0.12s ease',
                  }}
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    draggable={false}
                    className={`pointer-events-none h-full w-full object-contain ${
                      item.blended ? 'contrast-105 brightness-95' : 'mix-blend-multiply'
                    }`}
                    style={item.blended ? { filter: 'drop-shadow(0 8px 18px rgba(0,0,0,0.45)) contrast(1.08) saturate(1.05)' } : undefined}
                  />
                  {selectedId === item.id && (
                    <>
                      <div className="pointer-events-none absolute inset-0 rounded-lg ring-1 ring-white/60 ring-offset-2 ring-offset-transparent" />
                      {/* Resize handle */}
                      <button
                        aria-label="Resize"
                        onPointerDown={(e) => onResizePointerDown(e, item)}
                        className="absolute -bottom-1.5 -right-1.5 size-4 cursor-se-resize rounded-full border-2 border-white bg-[#0b0b0e] shadow"
                      />
                      {/* Rotate handle */}
                      <button
                        aria-label="Rotate"
                        onPointerDown={(e) => onRotatePointerDown(e, item)}
                        className="absolute -top-6 left-1/2 -translate-x-1/2 size-4 cursor-grab rounded-full border-2 border-white bg-[#0b0b0e] shadow"
                      />
                      {/* Layer up */}
                      <button
                        aria-label="Bring forward"
                        onClick={(e) => { e.stopPropagation(); bringToFront(item.id) }}
                        className="absolute -top-1.5 -left-1.5 flex size-5 items-center justify-center rounded-full border border-white/30 bg-[#0b0b0e] text-white"
                      >
                        <Layers3 className="size-2.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}

            {/* Trash on avatar */}
            <AnimatePresence>
              {showTrash && placedItems.length > 0 && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  onClick={(e) => { e.stopPropagation(); if (selectedId) removePlaced(selectedId) }}
                  className="absolute right-3 top-3 z-40 flex size-9 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur hover:bg-red-500/80"
                >
                  <Trash2 className="size-4" />
                </motion.button>
              )}
            </AnimatePresence>

            {/* AI overlay */}
            <AnimatePresence>
              {aiProcessing && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-black/70 backdrop-blur-md"
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
                    className="flex size-12 items-center justify-center rounded-full border border-white/20"
                  >
                    <Wand2 className="size-5 text-emerald-300" />
                  </motion.div>
                  <p className="font-serif text-lg tracking-[-0.02em] text-white/90">
                    Running deep learning cloth physics…
                  </p>
                  <p className="max-w-[280px] text-center text-xs text-white/50">
                    Blending lighting and generating wrinkles for a photorealistic fit.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {aiDone && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="absolute bottom-3 left-1/2 z-50 -translate-x-1/2 rounded-full bg-emerald-500/90 px-4 py-1.5 text-xs font-medium text-white"
              >
                Realistic fit generated
              </motion.div>
            )}
          </div>

          {/* AI button */}
          <div className="mt-5 flex w-full max-w-[460px] flex-col gap-2">
            <Button
              onClick={(e) => { e.stopPropagation(); runAiTryOn() }}
              className="h-11 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-500 text-sm font-semibold text-black hover:from-emerald-300 hover:to-teal-400"
            >
              <Wand2 data-icon="inline-start" /> Generate Realistic Fit (AI)
            </Button>
            {selected && (
              <div className="flex items-center justify-between text-[10px] text-white/40">
                <span>Selected: {selected.name}</span>
                <span className={selected.snapped ? 'text-emerald-400' : ''}>
                  {selected.snapped ? 'Snapped' : 'Free position'}
                </span>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Bottom wardrobe panel */}
      <WardrobePanel
        items={panelItems}
        onUpload={addClothingFromUpload}
        onStartDrag={(id) => setDraggingFromPanel(id)}
        onEndDrag={() => { setDraggingFromPanel(null); setDragOverZone(null) }}
      />
    </div>
  )
}

// ---------- Onboarding ----------

function Onboarding({
  state,
  onFile,
}: {
  state: 'idle' | 'uploading' | 'generating'
  onFile: (f: File) => void
}) {
  const [dragging, setDragging] = useState(false)
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0b0b0e] px-6 text-white">
      <div className="pointer-events-none absolute -top-40 left-1/2 size-[600px] -translate-x-1/2 rounded-full bg-emerald-500/10 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-0 right-0 size-[400px] rounded-full bg-teal-500/5 blur-[100px]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-xl text-center"
      >
        <div className="mx-auto mb-6 flex size-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03]">
          <Sparkles className="size-6 text-emerald-300" />
        </div>
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.3em] text-white/40">Atelier · Virtual Try-On</p>
        <h1 className="mb-3 font-serif text-4xl tracking-[-0.04em] sm:text-5xl">
          Create your digital avatar
        </h1>
        <p className="mb-8 text-sm leading-relaxed text-white/50">
          Upload your full-body photo to create your lifelike digital statue and map body proportions for a perfect fit.
        </p>

        {state === 'idle' && (
          <label
            onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault()
              setDragging(false)
              const f = e.dataTransfer.files?.[0]
              if (f) onFile(f)
            }}
            className={`group block cursor-pointer rounded-3xl border-2 border-dashed p-12 transition-all ${
              dragging ? 'border-emerald-400/70 bg-emerald-400/5' : 'border-white/15 hover:border-white/30 hover:bg-white/[0.02]'
            }`}
          >
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f) }}
            />
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
              className="mx-auto mb-5 flex size-16 items-center justify-center rounded-full border border-white/15 bg-white/[0.04]"
            >
              <Upload className="size-6 text-white/70" />
            </motion.div>
            <p className="font-serif text-xl tracking-[-0.02em]">Drop your photo here</p>
            <p className="mt-1 text-xs text-white/40">or click to browse · JPG, PNG up to 20MB</p>
          </label>
        )}

        {state === 'uploading' && (
          <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-12">
            <Loader2 className="mx-auto mb-4 size-8 animate-spin text-emerald-300" />
            <p className="text-sm text-white/70">Reading your photo…</p>
          </div>
        )}

        {state === 'generating' && (
          <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-14">
            <motion.div
              className="relative mx-auto mb-6 size-24"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                className="absolute inset-0 rounded-full border-2 border-transparent border-t-emerald-400 border-r-emerald-400/40"
              />
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
                className="absolute inset-2 rounded-full border-2 border-transparent border-b-teal-400 border-l-teal-400/30"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="size-7 text-emerald-300" />
              </div>
            </motion.div>
            <p className="font-serif text-lg tracking-[-0.02em] text-white/90">
              Generating your digital statue
            </p>
            <p className="mt-2 text-xs text-white/45">Mapping body proportions…</p>
          </div>
        )}
      </motion.div>
    </div>
  )
}

// ---------- Wardrobe Panel ----------

function WardrobePanel({
  items,
  onUpload,
  onStartDrag,
  onEndDrag,
}: {
  items: PanelItem[]
  onUpload: (f: File) => void
  onStartDrag: (id: string) => void
  onEndDrag: () => void
}) {
  return (
    <div className="shrink-0 border-t border-white/[0.06] bg-[#101015] px-4 py-4 lg:px-8">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/35">Wardrobe</p>
          <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-white/50">{items.length}</span>
        </div>
        <Button
          size="sm"
          onClick={() => document.getElementById('clothing-upload')?.click()}
          className="h-8 rounded-full bg-white px-3 text-xs text-black hover:bg-white/85"
        >
          <Plus data-icon="inline-start" /> Upload New Clothing
        </Button>
        <input
          id="clothing-upload"
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) onUpload(f) }}
        />
      </div>

      {items.length === 0 ? (
        <div className="flex h-24 items-center justify-center rounded-xl border border-dashed border-white/10 text-xs text-white/30">
          Your uploaded clothing will appear here · drag items onto the avatar
        </div>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {items.map((item) => (
            <div
              key={item.id}
              draggable={!item.processing}
              onDragStart={(e) => {
                e.dataTransfer.setData('text/plain', item.id)
                onStartDrag(item.id)
              }}
              onDragEnd={onEndDrag}
              className="group relative flex h-24 w-24 shrink-0 cursor-grab flex-col items-center justify-center rounded-xl border border-white/10 bg-[#18181d] active:cursor-grabbing"
            >
              {item.processing ? (
                <div className="flex flex-col items-center gap-1.5 text-white/40">
                  <Loader2 className="size-4 animate-spin" />
                  <span className="text-[8px] uppercase tracking-wide">Removing bg…</span>
                </div>
              ) : (
                <>
                  <img
                    src={item.image}
                    alt={item.name}
                    className="max-h-16 max-w-[80%] object-contain mix-blend-multiply"
                    draggable={false}
                  />
                  <span className="absolute bottom-1 left-1 right-1 truncate text-center text-[8px] text-white/40">
                    {item.name}
                  </span>
                  <span className="absolute left-1 top-1 rounded bg-white/10 px-1 text-[7px] uppercase text-white/50">
                    {item.category}
                  </span>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
