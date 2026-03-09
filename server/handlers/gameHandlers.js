import { SOCKET_EVENTS } from '../../shared/constants.js'
import { applyDiscard, applyDraw, applyYaniv, createInitialGameState } from '../game/gameLogic.js'
import { getRoomBySocket, broadcastGameState } from '../utils/sanitize.js'
import { startTurnTimer, clearTurnTimer } from '../utils/timer.js'

export function registerGameHandlers(io, socket, rooms) {
  socket.on(SOCKET_EVENTS.DISCARD, ({ cardIds }) => {
    const room = getRoomBySocket(socket, rooms)
    if (!room || !room.gameState) return

    const player = room.gameState.players.find(p => p.id === socket.id)
    if (!player) return

    const cards = cardIds
      .map(id => player.hand.find(c => c.id === id))
      .filter(Boolean)

    const result = applyDiscard(room.gameState, socket.id, cards)
    if (!result.success) {
      socket.emit('error', { message: result.error })
      return
    }

    room.gameState = result.gameState
    rooms.set(room.id, room)
    broadcastGameState(io, room, SOCKET_EVENTS)
    startTurnTimer(io, rooms, room.id)
  })

  socket.on(SOCKET_EVENTS.DRAW, ({ source }) => {
    const room = getRoomBySocket(socket, rooms)
    if (!room || !room.gameState) return

    const result = applyDraw(room.gameState, socket.id, source)
    if (!result.success) {
      socket.emit('error', { message: result.error })
      return
    }

    room.gameState = result.gameState
    rooms.set(room.id, room)
    broadcastGameState(io, room, SOCKET_EVENTS)

    const currentPlayer = room.gameState.players[room.gameState.currentPlayerIndex]
    io.to(room.id).emit(SOCKET_EVENTS.TURN_CHANGED, { currentPlayerId: currentPlayer.id })
    startTurnTimer(io, rooms, room.id)
  })

  socket.on(SOCKET_EVENTS.CALL_YANIV, () => {
    const room = getRoomBySocket(socket, rooms)
    if (!room || !room.gameState) return

    clearTurnTimer(room.id)

    const result = applyYaniv(room.gameState, socket.id)
    if (!result.success) {
      socket.emit('error', { message: result.error })
      return
    }

    room.gameState = result.gameState
    rooms.set(room.id, room)

    io.to(room.id).emit(SOCKET_EVENTS.ROUND_END, result.roundResult)

    if (room.gameState.winner) {
      io.to(room.id).emit(SOCKET_EVENTS.GAME_OVER, { winner: room.gameState.winner })
      return
    }

    // Start a new round after 3 seconds
    setTimeout(() => {
      const currentRoom = rooms.get(room.id)
      if (!currentRoom) return

      const newGameState = createInitialGameState(
        currentRoom.gameState.players.map(p => ({ id: p.id, name: p.name })),
        currentRoom.gameState.settings
      )

      // Preserve scores and eliminated status from previous round
      newGameState.players = newGameState.players.map((p, i) => ({
        ...p,
        score: currentRoom.gameState.players[i].score,
        isEliminated: currentRoom.gameState.players[i].isEliminated,
      }))
      newGameState.roundNumber = currentRoom.gameState.roundNumber + 1

      currentRoom.gameState = newGameState
      rooms.set(room.id, currentRoom)
      broadcastGameState(io, currentRoom, SOCKET_EVENTS)
      startTurnTimer(io, rooms, room.id)
    }, 3000)
  })
}
