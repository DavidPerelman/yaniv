# Phase 3 — Bug Fixes (Joker Edge Detection): Context

**Gathered:** 2026-03-31
**Status:** Ready for planning
**Source:** User-provided + codebase trace

---

## Phase Boundary

Fix BUG-LOGIC-01 only. Single function, single file.

**Bug:** `computeDrawableCards` in `server/game/gameLogic.js` uses the Joker's
position in the raw input array to determine whether it is at the low edge, high edge,
or middle of a run. The client sends cards in selection order (not rank order), so the
Joker's array position is arbitrary — the edge detection produces wrong results.

**Example of broken behavior:**
```
Input: [{ id:'H6', suit:'H', rank:'6' }, { id:'H7', suit:'H', rank:'7' }, { id:'JK1', suit:'JK', rank:'JK' }]
Expected: [H6, JK1]   ← low non-joker edge + high Joker edge
Actual:   depends on client order — if client sent JK first the result is wrong
```

**Constraint:** Only `server/game/gameLogic.js` may be modified. No other files.

---

## Decisions

### Fix location
Replace the edge-detection block in `computeDrawableCards` (lines ~85–104 in
`server/game/gameLogic.js`). The rest of the function (length-1 guard, joker/nonJoker
partition, set check, span/gap check) is correct and must not change.

### Fix approach
After the middle-gap check passes (span <= nonJokers.length), instead of using
`findIndex`/`findLastIndex` on the raw input array:
1. Find the Joker's original index in `discardedCards`.
2. Find the original index of the RANK-LOWEST non-joker (`firstNonJoker` from the
   already-computed `sortedNonJokers`).
3. If `jokerOrigIdx < lowestNJOrigIdx` → client placed Joker before the lowest-rank
   card → treat as **low edge** → drawable = `[Joker, lastNonJoker]`.
4. Otherwise (Joker after, or between non-jokers) → treat as **high edge** →
   drawable = `[firstNonJoker, Joker]`.
5. If no Joker (pure non-joker run) → drawable = `[firstNonJoker, lastNonJoker]`.

This approach:
- Works correctly when client sends Joker first (low edge) or last (high edge).
- Defaults to high edge for the ambiguous case where client sends Joker between
  two non-jokers (e.g., `[6H, JK, 7H]`).
- Preserves all 7 existing test cases (verified by trace).
- Does not require any sorting of the full input array.
- Removes the `Map` dedup at the end (now unnecessary — no duplicate-push risk).

### indexOf reference safety
`firstNonJoker` and `lastNonJoker` are references to elements from `[...nonJokers]`
which in turn are references from `discardedCards`. `Array.prototype.indexOf` uses
`===` reference equality, so `discardedCards.indexOf(firstNonJoker)` correctly finds
the original card object.

### Out of scope
- No changes to `applyDiscard`, `gameHandlers.js`, or any client file.
- No changes to the test file (existing tests act as regression guard).
- No other bugs addressed.
