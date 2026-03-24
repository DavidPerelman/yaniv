---
title: STACK
focus: tech
generated: 2026-03-24
---

# Technology Stack

**Analysis Date:** 2026-03-24

## Languages

**Primary:**
- JavaScript (ES2022+) - All source code across client, server, and shared modules
- JSX - React component files in `client/src/`

**Secondary:**
- None detected (no TypeScript, Python, etc.)

## Runtime

**Environment:**
- Node.js v23.11.0 (detected from local environment)
- ES Modules (`"type": "module"`) used in both `client/package.json` and `server/package.json`

**Package Manager:**
- npm
- Lockfile: `client/package-lock.json` and `server/package-lock.json` both present

## Frameworks

**Backend:**
- Express 4.18.2 - HTTP server and REST endpoints (`server/index.js`)

**Frontend:**
- React 18.2.0 - UI framework (`client/src/`)
- React Router DOM 6.18.0 - Client-side routing (`client/src/App.jsx`)

**Styling:**
- Tailwind CSS 3.3.5 - Utility-first CSS (`client/tailwind.config.js`)
- PostCSS 8.4.31 - CSS processing pipeline (`client/postcss.config.js`)
- Autoprefixer 10.4.16 - CSS vendor prefixes

**Animation:**
- Framer Motion 10.16.4 - UI animations (`client/src/components/`)

**Real-time:**
- Socket.IO 4.7.2 (server) - WebSocket server (`server/index.js`)
- Socket.IO Client 4.7.2 (client) - WebSocket client (`client/src/socket/socketClient.js`)

**Progressive Web App:**
- vite-plugin-pwa 1.2.0 - PWA manifest and service worker generation (`client/vite.config.js`)
  - App configured as standalone PWA with Hebrew locale (`lang: "he"`, `dir: "rtl"`)
  - Theme color: `#0f3d1a`

**Build/Dev:**
- Vite 4.5.0 - Dev server and bundler (`client/vite.config.js`)
- @vitejs/plugin-react 4.1.0 - React Fast Refresh and JSX transform
- nodemon 3.0.1 - Server hot-reload in development (`server/package.json`)

## Key Dependencies

**Critical:**
- `socket.io` 4.7.2 - Core real-time multiplayer communication; entire game interaction model depends on it
- `react` 18.2.0 - Entire client UI
- `express` 4.18.2 - HTTP server; also serves the `/health` endpoint used by client cold-start detection
- `cors` 2.8.5 - CORS middleware; currently configured with `origin: "*"` on both HTTP and Socket.IO

**Infrastructure:**
- `framer-motion` 10.16.4 - Card animations and overlay transitions throughout game UI

**Testing/Dev:**
- `socket.io-client` 4.8.3 (server devDependency) - Used by bot tester script `server/test/botTester.cjs`
- Node.js built-in `assert` module - Used directly in `server/test/computeDrawableCards.test.mjs`

## Configuration

**Environment:**
- Client reads `VITE_SERVER_URL` at build time via `import.meta.env.VITE_SERVER_URL`
  - Used in `client/src/socket/socketClient.js` (Socket.IO connection target)
  - Used in `client/src/App.jsx` (health check ping on startup)
  - When `VITE_SERVER_URL` is not set (local dev), Vite proxy routes `/socket.io` to `http://localhost:3001`
- Server reads `PORT` at runtime via `process.env.PORT`; defaults to `3001`

**Build:**
- `client/vite.config.js` - Vite config with React plugin, PWA plugin, and dev proxy
- `client/tailwind.config.js` - Tailwind theme extensions (custom colors: `felt`, `feltDark`, `feltLight`, `gold`, etc.)
- `client/postcss.config.js` - PostCSS with tailwindcss and autoprefixer plugins

## Platform Requirements

**Development:**
- Node.js v23+ (detected from environment)
- Two processes required: `npm run dev` in `client/` and `npm run dev` in `server/`
- Client dev server proxies `/socket.io` to `localhost:3001` automatically

**Production:**
- Server: Any Node.js hosting that supports `process.env.PORT` (e.g., Render, Railway, Fly.io)
- Client: Static hosting (Vite build output) — any CDN or static host
- `VITE_SERVER_URL` must be set to the deployed server URL at client build time

---

*Stack analysis: 2026-03-24*
