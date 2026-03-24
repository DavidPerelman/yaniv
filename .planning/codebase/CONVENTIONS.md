---
title: CONVENTIONS
focus: quality
generated: 2026-03-24
---

# Coding Conventions

## Language & Module System

- **ES Modules** (`"type": "module"`) everywhere — `import`/`export`, no `require()`
- Exception: `server/test/botTester.cjs` uses CommonJS (`.cjs` extension) due to Socket.IO client compatibility
- Test file uses `.mjs` extension: `computeDrawableCards.test.mjs`

## Naming

| Thing | Convention | Example |
|---|---|---|
| Files | camelCase | `gameLogic.js`, `socketClient.js` |
| React components | PascalCase file + default export | `GamePage.jsx`, `CardComponent.jsx` |
| Functions | camelCase | `applyDiscard`, `createInitialGameState` |
| Constants | SCREAMING_SNAKE_CASE | `SOCKET_EVENTS`, `GAME_CONSTANTS` |
| React state actions | SCREAMING_SNAKE_CASE | `SET_GAME_STATE`, `ADD_CHAT` |
| Socket event strings | snake_case | `'game_state'`, `'call_yaniv'` |
| CSS class vars | kebab-case via Tailwind | `felt-table`, `animate-fade-in` |

## File Organization

- Server logic split into handlers (I/O), game (pure logic), utils (cross-cutting)
- Client split into pages (routes), components (reusable UI), context (state), socket (networking), hooks (abstractions)
- Shared constants at repo root in `shared/` — imported with relative paths from both sides

## React Patterns

- **Global state**: `useReducer` + `createContext` in `GameContext.jsx`; consumed via `useGame()` hook
- **Socket bindings**: Centralized in `SocketManager.jsx` (a component with no UI); individual components use `useSocket(event, handler)` for local subscriptions
- **Socket singleton**: `socketClient.js` exports a single `socket` instance imported directly
- **Page routing**: React Router v6 with `<Routes>`/`<Route>`; navigation via `useNavigate()`
- **Animations**: Framer Motion `<motion.div>`, `<AnimatePresence>` for enter/exit transitions

## State Management

- All game state flows: server → Socket.IO → `SET_GAME_STATE` dispatch → `GameContext`
- Player name persisted to `localStorage` (`yaniv_name`) on `SET_NAME` action
- `RESET` action preserves `playerName` but clears all other state

## Error Handling

- Server: each handler returns `{ success: false, error: string }` on failure; handler emits `socket.emit("error", { message })`
- Server: global `uncaughtException` and `unhandledRejection` handlers at top of `index.js`
- Server: try/catch in all game logic functions with `console.error` logging
- Client: no structured error display for socket errors beyond `SET_ERROR` in context (not consistently wired)

## Logging

- Server: `console.log` with `[ROOM]`, `[GAME]`, `[FATAL]` prefixes for log scanning
- Client: minimal `console.log` for debug tracing (some left in `GamePage.jsx`)

## Comments

- No JSDoc; minimal inline comments
- Some files have a `/* TESTS */` block at the bottom listing expected test cases as comments (e.g., `gameLogic.js`, `room.js`, `deck.js`) — these describe intent, not runnable tests

## Code Style

- No `.eslintrc` or `.prettierrc` detected — no enforced formatter
- Consistent use of `const`/`let`, arrow functions, object spread, optional chaining
- Template literals for log messages
- Immutable update pattern in game logic: spread into new objects rather than mutation (except in `gameHandlers.js` where `room.gameState` is directly reassigned)

## Tailwind

- Custom theme colors defined in `tailwind.config.js`: `felt`, `feltDark`, `feltLight`, `gold`, `goldDark`
- `felt-table` CSS class used as the main game background
- Responsive breakpoints: `md:` prefix for desktop variants (mobile-first)
