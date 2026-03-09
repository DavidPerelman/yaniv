import { motion } from 'framer-motion'

const AVATAR_COLORS = ['#1565c0', '#c62828', '#2e7d32', '#6a1b9a', '#e65100']

export default function OpponentArea({ player, isCurrentTurn }) {
  const avatarColor = AVATAR_COLORS[player.name.charCodeAt(0) % AVATAR_COLORS.length]
  const initial = player.name.charAt(0).toUpperCase()

  return (
    <motion.div
      animate={
        isCurrentTurn && !player.isEliminated
          ? { boxShadow: ['0 0 0px #f5c842', '0 0 20px #f5c842', '0 0 0px #f5c842'] }
          : { boxShadow: '0 0 0px transparent' }
      }
      transition={{ duration: 1.5, repeat: isCurrentTurn ? Infinity : 0 }}
      className={[
        'flex flex-col items-center gap-2 px-3 py-2 rounded-2xl transition-opacity',
        'bg-black/30 backdrop-blur-sm',
        isCurrentTurn ? 'border-2 border-gold' : 'border border-white/10',
        player.isEliminated ? 'opacity-40' : '',
      ].join(' ')}
      style={{ minWidth: '76px' }}
    >
      {/* Avatar circle */}
      <div
        style={{
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          background: avatarColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 'bold',
          fontSize: '15px',
          color: 'white',
          flexShrink: 0,
        }}
      >
        {initial}
      </div>

      {/* Name + score */}
      <div className="text-center">
        <div className="text-sm font-semibold text-white leading-tight">{player.name}</div>
        <div className="text-xs text-gray-300">{player.score} נק'</div>
      </div>

      {/* Mini stacked face-down cards */}
      <div className="flex items-center">
        {Array.from({ length: Math.min(player.cardCount, 5) }).map((_, i) => (
          <div
            key={i}
            style={{
              width: '14px',
              height: '20px',
              borderRadius: '3px',
              background: 'linear-gradient(135deg, #1565c0 25%, #1976d2 100%)',
              border: '1px solid rgba(255,255,255,0.2)',
              marginLeft: i > 0 ? '-5px' : 0,
              boxShadow: '0 2px 4px rgba(0,0,0,0.35)',
            }}
          />
        ))}
        {player.cardCount > 5 && (
          <span className="text-gray-400 text-xs mr-1">+{player.cardCount - 5}</span>
        )}
      </div>

      {player.isEliminated && <span className="text-red-400 text-xs">פסול</span>}
      {isCurrentTurn && !player.isEliminated && (
        <span className="text-xs font-bold" style={{ color: '#f5c842' }}>תורו ▶</span>
      )}
    </motion.div>
  )
}
