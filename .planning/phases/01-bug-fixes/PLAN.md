# Phase 1 — Bug Fixes: Plan

## GOAL

Fix three diagnosed bugs in the Yaniv multiplayer card game server. All root causes are confirmed. No exploratory work needed — this is a targeted surgical fix plan.

**Bugs addressed (priority order):**
- BUG-01: `applyDiscard` overwrites `drawableDiscardCards`, collapsing multi-card drawable sets to a single card
- BUG-SEC-01: `CALL_YANIV` handler and `applyYaniv` lack phase/player validation
- BUG-02: Disconnect handler does not advance turn when the disconnected player is the current player

---

## TASKS

### Task 1 — Fix BUG-01: Remove `drawableDiscardCards` assignment from `applyDiscard`

**File:** `server/game/gameLogic.js`

**What to change:**

In the `applyDiscard` function (around line 180–185), the `newState` object currently sets:

```js
drawableDiscardCards: topBeforeDiscard ? [topBeforeDiscard] : [],
```

Remove that line entirely. Do not replace it with anything. The spread `...gameState` already preserves the existing `drawableDiscardCards` value, which is the correct multi-card set from the previous player's discard (set by `applyDraw`).

The resulting `newState` object should contain:
```js
const newState = {
  ...gameState,
  phase: "draw",
  discardPile: newDiscardPile,
  nextDrawableCards: computeDrawableCards(cards, topBeforeDiscard),
  lastDiscardedCards: cards,
  players: gameState.players.map((p, i) =>
    i === playerIndex ? { ...p, hand: newHand } : p,
  ),
};
```

No other changes in this function. The `topBeforeDiscard` variable is still needed for `computeDrawableCards` — do not remove it.

**Why this is safe:**
- `drawableDiscardCards` is initialized to the starter card in `createInitialGameState` (Task 8). On the first discard of a round, `...gameState` preserves that starter-card value, which is the correct drawable for the first draw phase.
- After each `applyDraw`, `drawableDiscardCards` is set to `gameState.nextDrawableCards ?? null`. So by the time the next player calls `applyDiscard`, `drawableDiscardCards` already holds the correct drawable set for that draw phase.

**Verify:**
```bash
cd D:/Projects/yaniv && node --experimental-vm-modules node_modules/.bin/jest server/test/computeDrawableCards.test.mjs --no-coverage 2>&1
```
All existing tests must pass. No new test failures.

---

### Task 2 — Fix BUG-SEC-01 (part A): Add phase and player validation to `applyYaniv`

**File:** `server/game/gameLogic.js`

**What to change:**

In `applyYaniv` (starts around line 285), after the opening of the `try` block and before the existing `caller` lookup, insert these validation checks:

```js
const callerIndex = gameState.players.findIndex((p) => p.id === callerId);
if (callerIndex === -1) return { success: false, error: "Player not found" };
if (callerIndex !== gameState.currentPlayerIndex)
  return { success: false, error: "Not your turn" };
if (gameState.phase !== "discard")
  return { success: false, error: "Can only call Yaniv during discard phase" };
```

Then remove (or replace) the existing `const caller = gameState.players.find(...)` line, since `callerIndex` is now known. Change it to:

```js
const caller = gameState.players[callerIndex];
```

The rest of the function is unchanged.

**Result:** The function now validates in order: player exists → is current player → is discard phase → hand value ≤ 7. The existing `if (!canCallYaniv(caller.hand))` check stays in place after these new guards.

**Verify:**
```bash
cd D:/Projects/yaniv && node --experimental-vm-modules node_modules/.bin/jest server/test/computeDrawableCards.test.mjs --no-coverage 2>&1
```

---

### Task 3 — Fix BUG-SEC-01 (part B): Add early-return guard to `CALL_YANIV` handler before `clearTurnTimer`

**File:** `server/handlers/gameHandlers.js`

**What to change:**

In the `CALL_YANIV` socket handler (around line 73), the current code is:

```js
socket.on(SOCKET_EVENTS.CALL_YANIV, () => {
  const room = getRoomBySocket(socket, rooms);
  if (!room || !room.gameState) return;

  clearTurnTimer(room.id);   // ← this fires before any validation
  ...
```

