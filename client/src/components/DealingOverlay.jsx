import { useEffect } from 'react'
import { motion } from 'framer-motion'

export default function DealingOverlay({ players, onComplete }) {
  useEffect(() => {
    const t = setTimeout(onComplete, 1500)
    return () => clearTimeout(t)
  }, [])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.65)' }}
    >
      <div className="flex flex-col items-center gap-6">
        <motion.h2
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
          style={{ fontFamily: 'Fredoka One, cursive', fontSize: '2rem', color: '#f5c842' }}
        >
          מחלק קלפים...
        </motion.h2>

        <div className="flex gap-2">
          {[0, 1, 2, 3, 4].map(i => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: -40, rotateY: 180 }}
              animate={{ opacity: 1, y: 0, rotateY: 0 }}
              transition={{ delay: i * 0.15, type: 'spring', stiffness: 200, damping: 18 }}
              style={{
                width: '3rem',
                height: '4.5rem',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #1565c0 25%, #1976d2 100%)',
                border: '1px solid rgba(255,255,255,0.25)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
