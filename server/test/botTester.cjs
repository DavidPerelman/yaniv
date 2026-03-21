const { io } = require("socket.io-client");
const fs = require("fs");
const path = require("path");

const LOG_FILE = path.join(__dirname, "bot_output.txt");
const logStream = fs.createWriteStream(LOG_FILE, { flags: "w" });

function log(msg) {
  const line = `${msg}\n`;
  process.stdout.write(line);
  logStream.write(line);
}

const SERVER_URL = process.env.BOT_SERVER_URL || "http://localhost:3001";
const TOTAL_GAMES = 1;
const ACTION_DELAY = 400;
const FREEZE_TIMEOUT = 8000;

// ─── Event names (from shared/constants.js) ───────────────────────
const EV = {
  JOIN_LOBBY: "join_lobby",
  CREATE_ROOM: "create_room",
  JOIN_ROOM: "join_room",
  ROOM_UPDATED: "room_updated",
  ROOM_NOT_FOUND: "room_not_found",
  ROOM_FULL: "room_full",
  START_GAME: "start_game",
  GAME_STATE: "game_state",
  DISCARD: "discard",
  DRAW: "draw",
  CALL_YANIV: "call_yaniv",
  ROUND_END: "round_end",
  GAME_OVER: "game_over",
};

// ─── Report ───────────────────────────────────────────────────────
const report = {
  gamesCompleted: 0,
  gamesFrozen: 0,
  roundsTotal: 0,
  yanivCalls: 0,
  assafTriggers: 0,
  errors: [],
};

let currentGame = 0;
let freezeTimer = null;
let lastEvent = "none";

// ─── Helpers ──────────────────────────────────────────────────────
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function cardValue(card) {
  if (!card) return 0;
  if (card.rank === "JK" || card.rank === "JOKER") return 0;
  if (["J", "Q", "K"].includes(card.rank)) return 10;
  if (card.rank === "A") return 1;
  return parseInt(card.rank);
}

function handSum(hand) {
  return hand.reduce((sum, c) => sum + cardValue(c), 0);
}

function findBestDiscard(hand) {
  // Try pair
  const groups = {};
  for (const c of hand) {
    groups[c.rank] = groups[c.rank] || [];
    groups[c.rank].push(c);
  }
  for (const r in groups) {
    if (groups[r].length >= 2) return groups[r].slice(0, 2);
  }
  // Single highest card
  return [[...hand].sort((a, b) => cardValue(b) - cardValue(a))[0]];
}

function resetFreezeTimer(bot1, bot2, label) {
  if (freezeTimer) clearTimeout(freezeTimer);
  freezeTimer = setTimeout(() => {
    log(
      `[BOT] ❌ FREEZE DETECTED — Game ${currentGame} — last event: "${lastEvent}" — at: ${label}`,
    );
    report.gamesFrozen++;
    report.errors.push(
      `FREEZE at Game ${currentGame}, last event: ${lastEvent}`,
    );
    bot1.disconnect();
    bot2.disconnect();
    setTimeout(() => runGame(currentGame + 1), 1500);
  }, FREEZE_TIMEOUT);
}

