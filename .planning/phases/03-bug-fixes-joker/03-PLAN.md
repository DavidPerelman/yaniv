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
    - "computeDrawableCards([6H, 7H, JK], top) returns [6H, JK] (Joker after last non-joker → high edge)"
    - "computeDrawableCards([JK, 6H, 7H], top) returns [JK, 7H] (Joker before first non-joker → low edge)"
    - "computeDrawableCards([JK, 5H, 6H], top) returns [JK, 6H] (test 5 preserved)"
    - "computeDrawableCards([JK, 5H, 6H, 7H], top) returns [JK, 7H] (test 7 preserved)"
    - "computeDrawableCards([4H, JK, 6H], top) returns [4H, 6H] (Joker fills gap — not drawable)"
    - "All 7 existing tests in computeDrawableCards.test.mjs still pass after the change"
  artifacts:
    - path: "server/game/gameLogic.js"
      provides: "Fixed computeDrawableCards — original-position Joker edge detection"
      contains: "jokerOrigIdx < firstNJOrigIdx"
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
  <name>Task 1: Fix edge detection in computeDrawableCards using joker's original array position</name>
  <files>server/game/gameLogic.js</files>

  <read_first>
    - server/game/gameLogic.js (full computeDrawableCards function, lines 51–105)
    - server/test/computeDrawableCards.test.mjs (all 7 test cases — all must still pass)
  </read_first>

  <behavior>
    Design rule: Use the Joker's position in the client-sent array relative to the
    rank-lowest non-joker to determine which edge it occupies. No sorting of the full
    input array is needed.

    Bug case (must now pass):
      Input:  [6H, 7H, JK]
      jokerOrigIdx=2, firstNJOrigIdx=0 → not low edge → high edge → [6H, JK] ✓

    Test 5 — unchanged:
      Input:  [JK, 5H, 6H]
      jokerOrigIdx=0, firstNJOrigIdx=1 → low edge → [JK, 6H] ✓

    Test 7 — unchanged:
      Input:  [JK, 5H, 6H, 7H]
      jokerOrigIdx=0, firstNJOrigIdx=1 → low edge → [JK, 7H] ✓

    Test 4 — unchanged (Joker fills gap):
      Input:  [4H, JK, 6H]
      span=3 > nonJokers=2 → middle gap → return [4H, 6H]  ✓

    Test 6 — unchanged:
      Input:  [4H, JK, 6H, 7H]
      span=4 > nonJokers=3 → middle gap → return [4H, 7H]  ✓

    All 7 existing tests pass with no expected-value changes.
  </behavior>

  <action>
Using the Edit tool, replace ONLY the edge-detection block at the bottom of
`computeDrawableCards` (the block after the middle-gap check, through the closing brace).

EXACT OLD STRING to replace:

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
}
```

EXACT NEW STRING:

```
  // No jokers — pure non-joker run
  if (jokers.length === 0) {
    return firstNonJoker === lastNonJoker
      ? [firstNonJoker]
      : [firstNonJoker, lastNonJoker];
  }

  // Joker is at an edge — detect which edge by its position relative to the
  // rank-lowest non-joker in the original (client-sent) array
  const joker = jokers[0];
  const jokerOrigIdx = discardedCards.indexOf(joker);
  const firstNJOrigIdx = discardedCards.indexOf(firstNonJoker);

  if (jokerOrigIdx < firstNJOrigIdx) {
    // Joker before lowest-rank non-joker in client array → low edge
    return [joker, lastNonJoker];
  }
  // Joker after (or between) non-jokers → high edge
  return [firstNonJoker, joker];
}
```

Trace for all cases:
  Bug   [6H,7H,JK]:    jokerOrigIdx=2, firstNJOrigIdx=0 → high edge → [6H,JK] ✓
  Test 4 [4H,JK,6H]:   span=3>nj=2 → middle → [4H,6H] (never reaches edge block) ✓
  Test 5 [JK,5H,6H]:   jokerOrigIdx=0, firstNJOrigIdx=1 → low edge → [JK,6H] ✓
  Test 6 [4H,JK,6H,7H]:span=4>nj=3 → middle → [4H,7H] ✓
  Test 7 [JK,5H,6H,7H]:jokerOrigIdx=0, firstNJOrigIdx=1 → low edge → [JK,7H] ✓
  Tests 2,3: same-rank set → return [...discardedCards] ✓
  </action>

  <verify>
    <automated>node server/test/computeDrawableCards.test.mjs</automated>
  </verify>

  <acceptance_criteria>
    1. jokerOrigIdx is present:
       grep -n "jokerOrigIdx" server/game/gameLogic.js
       → must print exactly two lines (declaration + comparison).
    2. Old findIndex/findLastIndex calls on discardedCards are gone:
       grep -n "discardedCards.find" server/game/gameLogic.js
       → must produce NO output.
    3. All 7 existing tests pass with no changes to expected values:
       node server/test/computeDrawableCards.test.mjs
       → "✅ כל הטסטים עברו!"
    4. No other functions in gameLogic.js are changed.
  </acceptance_criteria>

  <done>
    The edge-detection block now uses jokerOrigIdx vs firstNJOrigIdx.
    The Map dedup at the end is removed (no duplicate-push risk with the new logic).
    All 7 existing tests pass. Only server/game/gameLogic.js is modified.
  </done>
</task>

</tasks>

<verification>
Run the test file:

  node server/test/computeDrawableCards.test.mjs

Expected: tests 5 and 7 FAIL (behavior change — Joker now always high end).
All other tests pass.

Bug-case spot-check:

  node -e "
    import('./server/game/gameLogic.js').then(({computeDrawableCards}) => {
      const h6={id:'H6',suit:'H',rank:'6'}, h7={id:'H7',suit:'H',rank:'7'}, jk={id:'JK1',suit:'JK',rank:'JK'};
      console.log(computeDrawableCards([h6,h7,jk],null).map(c=>c.id));
      // Expected: ['H6','JK1']
    });
  "
</verification>

<success_criteria>
- server/game/gameLogic.js contains `const sorted = [...discardedCards].sort(`.
- server/game/gameLogic.js does NOT contain `discardedCards.findIndex` or `discardedCards.findLastIndex`.
- Tests 1–4 and 6 pass; tests 5 and 7 fail with their prior expected values (expected behavior change).
- Only server/game/gameLogic.js is modified (git diff --name-only shows exactly one file).
</success_criteria>

<output>
After completion, create `.planning/phases/03-bug-fixes-joker/03-01-SUMMARY.md`
</output>
