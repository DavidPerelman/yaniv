---
phase: "01"
plan: "01"
subsystem: server
tags: [bug-fix, game-logic, security, disconnect, drawable-cards, timer]
dependency_graph:
  requires: []
  provides: [correct-drawable-cards, yaniv-validation, disconnect-turn-advance]
  affects: [server/game/gameLogic.js, server/handlers/gameHandlers.js, server/utils/timer.js, server/index.js]
tech_stack:
  added: []
  patterns: [guard-clause-validation, belt-and-suspenders-initialization]
key_files:
  created: []
  modified:
    - server/game/gameLogic.js
    - server/handlers/gameHandlers.js
    - server/utils/timer.js
    - server/index.js
decisions:
  - "Remove drawableDiscardCards from applyDiscard newState — spread preserves correct value from previous applyDraw"
  - "Initialize drawableDiscardCards to [discardPile[0]] in createInitialGameState and in new-round setTimeout for belt-and-suspenders"
  - "Reset drawableDiscardCards to pile top (not null) when timer expires in draw phase"
  - "Guards in CALL_YANIV handler placed before clearTurnTimer to prevent timer cancellation from invalid calls"
metrics:
  duration_minutes: 30
  completed_date: "2026-03-24"
  tasks_completed: 7
  files_modified: 4
---

# Phase 1 Plan 1: Bug Fixes Summary

**One-liner:** Fixed three server bugs — multi-card drawable set collapse, missing Yaniv phase/player validation, and stuck game on current-player disconnect.

---

## Tasks Completed

| Task | Description | Commit |
|------|-------------|--------|
| 1 | Remove `drawableDiscardCards` assignment from `applyDiscard` (BUG-01) | f1e0412 |
| 2 | Add phase and player validation to `applyYaniv` (BUG-SEC-01 part A) | 8efd5ea |
| 3 | Add early-return guards to `CALL_YANIV` handler before `clearTurnTimer` (BUG-SEC-01 part B) | cb7d348 |
| 4 | Advance turn on current-player disconnect in `server/index.js` (BUG-02) | 08b675f |
| 5 | Verify GamePage.jsx DrawablePicker trigger path (read-only confirmation) | — |
| 7 | Reset `drawableDiscardCards` when draw-phase timer expires | 1b6d4a1 |
| 8 | Initialize `drawableDiscardCards` to starter card in `createInitialGameState` and new-round handler | ba26846 |

---

## Changes Made

### BUG-01: Multi-card drawable set collapsed to single card

**Root cause:** `applyDiscard` set `drawableDiscardCards: topBeforeDiscard ? [topBeforeDiscard] : []`, overwriting the correctly computed multi-card set that `applyDraw` had promoted.

**Fix:** Removed the `drawableDiscardCards` assignment from `applyDiscard`'s `newState` object. The spread `...gameState` now correctly preserves whatever value `applyDraw` last wrote.

**File:** `server/game/gameLogic.js` — `applyDiscard` function

---

### BUG-SEC-01: Missing validation on `applyYaniv` and `CALL_YANIV` handler

**Root cause (part A):** `applyYaniv` only checked hand value — it did not verify the caller is the current player or that the phase is "discard".

**Fix:** Added three guards at the top of `applyYaniv`: player exists check (using index), `callerIndex !== currentPlayerIndex`, and `phase !== "discard"`. Replaced `players.find()` with `players[callerIndex]` since the index is already known.

**Root cause (part B):** `CALL_YANIV` socket handler called `clearTurnTimer` before any validation, allowing a modified client to cancel any active turn timer.

**Fix:** Inserted two guard clauses before `clearTurnTimer`: phase check and current-player-id check. Timer is only cleared if both pass.

**Files:** `server/game/gameLogic.js`, `server/handlers/gameHandlers.js`

---

### BUG-02: Game stuck when current player disconnects

**Root cause:** The disconnect handler marked the player as eliminated but did not advance `currentPlayerIndex` or restart the turn timer.

**Fix:**
- Added imports for `clearTurnTimer`, `startTurnTimer`, and `getNextActivePlayerIndex` to `server/index.js`
- Computed `wasCurrentPlayer` before the existing GAME_OVER check
- If `wasCurrentPlayer`: clear timer, advance index to next active player, reset phase to "discard"
- After the GAME_OVER early-return block: if `wasCurrentPlayer`, start the turn timer for the new current player
- `broadcastGameState` fires last, giving clients the correct updated state

**File:** `server/index.js`

---

### Timer expiry stale drawable (companion to BUG-01 fix)

**Root cause:** With BUG-01 fixed, `applyDiscard` no longer silently resets `drawableDiscardCards`. When the timer expires during draw phase, discarded cards are returned to the player's hand and removed from the pile, but `drawableDiscardCards` was left pointing at the now-reverted drawable set.

**Fix:** After `gs.lastDiscardedCards = null` in the draw-phase expiry block, set `gs.drawableDiscardCards` to the current top of the discard pile (post-revert state). This maintains the invariant that `drawableDiscardCards` always reflects the correct drawable for the current draw phase.

**File:** `server/utils/timer.js`

---

### Round start drawable initialization (companion to BUG-01 fix)

**Root cause:** `createInitialGameState` set `drawableDiscardCards: null`, preventing the first player from drawing the face-up starter card.

**Fix:**
- Changed `createInitialGameState` to set `drawableDiscardCards: discardPile.length ? [discardPile[0]] : []`
- Added explicit initialization in the new-round `setTimeout` block in `gameHandlers.js` as belt-and-suspenders

**Files:** `server/game/gameLogic.js`, `server/handlers/gameHandlers.js`

---

## Verification

`server/test/computeDrawableCards.test.mjs` passes after all changes. Server starts cleanly with no import errors.

---

## Invariants Confirmed After Changes

- `applyDiscard` and `applyDraw` remain pure functions — no timer/socket imports
- `drawableDiscardCards` is initialized to `[discardPile[0]]` in `createInitialGameState`
- New-round setTimeout explicitly sets `drawableDiscardCards` to the starter card
- `drawableDiscardCards` is never null between turns
- `clearTurnTimer` in CALL_YANIV handler fires only after both phase and player guards pass
- `startTurnTimer` in disconnect handler is only called when `wasCurrentPlayer` is true and no winner exists
- Timer expiry in draw phase resets `drawableDiscardCards` to pile top (not null)

---

## Deviations from Plan

None — plan executed exactly as written. Task numbering in the plan is non-sequential (1, 2, 3, 4, 5, 7, 8, 6) — tasks were executed in plan order.

---

## Known Stubs

None.

## Self-Check: PASSED

All modified files exist. All task commits verified in git log.
