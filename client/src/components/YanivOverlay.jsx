import { motion } from 'framer-motion'

const CONFETTI_COLORS = ['#f5c842', '#d32f2f', '#1565c0', '#2e7d32', '#9c27b0', '#ff6b35']

function Confetti() {
  const pieces = Array.from({ length: 12 }, (_, i) => {
    const angle = (i / 12) * 360
    const dist = 120 + (i % 3) * 40
    const tx = Math.cos((angle * Math.PI) / 180) * dist
    const ty = Math.sin((angle * Math.PI) / 180) * dist
    return { tx, ty, color: CONFETTI_COLORS[i % CONFETTI_COLORS.length], i }
  })

  return (
    <div style={{ position: 'absolute', top: '50%', left: '50%', pointerEvents: 'none' }}>
      {pieces.map(({ tx, ty, color, i }) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            width: '10px',
            height: '10px',
            background: color,
            borderRadius: '2px',
            '--tx': `${tx}px`,
            '--ty': `${ty}px`,
            animation: 'confettiFly 1.4s ease-out forwards',
            animationDelay: `${i * 0.05}s`,
          }}
        />
      ))}
    </div>
  )
}

export default function YanivOverlay({ roundResult, myId }) {
  const { callerId, callerName, callerWasAssafed, assaferId, assaferName } = roundResult

  const isCaller = myId === callerId
  const isAssafer = myId === assaferId
  const showConfetti = !callerWasAssafed || isAssafer

  let headline, subline, emoji, color, shadowColor

  if (!callerWasAssafed) {
    headline = 'יָנִיב!'
    color = '#f5c842'
    shadowColor = 'rgba(245,200,66,0.6)'
    if (isCaller) {
      subline = 'כל הכבוד! 🏅'
      emoji = '🎉'
    } else {
      subline = `${callerName} קרא יניב!`
      emoji = '🃏'
    }
  } else {
    headline = 'אָסַף!'
    if (isCaller) {
      color = '#ef5350'
      shadowColor = 'rgba(211,47,47,0.6)'
      subline = 'נתפסת! +30 נקודות 😢'
      emoji = '😱'
    } else if (isAssafer) {
      color = '#66bb6a'
      shadowColor = 'rgba(46,125,50,0.6)'
      subline = `עשית אסף ל-${callerName}! 🎯`
      emoji = '🎯'
    } else {
      color = '#ef5350'
      shadowColor = 'rgba(211,47,47,0.6)'
      subline = `${callerName} נתפס על ידי ${assaferName ?? ''}!`
      emoji = '😱'
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
      style={{ background: 'rgba(0,0,0,0.6)' }}
    >
      <div style={{ position: 'relative' }}>
        {showConfetti && <Confetti />}
        <motion.div
          initial={{ scale: 0, rotate: callerWasAssafed ? 0 : -10 }}
          animate={{ scale: [0, 1.3, 1], rotate: 0 }}
          transition={{ duration: 0.5, type: 'spring' }}
          className="flex flex-col items-center gap-3 text-center"
        >
          <div
            className="font-bold"
            style={{
              fontSize: '80px',
              fontFamily: 'Fredoka One, cursive',
              lineHeight: 1,
              color,
              textShadow: `0 0 30px ${shadowColor}`,
            }}
          >
            {headline}
          </div>
          <div className="text-4xl mt-2">{emoji}</div>
          <div className="text-xl text-white/80 mt-1">{subline}</div>
        </motion.div>
      </div>
    </div>
  )
}
