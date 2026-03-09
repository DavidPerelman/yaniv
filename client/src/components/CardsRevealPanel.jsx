import { motion } from 'framer-motion'
import CardComponent from './CardComponent'

export default function CardsRevealPanel({ playerResults, myId }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-black/10 rounded-2xl p-3 w-full"
    >
      {playerResults.map((player, i) => (
        <div
          key={player.id}
          className={`flex items-center gap-3 mb-3 p-2 rounded-xl
            ${player.id === myId ? 'border border-yellow-400/60 bg-yellow-400/10' : ''}`}
        >
          {/* Avatar */}
          <div className="w-8 h-8 rounded-full bg-green-700 flex items-center justify-center text-white font-bold text-sm shrink-0">
            {player.name[0]}
          </div>
          {/* Name + value */}
          <div className="w-20 shrink-0">
            <div className="text-gray-800 text-sm font-semibold truncate">{player.name}</div>
            <div className="text-gray-500 text-xs">סכום: {player.handValue ?? '-'}</div>
          </div>
          {/* Cards */}
          <div className="flex gap-1 flex-wrap">
            {(player.hand ?? []).map((card, j) => (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 + j * 0.08 }}
              >
                <CardComponent card={card} selected={false} onClick={null} small />
              </motion.div>
            ))}
          </div>
        </div>
      ))}
    </motion.div>
  )
}
