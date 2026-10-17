'use client'

import { useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ImagePlus, Shirt } from 'lucide-react'

import { WARDROBE_DRAG_TYPE, type WardrobeItem } from '@/lib/vton'

type Props = {
  items: WardrobeItem[]
  pendingIds: string[]
  onUpload: (files: File[]) => void
  onTryOn: (itemId: string) => void
}

export function WardrobePanel({ items, pendingIds, onUpload, onTryOn }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const isEmpty = items.length === 0 && pendingIds.length === 0

  return (
    <section aria-labelledby="wardrobe-heading" className="border-t border-border bg-card/60 backdrop-blur-xl">
      <div className="flex items-center justify-between px-5 pt-4 md:px-8">
        <div className="flex items-baseline gap-3">
          <h2 id="wardrobe-heading" className="font-serif text-xl">
            Wardrobe
          </h2>
          <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            {items.length} {items.length === 1 ? 'piece' : 'pieces'}
          </span>
        </div>
        <p className="hidden text-xs text-muted-foreground md:block">Drag a piece onto your avatar to try it on</p>
      </div>

      <div className="flex gap-3 overflow-x-auto px-5 pb-5 pt-3 md:px-8 [scrollbar-width:thin]">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="group flex h-36 w-28 shrink-0 flex-col items-center justify-center gap-2.5 rounded-xl border border-dashed border-primary/40 bg-background/40 text-center transition-colors hover:border-primary hover:bg-background/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
        >
          <span className="flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform group-hover:scale-105">
            <ImagePlus className="size-4" aria-hidden />
          </span>
          <span className="px-2 text-xs font-medium leading-tight">Upload New Clothing</span>
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          aria-label="Upload clothing images"
          onChange={(e) => {
            const files = Array.from(e.target.files ?? []).filter((f) => f.type.startsWith('image/'))
            if (files.length) onUpload(files)
            e.target.value = ''
          }}
        />

        {isEmpty && (
          <div className="flex h-36 min-w-56 flex-1 items-center gap-3 rounded-xl border border-border/60 px-5 text-muted-foreground">
            <Shirt className="size-5 shrink-0" aria-hidden />
            <p className="text-sm leading-relaxed">
              Your wardrobe is empty. Upload a garment photo to start styling.
            </p>
          </div>
        )}

        <AnimatePresence initial={false}>
          {items.map((item) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="shrink-0"
            >
              <button
                type="button"
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData(WARDROBE_DRAG_TYPE, item.id)
                  e.dataTransfer.effectAllowed = 'copy'
                }}
                onClick={() => onTryOn(item.id)}
                aria-label={`${item.name}. Drag onto avatar, or press to try on.`}
                className="group flex h-36 w-28 cursor-grab flex-col overflow-hidden rounded-xl border border-border bg-background/60 text-left transition-all hover:-translate-y-0.5 hover:border-primary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 active:cursor-grabbing"
              >
                <span className="flex flex-1 items-center justify-center bg-[radial-gradient(circle_at_center,oklch(0.25_0.01_75),transparent_75%)] p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.src || '/placeholder.svg'}
                    alt=""
                    draggable={false}
                    className="max-h-24 max-w-full object-contain transition-transform duration-300 group-hover:scale-105"
                  />
                </span>
                <span className="truncate border-t border-border px-2.5 py-1.5 text-[11px] text-muted-foreground">
                  {item.name}
                </span>
              </button>
            </motion.div>
          ))}

          {pendingIds.map((id) => (
            <motion.div
              key={id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              role="status"
              className="relative flex h-36 w-28 shrink-0 flex-col overflow-hidden rounded-xl border border-border bg-background/60"
            >
              <div className="relative flex-1 overflow-hidden bg-muted/40">
                <motion.div
                  aria-hidden
                  className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-foreground/10 to-transparent"
                  initial={{ left: '-50%' }}
                  animate={{ left: '120%' }}
                  transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
                />
                <div className="absolute inset-x-5 top-5 bottom-3 rounded-t-[40%] bg-muted/70" />
              </div>
              <span className="border-t border-border px-2.5 py-1.5 text-[11px] text-primary">Removing background...</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </section>
  )
}
