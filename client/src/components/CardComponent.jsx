import { motion } from 'framer-motion'

const SUITS = { H: '♥', D: '♦', C: '♣', S: '♠', JK: '🃏' }
const RED_SUITS = new Set(['H', 'D'])

export function FaceDownCard({ style }) {
  return (
    <div
      style={{
        width: '3rem',
        height: '4.5rem',
        borderRadius: '10px',
        background: 'linear-gradient(135deg, #1565c0 25%, #1976d2 100%)',
        border: '1px solid rgba(255,255,255,0.25)',
        boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...style,
      }}
    >
      <div
        style={{
          width: '55%',
          height: '65%',
          border: '2px solid rgba(255,255,255,0.3)',
          borderRadius: '4px',
          transform: 'rotate(45deg)',
        }}
      />
    </div>
  )
}

export default function CardComponent({ card, selected, onClick, small }) {
  const isJoker = card.suit === 'JK'
  const isRed = RED_SUITS.has(card.suit)
  const textColor = isRed ? '#d32f2f' : '#1a1a2e'

  const cardBackground = isJoker
    ? 'linear-gradient(135deg, #ff6b6b, #ffd93d, #6bcb77, #4d96ff)'
    : '#faf7f0'

  const selectedShadow = selected
    ? '0 0 16px rgba(245,200,66,0.6), 0 8px 20px rgba(0,0,0,0.35)'
    : '0 4px 8px rgba(0,0,0,0.25), 0 1px 2px rgba(0,0,0,0.15)'

  const selectedBorder = selected ? '2px solid #f5c842' : '1px solid #d4c5a0'

  return (
    <motion.div
      whileHover={onClick ? { y: -6, boxShadow: '0 8px 20px rgba(0,0,0,0.3)' } : {}}
      whileTap={onClick ? { scale: 0.95 } : {}}
      animate={{ y: selected ? -12 : 0 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      onClick={onClick}
      style={{
        width: small ? '2rem' : '4rem',
        height: small ? '3rem' : '5.75rem',
        borderRadius: small ? '6px' : '12px',
        background: cardBackground,
        border: selectedBorder,
        boxShadow: selectedShadow,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '5px 7px',
        cursor: onClick ? 'pointer' : 'default',
        userSelect: 'none',
        flexShrink: 0,
      }}
    >
      {/* Top-left: rank + suit */}
      <div style={{ color: isJoker ? 'white' : textColor, fontSize: small ? '7px' : '11px', fontWeight: 'bold', lineHeight: 1.2 }}>
        {isJoker ? '🃏' : (
          <>
            <div>{card.rank}</div>
            <div style={{ fontSize: small ? '6px' : '10px' }}>{SUITS[card.suit]}</div>
          </>
        )}
      </div>

      {/* Center: large suit */}
      {!small && (
        <div style={{
          color: isJoker ? 'white' : textColor,
          fontSize: '30px',
          lineHeight: 1,
          textAlign: 'center',
          alignSelf: 'center',
        }}>
          {SUITS[card.suit]}
        </div>
      )}

      {/* Bottom-right: rank + suit rotated */}
      <div style={{
        color: isJoker ? 'white' : textColor,
        fontSize: small ? '7px' : '11px',
        fontWeight: 'bold',
        lineHeight: 1.2,
        transform: 'rotate(180deg)',
        alignSelf: 'flex-end',
      }}>
        {isJoker ? '🃏' : (
          <>
            <div>{card.rank}</div>
            <div style={{ fontSize: '10px' }}>{SUITS[card.suit]}</div>
          </>
        )}
      </div>
    </motion.div>
  )
}
