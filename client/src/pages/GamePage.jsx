import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
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
  "rounded-2xl px-3 py-2 md:px-5 md:py-3 font-bold text-white shadow-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 text-xs md:text-sm";

export default function GamePage() {
  const { state, dispatch } = useGame();
  const { gameState, myHand, room, roundResult } = state;
  const [selectedCards, setSelectedCards] = useState([]);
  const [dealing, setDealing] = useState(true);
  const [yanivAnnounce, setYanivAnnounce] = useState(null);
  const [showRoundResult, setShowRoundResult] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (gameState) setDealing(true);
  }, [gameState?.roundNumber]);

  useEffect(() => {
    setSelectedCards([]);
  }, [gameState?.currentPlayerIndex, gameState?.phase]);

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
    <>
      <div className="h-dvh flex flex-col overflow-hidden felt-table relative">
        {/* Header - compact on mobile */}
        <header className="flex justify-between items-center px-3 py-2 bg-black/20 text-sm shrink-0 relative z-10">
          <span className="text-white/70 text-xs md:text-sm">
            ערך יד:{" "}
            <strong style={{ color: myHandValue <= 7 ? "#f5c842" : "white" }}>
              {myHandValue}
            </strong>
          </span>
          <div className="flex items-center gap-2">
            <span
              className="font-bold text-center text-xs md:text-sm"
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
            <TurnTimer timerSeconds={timerSeconds} />
          </div>
          <span className="text-white/70 text-xs md:text-sm">
            סבב {gameState.roundNumber}
          </span>
        </header>

        {/* Main content: game area + chat side by side on desktop */}
        <div className="flex flex-1 overflow-hidden relative z-10">
          {/* Game area */}
          <div className="flex-1 flex flex-col overflow-hidden relative">
            {/* Oval table decoration */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div
                style={{
                  width: "80%",
                  height: "45%",
                  border: "2px solid rgba(255,255,255,0.06)",
                  borderRadius: "50%",
                }}
              />
            </div>

            {/* Opponents row */}
            <div className="flex justify-center gap-2 pt-3 px-2 shrink-0 flex-wrap">
              {opponents.map((p) => (
                <OpponentArea
                  key={p.id}
                  player={p}
                  isCurrentTurn={p.id === currentPlayer?.id}
                />
              ))}
            </div>

            {/* Deck + Discard pile - centered, fills remaining space */}
            <div className="flex justify-center items-center gap-6 md:gap-8 flex-1">
              <div className="flex flex-col items-center gap-1">
                <span className="text-xs text-gray-400">
                  חפיסה ({gameState.deckSize})
                </span>
                <motion.button
                  onClick={handleDrawDeck}
                  disabled={!canDraw}
                  whileTap={canDraw ? { scale: 0.95 } : {}}
                  style={{
                    width: "3.5rem",
                    height: "5rem",
                    borderRadius: "10px",
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
                  className="md:w-16 md:h-24"
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

            {/* Action buttons - 2×2 on mobile, row on desktop */}
            <div className="grid grid-cols-2 md:flex md:flex-row justify-center gap-2 px-3 pb-2 shrink-0">
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
                  background: "linear-gradient(135deg, #f5c842, #ffb300)",
                }}
              >
                יניב! ({myHandValue})
              </motion.button>
            </div>

            {selectedCards.length > 0 &&
              !isValidDiscardClient(selectedCards) && (
                <p className="text-center text-red-400 text-xs pb-1">
                  שילוב לא חוקי
                </p>
              )}
          </div>

          {/* Desktop chat sidebar */}
          <div className="hidden md:flex md:flex-col md:w-56 shrink-0 border-r border-white/10">
            <ChatPanel />
          </div>
        </div>

        {/* My hand - fixed at bottom */}
        <div
          className="shrink-0 bg-black/30 pt-2 pb-3 relative z-10"
          style={{ height: "150px" }}
        >
          <div className="text-center text-white/60 text-xs mb-1">
            הקלפים שלי | סכום:{" "}
            <strong style={{ color: myHandValue <= 7 ? "#f5c842" : "white" }}>
              {myHandValue}
            </strong>
          </div>
          <div className="flex gap-1 px-2 justify-center items-center h-24">
            <PlayerHand
              cards={myHand}
              onCardSelect={toggleCard}
              selectedCards={selectedCards}
            />
          </div>
        </div>

        {/* Chat toggle - mobile only, bottom right */}
        <button
          onClick={() => setChatOpen(true)}
          className="md:hidden fixed bottom-36 right-3 z-20 bg-black/60 text-white rounded-full w-11 h-11 flex items-center justify-center text-xl shadow-lg"
        >
          💬
        </button>

        {/* Toast notification */}
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

        {/* Overlays */}
        {dealing && (
          <DealingOverlay
            players={gameState.players}
            onComplete={() => setDealing(false)}
          />
        )}

        {yanivAnnounce && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 pointer-events-none">
            <YanivOverlay roundResult={yanivAnnounce} myId={socket.id} />
          </div>
        )}

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

      {/* Mobile chat - portal, completely outside layout */}
      {chatOpen &&
        createPortal(
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 9999,
              display: "flex",
              flexDirection: "column",
              background: "#0f3d1a",
            }}
          >
            <ChatPanel onClose={() => setChatOpen(false)} />
          </div>,
          document.body,
        )}
    </>
  );
}
