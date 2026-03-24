---
title: GAME_RULES
focus: arch
generated: 2026-03-24
---

# Yaniv — Complete Game Logic Reference

Source files: `server/game/gameLogic.js`, `server/game/deck.js`, `shared/constants.js`

---

## 1. The Deck

54 cards total:
- 4 suits × 13 ranks = 52 standard cards (suits: H, D, C, S)
- 2 Jokers (ids: `JK1`, `JK2`, suit: `JK`, rank: `JK`)

The deck is Fisher-Yates shuffled on creation. Each card has `{ id, suit, rank, value }`.

---

## 2. Card Values

| Card | Value |
|---|---|
| Ace (A) | 1 |
| 2 – 10 | Face value |
| Jack (J) | 10 |
| Queen (Q) | 10 |
| King (K) | 10 |
| Joker | 0 |

A player's **hand value** is the sum of all card values in their hand. Jokers contribute 0.

---

## 3. Game Setup

- Each player receives 5 cards.
- The discard pile starts with 1 face-up card.
- The starting player is chosen randomly (`Math.floor(Math.random() * players.length)`).
- Phase starts at `"discard"`. Round number starts at 1.
- All players start with score 0, `isEliminated: false`.

---

## 4. Turn Flow

Each turn has two phases, always in this order:

```
DISCARD phase  →  player discards 1+ cards  →  DRAW phase  →  player draws 1 card  →  next player's DISCARD phase
```

The current player is identified by `gameState.currentPlayerIndex` (index into `gameState.players[]`).

### 4a. Discard Phase

The current player must discard one valid combination from their hand (see §5).

On a valid discard:
- The discarded cards are appended to the end of `discardPile`.
- They are removed from the player's hand.
- Phase advances to `"draw"`.
- `drawableDiscardCards` is set to the **previous top card** of the discard pile (the card that was on top before this discard). This is what the player can draw if they choose the discard pile.
- `nextDrawableCards` is computed via `computeDrawableCards` (see §6) — this becomes available after the draw.
- `lastDiscardedCards` records the just-discarded cards (used by timer expiry logic).

Special case: the player may instead **call Yaniv** before discarding (see §7).

### 4b. Draw Phase

The current player must draw exactly one card from either:
- **The deck** (top card, face-down)
- **The discard pile** (one of the drawable cards — see §6)

On draw from deck:
- If the deck is empty, the discard pile (all cards except the current top) is shuffled and becomes the new deck.
- The top card of the deck is removed and added to the player's hand.

On draw from discard:
- The player specifies which drawable card they want (by `cardId`).
- That card is removed from `discardPile` and added to the player's hand.

After a successful draw:
- Phase resets to `"discard"`.
- `currentPlayerIndex` advances to the next active (non-eliminated) player (see §8).
- `drawableDiscardCards` is updated to `nextDrawableCards` (the set computed at discard time).
- `lastDiscardedCards` is cleared to `null`.

---

## 5. Valid Discard Combinations

A discard is valid if the cards form one of the following:

### Single Card
Any single card is always valid.

### Pair (2 cards)
Both cards must share the same rank. A Joker counts as any rank — one Joker + one non-Joker of any rank is a valid pair.

### Three-of-a-Kind / Four-of-a-Kind (3–4 cards)
All non-Joker cards must share the same rank. Jokers fill the remaining slots. Example: `7♥ 7♦ JK` is a valid three-of-a-kind.

- All-Joker combinations (2 Jokers) are also valid as a set.
- Maximum 4 cards for a set.

### Sequence / Run (3+ cards)
All non-Joker cards must share the same **suit** and have **consecutive ranks** (using rank order A 2 3 4 5 6 7 8 9 10 J Q K). Jokers fill gaps or extend edges.

Rules:
- Duplicate ranks among non-Jokers → invalid.
- Mixed suits among non-Jokers → invalid.
- The span of ranks covered must be ≤ total cards in the combination (i.e., enough Jokers to fill all gaps).

Examples:
- `4♥ 5♥ 6♥` — valid run of 3
- `4♥ JK 6♥` — valid run (Joker fills the 5)
- `JK 5♥ 6♥ 7♥` — valid run (Joker acts as 4 or 8 at the edge)
- `4♥ 6♥` — invalid (only 2 cards, not a pair, and would need a run of 3)

---

## 6. computeDrawableCards — What Can Be Drawn from the Discard Pile

After a player discards, only specific cards from the discard pile may be drawn on the following turn. The logic depends on what was just discarded:

### Single card discarded
Only the **previous top card** (the card that was on top before this discard) is drawable. The newly discarded card itself is not immediately drawable.

