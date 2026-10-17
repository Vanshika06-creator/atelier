'use client'

import { useRef, useState } from 'react'
import {
  Check,
  ChevronDown,
  Grid2X2,
  Hand,
  ImagePlus,
  Layers3,
  Minus,
  Plus,
  RotateCcw,
  Sparkles,
  Trash2,
  Upload,
  X,
} from 'lucide-react'

import { Button } from '@/components/ui/button'

type Category = 'All' | 'Tops' | 'Bottoms' | 'Footwear'
type WardrobeItem = { id: string; name: string; category: Exclude<Category, 'All'>; image: string; color: string }
type CanvasItem = WardrobeItem & { instanceId: string; x: number; y: number; width: number }

const wardrobe: WardrobeItem[] = [
  { id: 'linen-shirt', name: 'Linen shirt', category: 'Tops', image: '/wardrobe/linen-shirt.png', color: 'Ivory' },
  { id: 'knit-top', name: 'Ribbed knit top', category: 'Tops', image: '/wardrobe/knit-top.png', color: 'Charcoal' },
  { id: 'wide-leg-trouser', name: 'Wide-leg trouser', category: 'Bottoms', image: '/wardrobe/wide-leg-trouser.png', color: 'Black' },
  { id: 'denim', name: 'Straight denim', category: 'Bottoms', image: '/wardrobe/denim.png', color: 'Vintage blue' },
  { id: 'loafers', name: 'Leather loafer', category: 'Footwear', image: '/wardrobe/loafers.png', color: 'Onyx' },
  { id: 'sneakers', name: 'Studio sneaker', category: 'Footwear', image: '/wardrobe/sneakers.png', color: 'White' },
]

const categories: Category[] = ['All', 'Tops', 'Bottoms', 'Footwear']

