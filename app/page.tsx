'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

import { AvatarOnboarding } from '@/components/vton/avatar-onboarding'
import { FittingRoom } from '@/components/vton/fitting-room'

export default function Page() {
  const [avatarPhoto, setAvatarPhoto] = useState<string | null>(null)

  return (
    <AnimatePresence mode="wait">
      {avatarPhoto ? (
        <motion.div
          key="room"
          initial={{ opacity: 0, scale: 1.02 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <FittingRoom avatarPhoto={avatarPhoto} onRescan={() => setAvatarPhoto(null)} />
        </motion.div>
      ) : (
        <motion.div
          key="onboarding"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, filter: 'blur(8px)' }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <AvatarOnboarding onComplete={setAvatarPhoto} />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
