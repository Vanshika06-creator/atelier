'use client'

import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'

export const AI_FIT_DURATION_MS = 4000

const STAGES = [
  'Running deep learning cloth physics...',
  'Blending lighting...',
  'Generating wrinkles...',
]

export function AiFitOverlay() {
  const stageSeconds = AI_FIT_DURATION_MS / 1000 / STAGES.length

  return (
    <motion.div
      role="status"
      aria-live="polite"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, filter: 'blur(6px)' }}
      transition={{ duration: 0.4 }}
      className="absolute inset-0 z-[1000] flex flex-col items-center justify-center overflow-hidden rounded-3xl bg-background/55 backdrop-blur-[3px]"
    >
      <motion.div
        aria-hidden
        className="absolute inset-x-0 h-24 bg-gradient-to-b from-transparent via-primary/25 to-transparent"
        initial={{ top: '-15%' }}
        animate={{ top: '105%' }}
        transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-[linear-gradient(to_right,oklch(0.8_0.08_80/0.07)_1px,transparent_1px),linear-gradient(to_bottom,oklch(0.8_0.08_80/0.07)_1px,transparent_1px)] bg-[size:28px_28px]"
      />

      <div className="relative mx-4 flex max-w-64 flex-col items-center gap-4 rounded-2xl border border-primary/30 bg-card/85 px-5 py-5 text-center shadow-2xl backdrop-blur-md">
        <span className="relative flex size-11 items-center justify-center">
          <motion.span
            aria-hidden
            className="absolute inset-0 rounded-full border border-primary/60"
            animate={{ scale: [1, 1.5], opacity: [0.8, 0] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: 'easeOut' }}
          />
          <span className="flex size-11 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Sparkles className="size-5" aria-hidden />
          </span>
        </span>

        <div className="relative h-10 w-full">
          {STAGES.map((text, i) => (
            <motion.p
              key={text}
              className="absolute inset-0 flex items-center justify-center text-sm leading-snug text-foreground"
              initial={{ opacity: 0, y: 6 }}
              animate={{
                opacity: i === STAGES.length - 1 ? [0, 1] : [0, 1, 1, 0],
                y: i === STAGES.length - 1 ? [6, 0] : [6, 0, 0, -6],
              }}
              transition={{
                delay: i * stageSeconds,
                duration: i === STAGES.length - 1 ? 0.35 : stageSeconds,
                times: i === STAGES.length - 1 ? [0, 1] : [0, 0.12, 0.85, 1],
              }}
            >
              {text}
            </motion.p>
          ))}
        </div>

        <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
          <motion.div
            className="h-full rounded-full bg-primary"
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ duration: AI_FIT_DURATION_MS / 1000, ease: [0.4, 0, 0.2, 1] }}
          />
        </div>
        <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">VTON engine · simulated</p>
      </div>
    </motion.div>
  )
}
