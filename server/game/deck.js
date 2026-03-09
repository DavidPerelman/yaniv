const RANK_ORDER = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']

export function getCardValue(card) {
  if (card.suit === 'JK' || card.rank === 'JK') return 0
  if (card.rank === 'A') return 1
  if (['J', 'Q', 'K'].includes(card.rank)) return 10
  return parseInt(card.rank)
}

export function createDeck() {
  const suits = ['H', 'D', 'C', 'S']
  const cards = []

  for (const suit of suits) {
    for (const rank of RANK_ORDER) {
      cards.push({ id: `${suit}${rank}`, suit, rank, value: getCardValue({ suit, rank }) })
    }
  }

  cards.push({ id: 'JK1', suit: 'JK', rank: 'JK', value: 0 })
  cards.push({ id: 'JK2', suit: 'JK', rank: 'JK', value: 0 })

  // Fisher-Yates shuffle
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[cards[i], cards[j]] = [cards[j], cards[i]]
  }

  return cards
}

export function calculateHandValue(cards) {
  return cards.reduce((sum, card) => sum + getCardValue(card), 0)
}

export { RANK_ORDER }

/* TESTS
 * createDeck:
 *   - Returns exactly 54 cards
 *   - Contains exactly 4 suits × 13 ranks = 52 regular cards
 *   - Contains exactly 2 jokers with ids 'JK1' and 'JK2'
 *   - All card ids are unique
 *   - Every card has id, suit, rank, value fields
 *   - Returns a different order on repeated calls (shuffle is random)
 *
 * getCardValue:
 *   - Ace returns 1
 *   - Number cards 2–10 return face value
 *   - J, Q, K return 10
 *   - Joker (suit 'JK') returns 0
 *
 * calculateHandValue:
 *   - Empty array returns 0
 *   - Single card returns its value
 *   - Mixed hand sums correctly
 *   - Joker contributes 0 to the sum
 */
