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
      const finalStandings = room.gameState.players
        .map((p) => ({
          id: p.id,
          name: p.name,
          score: p.score,
          isEliminated: p.isEliminated,
        }))
        .sort((a, b) => a.score - b.score)

      io.to(room.id).emit(SOCKET_EVENTS.GAME_OVER, {
        winner: {
          id: room.gameState.winner.id,
          name: room.gameState.winner.name,
          score: room.gameState.winner.score,
        },
        finalStandings,
      })
      return
    }

    // Start a new round after 3 seconds (aligned with client overlay duration)
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

  if (process.env.NODE_ENV !== 'production') {
    socket.on('dev_force_low_hand', () => {
      const room = getRoomBySocket(socket, rooms)
      if (!room?.gameState) return
      const player = room.gameState.players.find(p => p.id === socket.id)
      if (!player) return
      player.hand = [
        { id: 'H_A_dev', suit: 'H', rank: 'A', value: 1 },
        { id: 'D_A_dev', suit: 'D', rank: 'A', value: 1 },
      ]
      room.gameState.phase = 'discard'
      room.gameState.currentPlayerIndex = room.gameState.players.indexOf(player)
      broadcastGameState(io, room, SOCKET_EVENTS)
    })

    socket.on('dev_set_score', ({ score }) => {
      const room = getRoomBySocket(socket, rooms)
      if (!room?.gameState) return
      const player = room.gameState.players.find(p => p.id === socket.id)
      if (!player) return
      player.score = score
      broadcastGameState(io, room, SOCKET_EVENTS)
    })

    socket.on('dev_set_all_scores', ({ scores }) => {
      const room = getRoomBySocket(socket, rooms)
      if (!room?.gameState) return
      room.gameState.players.forEach((p, i) => {
        if (scores[i] !== undefined) p.score = scores[i]
      })
      broadcastGameState(io, room, SOCKET_EVENTS)
    })

    socket.on('dev_force_my_turn', () => {
      const room = getRoomBySocket(socket, rooms)
      if (!room?.gameState) return
      const idx = room.gameState.players.findIndex(p => p.id === socket.id)
      if (idx === -1) return
      room.gameState.currentPlayerIndex = idx
      room.gameState.phase = 'discard'
      broadcastGameState(io, room, SOCKET_EVENTS)
    })

    socket.on('dev_setup_scenario', ({ myScore, opponentScore, role }) => {
      const room = getRoomBySocket(socket, rooms)
      if (!room?.gameState) return
      const players = room.gameState.players
      const myIdx = players.findIndex(p => p.id === socket.id)
      if (myIdx === -1) return
      const oppIdx = myIdx === 0 ? 1 : 0
      if (!players[oppIdx]) return

      players.forEach(p => { p.isEliminated = false })
      players[myIdx].score = myScore ?? 0
      players[oppIdx].score = opponentScore ?? 0

      if (role === 'receiver') {
        players[oppIdx].hand = [
          { id: 'H_A_dev2', suit: 'H', rank: 'A', value: 1 },
          { id: 'D_A_dev2', suit: 'D', rank: 'A', value: 1 },
        ]
        players[myIdx].hand = [
          { id: 'H_2_dev', suit: 'H', rank: '2', value: 2 },
          { id: 'D_3_dev', suit: 'D', rank: '3', value: 3 },
        ]
        room.gameState.currentPlayerIndex = oppIdx
        room.gameState.phase = 'discard'
      } else {
        players[myIdx].hand = [
          { id: 'H_A_dev', suit: 'H', rank: 'A', value: 1 },
          { id: 'D_A_dev', suit: 'D', rank: 'A', value: 1 },
        ]
        players[oppIdx].hand = [
          { id: 'H_K_dev', suit: 'H', rank: 'K', value: 10 },
          { id: 'D_Q_dev', suit: 'D', rank: 'Q', value: 10 },
          { id: 'C_J_dev', suit: 'C', rank: 'J', value: 10 },
        ]
        room.gameState.currentPlayerIndex = myIdx
        room.gameState.phase = 'discard'
      }

      broadcastGameState(io, room, SOCKET_EVENTS)
    })

    socket.on('dev_force_opponent_low_hand', () => {
      const room = getRoomBySocket(socket, rooms)
      if (!room?.gameState) return
      const players = room.gameState.players
      const myIdx = players.findIndex(p => p.id === socket.id)
      const oppIdx = myIdx === 0 ? 1 : 0
      if (!players[oppIdx]) return
      players[oppIdx].hand = [
        { id: 'H_A_opp', suit: 'H', rank: 'A', value: 1 },
        { id: 'D_A_opp', suit: 'D', rank: 'A', value: 1 },
      ]
      broadcastGameState(io, room, SOCKET_EVENTS)
    })
  }
}
