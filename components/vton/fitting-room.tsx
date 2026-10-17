'use client'

import { useCallback, useRef, useState, type DragEvent } from 'react'
import { motion } from 'framer-motion'
import { BringToFront, Eraser, RefreshCw, SendToBack, Trash2 } from 'lucide-react'

import { FittedGarment } from '@/components/vton/fitted-garment'
import { WardrobePanel } from '@/components/vton/wardrobe-panel'
import { Button } from '@/components/ui/button'
import {
  WARDROBE_DRAG_TYPE,
  fileLabel,
  readImageFile,
  wait,
  type FittedGarment as Garment,
  type WardrobeItem,
} from '@/lib/vton'
import { cn } from '@/lib/utils'

const BACKGROUND_REMOVAL_MS = 2000

type Props = {
  avatarPhoto: string
  onRescan: () => void
}

export function FittingRoom({ avatarPhoto, onRescan }: Props) {
  const [wardrobe, setWardrobe] = useState<WardrobeItem[]>([])
  const [pendingIds, setPendingIds] = useState<string[]>([])
  const [garments, setGarments] = useState<Garment[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isDropTarget, setIsDropTarget] = useState(false)
  const stageRef = useRef<HTMLDivElement>(null)

  async function handleUpload(files: File[]) {
    await Promise.all(
      files.map(async (file) => {
        const id = crypto.randomUUID()
        setPendingIds((prev) => [...prev, id])
        try {
          const [image] = await Promise.all([readImageFile(file), wait(BACKGROUND_REMOVAL_MS)])
          setWardrobe((prev) => [...prev, { id, name: fileLabel(file), ...image }])
        } finally {
          setPendingIds((prev) => prev.filter((p) => p !== id))
        }
      }),
    )
  }

  function placeGarment(itemId: string, point?: { x: number; y: number }) {
    const item = wardrobe.find((w) => w.id === itemId)
    const stage = stageRef.current
    if (!item || !stage) return
    const { width, height } = stage.getBoundingClientRect()
    const garment: Garment = {
      instanceId: crypto.randomUUID(),
      itemId: item.id,
      name: item.name,
      src: item.src,
      aspect: item.aspect,
      x: point?.x ?? width / 2,
      y: point?.y ?? height * 0.38,
      width: width * 0.55,
      rotation: 0,
    }
    setGarments((prev) => [...prev, garment])
    setSelectedId(garment.instanceId)
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setIsDropTarget(false)
    const itemId = e.dataTransfer.getData(WARDROBE_DRAG_TYPE)
    const stage = stageRef.current
    if (!itemId || !stage) return
    const rect = stage.getBoundingClientRect()
    placeGarment(itemId, { x: e.clientX - rect.left, y: e.clientY - rect.top })
  }

  const updateGarment = useCallback((instanceId: string, patch: Partial<Garment>) => {
    setGarments((prev) => prev.map((g) => (g.instanceId === instanceId ? { ...g, ...patch } : g)))
  }, [])

  function removeGarment(instanceId: string | null) {
    if (!instanceId) return
    setGarments((prev) => prev.filter((g) => g.instanceId !== instanceId))
    setSelectedId(null)
  }

  function shiftLayer(direction: 1 | -1) {
    setGarments((prev) => {
      const index = prev.findIndex((g) => g.instanceId === selectedId)
      const target = index + direction
      if (index < 0 || target < 0 || target >= prev.length) return prev
      const next = [...prev]
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
  }

  const selectedIndex = garments.findIndex((g) => g.instanceId === selectedId)
  const selected = selectedIndex >= 0 ? garments[selectedIndex] : null

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <header className="flex items-center justify-between gap-4 border-b border-border px-5 py-3 md:px-8">
        <div className="flex items-baseline gap-4">
          <span className="font-serif text-2xl tracking-wide">Atelier</span>
          <span className="hidden text-xs uppercase tracking-[0.3em] text-muted-foreground sm:inline">
            The Fitting Room
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={avatarPhoto || '/placeholder.svg'}
              alt="Your body scan reference"
              className="size-9 rounded-full border border-border object-cover"
            />
            <span className="hidden text-xs leading-tight text-muted-foreground md:block">
              Avatar
              <br />
              <span className="text-foreground">Calibrated</span>
            </span>
          </div>
          <Button variant="outline" size="sm" onClick={onRescan}>
            <RefreshCw aria-hidden />
            Rescan
          </Button>
        </div>
      </header>

      <main className="relative flex min-h-0 flex-1 items-center justify-center px-4 py-6">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,oklch(0.24_0.02_75/0.5),transparent_65%)]"
        />

        <div className="relative flex h-full items-center gap-3 md:gap-5">
          <div
            ref={stageRef}
            onPointerDown={() => setSelectedId(null)}
            onDragOver={(e) => {
              if (!e.dataTransfer.types.includes(WARDROBE_DRAG_TYPE)) return
              e.preventDefault()
              e.dataTransfer.dropEffect = 'copy'
              setIsDropTarget(true)
            }}
            onDragLeave={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setIsDropTarget(false)
            }}
            onDrop={handleDrop}
            className={cn(
              'relative aspect-[768/1376] h-full max-w-[calc(100vw-5rem)] rounded-3xl transition-shadow duration-300',
              isDropTarget && 'shadow-[0_0_0_1px] shadow-primary/70',
            )}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/avatar/mannequin.png"
              alt="Your digital avatar"
              draggable={false}
              className="pointer-events-none size-full select-none object-contain [mask-image:radial-gradient(ellipse_70%_60%_at_50%_50%,black_70%,transparent_100%)]"
            />

            {garments.map((garment, index) => (
              <FittedGarment
                key={garment.instanceId}
                garment={garment}
                layer={index + 1}
                selected={garment.instanceId === selectedId}
                stageRef={stageRef}
                onSelect={() => setSelectedId(garment.instanceId)}
                onChange={(patch) => updateGarment(garment.instanceId, patch)}
                onRemove={() => removeGarment(garment.instanceId)}
              />
            ))}

            {isDropTarget && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="pointer-events-none absolute inset-x-0 bottom-6 flex justify-center"
              >
                <span className="rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
                  Release to try on
                </span>
              </motion.div>
            )}

            {garments.length === 0 && !isDropTarget && (
              <p className="pointer-events-none absolute inset-x-0 bottom-4 text-center text-xs uppercase tracking-[0.25em] text-muted-foreground">
                Drag clothing onto your avatar
              </p>
            )}
          </div>

          <div
            role="toolbar"
            aria-label="Garment tools"
            aria-orientation="vertical"
            className="flex flex-col gap-1 rounded-2xl border border-border bg-card/70 p-1.5 backdrop-blur"
          >
            <ToolButton
              label="Remove selected garment"
              disabled={!selected}
              onClick={() => removeGarment(selectedId)}
              className="hover:bg-destructive/15 hover:text-destructive"
            >
              <Trash2 />
            </ToolButton>
            <div className="mx-2 my-1 h-px bg-border" />
            <ToolButton
              label="Bring forward"
              disabled={!selected || selectedIndex === garments.length - 1}
              onClick={() => shiftLayer(1)}
            >
              <BringToFront />
            </ToolButton>
            <ToolButton label="Send backward" disabled={!selected || selectedIndex === 0} onClick={() => shiftLayer(-1)}>
              <SendToBack />
            </ToolButton>
            <div className="mx-2 my-1 h-px bg-border" />
            <ToolButton
              label="Clear all garments"
              disabled={garments.length === 0}
              onClick={() => {
                setGarments([])
                setSelectedId(null)
              }}
            >
              <Eraser />
            </ToolButton>
          </div>
        </div>

        {selected && (
          <p className="pointer-events-none absolute left-5 top-4 hidden text-xs text-muted-foreground md:block">
            <span className="text-foreground">{selected.name}</span> · Layer {selectedIndex + 1} of {garments.length}
            <span className="mt-1 block text-[11px]">Drag to move · corners to resize · top knob to rotate (Shift snaps)</span>
          </p>
        )}
      </main>

      <WardrobePanel
        items={wardrobe}
        pendingIds={pendingIds}
        onUpload={handleUpload}
        onTryOn={(id) => placeGarment(id)}
      />
    </div>
  )
}

function ToolButton({
  label,
  className,
  ...props
}: { label: string } & React.ComponentProps<typeof Button>) {
  return (
    <Button
      variant="ghost"
      size="icon-lg"
      aria-label={label}
      title={label}
      className={cn('rounded-xl [&_svg]:size-4', className)}
      {...props}
    />
  )
}
