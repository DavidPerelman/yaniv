# Phase 1 — Bug Fixes: Context

## Phase Goal

Fix three ranked bugs in the Yaniv multiplayer card game. All bugs are fully diagnosed with root causes and fix directions documented in `.planning/codebase/KNOWN_BUGS.md`.

## Bugs (Priority Order)

### BUG-01 — Drawable picker never activates (High)
Multi-card drawable sets (pairs, runs) always collapse to a single card during the draw phase. `DrawablePicker` component exists and is wired up but never triggers.

**Root cause:** `applyDiscard` in `server/game/gameLogic.js` overwrites `drawableDiscardCards` with `[topBeforeDiscard]` (one card) instead of preserving the existing multi-card set from the previous player's discard.

**Fix:** Remove the `drawableDiscardCards` assignment from `applyDiscard`. The value already in state (from `applyDraw` of the previous turn) is correct.

### BUG-02 — Disconnect during active turn freezes the game (High)
If the current player disconnects, `currentPlayerIndex` is not advanced. All remaining players are stuck ("Not your turn" on every action).

**Root cause:** Disconnect handler in `server/index.js` marks the player as eliminated but does not advance the turn when they are the current player.

**Fix:** After elimination, check if the disconnected player was `currentPlayerIndex`. If so: clear timer, advance index via `getNextActivePlayerIndex`, reset phase to `"discard"`, restart timer.

### BUG-SEC-01 — No server-side phase check on CALL_YANIV (Medium)
A modified client can call Yaniv during the draw phase. Server only checks hand value ≤ 7.

**Root cause:** `applyYaniv` and the `CALL_YANIV` handler in `server/handlers/gameHandlers.js` do not verify `phase === "discard"` or that the caller is the current player.

**Fix:** Add phase + currentPlayer validation in both the handler (early return) and `applyYaniv` (return error). Move `clearTurnTimer` to after validation.

## Authoritative Spec Reference

`.planning/codebase/GAME_SPEC.md` defines the correct intended behavior for all three areas.

## Codebase Layout (relevant files)

```
server/
  index.js                    ← BUG-02: disconnect handler
  game/
    gameLogic.js              ← BUG-01 (applyDiscard), BUG-SEC-01 (applyYaniv)
    deck.js                   ← no changes needed
  handlers/
    gameHandlers.js           ← BUG-SEC-01: CALL_YANIV handler
  utils/
    timer.js                  ← BUG-02: clearTurnTimer/startTurnTimer imports
    sanitize.js               ← no changes needed
client/
  src/
    pages/GamePage.jsx        ← verify DrawablePicker triggers correctly after BUG-01 fix
    components/
      DiscardPile.jsx         ← no changes needed (already handles fanCards display)
      DrawablePicker.jsx      ← no changes needed (already wired correctly)
shared/
  constants.js                ← no changes needed
```

## Key Invariants to Preserve

- `applyDiscard` and `applyDraw` are pure functions — fix must not introduce side effects.
- `drawableDiscardCards` must be `null` / `[]` at round start (first discard has nothing to draw from).
- Timer must be correctly cleared and restarted when turn advances due to disconnect.
- `clearTurnTimer` in the CALL_YANIV handler must only run after the call is validated as legitimate.
- Existing unit test `server/test/computeDrawableCards.test.mjs` must continue to pass (it tests `computeDrawableCards` directly, no changes to that function).

## Acceptance Criteria

1. **BUG-01**: When the previous player discards a pair [7♥, 7♦], the next player's draw phase shows both cards as drawable. If 2 cards are drawable, `DrawablePicker` appears and the player can select either card. Drawing removes the chosen card from the discard pile.
2. **BUG-01**: When the previous player discards a single card, draw phase still works — one card available, no picker needed.
3. **BUG-01**: First discard of each round: only deck draw available (no discard draw), no crash.
4. **BUG-02**: When the current player disconnects, remaining players immediately see the next player's turn (not stuck). Timer advances correctly.
5. **BUG-02**: When a non-current player disconnects, turn is unaffected.
6. **BUG-SEC-01**: Emitting `CALL_YANIV` during draw phase is rejected server-side with no state change. Timer is unaffected by the rejected call.
7. **BUG-SEC-01**: Legitimate Yaniv calls (discard phase, ≤7 hand value, correct player) still work.
8. All existing game flows (normal discard → draw → next player, assaf, scoring, round transitions) unaffected.
