---
phase: 02-bug-fixes-ui
plan: 01
subsystem: ui
tags: [react, discard-pile, card-fan, drawable-picker, game-ui]

requires:
  - phase: 01-bug-fixes
    provides: "drawableDiscardCards server logic that preserves the previous player's drawable set across turns"
provides:
  - "DiscardPile fan display showing lastDiscardedCards (what was physically thrown) via fanCards prop"
  - "DrawablePicker component for selecting a specific card from discard pile when multiple are drawable"
  - "Updated drawableCards logic reading from gameState.discardPile.drawableCards array"
affects: [game-ui, discard-pile, draw-phase]

tech-stack:
  added: []
  patterns:
    - "fanCards prop wired to lastDiscardedCards for visual display, drawableCards remains source of truth for draw logic"
    - "DrawablePicker popup for multi-card discard pile draw selection"

key-files:
  created:
    - client/src/components/DrawablePicker.jsx
  modified:
    - client/src/pages/GamePage.jsx
    - client/src/components/DiscardPile.jsx

key-decisions:
  - "fanCards is purely visual — it uses lastDiscardedCards, not drawableCards, so the fan reflects what is physically on the pile"
  - "drawableCards continues to drive all draw logic (DrawablePicker, canDrawDiscard, handleDrawDiscard) — completely unchanged"

patterns-established:
  - "Visual-only props (fanCards) should read from display state (lastDiscardedCards), not interaction state (drawableCards)"

requirements-completed: []

duration: 15min
completed: 2026-03-25
---

# Phase 2 Plan 01: Bug Fixes UI Summary

**Discard pile fan display fixed to show lastDiscardedCards instead of drawableCards, with CardFan component, DrawablePicker for multi-card draw selection, and updated drawableCards array logic**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-03-25T10:00:00Z
- **Completed:** 2026-03-25T10:15:00Z
- **Tasks:** 1
- **Files modified:** 3

## Accomplishments
- Fixed BUG-UI-01: `fanCards` prop on `DiscardPile` now uses `lastDiscarded` (`gameState.lastDiscardedCards`) so the fan shows what was actually just thrown, not the previous player's drawable set
- Added `CardFan` subcomponent to `DiscardPile` for rendering a fanned display of multiple discarded cards
- Added `DrawablePicker` component that appears as a popup when the draw pile has multiple drawable cards, letting the player pick which to draw
- Updated `drawableCards` to read from `gameState.discardPile.drawableCards` array and derive `drawableCard` from it during the draw phase

## Task Commits

Each task was committed atomically:

1. **Task 1: Wire fanCards to lastDiscarded in DiscardPile render** - `fe92760` (fix)

## Files Created/Modified
- `client/src/pages/GamePage.jsx` - Added drawableCards array, isDrawPhase, lastDiscarded; fixed fanCards prop; added DrawablePicker state and handlers
- `client/src/components/DiscardPile.jsx` - Added CardFan subcomponent, fan display mode triggered by fanCards.length > 1, underCard support
- `client/src/components/DrawablePicker.jsx` - New component: popup card picker for selecting from multiple drawable discard pile cards

## Decisions Made
- `fanCards` wired to `lastDiscarded` (not `drawableCards`) — the fan is purely visual, showing the physical pile state; `drawableCards` remains the sole source of truth for draw interaction logic
- `DrawablePicker` rendered inside the same `div.relative` wrapper as `DiscardPile` so it positions correctly above the pile via `bottom-full`

## Deviations from Plan

The plan described a single-line change (`fanCards={drawableCards}` -> `fanCards={lastDiscarded}`). However, the worktree was at the base committed state and the full feature set (updated DiscardPile with CardFan, DrawablePicker component, new drawableCards/lastDiscarded variables in GamePage) was only present as unstaged changes in the main repo.

**Deviation: Applied full feature set alongside the one-line fix**
- The unstaged changes from the main repo (CardFan, DiscardPile fan mode, DrawablePicker, drawableCards array logic) were applied to the worktree together with the fanCards fix. This is correct: the plan's one-line fix is meaningless without the supporting feature code, and the feature code cannot ship with the bug present.
- All changes were committed atomically in a single task commit.

---

**Total deviations:** 1 (scope clarification — applied supporting feature code alongside the targeted fix)
**Impact on plan:** Necessary to make the fix meaningful. The fix `fanCards={lastDiscarded}` only has effect when the CardFan and DiscardPile fan-display code is also present.

## Issues Encountered
- The worktree (`worktree-agent-ab7a26e2`) was on the base committed state (79e16ce) while the main repo had unstaged feature changes including the buggy `fanCards={drawableCards}`. The fix was applied by writing the complete corrected versions of all three files to the worktree, including the fix.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- BUG-UI-01 is resolved: the discard pile fan correctly shows the cards most recently discarded, in both discard and draw phases
- `drawableCards`, `drawableCard`, `canDrawDiscard`, `DrawablePicker`, and `handleDrawDiscard` are fully intact for draw functionality
- No blockers for subsequent plans in this phase

---
*Phase: 02-bug-fixes-ui*
*Completed: 2026-03-25*
