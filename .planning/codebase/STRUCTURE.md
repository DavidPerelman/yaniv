---
title: STRUCTURE
focus: arch
generated: 2026-03-24
---

# Directory Structure

## Top-Level

```
yaniv/
├── client/          # React SPA (Vite)
├── server/          # Node.js/Express + Socket.IO backend
├── shared/          # Shared constants used by both client and server
└── docs/            # Developer prompts/notes
```

## `shared/`

```
shared/
└── constants.js     # GAME_CONSTANTS + SOCKET_EVENTS — single source of truth for event names and game rules
```

## `server/`

```
server/
├── index.js                    # Entry point: Express, Socket.IO, disconnect handler, rooms Map
├── package.json                # Dependencies: express, socket.io, cors; devDep: nodemon
├── handlers/
│   ├── roomHandlers.js         # Room lifecycle events (create, join, start, reconnect)
│   ├── gameHandlers.js         # Game action events (discard, draw, yaniv) + dev tools
│   └── chatHandlers.js         # Chat message relay
├── game/
│   ├── deck.js                 # Deck creation, card values, shuffle
│   ├── gameLogic.js            # Core game rules: discard/draw/yaniv logic, drawable card computation
│   └── room.js                 # Room CRUD: create, addPlayer, removePlayer, startGame
├── utils/
│   ├── sanitize.js             # privateGameView (per-player), broadcastGameState, sanitizeRoom
│   └── timer.js                # Turn timer: start/clear, auto-advance on expire
└── test/
    ├── computeDrawableCards.test.mjs   # Unit tests for drawable card logic (Node built-in assert)
    └── botTester.cjs                   # Manual multi-bot load tester (Socket.IO client)
```

## `client/`

```
client/
├── vite.config.js              # Vite: React plugin, PWA plugin, dev proxy (/socket.io → :3001)
├── tailwind.config.js          # Custom theme: felt colors, gold, etc.
├── postcss.config.js           # Tailwind + Autoprefixer
├── package.json                # React 18, React Router 6, Socket.IO client, Framer Motion, Tailwind
├── index.html                  # SPA shell
└── src/
    ├── main.jsx                # React root, BrowserRouter mount
    ├── App.jsx                 # Cold-start health poll, routes, GameProvider wrapper
    ├── context/
    │   └── GameContext.jsx     # Global state via useReducer: playerName, room, gameState, chat
    ├── socket/
    │   ├── socketClient.js     # Singleton Socket.IO client instance
    │   ├── SocketManager.jsx   # All socket→dispatch bindings (component, no UI)
    │   └── events.js           # Socket event handler logic
    ├── hooks/
    │   └── useSocket.js        # Per-component socket event subscription hook
    ├── pages/
    │   ├── LoginPage.jsx       # Name entry, saved in localStorage
    │   ├── LobbyPage.jsx       # Create/join room
    │   ├── WaitingPage.jsx     # Room lobby before game start
    │   ├── GamePage.jsx        # Main game UI: hands, discard pile, action buttons, overlays
    │   └── EndPage.jsx         # Final standings
    └── components/
        ├── PlayerHand.jsx      # Current player's hand with card selection
        ├── CardComponent.jsx   # Single card renderer
        ├── DiscardPile.jsx     # Discard pile with drawable card highlight
        ├── DrawablePicker.jsx  # Modal for choosing which drawable card to take
        ├── OpponentArea.jsx    # Face-down opponent cards + score/status
        ├── TurnTimer.jsx       # Countdown display
        ├── ChatPanel.jsx       # In-game chat
        ├── DealingOverlay.jsx  # Animation on round start
        ├── YanivOverlay.jsx    # "Yaniv!" announcement animation
        ├── RoundResultOverlay.jsx  # Scores after each round
        ├── CardsRevealPanel.jsx    # Shows all hands on round end
        ├── DevPanel.jsx            # Developer tools (non-production)
        └── RulesModal.jsx          # In-game rules reference
```

## Key Files Quick Reference

| Need to find... | Look in... |
|---|---|
| Socket event names | `shared/constants.js` |
| Game rules / validation | `server/game/gameLogic.js` |
| Card deck | `server/game/deck.js` |
| Room management | `server/game/room.js` |
| Per-player state view | `server/utils/sanitize.js` |
| Turn timer | `server/utils/timer.js` |
| All socket→store bindings | `client/src/socket/SocketManager.jsx` |
| Global state shape | `client/src/context/GameContext.jsx` |
| Main game page | `client/src/pages/GamePage.jsx` |
| Vite/build config | `client/vite.config.js` |