Insert two guard checks between the `if (!room || !room.gameState) return;` line and the `clearTurnTimer` call:

```js
if (room.gameState.phase !== "discard") return;
if (room.gameState.players[room.gameState.currentPlayerIndex]?.id !== socket.id) return;
```

The `clearTurnTimer(room.id)` line stays where it is — it just now sits after the guards instead of before them. No other changes to this handler.

**Why order matters:** A rejected call (wrong phase or wrong player) must not clear the timer. The timer belongs to the current legitimate turn; an invalid call from a modified client must leave it running.

**Verify:**
- Server starts without errors: `cd D:/Projects/yaniv/server && node index.js &` then kill it
- No import changes needed in this file — `clearTurnTimer` is already imported from `../utils/timer.js`

---

### Task 4 — Fix BUG-02: Advance turn on disconnect in `server/index.js`

**File:** `server/index.js`

**Step 4a — Add missing imports.**

The current imports in `server/index.js` do not include timer utilities or `getNextActivePlayerIndex`. Add them.

Current import block (lines 9–18):
```js
import { SOCKET_EVENTS } from "../shared/constants.js";
import { registerRoomHandlers } from "./handlers/roomHandlers.js";
import { registerGameHandlers } from "./handlers/gameHandlers.js";
import { registerChatHandlers } from "./handlers/chatHandlers.js";
import { removePlayerFromRoom } from "./game/room.js";
import { sanitizeRoom, broadcastGameState } from "./utils/sanitize.js";
```

Add these two import lines after the existing imports:
```js
import { clearTurnTimer, startTurnTimer } from "./utils/timer.js";
import { getNextActivePlayerIndex } from "./game/gameLogic.js";
```

**Step 4b — Advance turn when current player disconnects.**

In the `disconnect` handler, inside the `else if (room.status === "playing")` branch, the current code (around line 64–80) is:

```js
const p = room.gameState?.players.find((p) => p.id === socket.id);
if (p) p.isEliminated = true;

if (room.gameState && !room.gameState.winner) {
  const activePlayers = room.gameState.players.filter((p) => !p.isEliminated);
  if (activePlayers.length === 1) {
    // ... GAME_OVER branch (rooms.delete + return)
  }
}

broadcastGameState(io, room, SOCKET_EVENTS);
```

After `if (p) p.isEliminated = true;`, insert the following block:

```js
const wasCurrentPlayer =
  room.gameState?.players[room.gameState.currentPlayerIndex]?.id === socket.id;

if (wasCurrentPlayer && room.gameState) {
  clearTurnTimer(room.id);
  const nextIndex = getNextActivePlayerIndex(
    room.gameState.players,
    room.gameState.currentPlayerIndex,
  );
  room.gameState.currentPlayerIndex = nextIndex;
  room.gameState.phase = "discard";
}
```

Then, after the early-return GAME_OVER block (after the `if (activePlayers.length === 1) { ... return; }` block closes) and just before `broadcastGameState(...)`, add:

```js
if (wasCurrentPlayer && room.gameState) {
  startTurnTimer(io, rooms, room.id);
}
```

The final structure of the `else if (room.status === "playing")` branch should be:

```
1. emit SYSTEM_MESSAGE
2. find player, mark isEliminated = true
3. compute wasCurrentPlayer
4. if wasCurrentPlayer: clearTurnTimer, advance index, set phase = "discard"
5. if room.gameState && !room.gameState.winner:
     compute activePlayers
     if activePlayers.length === 1: emit GAME_OVER, rooms.delete, return
6. if wasCurrentPlayer: startTurnTimer
7. broadcastGameState
```

**Why `startTurnTimer` goes before `broadcastGameState`:** `startTurnTimer` checks `room.settings.timerSeconds` and is a no-op if 0. It should be registered before the broadcast so the timer is live when clients receive the new state.

**Verify:**
```bash
cd D:/Projects/yaniv && node server/index.js &
sleep 2 && kill %1
```
Server must start and stop cleanly with no import errors.

---

### Task 5 — Verify `GamePage.jsx` DrawablePicker trigger path (read-only confirmation)

