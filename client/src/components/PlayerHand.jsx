import CardComponent from './CardComponent'

export default function PlayerHand({ cards, onCardSelect, selectedCards }) {
  const selectedIds = new Set(selectedCards.map(c => c.id))

  return (
    <div className="flex flex-wrap justify-center gap-2 p-2">
      {cards.map(card => (
        <CardComponent
          key={card.id}
          card={card}
          selected={selectedIds.has(card.id)}
          onClick={() => onCardSelect(card)}
        />
      ))}
    </div>
  )
}
