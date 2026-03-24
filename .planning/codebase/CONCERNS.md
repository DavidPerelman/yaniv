---
title: CONCERNS
focus: concerns
generated: 2026-03-24
---

# Technical Concerns

## Critical / Security

### No Authentication
- Players identify by name only; any client can impersonate any player name
- No session tokens — if a socket disconnects and reconnects with a different socket ID, they cannot re-join an in-progress game
- `CORS: origin: "*"` on both HTTP and Socket.IO — open to any origin

### In-Memory State Only
- All game state held in a `Map` on the server process
- Server restart = all rooms lost, all in-progress games destroyed
- No persistence, no crash recovery

### Dev Sockets in Production Risk
- `gameHandlers.js` registers `dev_force_low_hand`, `dev_set_score`, `dev_force_my_turn`, `dev_setup_scenario`, etc. only when `process.env.NODE_ENV !== "production"`
- If `NODE_ENV` is not set (common on some PaaS platforms), these cheat tools are active in production

## Logic / Correctness

### Duplicate `isValidDiscard` Logic
- `server/game/gameLogic.js:isValidDiscard` and `client/src/pages/GamePage.jsx:isValidDiscardClient` are parallel implementations
- No shared import between them — drift risk if rules change

### `drawableDiscardCards` State Confusion
- `applyDiscard` sets `drawableDiscardCards: topBeforeDiscard ? [topBeforeDiscard] : []` (the OLD top card)
- It also sets `nextDrawableCards: computeDrawableCards(cards, topBeforeDiscard)` (the NEW drawable set)
- `applyDraw` then promotes `nextDrawableCards → drawableDiscardCards`
- This two-step swap is confusing and was the source of recent bugs (see git history)
- `GamePage.jsx` reads `gameState.discardPile?.drawableCards` which comes from `privateGameView`

### Timer Uses Direct Mutation
- `timer.js` directly mutates `gs.discardPile`, `gs.players`, `gs.lastDiscardedCards` on expiry
- Inconsistent with the immutable update pattern used in `gameLogic.js`

### Eliminated Player Handling on Disconnect
- When a player disconnects mid-game, they are marked `isEliminated = true` but their socket room membership is lost
- If they reconnect, `check_room` / `room_ok` may succeed (room still exists) but game state won't include them as active
- No rejoin-in-progress-game flow

### `RANK_ORDER` Duplication
- Defined in `server/game/deck.js` (exported) and re-defined locally in `client/src/pages/GamePage.jsx` as `RANK_ORDER_CLIENT`
- Should be in `shared/constants.js`

## Missing Error Handling

### Client Socket Errors Not Displayed
- `GameContext` has a `SET_ERROR` action but the error is not consistently displayed to the user
- Server emits `socket.emit("error", { message })` but client has no global handler for the `"error"` event

### No Validation on `join_room` Name
- Players can join with empty names or very long strings
- No server-side sanitization of player names

### Room Code Collision (Low Risk)
- `generateRoomCode()` produces a random 6-char alphanumeric code with no collision check
- `rooms.set()` would silently overwrite an existing room if codes collide (probability ~1/2.2B per pair, negligible in practice)

## Code Quality

### `GamePage.jsx` Too Large
- Single file handles game rendering, all action handlers, overlay state, chat toggle, toast — 450+ lines
- Should be decomposed into smaller components/hooks

### `gameHandlers.js` Does Too Much
- Handles game events AND contains extensive dev tooling (100+ lines of dev socket handlers)
- Dev tools should be in a separate file or registration function

### `console.log` Left in Client
- `GamePage.jsx:handleDrawDiscard` has a `console.log` debug statement left in

### No ESLint/Prettier
- No code style enforcement; inconsistent formatting is possible as the codebase grows

## Missing Features / Incomplete

### No Reconnect for In-Progress Games
- `check_room` / `room_ok` reconnect flow works for waiting rooms but not for re-joining an active game

### No Spectator Mode
- No way to observe a game in progress

### No Persistence
- Game history, scores across sessions, or leaderboards are not stored

### Single-File Deployment Config Missing
- No `Dockerfile`, `render.yaml`, `fly.toml`, or similar — deployment requires manual setup