**File:** `client/src/pages/GamePage.jsx`

**No changes needed.** Confirm the following logic is already present and correct — do not modify the file.

Confirm these lines exist as-is:

```js
// Line ~124-128
const drawableCards = gameState.discardPile?.drawableCards ?? [];
const isDrawPhase = gameState?.phase === 'draw';
const drawableCard = drawableCards.length > 0 && isDrawPhase && isMyTurn
  ? drawableCards[drawableCards.length - 1]
  : null;
```

And in `handleDrawDiscard`:
```js
if (drawableCards.length === 1) {
  socket.emit(SOCKET_EVENTS.DRAW, { source: "discard", cardId: drawableCards[0].id });
} else if (drawableCards.length > 1) {
  setShowDrawablePicker(true);
}
```

These are correct. After the server fix in Task 1, `gameState.discardPile.drawableCards` (which maps to `drawableDiscardCards` in `sanitize.js` `privateGameView`) will correctly contain multiple cards, and `drawableCards.length > 1` will be true, triggering the picker.

**Verify (reading sanitize.js mapping):**
In `server/utils/sanitize.js`, confirm `privateGameView` maps:
```js
drawableCards: gameState.drawableDiscardCards ?? null,
```
This confirms the server field `drawableDiscardCards` reaches the client as `discardPile.drawableCards`. No changes needed.

---

### Task 7 — Fix timer expiry: reset `drawableDiscardCards` when draw phase expires

**File:** `server/utils/timer.js`

**Why this is needed:** With the BUG-01 fix in place, `applyDiscard` no longer overwrites `drawableDiscardCards`. This means when the turn timer expires during the draw phase (player discarded but never drew), the draw-phase undo logic runs (cards returned to hand), the turn advances — but `drawableDiscardCards` is left at the value from the previous player's discard. The next player then starts their discard phase with a stale drawable set. When they discard and enter draw phase, they would incorrectly be able to draw from it. Before the BUG-01 fix, `applyDiscard` was silently masking this by overwriting `drawableDiscardCards` every time.

**What to change:**

In the draw-phase expiry block (around line 33–44), after returning the discarded cards to the hand, reset `drawableDiscardCards` to the current top of the discard pile:

Current code:
```js
if (gs.phase === 'draw') {
  const lastDiscarded = gs.lastDiscardedCards
  if (lastDiscarded?.length) {
    const discardedIds = new Set(lastDiscarded.map((c) => c.id))
    const playerIndex = gs.currentPlayerIndex
    gs.discardPile = gs.discardPile.filter((c) => !discardedIds.has(c.id))
    gs.players = gs.players.map((p, i) =>
      i === playerIndex ? { ...p, hand: [...p.hand, ...lastDiscarded] } : p,
    )
    gs.lastDiscardedCards = null
  }
}
```

After `gs.lastDiscardedCards = null`, add one line:
```js
gs.drawableDiscardCards = null
```

The result:
```js
if (gs.phase === 'draw') {
  const lastDiscarded = gs.lastDiscardedCards
  if (lastDiscarded?.length) {
    const discardedIds = new Set(lastDiscarded.map((c) => c.id))
    const playerIndex = gs.currentPlayerIndex
    gs.discardPile = gs.discardPile.filter((c) => !discardedIds.has(c.id))
    gs.players = gs.players.map((p, i) =>
      i === playerIndex ? { ...p, hand: [...p.hand, ...lastDiscarded] } : p,
    )
    gs.lastDiscardedCards = null
    gs.drawableDiscardCards = gs.discardPile.length
      ? [gs.discardPile[gs.discardPile.length - 1]]
      : []   // ← add this line
  }
}
```

**Why the discard pile top:** After a timer-forced turn skip, the discarded cards are returned to the player's hand and removed from the pile. The discard pile reverts to its pre-discard state. The current top card of the pile is the starter card (or the last legitimately drawn-from card), which is exactly what should be drawable next. This keeps `drawableDiscardCards` consistent with the spec: it is never empty/null between turns.

**Verify:**
```bash
cd D:/Projects/yaniv && node server/utils/timer.js 2>&1 || true
```
(No syntax error. The file is not directly executable but any import error will surface here.)

