const SUIT_SYMBOLS = { H: '♥', D: '♦', C: '♣', S: '♠', JK: '🃏' }
const RED_SUITS = new Set(['H', 'D'])

export default function CardComponent({ card, selected, onClick }) {
  const isJoker = card.suit === 'JK'
  const isRed = RED_SUITS.has(card.suit)

  return (
    <button
      onClick={onClick}
      className={[
        'relative flex flex-col justify-between rounded-lg px-2 py-1 w-14 h-20 font-bold shadow-md transition select-none',
        'bg-card text-black',
        isRed ? 'text-red-600' : 'text-gray-900',
        selected
          ? 'border-4 border-yellow-400 -translate-y-3'
          : 'border-2 border-gray-300 hover:-translate-y-1',
      ].join(' ')}
    >
      <span className="text-sm leading-none">{isJoker ? '🃏' : card.rank}</span>
      <span className="text-xl leading-none self-center">{SUIT_SYMBOLS[card.suit]}</span>
      <span className="text-sm leading-none self-end rotate-180">{isJoker ? '🃏' : card.rank}</span>
    </button>
  )
}
