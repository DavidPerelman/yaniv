---
title: GAME_SPEC
focus: arch
generated: 2026-03-24
---

# Yaniv — Authoritative Game Specification

This document defines the **intended** behavior. Where GAME_RULES.md describes what the code does, this document describes what it **should** do. Use this as the reference when fixing bugs or planning new features.

---

## Drawable Cards — Authoritative Spec

This is the most important clarification, as the current implementation diverges from intent.

### The Rule

When it is your turn to draw, **you draw from the cards that were discarded by the previous player** — specifically, from the subset computed by `computeDrawableCards` applied to their discard.

- You **cannot** draw a card you yourself just discarded.
- You can draw from the previous player's discarded set (edge cards of runs, any card of a set).

### State Flow (Correct)

```
prevPlayer discards [7♥, 7♦]
  → nextDrawableCards = computeDrawableCards([7♥, 7♦], oldTop) = [7♥, 7♦]
  → drawableDiscardCards unchanged (prevPlayer draws from the pre-existing drawable)

prevPlayer draws
  → drawableDiscardCards ← nextDrawableCards = [7♥, 7♦]
  → currentPlayer = B

Player B discards [K♠]
  → drawableDiscardCards must STAY as [7♥, 7♦]   ← do NOT overwrite
  → nextDrawableCards = computeDrawableCards([K♠], 7♦) = [7♦]

Player B draws
  → reads drawableDiscardCards = [7♥, 7♦] → can pick either card
  → drawableDiscardCards ← nextDrawableCards = [7♦]
```

### Correct Behavior by Discard Type (what the drawing player can take)

| Previous player discarded | Drawing player can take |
|---|---|
| Single card | That single card |
| Pair / Three-of-a-kind / Four-of-a-kind | Any card from the set |
| Run, Joker in middle gap | Either non-Joker edge card |
| Run, Joker at low edge | The Joker OR the high non-Joker edge |
| Run, Joker at high edge | The low non-Joker edge OR the Joker |
| Run, no Joker | Either non-Joker edge card |

### First Turn of Each Round

At the start of each round, one card is placed face-up on the discard pile.
`drawableDiscardCards` is initialized to that single face-up card.
The first player MAY draw that card from the pile, or draw from the deck.
`drawableDiscardCards` is never null at the start of a turn.

### What the Current Code Does Wrong

`applyDiscard` currently overwrites `drawableDiscardCards` with `[topBeforeDiscard]` (the previous top of pile, always one card). This replaces the correctly computed multi-card set with a single card. Fix: `applyDiscard` must **not** set `drawableDiscardCards`; it should only set `nextDrawableCards`.

---

## Turn Flow — Authoritative Spec

```
Your DISCARD phase:
  Option A: Discard a valid combination
    - Cards removed from hand, appended to discardPile
    - nextDrawableCards = computeDrawableCards(yourCards, topBeforeDiscard)
    - drawableDiscardCards preserved (from previous player's discard)
    - phase → "draw"
  Option B: Call Yaniv (if hand value ≤ 7, must be discard phase)

Your DRAW phase:
  Option A: Draw from deck (always available)
    - Top deck card → hand
  Option B: Draw from discardPile (if drawableDiscardCards is non-empty)
    - Pick any card from drawableDiscardCards
    - That specific card removed from discardPile → hand
    - If exactly 2 drawable cards: player must choose one (DrawablePicker UI)
    - If exactly 1 drawable card: direct draw

  After draw:
    - drawableDiscardCards ← nextDrawableCards
    - nextDrawableCards ← null
    - lastDiscardedCards ← null
    - phase → "discard"
    - currentPlayerIndex → next active non-eliminated player
```

---

## Yaniv Call — Authoritative Spec

- May only be called during the **discard phase** of the player's own turn
- Hand value must be ≤ 7 (`YANIV_THRESHOLD`)
- **Both client and server must enforce the phase check**
- Server: `applyYaniv` or the CALL_YANIV handler must verify `phase === "discard"` and `currentPlayerIndex matches socket`

---

## Disconnect During Active Game — Authoritative Spec

When a player disconnects while `room.status === "playing"`:

1. Emit `SYSTEM_MESSAGE` to the room.
2. Mark the player as `isEliminated = true` in gameState.
3. Check active players:
   - If only 1 active player remains → emit `GAME_OVER`, delete room, return.
4. **If the disconnected player was the current player** (`socket.id === gameState.players[currentPlayerIndex].id`):
   - Clear any running turn timer for the room.
   - Advance `currentPlayerIndex` to the next active player.
   - Reset `phase` to `"discard"`.
   - Start the turn timer for the new current player.
5. Broadcast updated game state.

---

## Score Bonus Application — Authoritative Spec

The 50→0 and 100→50 resets apply to **any player whose score changes** in a round (including the Yaniv caller if they are assafed). Players whose score does not change in a round (the Yaniv caller in a normal win, eliminated players) do not have the bonus check applied.

---

## Player Order — Authoritative Spec

- **Game start**: random first player.
- **Subsequent rounds**: the player who called Yaniv goes first.
- **New round**: `currentPlayerIndex` is set to the Yaniv caller's index after `createInitialGameState` (which initialises to a random index, then gets overridden).
- **Advancing turns**: always forward, wrapping around, skipping eliminated players.
