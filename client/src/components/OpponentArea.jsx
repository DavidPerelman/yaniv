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
        'flex flex-col items-center gap-1 p-2 md:p-3 rounded-2xl transition-opacity',
        'bg-black/30 backdrop-blur-sm',
        isCurrentTurn ? 'border-2 border-yellow-400' : 'border border-white/10',
        player.isEliminated ? 'opacity-40' : '',
      ].join(' ')}
      style={{ minWidth: '72px' }}
    >
      {/* Avatar circle */}
      <div
        className="w-7 h-7 md:w-9 md:h-9 rounded-full flex items-center justify-center font-bold text-white text-sm shrink-0"
        style={{ background: avatarColor }}
      >
        {initial}
      </div>

      {/* Name + score */}
      <div className="text-center">
        <div className="text-xs md:text-sm font-semibold text-white leading-tight truncate max-w-[70px]">
          {player.name}
        </div>
        <div className="text-xs text-white/60">{player.score} נק'</div>
      </div>

      {/* Mini face-down cards */}
      <div className="flex items-center justify-center">
        {Array.from({ length: Math.min(player.cardCount, 5) }).map((_, i) => (
          <div
            key={i}
            className="w-4 h-6 md:w-5 md:h-7 rounded bg-blue-700 border border-blue-500"
            style={{ marginLeft: i > 0 ? '-5px' : 0 }}
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