---

### Task 8 — Initialize `drawableDiscardCards` to starter card at round start

**Files:** `server/game/gameLogic.js`, `server/handlers/gameHandlers.js`

**Why this is needed:** Per the authoritative spec, `drawableDiscardCards` is never null at the start of a turn. At round start, one card is placed face-up on the discard pile and the first player may draw it. `createInitialGameState` currently sets `drawableDiscardCards: null`, which prevents the first player from drawing the starter card. This must be fixed to align with the spec.

**Change A — `server/game/gameLogic.js`, `createInitialGameState`:**

The discard pile is already built before the return statement:
```js
const discardPile = [deck.pop()];
```

Change the `drawableDiscardCards` field in the returned object from:
```js
drawableDiscardCards: null,
```
to:
```js
drawableDiscardCards: discardPile.length ? [discardPile[0]] : [],
```

**Change B — `server/handlers/gameHandlers.js`, new-round `setTimeout` block:**

After `createInitialGameState` is called (around line 148), the new game state is stored in `newGameState`. Add one line immediately after the `createInitialGameState` call:

```js
newGameState.drawableDiscardCards = newGameState.discardPile.length
  ? [newGameState.discardPile[0]]
  : [];
```

This ensures the new-round state also starts with the face-up starter card as the drawable, not null (since `createInitialGameState` is also called here, without Change A it would still be null for subsequent rounds).

**Note:** Change A makes Change B redundant for the new-round path too once it calls `createInitialGameState`, but Change B is included as belt-and-suspenders to make the intent explicit at the call site.

**Verify:**
```bash
cd D:/Projects/yaniv && node --experimental-vm-modules node_modules/.bin/jest server/test/computeDrawableCards.test.mjs --no-coverage 2>&1
```

---

### Task 6 — Run existing tests

**Command:**
```bash
cd D:/Projects/yaniv && node --experimental-vm-modules node_modules/.bin/jest server/test/computeDrawableCards.test.mjs --no-coverage 2>&1
```

All tests must pass. This test suite exercises `computeDrawableCards` directly, which is not modified by any of these fixes. It acts as a regression guard confirming the shared game logic module loads and exports correctly after the changes to `applyDiscard` and `applyYaniv`.

If tests fail:
- Import error → check `applyYaniv` changes did not introduce a syntax error
- Logic error → the `computeDrawableCards` function was accidentally modified; revert it

---

## VERIFICATION

### Scenario 1 — BUG-01: Multi-card drawable set reaches draw phase

**Setup:** 2-player game. Player A's turn.

1. Player A discards a pair, e.g., [7♥, 7♦].
2. Server calls `applyDiscard` → `nextDrawableCards = [7♥, 7♦]`, `drawableDiscardCards` is unchanged (still the previous value or null).
3. Player A draws from deck → `applyDraw` promotes `nextDrawableCards` to `drawableDiscardCards`: value is now `[7♥, 7♦]`.
4. Player B's turn begins (discard phase). `drawableDiscardCards = [7♥, 7♦]`.
5. Player B discards any card → `applyDiscard` runs. `drawableDiscardCards` is NOT overwritten. It remains `[7♥, 7♦]`.
6. Player B is now in draw phase. `privateGameView` sends `discardPile.drawableCards = [7♥, 7♦]`.
7. Client receives `drawableCards.length === 2`. `DrawablePicker` appears. Player B can choose either card.

**Expected:** `DrawablePicker` modal appears with both cards. Selecting one emits `DRAW` with the correct `cardId`. The other card remains in the discard pile.

### Scenario 2 — BUG-01: Single-card discard still works

1. Player A discards a single card [K♠].
2. After `applyDraw`, `drawableDiscardCards = [K♠]` (single card).
3. Player B discards → `drawableDiscardCards` preserved as `[K♠]`.
4. Client sees `drawableCards.length === 1`. No picker. Direct draw emits `DRAW` with `cardId`.

**Expected:** No picker, draw works normally.

### Scenario 3 — BUG-01 + Task 8: First turn of round — starter card is drawable

