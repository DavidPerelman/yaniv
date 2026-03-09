import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useGame } from "../context/GameContext";
import socket from "../socket/socketClient";
import { SOCKET_EVENTS } from "../../../shared/constants.js";

const TIMER_OPTIONS = [
  { value: 0, label: "ללא" },
  { value: 15, label: "15 שניות" },
  { value: 30, label: "30 שניות" },
  { value: 60, label: "60 שניות" },
];

const FLOAT_SYMBOLS = ["🃏", "♠", "♥", "♦", "♣", "🎴"];

export default function LobbyPage() {
  const { state, dispatch } = useGame();
  const navigate = useNavigate();
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [roomCode, setRoomCode] = useState("");

  useEffect(() => {
    if (!state.playerName) navigate("/");
  }, [state.playerName]);

  // Auto-clear error after 3 seconds
  useEffect(() => {
    if (!state.error) return;
    const t = setTimeout(() => dispatch({ type: "CLEAR_ERROR" }), 3000);
    return () => clearTimeout(t);
  }, [state.error]);

  function handleCreateRoom() {
    socket.emit(SOCKET_EVENTS.CREATE_ROOM, {
      playerName: state.playerName,
      settings: { timerSeconds },
    });
  }

  function handleJoinRoom() {
    const code = roomCode.trim().toUpperCase();
    if (code.length !== 6) return;
    socket.emit(SOCKET_EVENTS.JOIN_ROOM, {
      playerName: state.playerName,
      roomId: code,
    });
  }

  return (
    <div className="felt-table min-h-screen relative overflow-hidden" dir="rtl">
      {/* Floating background symbols */}
      <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
        {FLOAT_SYMBOLS.map((sym, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${10 + i * 15}%`,
              top: `${5 + (i % 3) * 30}%`,
              fontSize: `${2 + (i % 3)}rem`,
              opacity: 0.06,
              animation: `floatCard ${4 + i}s ease-in-out infinite alternate`,
              animationDelay: `${i * 0.5}s`,
            }}
          >
            {sym}
          </div>
        ))}
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-10">
          <h1
            style={{ fontFamily: "Fredoka One" }}
            className="text-5xl text-yellow-400 mb-1"
          >
            🃏 יניב
          </h1>
          <p className="text-white/60 text-sm">שלום, {state.playerName}! 👋</p>
        </div>

        {/* Two cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Create Room */}
          <motion.div
            whileHover={{ y: -4, boxShadow: "0 12px 40px rgba(0,0,0,0.3)" }}
            className="bg-white/10 backdrop-blur-sm rounded-3xl p-6 border border-white/20"
          >
            <div className="text-center mb-6">
              <div className="text-4xl mb-2">🏠</div>
              <h2
                style={{ fontFamily: "Fredoka One" }}
                className="text-2xl text-white"
              >
                צור חדר
              </h2>
              <p className="text-white/50 text-sm mt-1">הזמן חברים עם קוד</p>
            </div>

            <div className="mb-6">
              <label className="text-white/70 text-sm mb-3 block text-center">
                ⏱ טיימר לתור
              </label>
              <div className="grid grid-cols-2 gap-2">
                {TIMER_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setTimerSeconds(opt.value)}
                    className={`py-2 px-3 rounded-xl text-sm font-semibold transition-all ${
                      timerSeconds === opt.value
                        ? "bg-yellow-400 text-black"
                        : "bg-white/10 text-white/70 hover:bg-white/20"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleCreateRoom}
              style={{ background: "linear-gradient(135deg, #f5c842, #ffb300)" }}
              className="w-full py-3 rounded-2xl font-bold text-black text-lg shadow-lg active:scale-95 transition-all"
            >
              צור חדר 🚀
            </button>
          </motion.div>

          {/* Card 2: Join Room */}
          <motion.div
            whileHover={{ y: -4, boxShadow: "0 12px 40px rgba(0,0,0,0.3)" }}
            className="bg-white/10 backdrop-blur-sm rounded-3xl p-6 border border-white/20"
          >
            <div className="text-center mb-6">
              <div className="text-4xl mb-2">🔑</div>
              <h2
                style={{ fontFamily: "Fredoka One" }}
                className="text-2xl text-white"
              >
                הצטרף לחדר
              </h2>
              <p className="text-white/50 text-sm mt-1">יש לך קוד? כנס!</p>
            </div>

            <input
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              placeholder="הכנס קוד חדר"
              maxLength={6}
              className="w-full bg-white/20 border border-white/30 rounded-2xl px-4 py-3 text-white text-center text-2xl font-bold tracking-widest placeholder-white/40 mb-4 focus:outline-none focus:border-yellow-400"
            />

            <button
              onClick={handleJoinRoom}
              style={{ background: "linear-gradient(135deg, #1565c0, #1976d2)" }}
              className="w-full py-3 rounded-2xl font-bold text-white text-lg shadow-lg active:scale-95 transition-all"
            >
              הצטרף 🎮
            </button>
          </motion.div>
        </div>
      </div>

      {/* Error toast */}
      <AnimatePresence>
        {state.error && (
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-red-500 text-white px-6 py-3 rounded-2xl shadow-xl font-semibold z-50"
          >
            ⚠️ {state.error}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
