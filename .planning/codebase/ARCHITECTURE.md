---
title: ARCHITECTURE
focus: arch
generated: 2026-03-24
---

# Architecture

## Pattern

Classic **client-server, real-time multiplayer** architecture. The server holds all authoritative game state; the client is a dumb view that sends player actions and renders state it receives.

```
Browser (React SPA)
       │
       │  Socket.IO (WebSocket)
       │  HTTP GET /health
       ▼
Node.js / Express + Socket.IO Server
       │
       │  in-memory Map (rooms)
       ▼
  Game Logic (pure functions, no DB)
```

## Major Components

### Server

| Component | File(s) | Responsibility |
|---|---|---|
| HTTP/WS Server | `server/index.js` | Express app, Socket.IO setup, disconnect handler |
| Room Handlers | `server/handlers/roomHandlers.js` | create_room, join_room, start_game, check_room |
| Game Handlers | `server/handlers/gameHandlers.js` | discard, draw, call_yaniv, dev tools |
| Chat Handlers | `server/handlers/chatHandlers.js` | chat_message relay |
| Game Logic | `server/game/gameLogic.js` | Pure functions: createInitialGameState, applyDiscard, applyDraw, applyYaniv, computeDrawableCards |
| Room Logic | `server/game/room.js` | Pure functions: createRoom, addPlayerToRoom, removePlayerFromRoom, startGame |
| Deck | `server/game/deck.js` | createDeck (54 cards, Fisher-Yates shuffle), getCardValue, calculateHandValue |
| State Sanitizer | `server/utils/sanitize.js` | privateGameView (hides other players' hands), broadcastGameState, sanitizeRoom |
| Timer | `server/utils/timer.js` | startTurnTimer / clearTurnTimer — per-room countdown, auto-advance on expire |
| Shared Constants | `shared/constants.js` | GAME_CONSTANTS, SOCKET_EVENTS — used by both client and server |

### Client

| Component | File(s) | Responsibility |
|---|---|---|
| App | `client/src/App.jsx` | Cold-start health poll, routes, GameProvider wrapper |
| GameContext | `client/src/context/GameContext.jsx` | Global state via useReducer; playerName, room, gameState, chat, roundResult |
| SocketManager | `client/src/socket/SocketManager.jsx` | Registers all socket listeners; bridges Socket.IO events to dispatch() |
| socketClient | `client/src/socket/socketClient.js` | Singleton Socket.IO client instance |
| events.js | `client/src/socket/events.js` | Socket event handler definitions |
| useSocket | `client/src/hooks/useSocket.js` | Hook for component-level socket event subscriptions |
| Pages | `client/src/pages/` | LoginPage, LobbyPage, WaitingPage, GamePage, EndPage |
| Components | `client/src/components/` | PlayerHand, DiscardPile, OpponentArea, CardComponent, TurnTimer, ChatPanel, overlays, DrawablePicker |

## Data Flow

### Game turn (discard → draw cycle):

1. Player selects cards in UI → clicks "השלך" → `socket.emit(DISCARD, { cardIds })`
2. Server: `gameHandlers.js` → `applyDiscard()` → mutates room.gameState → `broadcastGameState()`
3. `broadcastGameState` sends each player a **private view** (their own hand only) via `GAME_STATE` event
4. Client `SocketManager` receives `GAME_STATE` → `dispatch({ type: 'SET_GAME_STATE' })`
5. React re-renders GamePage with new state
6. Player draws → `socket.emit(DRAW, { source, cardId })` → same flow, then `TURN_CHANGED` emitted
7. Timer started/restarted on each `DRAW` event

### Yaniv call:

1. `socket.emit(CALL_YANIV)` → server `applyYaniv()` → emits `ROUND_END` (with full player hands revealed)
2. If game over: emits `GAME_OVER` → client navigates to `/end`
3. If round continues: 3s setTimeout → new round via `createInitialGameState`, preserving scores → `broadcastGameState`

## Key Design Decisions

- **Authoritative server**: All game validation runs server-side. Client has a duplicate `isValidDiscardClient` for immediate UI feedback only.
- **Private views**: `privateGameView()` strips other players' hands before broadcasting — prevents cheating.
- **In-memory only**: No database. All state lost on server restart.
- **Shared constants**: `shared/constants.js` at the repo root is imported by both client and server, keeping event names and game constants in sync.
- **Pure game functions**: `gameLogic.js` and `room.js` are pure functions with no I/O side effects, making them independently testable.
- **Dev tools**: `gameHandlers.js` registers several `dev_*` socket events in non-production environments for testing specific game scenarios.

## Entry Points

- **Server**: `server/index.js` — `httpServer.listen(PORT)`
- **Client**: `client/src/main.jsx` → `<App />` → `<GameProvider>` → `<SocketManager>` + `<Routes>`
