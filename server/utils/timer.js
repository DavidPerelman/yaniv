import { SOCKET_EVENTS } from '../../shared/constants.js'
import { getNextActivePlayerIndex } from '../game/gameLogic.js'
import { broadcastGameState } from './sanitize.js'

const turnTimers = new Map() // roomId → NodeJS timeout handle

export function clearTurnTimer(roomId) {
  const t = turnTimers.get(roomId)
  if (t) {
    clearTimeout(t)
    turnTimers.delete(roomId)
  }
}

export function startTurnTimer(io, rooms, roomId) {
  clearTurnTimer(roomId)
  const room = rooms.get(roomId)
  if (!room || !room.gameState) return
  const seconds = room.settings?.timerSeconds ?? 0
  if (seconds === 0) return // no timer

  let remaining = seconds

  const tick = () => {
    remaining--
    io.to(roomId).emit(SOCKET_EVENTS.TIMER_TICK, { remaining })

    if (remaining <= 0) {
      const currentRoom = rooms.get(roomId)
      if (!currentRoom?.gameState) return
      const gs = currentRoom.gameState

      if (gs.phase === 'draw') {
        const lastDiscarded = gs.lastDiscardedCards
        if (lastDiscarded?.length) {
          const discardedIds = new Set(lastDiscarded.map((c) => c.id))
          const playerIndex = gs.currentPlayerIndex
          gs.discardPile = gs.discardPile.filter((c) => !discardedIds.has(c.id))
          gs.players = gs.players.map((p, i) =>
            i === playerIndex ? { ...p, hand: [...p.hand, ...lastDiscarded] } : p,
          )
          gs.lastDiscardedCards = null
        }
      }

      const nextIndex = getNextActivePlayerIndex(
        currentRoom.gameState.players,
        currentRoom.gameState.currentPlayerIndex,
      )
      currentRoom.gameState.currentPlayerIndex = nextIndex
      currentRoom.gameState.phase = 'discard'
      rooms.set(roomId, currentRoom)
      broadcastGameState(io, currentRoom, SOCKET_EVENTS)
      startTurnTimer(io, rooms, roomId)
      return
    }

    turnTimers.set(roomId, setTimeout(tick, 1000))
  }

  turnTimers.set(roomId, setTimeout(tick, 1000))
}
