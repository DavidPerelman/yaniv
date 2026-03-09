import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useGame } from "../context/GameContext";
import socket from "../socket/socketClient";
import { SOCKET_EVENTS, GAME_CONSTANTS } from "../../../shared/constants.js";

function avatarColor(name) {
  const colors = [
    "#e53935",
    "#1565c0",
    "#2e7d32",
    "#6a1b9a",
    "#ef6c00",
    "#00838f",
  ];
  const idx = name.charCodeAt(0) % colors.length;
  return colors[idx];
}

export default function WaitingPage() {
  const { state } = useGame();
  const { room } = state;
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  if (!room) {
    navigate("/");
    return null;
  }

  const isHost = socket.id === room.hostId;

  function copyCode() {
    navigator.clipboard.writeText(room.id).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleStart() {
    socket.emit(SOCKET_EVENTS.START_GAME);
  }

  return (
    <div className="felt-table min-h-screen" dir="rtl">
      <div className="max-w-lg mx-auto px-4 py-8">

        {/* Room code */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center mb-8"
        >
          <p className="text-white/60 text-sm mb-2">קוד החדר</p>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={copyCode}
            className="bg-white/15 border-2 border-white/30 rounded-2xl px-8 py-4 inline-block cursor-pointer hover:border-yellow-400 transition-colors group"
          >
            <span
              style={{ fontFamily: "Fredoka One" }}
              className="text-4xl text-white tracking-widest"
            >
              {room?.id}
            </span>
            <div className="text-white/40 text-xs mt-1 group-hover:text-yellow-400 transition-colors">
              {copied ? "✅ הועתק!" : "📋 לחץ להעתקה"}
            </div>
          </motion.button>
        </motion.div>

        {/* Players list */}
        <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-5 mb-6 border border-white/20">
          <div className="flex justify-between items-center mb-4">
            <span className="text-white/60 text-sm">שחקנים</span>
            <span className="text-yellow-400 font-bold">
              {room.players.length}/{GAME_CONSTANTS.MAX_PLAYERS}
            </span>
          </div>

          <div className="space-y-3">
            <AnimatePresence>
              {room.players.map((player, i) => (
                <motion.div
                  key={player.id}
                  initial={{ x: 40, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -40, opacity: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-center gap-3 bg-white/10 rounded-2xl px-4 py-3"
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-lg shrink-0"
                    style={{ background: avatarColor(player.name) }}
                  >
                    {player.name[0]}
                  </div>
                  <span className="text-white font-semibold flex-1">
                    {player.name}
                  </span>
                  {player.id === room.hostId && (
                    <span className="text-yellow-400 text-xs bg-yellow-400/20 px-2 py-1 rounded-full">
                      👑 מארח
                    </span>
                  )}
                  {player.id === socket.id && player.id !== room.hostId && (
                    <span className="text-green-400 text-xs">אתה</span>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Empty slots */}
          {Array.from({ length: GAME_CONSTANTS.MAX_PLAYERS - room.players.length }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-3 bg-white/5 rounded-2xl px-4 py-3 mt-3 border border-dashed border-white/20"
            >
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/30">
                ?
              </div>
              <span className="text-white/30 text-sm">ממתין לשחקן...</span>
            </div>
          ))}
        </div>

        {/* Settings strip */}
        <div className="flex justify-center gap-4 mb-6 text-sm text-white/60">
          <span>
            ⏱{" "}
            {room.settings?.timerSeconds === 0
              ? "ללא טיימר"
              : `${room.settings?.timerSeconds} שניות`}
          </span>
          <span>·</span>
          <span>👥 עד {GAME_CONSTANTS.MAX_PLAYERS} שחקנים</span>
        </div>

        {/* Start / Waiting */}
        {isHost ? (
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleStart}
            disabled={room.players.length < GAME_CONSTANTS.MIN_PLAYERS}
            style={{
              background:
                room.players.length >= GAME_CONSTANTS.MIN_PLAYERS
                  ? "linear-gradient(135deg, #f5c842, #ffb300)"
                  : undefined,
            }}
            className="w-full py-4 rounded-2xl font-bold text-black text-xl shadow-xl disabled:opacity-40 disabled:cursor-not-allowed disabled:bg-white/20 disabled:text-white transition-all"
          >
            {room.players.length < GAME_CONSTANTS.MIN_PLAYERS
              ? "ממתין לשחקן נוסף..."
              : "התחל משחק! 🚀"}
          </motion.button>
        ) : (
          <div className="text-center">
            <motion.div
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-white/70 text-lg"
            >
              ⏳ ממתין למארח שיתחיל...
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
