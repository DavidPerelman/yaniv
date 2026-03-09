import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGame } from "../context/GameContext";
import { useSocket } from "../hooks/useSocket";
import socket from "../socket/socketClient";
import { SOCKET_EVENTS } from "../../../shared/constants.js";
import PlayerHand from "../components/PlayerHand";
import DiscardPile from "../components/DiscardPile";
import OpponentArea from "../components/OpponentArea";
import TurnTimer from "../components/TurnTimer";
import ChatPanel from "../components/ChatPanel";
import RoundResultOverlay from "../components/RoundResultOverlay";
import DealingOverlay from "../components/DealingOverlay";
import YanivOverlay from "../components/YanivOverlay";
import DevPanel from "../components/DevPanel";

const RANK_ORDER_CLIENT = [
  "A",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "J",
  "Q",
  "K",
];

function isValidDiscardClient(cards) {
  if (!cards || cards.length === 0) return false;
  if (cards.length === 1) return true;
  const jokers = cards.filter((c) => c.suit === "JK");
  const nonJokers = cards.filter((c) => c.suit !== "JK");
  if (nonJokers.length === 0) return true;
  if (cards.length <= 4) {
    const firstRank = nonJokers[0].rank;
    if (nonJokers.every((c) => c.rank === firstRank)) return true;
  }
  if (cards.length >= 3) {
    const firstSuit = nonJokers[0].suit;
    if (!nonJokers.every((c) => c.suit === firstSuit)) return false;
    const rankValues = nonJokers.map(
      (c) => RANK_ORDER_CLIENT.indexOf(c.rank) + 1,
    );
    if (new Set(rankValues).size !== nonJokers.length) return false;
    rankValues.sort((a, b) => a - b);
    const span = rankValues[rankValues.length - 1] - rankValues[0] + 1;
    if (span <= cards.length) return true;
  }
  return false;
}

const BTN_BASE =
  "rounded-2xl px-5 py-3 font-bold text-white shadow-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 text-sm";

