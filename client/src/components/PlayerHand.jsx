import { AnimatePresence, motion } from 'framer-motion'
import CardComponent from './CardComponent'

export default function PlayerHand({ cards, onCardSelect, selectedCards }) {
  const selectedIds = new Set(selectedCards.map(c => c.id))
  const total = cards.length

  return (
    <div className="flex gap-1 flex-nowrap items-end justify-center">
      <AnimatePresence>
        {cards.map((card, i) => {
          const center = (total - 1) / 2
          const rotation = (i - center) * 1.5
          const yOffset = Math.abs(i - center) * 2

          return (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, y: 60, rotate: -10 }}
              animate={{ opacity: 1, y: yOffset, rotate: rotation }}
              exit={{ opacity: 0, y: -40, scale: 0.8 }}
              transition={{ delay: i * 0.05, type: 'spring', stiffness: 300 }}
              style={{ marginLeft: i > 0 ? '-6px' : 0 }}
            >
              <CardComponent
                card={card}
                selected={selectedIds.has(card.id)}
                onClick={() => onCardSelect(card)}
              />
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
