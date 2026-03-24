---
title: KNOWN_BUGS
focus: concerns
generated: 2026-03-24
---

# Known Bugs

---

## BUG-01 — Drawable picker never activates; multi-card draws always collapse to one card

**Severity:** High — core game mechanic broken
**Status:** Open

### Symptom

When the previous player discards a pair, three-of-a-kind, or a run, the drawing player should be able to choose which card to take from the discarded set. Instead, they can only draw one specific card (the last card appended to the pile). The `DrawablePicker` modal never appears. The visual fan display on the discard pile (during the discard phase) shows the correct multi-card set, but by draw phase it collapses to one card.

### Root Cause

**File:** `server/game/gameLogic.js` — `applyDiscard` (line ~184)

```js
// Current (broken):
drawableDiscardCards: topBeforeDiscard ? [topBeforeDiscard] : [],
nextDrawableCards: computeDrawableCards(cards, topBeforeDiscard),
```

`applyDiscard` unconditionally overwrites `drawableDiscardCards` with `[topBeforeDiscard]` (the single card that was on top before this discard). This happens at the transition to draw phase. But `drawableDiscardCards` at this point **should remain unchanged** — it holds the multi-card set computed from the *previous* player's discard, which is exactly what the current player should be able to draw from.

`computeDrawableCards` is correctly stored in `nextDrawableCards` and correctly promoted to `drawableDiscardCards` after the draw (`applyDraw`). But the next player's `applyDiscard` immediately overwrites it before they ever reach their draw phase.

**Chain:**
1. Player A discards pair [7♥, 7♦] → `nextDrawableCards = [7♥, 7♦]` ✓
2. Player A draws → `drawableDiscardCards = [7♥, 7♦]` ✓ (visible in B's discard phase as fan)
3. Player B discards [K♠] → `drawableDiscardCards = [7♦]` ✗ (overwritten to just the top card)
4. Player B draws → can only take `7♦`, cannot take `7♥`

`DrawablePicker` is gated on `drawableCards.length > 1` in `GamePage.jsx`, which can never be true during draw phase under the current logic.

### Fix Direction

**Server — `applyDiscard` in `gameLogic.js`:**
Remove the `drawableDiscardCards` assignment. Do not overwrite it. The correct value is already in the state from `applyDraw` of the previous turn.

```js
// Fixed state shape returned by applyDiscard:
{
  ...gameState,
  phase: "draw",
  discardPile: newDiscardPile,
  // drawableDiscardCards: ← DO NOT SET; keep existing value for draw phase
  nextDrawableCards: computeDrawableCards(cards, topBeforeDiscard),
  lastDiscardedCards: cards,
  players: ...,
}
```

**Edge case — first discard of round:**
`drawableDiscardCards` is `null` at round start. On the first discard of a round, the drawing player cannot draw from discard (there is no previous player discard). `applyDraw` already handles `null` correctly (`drawable = gameState.drawableDiscardCards ?? []` → empty → only deck draw available). No change needed here.

**Client — no changes needed.** `DrawablePicker` and the `handlePickDrawable` path in `GamePage.jsx` are already correctly wired; they just never trigger because the server always returns 1 drawable card.

---

## BUG-02 — Disconnect during active turn freezes the game

**Severity:** High — game becomes unplayable
**Status:** Open

### Symptom

If the player whose turn it is (current player) disconnects during an active game, the game freezes. All remaining players see it is still the disconnected player's turn. Any attempt to discard or draw returns `"Not your turn"` from the server. The game is permanently stuck unless the server is restarted.

### Root Cause

**File:** `server/index.js` — disconnect handler (line ~59)

```js
} else if (room.status === "playing") {
  const p = room.gameState?.players.find((p) => p.id === socket.id);
  if (p) p.isEliminated = true;

  // checks active players, emits GAME_OVER if 1 remains, otherwise:
  broadcastGameState(io, room, SOCKET_EVENTS);  // ← no turn advancement
}
```

After marking the disconnecting player as eliminated, the code does not check whether that player was `currentPlayerIndex`. If they were, `currentPlayerIndex` still points to the now-eliminated player. All subsequent `applyDiscard` / `applyDraw` calls from other players fail with `"Not your turn"` because their index ≠ `currentPlayerIndex`.

The turn timer is also not cleared or restarted, so a running timer may later try to advance a turn that is already stuck.

### Fix Direction

**Server — disconnect handler in `index.js`:**
After eliminating the player, check if they were the current player. If so, advance the turn.

```js
// After: if (p) p.isEliminated = true;

const wasCurrentPlayer =
  room.gameState.players[room.gameState.currentPlayerIndex]?.id === socket.id;

if (wasCurrentPlayer) {
  clearTurnTimer(room.id);
  const nextIndex = getNextActivePlayerIndex(
    room.gameState.players,
    room.gameState.currentPlayerIndex,
  );
  room.gameState.currentPlayerIndex = nextIndex;
  room.gameState.phase = "discard";
}
```

Then after the early-return check (≤1 active players), call `startTurnTimer` before `broadcastGameState` if `wasCurrentPlayer`.

**Imports needed:** `clearTurnTimer`, `startTurnTimer` from `./utils/timer.js` and `getNextActivePlayerIndex` from `./game/gameLogic.js` must be imported in `index.js`.

---

## BUG-SEC-01 — Server does not validate phase before processing CALL_YANIV

**Severity:** Medium — exploitable by a modified client
**Status:** Open

### Symptom

A player using a modified client can emit `CALL_YANIV` during the draw phase (after discarding, before drawing). The server processes the Yaniv call, potentially ending the round at an unexpected moment. The legitimate client prevents this via `canYaniv = isMyTurn && phase === "discard" && myHandValue <= 7`, but the server has no such guard.

### Root Cause

**File:** `server/game/gameLogic.js` — `applyYaniv` (line ~286)
**File:** `server/handlers/gameHandlers.js` — `CALL_YANIV` handler (line ~73)

`applyYaniv` validates only hand value (≤ 7). Neither `applyYaniv` nor the handler checks that `gameState.phase === "discard"`.

```js
// gameHandlers.js — no phase check before calling applyYaniv
socket.on(SOCKET_EVENTS.CALL_YANIV, () => {
  const room = getRoomBySocket(socket, rooms);
  if (!room || !room.gameState) return;
  clearTurnTimer(room.id);
  // ← missing: if (room.gameState.phase !== 'discard') return;
  const result = applyYaniv(room.gameState, socket.id);
```

```js
// gameLogic.js — applyYaniv only checks hand value
if (!canCallYaniv(caller.hand))
  return { success: false, error: "Hand value too high to call Yaniv" };
// ← missing: phase and currentPlayer checks
```

### Fix Direction

**Option A (preferred — defence in depth):** Add validation in both places.

In `applyYaniv` (gameLogic.js), add at the top:
```js
const callerIndex = gameState.players.findIndex(p => p.id === callerId);
if (callerIndex === -1) return { success: false, error: "Player not found" };
if (callerIndex !== gameState.currentPlayerIndex)
  return { success: false, error: "Not your turn" };
if (gameState.phase !== "discard")
  return { success: false, error: "Can only call Yaniv during discard phase" };
```

In the `CALL_YANIV` handler (gameHandlers.js), add an early return before `clearTurnTimer`:
```js
if (room.gameState.phase !== "discard") return;
if (room.gameState.players[room.gameState.currentPlayerIndex]?.id !== socket.id) return;
```

**Note:** `clearTurnTimer` should only be called after validating the call is legitimate — a rejected call should leave the timer running.