export default function Page() {
  const [activeCategory, setActiveCategory] = useState<Category>('All')
  const [canvasItems, setCanvasItems] = useState<CanvasItem[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [zoom, setZoom] = useState(100)
  const [dragging, setDragging] = useState<string | null>(null)
  const canvasRef = useRef<HTMLDivElement>(null)

  const filteredItems = activeCategory === 'All' ? wardrobe : wardrobe.filter((item) => item.category === activeCategory)

  function addItem(item: WardrobeItem) {
    const instanceId = `${item.id}-${Date.now()}`
    setCanvasItems((current) => [...current, { ...item, instanceId, x: 34 + current.length * 7, y: 18 + current.length * 4, width: item.category === 'Footwear' ? 20 : 27 }])
    setSelectedId(instanceId)
  }

  function updateItem(instanceId: string, patch: Partial<CanvasItem>) {
    setCanvasItems((current) => current.map((item) => item.instanceId === instanceId ? { ...item, ...patch } : item))
  }

  function handlePointerDown(event: React.PointerEvent, item: CanvasItem) {
    if ((event.target as HTMLElement).closest('button')) return
    const canvas = canvasRef.current
    if (!canvas) return
    const bounds = canvas.getBoundingClientRect()
    const startX = event.clientX
    const startY = event.clientY
    const originX = item.x
    const originY = item.y
    setSelectedId(item.instanceId)
    setDragging(item.instanceId)
    const move = (moveEvent: PointerEvent) => {
      updateItem(item.instanceId, {
        x: Math.max(2, Math.min(78, originX + ((moveEvent.clientX - startX) / bounds.width) * 100)),
        y: Math.max(2, Math.min(78, originY + ((moveEvent.clientY - startY) / bounds.height) * 100)),
      })
    }
    const up = () => {
      setDragging(null)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  function handleResizePointerDown(event: React.PointerEvent, item: CanvasItem) {
    event.stopPropagation()
    const canvas = canvasRef.current
    if (!canvas) return
    const startX = event.clientX
    const startWidth = item.width
    const bounds = canvas.getBoundingClientRect()
    const move = (moveEvent: PointerEvent) => {
      updateItem(item.instanceId, { width: Math.max(12, Math.min(45, startWidth + ((moveEvent.clientX - startX) / bounds.width) * 100)) })
    }
    const up = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  function removeItem(instanceId: string) {
    setCanvasItems((current) => current.filter((item) => item.instanceId !== instanceId))
    setSelectedId((current) => current === instanceId ? null : current)
  }

  function resizeSelected(amount: number) {
    if (!selectedId) return
    const selected = canvasItems.find((item) => item.instanceId === selectedId)
    if (selected) updateItem(selectedId, { width: Math.max(12, Math.min(45, selected.width + amount)) })
  }

  return (
    <main className="min-h-screen bg-[#f6f6f4] text-[#171717] selection:bg-[#d9e7df]">
      <header className="flex h-[74px] items-center justify-between border-b border-black/[0.08] bg-white px-6 lg:px-10">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-full bg-[#171717] text-white"><Sparkles className="size-4" /></div>
          <div><p className="text-[11px] font-semibold uppercase tracking-[0.22em]">Atelier</p><p className="text-xs text-black/45">Virtual closet</p></div>
        </div>
        <div className="hidden items-center gap-8 text-xs font-medium text-black/50 md:flex"><span className="text-black">Outfit builder</span><span>Saved looks</span><span>Profile</span></div>
        <Button variant="outline" className="h-9 rounded-full border-black/10 bg-white px-4 text-xs shadow-none hover:bg-black/[0.03]"><Check data-icon="inline-start" />Save look</Button>
      </header>

      <div className="flex min-h-[calc(100vh-74px)] flex-col lg:flex-row">
        <aside className="w-full border-b border-black/[0.08] bg-white px-5 py-6 lg:w-[30%] lg:min-w-[320px] lg:border-b-0 lg:border-r lg:px-7 lg:py-8">
          <div className="mb-7 flex items-start justify-between"><div><p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-black/40">Your collection</p><h1 className="font-serif text-3xl tracking-[-0.04em]">Wardrobe</h1></div><Button size="sm" onClick={() => document.getElementById('upload-item')?.click()} className="h-9 rounded-full bg-[#171717] px-3 text-xs hover:bg-black/80"><Upload data-icon="inline-start" />Upload item</Button><input id="upload-item" type="file" accept="image/*" className="hidden" /></div>
          <div className="mb-7 flex gap-1 border-b border-black/[0.08] pb-2">{categories.map((category) => <button key={category} onClick={() => setActiveCategory(category)} className={`relative px-2 pb-2 text-xs transition-colors ${activeCategory === category ? 'font-semibold text-black' : 'text-black/40 hover:text-black/70'}`}>{category}{activeCategory === category && <span className="absolute inset-x-2 -bottom-[9px] h-px bg-black" />}</button>)}</div>
          <div className="grid grid-cols-2 gap-3">{filteredItems.map((item) => <button key={item.id} onClick={() => addItem(item)} className="group text-left"><div className="relative flex aspect-[0.82] items-center justify-center overflow-hidden rounded-xl border border-black/[0.07] bg-[#f4f4f1] transition-all group-hover:-translate-y-0.5 group-hover:border-black/20 group-hover:bg-[#efefeb] group-hover:shadow-lg"><img src={item.image} alt={item.name} className="h-[86%] w-[86%] object-contain mix-blend-multiply" /><span className="absolute bottom-2 right-2 flex size-6 items-center justify-center rounded-full bg-white/90 opacity-0 shadow-sm transition-opacity group-hover:opacity-100"><Plus className="size-3" /></span></div><p className="mt-2 text-xs font-medium">{item.name}</p><p className="mt-0.5 text-[10px] text-black/40">{item.color}</p></button>)}</div>
          <div className="mt-8 flex items-center gap-2 text-[10px] text-black/35"><ImagePlus className="size-3.5" />Click an item to place it on your canvas</div>
        </aside>

        <section className="flex min-h-[660px] flex-1 flex-col p-5 lg:p-8">
          <div className="mb-5 flex items-end justify-between"><div><p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-black/35">Workspace</p><h2 className="font-serif text-3xl tracking-[-0.04em]">Outfit canvas</h2></div><div className="flex items-center gap-1 rounded-full border border-black/[0.08] bg-white p-1"><button aria-label="Zoom out" onClick={() => setZoom(Math.max(70, zoom - 10))} className="flex size-7 items-center justify-center rounded-full text-black/45 hover:bg-black/[0.05] hover:text-black"><Minus className="size-3.5" /></button><span className="w-10 text-center text-[10px] font-medium">{zoom}%</span><button aria-label="Zoom in" onClick={() => setZoom(Math.min(130, zoom + 10))} className="flex size-7 items-center justify-center rounded-full text-black/45 hover:bg-black/[0.05] hover:text-black"><Plus className="size-3.5" /></button></div></div>
          <div ref={canvasRef} className="relative flex-1 overflow-hidden rounded-2xl border border-black/[0.08] bg-[#fbfbfa] shadow-[0_10px_35px_rgba(0,0,0,0.04)]" style={{ backgroundImage: 'linear-gradient(rgba(0,0,0,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.025) 1px, transparent 1px)', backgroundSize: '32px 32px' }}>
            <div className="absolute left-5 top-5 flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.16em] text-black/25"><Hand className="size-3.5" />Drag to arrange</div>
            {canvasItems.length === 0 && <div className="absolute inset-0 flex flex-col items-center justify-center text-center"><div className="mb-4 flex size-16 items-center justify-center rounded-full border border-dashed border-black/15 text-black/25"><Layers3 className="size-6" /></div><p className="font-serif text-2xl tracking-[-0.03em]">Start styling your look</p><p className="mt-2 max-w-[220px] text-xs leading-relaxed text-black/40">Select pieces from your wardrobe to build an outfit here.</p></div>}
            {canvasItems.map((item) => <div key={item.instanceId} onPointerDown={(event) => handlePointerDown(event, item)} className={`group absolute touch-none cursor-grab select-none ${dragging === item.instanceId ? 'cursor-grabbing' : ''} ${selectedId === item.instanceId ? 'z-10' : 'z-[1]'}`} style={{ left: `${item.x}%`, top: `${item.y}%`, width: `${item.width}%`, transform: `scale(${zoom / 100})`, transformOrigin: 'top left' }}><div className={`relative rounded-xl p-2 transition-shadow ${selectedId === item.instanceId ? 'ring-1 ring-black/25 ring-offset-2' : ''}`}><img src={item.image} alt={item.name} className="pointer-events-none w-full object-contain mix-blend-multiply" /><button aria-label={`Remove ${item.name}`} onClick={(event) => { event.stopPropagation(); removeItem(item.instanceId) }} className="absolute -right-1 -top-1 flex size-6 items-center justify-center rounded-full bg-[#171717] text-white opacity-0 shadow-md transition-opacity group-hover:opacity-100"><X className="size-3" /></button><button aria-label={`Resize ${item.name}`} onPointerDown={(event) => handleResizePointerDown(event, item)} className="absolute -bottom-1 -right-1 size-4 cursor-se-resize rounded-full border-2 border-white bg-[#171717] opacity-0 shadow transition-opacity group-hover:opacity-100" /></div></div>)}
          </div>
          <div className="mt-4 flex items-center justify-between text-[10px] text-black/35"><span>{canvasItems.length} {canvasItems.length === 1 ? 'piece' : 'pieces'} on canvas</span><div className="flex items-center gap-4"><button onClick={() => setCanvasItems([])} className="flex items-center gap-1.5 hover:text-black"><Trash2 className="size-3.5" />Clear canvas</button><button onClick={() => { setCanvasItems([]); setSelectedId(null) }} className="flex items-center gap-1.5 hover:text-black"><RotateCcw className="size-3.5" />Reset</button></div></div>
        </section>
      </div>
    </main>
  )
}