export default function GamePage() {
  const { state, dispatch } = useGame();
  const { gameState, myHand, room, roundResult } = state;
  const [selectedCards, setSelectedCards] = useState([]);
  const [dealing, setDealing] = useState(true);
  const [yanivAnnounce, setYanivAnnounce] = useState(null);
  const [showRoundResult, setShowRoundResult] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [toast, setToast] = useState(null);

  // Reset dealing animation on each new round
  useEffect(() => {
    if (gameState) setDealing(true);
  }, [gameState?.roundNumber]);

  // Clear selection on turn/phase change
  useEffect(() => {
    setSelectedCards([]);
  }, [gameState?.currentPlayerIndex, gameState?.phase]);

  // Yaniv flow: watch roundResult from context (set by SocketManager)
  useEffect(() => {
    if (!roundResult) {
      setYanivAnnounce(null);
      setShowRoundResult(false);
      return;
    }
    setYanivAnnounce(roundResult);
    setShowRoundResult(false);
    const t = setTimeout(() => {
      setYanivAnnounce(null);
      setShowRoundResult(true);
    }, 2500);
    return () => clearTimeout(t);
  }, [roundResult]);

  // Toast for system messages (disconnect notifications)
  const handleSystemMessage = useCallback((msg) => {
    setToast(msg.text);
    setTimeout(() => setToast(null), 3000);
  }, []);
  useSocket(SOCKET_EVENTS.SYSTEM_MESSAGE, handleSystemMessage);

  if (!gameState) {
    return (
      <div
        className="min-h-screen flex items-center justify-center text-xl"
        style={{ fontFamily: "Fredoka One, cursive", color: "#f5c842" }}
      >
        טוען...
      </div>
    );
  }

  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  const isMyTurn = currentPlayer?.id === socket.id;
  const myHandValue = myHand.reduce((sum, c) => sum + (c.value ?? 0), 0);
  const canYaniv =
    isMyTurn && gameState.phase === "discard" && myHandValue <= 7;
  const canDiscard =
    isMyTurn &&
    gameState.phase === "discard" &&
    selectedCards.length > 0 &&
    isValidDiscardClient(selectedCards);
  const canDraw = isMyTurn && gameState.phase === "draw";
  const topCard = gameState.discardPile?.topCard ?? null;
  const drawableCard = gameState.discardPile?.drawableCard ?? null;
  const canDrawDiscard = canDraw && !!drawableCard;
  const timerSeconds =
    room?.settings?.timerSeconds ?? gameState.settings?.timerSeconds ?? 0;
  const opponents = gameState.players.filter((p) => p.id !== socket.id);

  function toggleCard(card) {
    setSelectedCards((prev) =>
      prev.find((c) => c.id === card.id)
        ? prev.filter((c) => c.id !== card.id)
        : [...prev, card],
    );
  }

  function handleDiscard() {
    if (!canDiscard) return;
    socket.emit(SOCKET_EVENTS.DISCARD, {
      cardIds: selectedCards.map((c) => c.id),
    });
    setSelectedCards([]);
  }

  function handleDrawDeck() {
    if (!canDraw) return;
    socket.emit(SOCKET_EVENTS.DRAW, { source: "deck" });
    setSelectedCards([]);
  }

  function handleDrawDiscard() {
    if (!canDrawDiscard) return;
    socket.emit(SOCKET_EVENTS.DRAW, { source: "discard" });
    setSelectedCards([]);
  }

  function handleYaniv() {
    if (!canYaniv) return;
    socket.emit(SOCKET_EVENTS.CALL_YANIV);
    setSelectedCards([]);
  }

  return (
    <div className="felt-table min-h-screen flex flex-col h-screen overflow-hidden relative">
      {/* Table oval decoration */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div
          style={{
            width: "60%",
            height: "50%",
            border: "2px solid rgba(255,255,255,0.06)",
            borderRadius: "50%",
          }}
        />
      </div>

      {/* Header */}
      <div className="relative z-10 flex justify-between items-center px-4 py-2 bg-black/30 text-sm shrink-0">
        <span className="text-gray-300">סבב {gameState.roundNumber}</span>
        <span
          className="font-semibold"
          style={{
            color: isMyTurn ? "#f5c842" : "white",
            fontFamily: isMyTurn ? "Fredoka One, cursive" : undefined,
          }}
        >
          {isMyTurn
            ? gameState.phase === "discard"
              ? "תורך - השלך"
              : "תורך - משוך"
            : `תור ${currentPlayer?.name ?? ""}`}
        </span>
        <span className="text-gray-300">
          ערך יד:{" "}
          <span
            style={{
              color: myHandValue <= 7 ? "#f5c842" : "white",
              fontWeight: "bold",
            }}
          >
            {myHandValue}
          </span>
        </span>
      </div>

      {/* Main area */}
      <div className="relative z-10 flex flex-1 gap-2 p-2 min-h-0">
        {/* Left: game area */}
        <div className="flex flex-col flex-1 gap-3 min-w-0">
          {/* Opponents */}
          <div className="flex flex-wrap justify-center gap-2">
            {opponents.map((p) => (
              <OpponentArea
                key={p.id}
                player={p}
                isCurrentTurn={p.id === currentPlayer?.id}
              />
            ))}
          </div>

          {/* Deck + Discard */}
          <div className="flex justify-center gap-8 items-end">
            <div className="flex flex-col items-center gap-1">
              <span className="text-xs text-gray-400">
                חפיסה ({gameState.deckSize})
              </span>
              <motion.button
                onClick={handleDrawDeck}
                disabled={!canDraw}
                whileTap={canDraw ? { scale: 0.95 } : {}}
                style={{
                  width: "4rem",
                  height: "5.75rem",
                  borderRadius: "12px",
                  background:
                    "linear-gradient(135deg, #1565c0 25%, #1976d2 100%)",
                  border: "1px solid rgba(255,255,255,0.2)",
                  boxShadow: canDraw
                    ? "0 0 12px rgba(21,101,192,0.5)"
                    : undefined,
                  opacity: !canDraw ? 0.4 : 1,
                  cursor: canDraw ? "pointer" : "not-allowed",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <div
                  style={{
                    width: "55%",
                    height: "65%",
                    border: "2px solid rgba(255,255,255,0.3)",
                    borderRadius: "4px",
                    transform: "rotate(45deg)",
                  }}
                />
              </motion.button>
            </div>
            <DiscardPile
              topCard={topCard}
              drawableCard={drawableCard}
              onDraw={handleDrawDiscard}
              canDraw={canDrawDiscard}
            />
          </div>

          {/* Timer */}
          <TurnTimer timerSeconds={timerSeconds} />

          {/* Action buttons - 2×2 grid on mobile, row on sm+ */}
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap justify-center gap-2">
            <button
              onClick={handleDiscard}
              disabled={!canDiscard}
              className={BTN_BASE}
              style={{
                background: "linear-gradient(135deg, #c62828, #e53935)",
              }}
            >
              השלך
            </button>
            <button
              onClick={handleDrawDeck}
              disabled={!canDraw}
              className={BTN_BASE}
              style={{
                background: "linear-gradient(135deg, #1565c0, #1976d2)",
              }}
            >
              משוך מחפיסה
            </button>
            <button
              onClick={handleDrawDiscard}
              disabled={!canDrawDiscard}
              className={BTN_BASE}
              style={{
                background: "linear-gradient(135deg, #6a1b9a, #8e24aa)",
              }}
            >
              משוך מהערמה
            </button>
            <motion.button
              onClick={handleYaniv}
              disabled={!canYaniv}
              animate={canYaniv ? { scale: [1, 1.05, 1] } : {}}
              transition={{ duration: 1.2, repeat: Infinity }}
              className={BTN_BASE + " text-gray-900"}
              style={{
                background: canYaniv
                  ? "linear-gradient(135deg, #f5c842, #ffb300)"
                  : "linear-gradient(135deg, #f5c842, #ffb300)",
              }}
            >
              יניב! ({myHandValue})
            </motion.button>
          </div>

          {selectedCards.length > 0 && !isValidDiscardClient(selectedCards) && (
            <p className="text-center text-red-400 text-xs">שילוב לא חוקי</p>
          )}
        </div>

        {/* Chat panel */}
        <div
          className={`w-48 shrink-0 ${showChat ? "flex" : "hidden"} sm:flex flex-col`}
        >
          <ChatPanel />
        </div>
      </div>

      {/* My hand */}
      <div className="relative z-10 shrink-0 bg-black/20 rounded-t-2xl pt-2 pb-1">
        <p className="text-center text-xs text-gray-400 mb-1">
          הקלפים שלי | סכום:{" "}
          <span
            style={{
              color: myHandValue <= 7 ? "#f5c842" : "white",
              fontWeight: "bold",
            }}
          >
            {myHandValue}
          </span>
        </p>
        <PlayerHand
          cards={myHand}
          onCardSelect={toggleCard}
          selectedCards={selectedCards}
        />
      </div>

      {/* Mobile chat toggle */}
      <button
        onClick={() => setShowChat((s) => !s)}
        className="fixed bottom-24 left-3 z-20 sm:hidden w-10 h-10 rounded-full bg-felt shadow-lg flex items-center justify-center text-lg"
      >
        💬
      </button>

      {/* Toast notification (disconnect etc.) */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 100, opacity: 0 }}
            className="fixed top-4 left-4 bg-black/80 text-white px-4 py-2 rounded-xl z-50 text-sm"
          >
            ⚠️ {toast}
          </motion.div>
        )}
      </AnimatePresence>

      <DevPanel />

      {/* Overlays */}
      {dealing && (
        <DealingOverlay
          players={gameState.players}
          onComplete={() => setDealing(false)}
        />
      )}

      {/* Yaniv/Assaf announcement — center, auto-hides after 2.5s */}
      {yanivAnnounce && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 pointer-events-none">
          <YanivOverlay roundResult={yanivAnnounce} myId={socket.id} />
        </div>
      )}

      {/* Round result modal — includes cards inside */}
      {showRoundResult && roundResult && (
        <RoundResultOverlay
          roundResult={roundResult}
          myId={socket.id}
          onClose={() => {
            setShowRoundResult(false);
            dispatch({ type: "SET_ROUND_RESULT", payload: null });
          }}
        />
      )}
    </div>
  );
}
