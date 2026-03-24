---
title: INTEGRATIONS
focus: tech
generated: 2026-03-24
---

# External Integrations

**Analysis Date:** 2026-03-24

## APIs & External Services

**None detected.** No third-party REST APIs, SaaS platforms, payment processors, analytics services, or external HTTP clients are used. All game logic and data are self-contained.

## Real-time Communication

**Socket.IO (WebSocket layer):**
- Purpose: All game state, room management, chat, and timer events travel exclusively over Socket.IO
- Server library: `socket.io` 4.7.2 — configured in `server/index.js`
- Client library: `socket.io-client` 4.7.2 — singleton instance in `client/src/socket/socketClient.js`
- Transport: WebSocket with HTTP long-poll fallback (Socket.IO default)
- Auth: None — no token or session validation on connection
- CORS: `origin: "*"` (open to any origin)
- Dev proxy: Vite proxies `/socket.io` → `http://localhost:3001` with `ws: true` (`client/vite.config.js`)
- Event contract: All event names defined in `shared/constants.js` under `SOCKET_EVENTS`

**Socket event categories (from `shared/constants.js`):**
- Connection: `join_lobby`
- Room lifecycle: `create_room`, `join_room`, `room_updated`, `room_not_found`, `room_full`
- Game flow: `start_game`, `game_state`, `discard`, `draw`, `call_yaniv`, `turn_changed`, `round_end`, `game_over`
- Chat: `chat_message`, `system_message`
- Timer: `timer_tick`, `timer_expired`
- Reconnect: `check_room`, `room_ok`, `room_gone`

## Data Storage

**Databases:**
- None. No database is used.

**In-memory store:**
- All room and game state is held in a `Map` (`rooms`) on the server process in `server/index.js`
- State is lost on server restart; there is no persistence layer

**File Storage:**
- None (no S3, GCS, or local file uploads)

**Caching:**
- None

## Authentication & Identity

**Auth Provider:**
- None. No authentication system exists.
- Players identify themselves only by entering a name on `LoginPage`; the name is stored in React context (`GameContext`) and passed as a Socket.IO event payload
- No sessions, JWT tokens, OAuth, or cookies

## Monitoring & Observability

**Error Tracking:**
- None. No Sentry, Datadog, or similar service is integrated.

**Logs:**
- Server uses `console.log` / `console.error` throughout `server/index.js` and handler files
- Global uncaught exception and unhandled rejection handlers log to stderr (`server/index.js` lines 1–7)
- Client has no structured logging

**Health Check:**
- `GET /health` endpoint returns `{ status: "ok" }` — used by `client/src/App.jsx` to detect cold-start server wake-up before connecting

## Progressive Web App

**Service Worker:**
- Generated automatically by `vite-plugin-pwa` 1.2.0 at build time
- Register type: `autoUpdate` (silently updates service worker on new deploy)
- Manifest configured in `client/vite.config.js`: standalone display, portrait orientation, Hebrew RTL, `favicon.svg` icon
- No push notifications or background sync configured

## CI/CD & Deployment

**Hosting:**
- Not explicitly configured in the repository. No `Dockerfile`, `fly.toml`, `render.yaml`, `railway.toml`, or Vercel/Netlify config files detected.
- Deployment target is inferred to be a Node.js PaaS (server) + static CDN (client) based on `process.env.PORT` usage and `VITE_SERVER_URL` environment variable.

**CI Pipeline:**
- None detected. No `.github/workflows/`, `.circleci/`, or similar CI configuration.

## Environment Configuration

**Required environment variables:**
- `VITE_SERVER_URL` (client, set at build time) — full URL of the deployed server, e.g. `https://yaniv-server.onrender.com`
  - Referenced in: `client/src/socket/socketClient.js`, `client/src/App.jsx`
  - When absent (local dev), Vite proxy handles routing automatically
- `PORT` (server, runtime) — HTTP port for the server; defaults to `3001`
  - Referenced in: `server/index.js`

**Secrets:**
- No `.env` files detected in the repository. No secrets management system configured.

## Webhooks & Callbacks

**Incoming:** None

**Outgoing:** None

---

*Integration audit: 2026-03-24*