### Set discarded (pair, three/four-of-a-kind, or all-Jokers)
All cards in the just-discarded combination are drawable. The opponent may pick any card from the set.

### Run discarded — Joker in the middle
The Joker fills an internal gap (e.g., `4♥ JK 6♥`). Only the **two non-Joker edge cards** are drawable (the 4 and the 6). The Joker is not drawable.

### Run discarded — Joker at an edge (low or high)
- If the Joker is at the **low end** (e.g., `JK 5♥ 6♥`): the Joker and the **high edge non-Joker** are drawable (JK and 6♥).
- If the Joker is at the **high end** (e.g., `4♥ 5♥ JK`): the **low edge non-Joker** and the Joker are drawable (4♥ and JK).

### Run discarded — no Joker
The **lowest** and **highest** rank cards in the run are drawable.

### Summary table

| Discard type | Drawable cards |
|---|---|
| Single card | Previous top card only |
| Set (same rank) | All discarded cards |
| Run, Joker in middle gap | Low edge non-Joker + high edge non-Joker |
| Run, Joker at low edge | Low edge Joker + high edge non-Joker |
| Run, Joker at high edge | Low edge non-Joker + high edge Joker |
| Run, no Joker | Low edge non-Joker + high edge non-Joker |

When there is only one drawable card, the draw is immediate. When there are two, the player must choose one.

---

## 7. Yaniv — Calling and Assaf

### Calling Yaniv
A player may call Yaniv at the **start of their discard phase** (before discarding) if their hand value is **≤ 7**.

Threshold: `YANIV_THRESHOLD = 7`

### Normal Yaniv Win
If no opponent has a hand value ≤ the caller's hand value:
- The caller wins the round.
- All other active players **add their hand value to their score**.
- The caller's score is unchanged.

### Assaf (被 Assaf'd)
If **any other active player** has a hand value **≤ the caller's hand value**, the caller is "assafed":
- The caller receives a **+30 penalty** added to their score. (`YANIV_PENALTY = 30`)
- All other players' scores are **unchanged** (nobody else scores in an assaf round).
- Only the first qualifying opponent is recorded as the assafer, but the condition checks all opponents.

---

## 8. Scoring Rules

### Score Accumulation
Scores increase over rounds. Lower scores are better.

### Elimination
A player is eliminated when their score **exceeds 100** after a round. (`SCORE_LIMIT = 100`)

### Bonus Resets
Exact scores of 50 or 100 trigger a reset instead of elimination:

| Score reaches | Result |
|---|---|
| Exactly 50 | Score resets to **0** (`reset_50`) |
| Exactly 100 | Score resets to **50** (`reset_100`) |
| > 100 | Player is **eliminated** |

These bonuses apply to any player whose score changes in a round (including the assafed caller).

### Winning
The game ends when only one non-eliminated player remains. That player is the winner.

Edge case: if all remaining players are eliminated simultaneously in the same round (e.g., multiple players simultaneously go over 100), the player with the **lowest score** among them is declared the winner.

---

## 9. Advancing currentPlayerIndex

After each successful draw, the turn advances to the **next active (non-eliminated) player**:

```
Starting from currentPlayerIndex, scan forward (with wrap-around) until
a player with isEliminated === false is found.
```

Eliminated players are skipped entirely. If all players are somehow eliminated (edge case), the index stays at the current position.

---

## 10. Round Transitions

After a Yaniv round ends (and the game is not over), a new round begins after a **3-second delay** (to allow UI overlays to display).

On new round:
- A fresh deck is created and dealt (5 cards per player).
- **Scores and elimination status are preserved** from the previous round.
- `roundNumber` increments by 1.
- The **Yaniv caller** from the previous round goes **first** in the new round (`currentPlayerIndex` is set to the caller's index).

---

## 11. Timer Behavior

The turn timer is optional (`timerSeconds: 0` means no timer). Valid values: 0, 15, 30, 60 seconds.

The timer starts on each `DRAW` event (beginning of a new discard phase).

### On expiry:

**If the expired player is in the draw phase** (they discarded but haven't drawn):
- Their discarded cards are returned to their hand (undoing the discard).
- `lastDiscardedCards` is cleared.
- `discardPile` has the returned cards removed.

**After the above (or if expired during discard phase directly):**
- `currentPlayerIndex` advances to the next active player.
- Phase resets to `"discard"`.
- The timer restarts for the next player.
- Game state is broadcast to all players.

The timer does **not** automatically call Yaniv or draw cards on behalf of the player — it simply skips their turn and (if they were mid-turn in draw phase) undoes their discard.
