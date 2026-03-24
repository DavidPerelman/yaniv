---
title: TESTING
focus: quality
generated: 2026-03-24
---

# Testing

## Test Frameworks

- **No test framework installed** (no Jest, Vitest, Mocha, etc. in any `package.json`)
- `server/test/computeDrawableCards.test.mjs` uses **Node.js built-in `assert`** module directly

## Test Files

| File | Type | What it covers |
|---|---|---|
| `server/test/computeDrawableCards.test.mjs` | Unit test | `computeDrawableCards()` function — 7 scenarios covering single cards, pairs, triples, runs with jokers in various positions |
| `server/test/botTester.cjs` | Manual integration/load test | Spawns multiple Socket.IO bot clients that simulate a full game session; not automated |

## How to Run Tests

```bash
# Unit test (from repo root or server/):
node server/test/computeDrawableCards.test.mjs

# Bot tester (manual, requires server running):
node server/test/botTester.cjs
```

No `npm test` script defined in either `package.json`.

## Coverage Areas

### Tested
- `computeDrawableCards` — edge cases for joker position in runs and sets

### Test Cases Documented But Not Implemented
The following files have `/* TESTS */` comment blocks listing expected test cases that are **not yet implemented as runnable tests**:
- `server/game/gameLogic.js` — createInitialGameState, isValidDiscard, applyDiscard, applyDraw, canCallYaniv, applyYaniv, getNextActivePlayerIndex
- `server/game/room.js` — generateRoomCode, createRoom, addPlayerToRoom, removePlayerFromRoom, startGame
- `server/game/deck.js` — createDeck, getCardValue, calculateHandValue

### Not Tested
- Room handler socket events (integration)
- Game handler socket events (integration)
- Turn timer behavior
- Client-side logic (React components, GameContext reducer, SocketManager)
- Reconnect flow
- Disconnect/elimination handling

## Test Strategy Observations

- The `/* TESTS */` comments serve as a test specification backlog — the intent exists but implementation is missing
- Game logic functions (`gameLogic.js`, `room.js`, `deck.js`) are pure functions, making them straightforward to unit test without mocking
- Socket handler tests would require either a real Socket.IO server or an integration test harness
- `botTester.cjs` provides informal smoke testing of the full game loop

## CI/CD

No CI pipeline configured. No `.github/workflows/`, no test scripts in `package.json`.
