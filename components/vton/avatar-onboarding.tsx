'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ScanLine, Upload } from 'lucide-react'

import { cn } from '@/lib/utils'

const GENERATION_MS = 3000

export function AvatarOnboarding({ onComplete }: { onComplete: (photoSrc: string) => void }) {
  const [photo, setPhoto] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current)
  }, [])

  function handleFile(file: File | undefined) {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file (JPG, PNG or WEBP).')
      return
    }
    setError(null)
    const src = URL.createObjectURL(file)
    setPhoto(src)
    timerRef.current = setTimeout(() => onComplete(src), GENERATION_MS)
  }

  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-6 py-16">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,oklch(0.3_0.03_75/0.35),transparent_60%)]"
      />

      <header className="absolute inset-x-0 top-0 flex items-center justify-between px-6 py-5 md:px-10">
        <span className="font-serif text-2xl tracking-wide">Atelier</span>
        <span className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Virtual Try-On</span>
      </header>

      <AnimatePresence mode="wait">
        {photo ? (
          <GeneratingAvatar key="generating" photo={photo} />
        ) : (
          <motion.section
            key="upload"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="relative flex w-full max-w-xl flex-col items-center text-center"
          >
            <p className="text-xs uppercase tracking-[0.35em] text-primary">Step 01 — Your avatar</p>
            <h1 className="mt-5 text-balance font-serif text-5xl leading-[1.05] md:text-6xl">
              Your private fitting room
            </h1>
            <p className="mt-5 max-w-md text-pretty leading-relaxed text-muted-foreground">
              Upload your full-body photo to create your lifelike digital avatar.
            </p>

            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault()
                setIsDragging(true)
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault()
                setIsDragging(false)
                handleFile(e.dataTransfer.files[0])
              }}
              className={cn(
                'group mt-10 flex w-full flex-col items-center gap-5 rounded-2xl border border-dashed border-border bg-card/40 px-8 py-14 transition-all duration-300',
                'hover:border-primary/60 hover:bg-card/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60',
                isDragging && 'scale-[1.01] border-primary bg-card/80',
              )}
            >
              <span className="flex size-14 items-center justify-center rounded-full border border-border bg-background transition-colors group-hover:border-primary/60">
                <Upload className="size-5 text-primary" aria-hidden />
              </span>
              <span className="flex flex-col gap-1.5">
                <span className="text-base font-medium">Drop your photo here, or browse</span>
                <span className="text-sm text-muted-foreground">JPG, PNG or WEBP · full body, head to toe</span>
              </span>
            </button>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="sr-only"
              aria-label="Upload full-body photo"
              onChange={(e) => handleFile(e.target.files?.[0])}
            />

            {error && (
              <p role="alert" className="mt-4 text-sm text-destructive">
                {error}
              </p>
            )}

            <ul className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
              <li>Stand straight</li>
              <li aria-hidden>·</li>
              <li>Plain background</li>
              <li aria-hidden>·</li>
              <li>Arms slightly apart</li>
            </ul>
          </motion.section>
        )}
      </AnimatePresence>
    </main>
  )
}

function GeneratingAvatar({ photo }: { photo: string }) {
  return (
    <motion.section
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.03 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="relative flex flex-col items-center gap-8"
      aria-live="polite"
    >
      <div className="relative h-[52vh] max-h-[520px] min-h-[320px] aspect-[3/4] overflow-hidden rounded-2xl border border-border bg-card">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photo} alt="Your uploaded photo" className="size-full object-cover grayscale-[0.6]" />
        <div
          aria-hidden
          className="absolute inset-0 bg-[linear-gradient(to_right,oklch(0.82_0.07_80/0.12)_1px,transparent_1px),linear-gradient(to_bottom,oklch(0.82_0.07_80/0.12)_1px,transparent_1px)] bg-[size:24px_24px]"
        />
        <motion.div
          aria-hidden
          className="absolute inset-x-0 h-24 bg-gradient-to-b from-transparent via-primary/30 to-transparent"
          initial={{ top: '-15%' }}
          animate={{ top: ['-15%', '100%', '-15%'] }}
          transition={{ duration: 2.4, ease: 'easeInOut', repeat: Infinity }}
        >
          <div className="absolute inset-x-0 top-1/2 h-px bg-primary shadow-[0_0_16px_2px] shadow-primary/70" />
        </motion.div>
        {[
          ['18%', '50%'],
          ['32%', '34%'],
          ['32%', '66%'],
          ['52%', '50%'],
          ['74%', '40%'],
          ['74%', '60%'],
        ].map(([top, left], i) => (
          <motion.span
            key={`${top}-${left}`}
            aria-hidden
            className="absolute size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary shadow-[0_0_10px_2px] shadow-primary/60"
            style={{ top, left }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: [0, 1, 0.6], scale: [0, 1.4, 1] }}
            transition={{ delay: 0.3 + i * 0.3, duration: 0.6 }}
          />
        ))}
        <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-background/70 px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] backdrop-blur">
          <ScanLine className="size-3 text-primary" aria-hidden />
          Scanning
        </div>
      </div>

      <div className="flex w-full max-w-sm flex-col items-center gap-4 text-center">
        <p className="text-balance font-serif text-2xl leading-snug">
          Generating your digital statue and mapping body proportions...
        </p>
        <div className="h-px w-full overflow-hidden bg-border">
          <motion.div
            className="h-full bg-primary"
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ duration: GENERATION_MS / 1000, ease: 'easeInOut' }}
          />
        </div>
      </div>
    </motion.section>
  )
}