1. Round starts. `createInitialGameState` sets `drawableDiscardCards = [starterCard]`.
2. Player A (first player) is in draw phase — they may draw the starter card OR draw from deck.
   - If they draw the starter card: `applyDraw` removes it from `discardPile`, adds to hand; `drawableDiscardCards ← nextDrawableCards` (which was null before any discard, so this becomes null/empty — but Player A hasn't discarded yet, so this path doesn't arise from a Discard→Draw cycle).
3. Player A discards → `applyDiscard` does not overwrite `drawableDiscardCards`.
4. Player A draws → `applyDraw` promotes `nextDrawableCards` to `drawableDiscardCards`.
5. Player B enters draw phase with correct drawable cards from Player A's discard.
6. No crash. No null-reference on starter-card draw.

**Expected:** First player can draw the face-up starter card. Round start handled correctly.

### Scenario 4 — BUG-SEC-01: CALL_YANIV rejected during draw phase

1. Player A discards (now in draw phase).
2. Modified client emits `CALL_YANIV` for Player A.
3. Handler checks `room.gameState.phase !== "discard"` → `true` → returns immediately.
4. `clearTurnTimer` is never called. Timer continues running.
5. No state change. No error emitted to other players.

**Expected:** Server silently rejects the call. Game state unchanged. Timer unaffected.

### Scenario 5 — BUG-SEC-01: CALL_YANIV rejected from non-current player

1. It is Player B's turn (discard phase).
2. Modified client for Player A emits `CALL_YANIV`.
3. Handler checks `currentPlayer.id !== socket.id` → returns immediately.
4. No state change.

**Expected:** Silent rejection.

### Scenario 6 — BUG-SEC-01: Legitimate Yaniv still works

1. It is Player A's turn, discard phase, hand value ≤ 7.
2. Player A emits `CALL_YANIV`.
3. Handler: phase === "discard" ✓, currentPlayer === socket.id ✓ → proceeds.
4. `clearTurnTimer` fires. `applyYaniv` runs with callerIndex check passing.
5. Round ends normally.

**Expected:** Yaniv resolves. `ROUND_END` emitted. New round starts after 3s.

### Scenario 7 — BUG-02: Current player disconnects

1. 3-player game. It is Player B's turn (discard phase, timer running).
2. Player B disconnects.
3. Disconnect handler: marks Player B `isEliminated = true`.
4. `wasCurrentPlayer = true`.
5. `clearTurnTimer` fires (stops Player B's timer).
6. `getNextActivePlayerIndex` returns Player C's index.
7. `currentPlayerIndex` updated. `phase = "discard"`.
8. `activePlayers.length > 1` → no GAME_OVER.
9. `startTurnTimer` fires (starts Player C's timer).
10. `broadcastGameState` sends new state to Players A and C.

**Expected:** Players A and C immediately see it is Player C's turn. Timer restarts for Player C. Game is unblocked.

### Scenario 8 — BUG-02: Non-current player disconnects

1. It is Player A's turn.
2. Player B disconnects.
3. `wasCurrentPlayer = false`. No timer or index change.
4. `broadcastGameState` fires. Players A and C see Player B is gone.

**Expected:** Player A's turn continues unaffected.

---

## KEY INVARIANTS TO CONFIRM AFTER ALL CHANGES

- `applyDiscard` and `applyDraw` remain pure functions (no side effects, no imports of timer/socket utilities).
- `drawableDiscardCards` is initialized to `[discardPile[0]]` (the face-up starter card) in `createInitialGameState` — never null at round start.
- The new-round `setTimeout` block in `gameHandlers.js` explicitly sets `newGameState.drawableDiscardCards` to the starter card after calling `createInitialGameState`.
- `drawableDiscardCards` is never null between turns — it always holds either the starter card (round start) or the drawable set from the last committed discard.
- `server/test/computeDrawableCards.test.mjs` passes with no modifications.
- `clearTurnTimer` is called in the `CALL_YANIV` handler only after both guard checks pass.
- `startTurnTimer` in the disconnect handler is only called when `wasCurrentPlayer` is true and a winner has not been decided.
- When the turn timer expires in draw phase, `drawableDiscardCards` is reset to the current top of the discard pile (not null) — the pile reverts to its pre-discard state after cards are returned to the player's hand.