// ─── Single game ──────────────────────────────────────────────────
async function runGame(gameNum) {
  if (gameNum > TOTAL_GAMES) return printReport();
  currentGame = gameNum;
  log(`\n[BOT] ▶ Starting game ${gameNum}/${TOTAL_GAMES}`);

  const bot1 = io(SERVER_URL, { reconnection: false });
  const bot2 = io(SERVER_URL, { reconnection: false });

  let roundNum = 0;
  let myHandBot1 = [];
  let myHandBot2 = [];
  let roomId = null;
  let gameStarted = false;

  const cleanup = () => {
    if (freezeTimer) clearTimeout(freezeTimer);
    bot1.removeAllListeners();
    bot2.removeAllListeners();
    bot1.disconnect();
    bot2.disconnect();
  };

  // ── Bot1: connect → join lobby → create room ──
  bot1.on("connect", async () => {
    lastEvent = "bot1 connected";
    log(`[BOT] Game ${gameNum} | Bot1 connected (${bot1.id})`);
    await sleep(200);
    bot1.emit(EV.JOIN_LOBBY, { name: "Bot1" });
    await sleep(200);
    bot1.emit(EV.CREATE_ROOM, {
      roomName: "BotTest",
      settings: { timerSeconds: 0 },
    });
    resetFreezeTimer(bot1, bot2, "waiting for ROOM_UPDATED after create");
  });

  // ── Bot2: connect → join lobby ──
  bot2.on("connect", async () => {
    lastEvent = "bot2 connected";
    log(`[BOT] Game ${gameNum} | Bot2 connected (${bot2.id})`);
    await sleep(200);
    bot2.emit(EV.JOIN_LOBBY, { name: "🤖 Bot2" });
  });

  // ── Bot1 gets ROOM_UPDATED after creating → extract roomId → Bot2 joins ──
  let bot1JoinedRoom = false;
  bot1.on(EV.ROOM_UPDATED, async (room) => {
    lastEvent = "ROOM_UPDATED (bot1)";
    if (!bot1JoinedRoom) {
      bot1JoinedRoom = true;
      roomId = room.id || room.roomId || room.code;
      log(`[BOT] Game ${gameNum} | Room created: ${roomId}`);
      await sleep(300);
      bot2.emit(EV.JOIN_ROOM, { roomId });
      resetFreezeTimer(bot1, bot2, "waiting for ROOM_UPDATED after bot2 join");
    } else if (!gameStarted && room.players?.length >= 2) {
      // Both players in room — start game
      gameStarted = true;
      await sleep(300);
      log(`[BOT] Game ${gameNum} | Both players in room, starting game...`);
      bot1.emit(EV.START_GAME);
      resetFreezeTimer(bot1, bot2, "waiting for GAME_STATE after start");
    }
  });

  bot2.on(EV.ROOM_UPDATED, (room) => {
    lastEvent = "ROOM_UPDATED (bot2)";
    log(
      `[BOT] Game ${gameNum} | Bot2 sees room: ${room.players?.length} players`,
    );
  });

  // ── Game state handler ──
  const onGameState = async (state, botSocket, botHand, botName) => {
    const currentPlayer = state.players?.[state.currentPlayerIndex];
    lastEvent = `GAME_STATE (turn: ${currentPlayer?.name})`;
    resetFreezeTimer(bot1, bot2, `GAME_STATE turn=${currentPlayer?.name}`);

    roundNum = state.roundNumber || roundNum;

    // Update my hand (server sends it as myHand)
    if (state.myHand) {
      botHand.length = 0;
      botHand.push(...state.myHand);
    }

    // Check if it's my turn
    const myTurn = currentPlayer?.id === botSocket.id;

    if (!myTurn) return;

    await sleep(ACTION_DELAY);

    const phase = state.phase;

    if (phase === "discard") {
      const sum = handSum(botHand);
      log(
        `[BOT] Game ${gameNum} | Round ${roundNum} | ${botName} turn — sum: ${sum} | hand: [${botHand.map((c) => c.rank + (c.suit || "")).join(", ")}]`,
      );

      // Yaniv?
      if (sum <= 7 && Math.random() > 0.4) {
        log(
          `[BOT] Game ${gameNum} | Round ${roundNum} | ${botName} calls YANIV (${sum})`,
        );
        report.yanivCalls++;
        botSocket.emit(EV.CALL_YANIV);
        return;
      }

      // Discard
      const toDiscard = findBestDiscard(botHand);
      log(
        `[BOT] Game ${gameNum} | Round ${roundNum} | ${botName} discards [${toDiscard.map((c) => c.rank + (c.suit || "")).join(", ")}]`,
      );
      botSocket.emit(EV.DISCARD, { cardIds: toDiscard.map((c) => c.id) });
    } else if (phase === "draw") {
      log(`[BOT] ...draws from deck`);
      botSocket.emit(EV.DRAW, { source: "deck" });
    }
  };

  bot1.on(EV.GAME_STATE, (s) => onGameState(s, bot1, myHandBot1, "Bot1"));
  bot2.on(EV.GAME_STATE, (s) => onGameState(s, bot2, myHandBot2, "Bot2"));

  // ── Round end ──
  const onRoundEnd = (data) => {
    lastEvent = "ROUND_END";
    report.roundsTotal++;
    log(
      `[BOT] Game ${gameNum} | Round ended | ${JSON.stringify(data.scores || data)}`,
    );
    if (data.assaf || data.assafPlayer) {
      report.assafTriggers++;
      log(`[BOT] Game ${gameNum} | ⚡ ASSAF triggered!`);
    }
    resetFreezeTimer(bot1, bot2, "after ROUND_END");
  };
  bot1.on(EV.ROUND_END, onRoundEnd);

  // ── Game over ──
  const onGameOver = (data) => {
    lastEvent = "GAME_OVER";
    if (freezeTimer) clearTimeout(freezeTimer);
    report.gamesCompleted++;
    log(
      `[BOT] Game ${gameNum} | ✅ FINISHED — Winner: ${data.winner?.name ?? data.winnerName ?? JSON.stringify(data)}`,
    );
    cleanup();
    setTimeout(() => runGame(gameNum + 1), 800);
  };
  bot1.on(EV.GAME_OVER, onGameOver);
  bot2.on(EV.GAME_OVER, onGameOver);

  // ── Errors ──
  const onErr = (name) => (err) => {
    const msg = `Game ${currentGame} | ${name}: ${JSON.stringify(err)}`;
    log(`[BOT] ❌ ERROR: ${msg}`);
    report.errors.push(msg);
  };
  bot1.on("error", onErr("Bot1"));
  bot2.on("error", onErr("Bot2"));
  bot1.on("actionError", onErr("Bot1"));
  bot2.on("actionError", onErr("Bot2"));
  bot1.on("invalidAction", onErr("Bot1"));
  bot2.on("invalidAction", onErr("Bot2"));
  bot1.on(EV.ROOM_NOT_FOUND, () => log(`[BOT] ❌ ROOM_NOT_FOUND`));
  bot1.on(EV.ROOM_FULL, () => log(`[BOT] ❌ ROOM_FULL`));
}

// ─── Report ───────────────────────────────────────────────────────
function printReport() {
  const summary = `
====== BOT TEST REPORT ======
Games completed:      ${report.gamesCompleted}/${TOTAL_GAMES}
Games frozen:         ${report.gamesFrozen}
Total rounds played:  ${report.roundsTotal}
Yaniv calls:          ${report.yanivCalls}
Assaf triggers:       ${report.assafTriggers}
Errors (${report.errors.length}):
${report.errors.length === 0 ? "  None! 🎉" : report.errors.map((e) => `  - ${e}`).join("\n")}
=============================
`;
  log(summary);
  logStream.end();
  process.exit(0);
}

// ─── Start ────────────────────────────────────────────────────────
log(`[BOT] Connecting to ${SERVER_URL}`);
log(`[BOT] Running ${TOTAL_GAMES} games...\n`);
runGame(1);
