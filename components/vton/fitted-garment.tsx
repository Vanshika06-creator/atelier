'use client'

import type { KeyboardEvent, PointerEvent as ReactPointerEvent, RefObject } from 'react'
import { motion } from 'framer-motion'

import type { FittedGarment as Garment } from '@/lib/vton'
import { cn } from '@/lib/utils'

type Mode = 'move' | 'scale' | 'rotate'

type Props = {
  garment: Garment
  layer: number
  selected: boolean
  stageRef: RefObject<HTMLDivElement | null>
  onSelect: () => void
  onChange: (patch: Partial<Garment>) => void
  onRemove: () => void
}

const MIN_WIDTH = 32
const CORNERS = [
  { key: 'tl', className: '-left-3 -top-3 cursor-nwse-resize' },
  { key: 'tr', className: '-right-3 -top-3 cursor-nesw-resize' },
  { key: 'bl', className: '-bottom-3 -left-3 cursor-nesw-resize' },
  { key: 'br', className: '-bottom-3 -right-3 cursor-nwse-resize' },
]

export function FittedGarment({ garment, layer, selected, stageRef, onSelect, onChange, onRemove }: Props) {
  function startInteraction(e: ReactPointerEvent<HTMLElement>, mode: Mode) {
    const stage = stageRef.current
    if (!stage || e.button !== 0) return
    e.stopPropagation()
    e.preventDefault()
    onSelect()

    const rect = stage.getBoundingClientRect()
    const start = {
      px: e.clientX - rect.left,
      py: e.clientY - rect.top,
      x: garment.x,
      y: garment.y,
      width: garment.width,
    }
    const startDistance = Math.max(1, Math.hypot(start.px - start.x, start.py - start.y))
    const target = e.currentTarget
    target.setPointerCapture(e.pointerId)

    const handleMove = (ev: PointerEvent) => {
      const px = ev.clientX - rect.left
      const py = ev.clientY - rect.top

      if (mode === 'move') {
        onChange({ x: start.x + (px - start.px), y: start.y + (py - start.py) })
      } else if (mode === 'scale') {
        const distance = Math.hypot(px - start.x, py - start.y)
        const width = Math.min(rect.width * 2.5, Math.max(MIN_WIDTH, (start.width * distance) / startDistance))
        onChange({ width })
      } else {
        let angle = (Math.atan2(py - start.y, px - start.x) * 180) / Math.PI + 90
        if (ev.shiftKey) angle = Math.round(angle / 15) * 15
        else if (Math.abs(((angle + 540) % 360) - 180) < 3) angle = 0
        onChange({ rotation: ((angle + 540) % 360) - 180 })
      }
    }

    const handleEnd = () => {
      target.removeEventListener('pointermove', handleMove)
      target.removeEventListener('pointerup', handleEnd)
      target.removeEventListener('pointercancel', handleEnd)
    }

    target.addEventListener('pointermove', handleMove)
    target.addEventListener('pointerup', handleEnd)
    target.addEventListener('pointercancel', handleEnd)
  }

  function handleKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const step = e.shiftKey ? 10 : 2
    const moves: Record<string, Partial<Garment>> = {
      ArrowLeft: { x: garment.x - step },
      ArrowRight: { x: garment.x + step },
      ArrowUp: { y: garment.y - step },
      ArrowDown: { y: garment.y + step },
      '+': { width: garment.width * 1.04 },
      '=': { width: garment.width * 1.04 },
      '-': { width: Math.max(MIN_WIDTH, garment.width / 1.04) },
      '[': { rotation: garment.rotation - step },
      ']': { rotation: garment.rotation + step },
    }
    if (moves[e.key]) {
      e.preventDefault()
      onChange(moves[e.key])
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault()
      onRemove()
    }
  }

  return (
    <motion.div
      role="button"
      tabIndex={0}
      aria-label={`${garment.name}, layer ${layer}. Drag to move, use handles to resize or rotate.`}
      aria-pressed={selected}
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      onPointerDown={(e) => startInteraction(e, 'move')}
      onFocus={onSelect}
      onKeyDown={handleKeyDown}
      className="absolute cursor-grab touch-none select-none outline-none active:cursor-grabbing"
      style={{
        left: garment.x,
        top: garment.y,
        width: garment.width,
        height: garment.width / garment.aspect,
        zIndex: layer,
        translateX: '-50%',
        translateY: '-50%',
        rotate: garment.rotation,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={garment.src || '/placeholder.svg'}
        alt=""
        draggable={false}
        className="pointer-events-none size-full object-contain drop-shadow-[0_12px_18px_rgba(0,0,0,0.55)]"
      />

      {selected && (
        <>
          <div aria-hidden className="pointer-events-none absolute inset-0 rounded-sm border border-primary/80" />
          <div aria-hidden className="pointer-events-none absolute -top-8 left-1/2 h-8 w-px -translate-x-1/2 bg-primary/80" />
          <span
            aria-hidden
            onPointerDown={(e) => startInteraction(e, 'rotate')}
            className="absolute -top-12 left-1/2 flex size-7 -translate-x-1/2 cursor-grab items-center justify-center"
          >
            <span className="size-3.5 rounded-full border-2 border-primary bg-background shadow-md" />
          </span>
          {CORNERS.map((corner) => (
            <span
              key={corner.key}
              aria-hidden
              onPointerDown={(e) => startInteraction(e, 'scale')}
              className={cn('absolute flex size-6 items-center justify-center', corner.className)}
            >
              <span className="size-2.5 rounded-[2px] border border-primary bg-background shadow-md" />
            </span>
          ))}
        </>
      )}
    </motion.div>
  )
}
