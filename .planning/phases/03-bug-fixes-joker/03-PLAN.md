---
phase: 03-bug-fixes-joker
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - server/game/gameLogic.js
autonomous: true
requirements:
  - BUG-LOGIC-01

must_haves:
  truths:
    - "computeDrawableCards([6H, 7H, JK], top) returns [6H, JK] (Joker at high edge, sent last)"
    - "computeDrawableCards([JK, 5H, 6H], top) returns [JK, 6H] (Joker at low edge, sent first)"
    - "computeDrawableCards([JK, 5H, 6H, 7H], top) returns [JK, 7H] (Joker low edge, 4-card run)"
    - "computeDrawableCards([4H, JK, 6H], top) returns [4H, 6H] (Joker fills gap — not drawable)"
    - "All 7 existing tests in computeDrawableCards.test.mjs still pass after the change"
  artifacts:
    - path: "server/game/gameLogic.js"
      provides: "Fixed computeDrawableCards — rank-based Joker edge detection"
      contains: "jokerOrigIdx < lowestNJOrigIdx"
  key_links:
    - from: "server/game/gameLogic.js"
      to: "server/test/computeDrawableCards.test.mjs"
      via: "node server/test/computeDrawableCards.test.mjs"
      pattern: "jokerOrigIdx"
---

<objective>
Fix BUG-LOGIC-01: `computeDrawableCards` misidentifies whether a Joker is at the low
or high edge of a run because it uses the Joker's array position (client selection order)
rather than its rank-relative position.

Purpose: After this fix, the drawable cards returned for a run containing a Joker are
correct regardless of which order the client sent the cards.

Output: Modified `server/game/gameLogic.js` with the edge-detection block replaced. All
7 existing tests pass. The bug-case input [6H, 7H, JK] returns [6H, JK].
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/phases/03-bug-fixes-joker/CONTEXT.md
@.planning/codebase/KNOWN_BUGS.md
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Replace edge-detection block in computeDrawableCards</name>
  <files>server/game/gameLogic.js</files>

  <read_first>
    - server/game/gameLogic.js (full computeDrawableCards function, lines 51–105)
    - server/test/computeDrawableCards.test.mjs (all 7 test cases — regression baseline)
  </read_first>

  <behavior>
    Bug case (must now pass):
      Input:  [{ id:'H6', suit:'H', rank:'6' }, { id:'H7', suit:'H', rank:'7' }, { id:'JK1', suit:'JK', rank:'JK' }]
      Expected: [H6, JK1]  (Joker is high edge)

    Existing test 5 (must still pass):
      Input:  [joker(1), card('5','H'), card('6','H')]
      Expected: [JK1, H6]  (Joker is low edge)

    Existing test 7 (must still pass):
      Input:  [joker(1), card('5','H'), card('6','H'), card('7','H')]
      Expected: [JK1, H7]  (Joker is low edge, 4-card run)

    Existing test 4 (must still pass — Joker fills gap):
      Input:  [card('4','H'), joker(1), card('6','H')]
      Expected: [H4, H6]  (Joker not drawable — middle gap caught by span > nonJokers check)

    Existing test 6 (must still pass — Joker fills gap, 4-card):
      Input:  [card('4','H'), joker(1), card('6','H'), card('7','H')]
      Expected: [H4, H7]
  </behavior>

  <action>
Using the Edit tool, replace the ENTIRE block from the comment "// Joker(s) are at edge(s)"
through the final `return` of the function (lines 85–104 inclusive) with the new
rank-based implementation.

EXACT OLD STRING to replace (copy verbatim — every space and newline matters):

```
  // Joker(s) are at edge(s) — detect which edge by position in original array
  const firstNonJokerIdx = discardedCards.findIndex((c) => c.suit !== "JK");
  const lastNonJokerIdx = discardedCards.findLastIndex((c) => c.suit !== "JK");

  const drawable = [];
  if (firstNonJokerIdx > 0) {
    // Joker precedes first non-joker → low edge joker is drawable
    drawable.push(discardedCards[0]);
  } else {
    drawable.push(firstNonJoker);
  }

  if (lastNonJokerIdx < discardedCards.length - 1) {
    // Joker follows last non-joker → high edge joker is drawable
    drawable.push(discardedCards[discardedCards.length - 1]);
  } else if (lastNonJoker !== firstNonJoker) {
    drawable.push(lastNonJoker);
  }

  return [...new Map(drawable.map((c) => [c.id, c])).values()];
```

EXACT NEW STRING to insert in its place:

```
  // Joker(s) are at edge(s) — determine which edge using rank-based boundary comparison
  if (jokers.length > 0) {
    const jokerOrigIdx = discardedCards.findIndex((c) => c.suit === "JK");
    const lowestNJOrigIdx = discardedCards.indexOf(firstNonJoker);

    if (jokerOrigIdx < lowestNJOrigIdx) {
      // Joker appears before lowest-rank non-joker in client array → low edge
      // Drawable: Joker (low end) + highest non-joker (high end)
      return firstNonJoker === lastNonJoker
        ? [jokers[0]]
        : [jokers[0], lastNonJoker];
    } else {
      // Joker appears after or between non-jokers → treat as high edge
      // Drawable: lowest non-joker (low end) + Joker (high end)
      return firstNonJoker === lastNonJoker
        ? [jokers[0]]
        : [firstNonJoker, jokers[0]];
    }
  }

  // No Joker in run — return the two non-joker edge cards
  return firstNonJoker === lastNonJoker
    ? [firstNonJoker]
    : [firstNonJoker, lastNonJoker];
```

Logic explanation (for traceability — do not add to the file):
- `jokerOrigIdx` = index of Joker in the raw client array (selection order).
- `lowestNJOrigIdx` = index of `firstNonJoker` in the raw client array.
  `firstNonJoker` is a reference to an element of `discardedCards` (via `sortedNonJokers`),
  so `discardedCards.indexOf(firstNonJoker)` uses `===` reference equality and is safe.
- If the client placed the Joker BEFORE the lowest-rank card, that signals low-edge intent.
- Otherwise default to high edge (covers both "Joker last" and ambiguous "Joker middle").
- No Map dedup needed — direct returns have no duplicate-push risk.

Trace for all cases:
  Test 5 [JK,5H,6H]:     jokerOrigIdx=0, lowestNJOrigIdx=1 → 0<1 → low  → [JK, 6H] ✓
  Test 7 [JK,5H,6H,7H]:  jokerOrigIdx=0, lowestNJOrigIdx=1 → 0<1 → low  → [JK, 7H] ✓
  Bug   [6H,7H,JK]:      jokerOrigIdx=2, lowestNJOrigIdx=0 → 2<0 false  → high → [6H, JK] ✓
  Ambig [6H,JK,7H]:      jokerOrigIdx=1, lowestNJOrigIdx=0 → 1<0 false  → high → [6H, JK] (default)
  Test 4 [4H,JK,6H]:     caught by span>nonJokers check (span=3, nonJokers=2) before reaching this code ✓
  Test 6 [4H,JK,6H,7H]:  caught by span>nonJokers check (span=4, nonJokers=3) ✓
  Tests 1,2,3: caught by length===1 and same-rank checks ✓
  </action>

  <verify>
    <automated>node server/test/computeDrawableCards.test.mjs</automated>
  </verify>

  <acceptance_criteria>
    1. The test file prints "✅ כל הטסטים עברו!" with no assertion errors.
    2. The file contains the new implementation:
       grep -n "jokerOrigIdx" server/game/gameLogic.js
       → must print two lines (the const declaration and the if-condition).
    3. The old broken pattern is gone:
       grep -n "findLastIndex" server/game/gameLogic.js
       → must produce NO output (line was removed).
    4. No other functions in gameLogic.js are changed:
       grep -n "export function" server/game/gameLogic.js
       → must show the same set of exported function names as before the edit.
  </acceptance_criteria>

  <done>
    All 7 existing tests pass. The new implementation uses `jokerOrigIdx < lowestNJOrigIdx`
    for edge detection. `findLastIndex` is no longer present in the function. No other
    functions or files are modified.
  </done>
</task>

</tasks>

<verification>
Run the full test file after the edit:

  node server/test/computeDrawableCards.test.mjs

Expected output: "✅ כל הטסטים עברו!" — all 7 assertions pass.

Additional spot-check (manual, confirm in Node REPL or by adding a temporary console.log):

  import { computeDrawableCards } from './server/game/gameLogic.js';
  const h6 = { id:'H6', suit:'H', rank:'6' };
  const h7 = { id:'H7', suit:'H', rank:'7' };
  const jk = { id:'JK1', suit:'JK', rank:'JK' };
  console.log(computeDrawableCards([h6, h7, jk], null));
  // Expected: [{ id:'H6', ... }, { id:'JK1', ... }]
</verification>

<success_criteria>
- node server/test/computeDrawableCards.test.mjs exits 0 and prints the success message.
- server/game/gameLogic.js contains `jokerOrigIdx` and does NOT contain `findLastIndex`.
- Only server/game/gameLogic.js is modified (git diff --name-only shows exactly one file).
</success_criteria>

<output>
After completion, create `.planning/phases/03-bug-fixes-joker/03-01-SUMMARY.md`
</output>
