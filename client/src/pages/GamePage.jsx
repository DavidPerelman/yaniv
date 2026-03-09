import { useState, useEffect } from 'react'
import { useGame } from '../context/GameContext'
import socket from '../socket/socketClient'
import { SOCKET_EVENTS } from '../../../shared/constants.js'
import PlayerHand from '../components/PlayerHand'
import DiscardPile from '../components/DiscardPile'
import OpponentArea from '../components/OpponentArea'
import TurnTimer from '../components/TurnTimer'
import ChatPanel from '../components/ChatPanel'
import RoundResultOverlay from '../components/RoundResultOverlay'

const RANK_ORDER_CLIENT = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']

function isValidDiscardClient(cards) {
  if (!cards || cards.length === 0) return false
  if (cards.length === 1) return true
  const jokers = cards.filter(c => c.suit === 'JK')
  const nonJokers = cards.filter(c => c.suit !== 'JK')
  if (nonJokers.length === 0) return true
  // Set
  if (cards.length <= 4) {
    const firstRank = nonJokers[0].rank
    if (nonJokers.every(c => c.rank === firstRank)) return true
  }
  // Run
  if (cards.length >= 3) {
    const firstSuit = nonJokers[0].suit
    if (!nonJokers.every(c => c.suit === firstSuit)) return false
    const rankValues = nonJokers.map(c => RANK_ORDER_CLIENT.indexOf(c.rank) + 1)
    if (new Set(rankValues).size !== nonJokers.length) return false
    rankValues.sort((a, b) => a - b)
    const span = rankValues[rankValues.length - 1] - rankValues[0] + 1
    if (span <= cards.length) return true
  }
  return false
}

export default function GamePage() {
  const { state, dispatch } = useGame()
  const { gameState, myHand, room, roundResult } = state
  const [selectedCards, setSelectedCards] = useState([])

  // Clear selection when phase or turn changes
  useEffect(() => {
    setSelectedCards([])
  }, [gameState?.currentPlayerIndex, gameState?.phase])

  if (!gameState) {
    return <div className="min-h-screen flex items-center justify-center text-xl">טוען...</div>
  }

  const currentPlayer = gameState.players[gameState.currentPlayerIndex]
  const isMyTurn = currentPlayer?.id === socket.id
  const myHandValue = myHand.reduce((sum, c) => sum + (c.value ?? 0), 0)
  const canYaniv = isMyTurn && gameState.phase === 'discard' && myHandValue <= 7
  const canDiscard = isMyTurn && gameState.phase === 'discard' && selectedCards.length > 0 && isValidDiscardClient(selectedCards)
  const canDraw = isMyTurn && gameState.phase === 'draw'

  const opponents = gameState.players.filter(p => p.id !== socket.id)
  const topCard = gameState.discardPile?.topCard ?? null
  const drawableCard = gameState.discardPile?.drawableCard ?? null
  const canDrawDiscard = canDraw && !!drawableCard
  const timerSeconds = room?.settings?.timerSeconds ?? gameState.settings?.timerSeconds ?? 0

  function toggleCard(card) {
    setSelectedCards(prev =>
      prev.find(c => c.id === card.id)
        ? prev.filter(c => c.id !== card.id)
        : [...prev, card]
    )
  }

  function handleDiscard() {
    if (!canDiscard) return
    socket.emit(SOCKET_EVENTS.DISCARD, { cardIds: selectedCards.map(c => c.id) })
    setSelectedCards([])
  }

  function handleDrawDeck() {
    if (!canDraw) return
    socket.emit(SOCKET_EVENTS.DRAW, { source: 'deck' })
    setSelectedCards([])
  }

  function handleDrawDiscard() {
    if (!canDrawDiscard) return
    socket.emit(SOCKET_EVENTS.DRAW, { source: 'discard' })
    setSelectedCards([])
  }

  function handleYaniv() {
    if (!canYaniv) return
    socket.emit(SOCKET_EVENTS.CALL_YANIV)
    setSelectedCards([])
  }

  return (
    <div className="min-h-screen flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-center px-4 py-2 bg-black/30 text-sm shrink-0">
        <span>סבב {gameState.roundNumber}</span>
        <span className={isMyTurn ? 'text-yellow-400 font-bold' : 'text-gray-300'}>
          {isMyTurn
            ? (gameState.phase === 'discard' ? 'תורך — השלך' : 'תורך — משוך')
            : `תור ${currentPlayer?.name ?? ''}`}
        </span>
        <span>ערך יד: {myHandValue}</span>
      </div>

      {/* Main area: left panel + chat */}
      <div className="flex flex-1 gap-2 p-2 min-h-0">
        {/* Left: opponents + deck/pile + timer + buttons */}
        <div className="flex flex-col flex-1 gap-3 min-w-0">
          {/* Opponents */}
          <div className="flex flex-wrap justify-center gap-2">
            {opponents.map(p => (
              <OpponentArea
                key={p.id}
                player={p}
                isCurrentTurn={p.id === currentPlayer?.id}
              />
            ))}
          </div>

          {/* Deck + Discard */}
          <div className="flex justify-center gap-6 items-end">
            <div className="flex flex-col items-center gap-1">
              <span className="text-xs text-gray-400">חפיסה ({gameState.deckSize})</span>
              <button
                onClick={handleDrawDeck}
                disabled={!canDraw}
                className="w-14 h-20 rounded-lg bg-blue-800 border-2 border-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
              />
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

          {/* Action buttons */}
          <div className="flex flex-wrap justify-center gap-2">
            <button
              onClick={handleDiscard}
              disabled={!canDiscard}
              className="bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold px-4 py-2 rounded-xl transition text-sm"
            >
              השלך
            </button>
            <button
              onClick={handleDrawDeck}
              disabled={!canDraw}
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold px-4 py-2 rounded-xl transition text-sm"
            >
              משוך מחפיסה
            </button>
            <button
              onClick={handleDrawDiscard}
              disabled={!canDrawDiscard}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold px-4 py-2 rounded-xl transition text-sm"
            >
              משוך מהערמה
            </button>
            <button
              onClick={handleYaniv}
              disabled={!canYaniv}
              className="bg-yellow-400 hover:bg-yellow-300 disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold px-4 py-2 rounded-xl transition text-sm"
            >
              יניב! ({myHandValue})
            </button>
          </div>
        </div>

        {/* Chat panel */}
        <div className="w-48 shrink-0 hidden sm:flex">
          <ChatPanel />
        </div>
      </div>

      {/* My hand */}
      <div className="shrink-0 bg-table/50 rounded-t-xl pt-2 pb-1">
        <p className="text-center text-xs text-gray-400 mb-1">
          הקלפים שלי | סכום: {myHandValue}
          {selectedCards.length > 0 && !isValidDiscardClient(selectedCards) && (
            <span className="text-red-400 mr-2">שילוב לא חוקי</span>
          )}
        </p>
        <PlayerHand
          cards={myHand}
          onCardSelect={toggleCard}
          selectedCards={selectedCards}
        />
      </div>

      {/* Round result overlay */}
      <RoundResultOverlay
        roundResult={roundResult}
        onClose={() => dispatch({ type: 'SET_ROUND_RESULT', payload: null })}
      />
    </div>
  )
}
