# Phase 2 — Bug Fixes UI: Context

## Phase Goal

Fix BUG-UI-01: the discard pile fan display shows the wrong cards because `fanCards` is wired to `drawableCards` (`drawableDiscardCards`) instead of `lastDiscardedCards`.

## Bug (Single)

### BUG-UI-01 — fanCards wired to drawableCards instead of lastDiscardedCards (Medium)

After the Phase 1 BUG-01 fix, `drawableDiscardCards` is correctly preserved from the *previous* player's discard. But `fanCards` is still wired to `drawableCards` (which equals `drawableDiscardCards`). This means the fan on the discard pile shows the previous player's discard during the *current* player's discard phase — not the card(s) just thrown.

**Root cause:** `client/src/pages/GamePage.jsx` line ~290:
```js
fanCards={drawableCards}  // ← wrong: shows drawableDiscardCards (previous player's discard)
```

**Fix:**
```js
const fanCards = gameState?.lastDiscardedCards ?? [];
// fanCards = lastDiscardedCards in both phases
// drawableCards continues to be used for draw logic (DrawablePicker / button) unchanged
```

`drawableCards` must NOT be replaced anywhere else — it remains the source of truth for the draw picker and draw button logic.

## Constraints

- **Only modify:** `client/src/pages/GamePage.jsx`
- **Do NOT touch:** any server files, `DiscardPile.jsx`, `DrawablePicker.jsx`, or any other client file
- **Do NOT change:** `drawableCards`, `drawableCard`, `canDrawDiscard`, `DrawablePicker` logic, or the `onDraw` / `handleDrawDiscard` paths
- **Do NOT change:** the `fanCards` prop name passed to `<DiscardPile>` — only the value it computes

## Codebase Layout (relevant files)

```
client/src/
  pages/GamePage.jsx        ← ONLY file to change
  components/DiscardPile.jsx ← read-only: already renders fanCards correctly
  components/DrawablePicker.jsx ← read-only: no changes needed
```

## Acceptance Criteria

1. `fanCards` in `GamePage.jsx` is computed from `gameState?.lastDiscardedCards ?? []`, not from `drawableCards`.
2. When a player discards a pair [7♥, 7♦], the fan on the discard pile shows [7♥, 7♦] immediately after the discard (during the current player's draw phase and the next player's discard phase).
3. `drawableCards`, `drawableCard`, `canDrawDiscard`, `DrawablePicker`, and `handleDrawDiscard` are completely unchanged.
4. No other lines in `GamePage.jsx` are modified beyond the `fanCards` computation.
5. Server files are untouched.
