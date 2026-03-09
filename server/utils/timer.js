import { SOCKET_EVENTS } from '../../shared/constants.js'
import { applyDiscard, applyDraw } from '../game/gameLogic.js'
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
      const gs = room.gameState
      const player = gs.players[gs.currentPlayerIndex]
      if (gs.phase === 'discard') {
        const highest = [...player.hand].sort((a, b) => b.value - a.value)[0]
        if (highest) {
          const result = applyDiscard(gs, player.id, [highest])
          if (result.success) {
            room.gameState = result.gameState
            rooms.set(roomId, room)
            broadcastGameState(io, room, SOCKET_EVENTS)
            startTurnTimer(io, rooms, roomId)
          }
        }
      } else if (gs.phase === 'draw') {
        const result = applyDraw(gs, player.id, 'deck')
        if (result.success) {
          room.gameState = result.gameState
          rooms.set(roomId, room)
          broadcastGameState(io, room, SOCKET_EVENTS)
          const nextPlayer = room.gameState.players[room.gameState.currentPlayerIndex]
          io.to(roomId).emit(SOCKET_EVENTS.TURN_CHANGED, { currentPlayerId: nextPlayer.id })
          startTurnTimer(io, rooms, roomId)
        }
      }
      return
    }

    turnTimers.set(roomId, setTimeout(tick, 1000))
  }

  turnTimers.set(roomId, setTimeout(tick, 1000))
}
