import { SOCKET_EVENTS, GAME_CONSTANTS } from '../../shared/constants.js'
import { createRoom, addPlayerToRoom, startGame } from '../game/room.js'
import { sanitizeRoom, privateGameView } from '../utils/sanitize.js'
import { startTurnTimer } from '../utils/timer.js'

export function registerRoomHandlers(io, socket, rooms) {
  socket.on(SOCKET_EVENTS.CREATE_ROOM, ({ playerName, settings = { timerSeconds: 0 } }) => {
    const room = createRoom(socket.id, playerName, settings)
    rooms.set(room.id, room)

    socket.join(room.id)
    socket.data.roomId = room.id
    socket.data.playerName = playerName

    socket.emit(SOCKET_EVENTS.ROOM_UPDATED, sanitizeRoom(room))
  })

  socket.on(SOCKET_EVENTS.JOIN_ROOM, ({ playerName, roomId }) => {
    const normalizedId = roomId?.toUpperCase()
    const room = rooms.get(normalizedId)

    if (!room) {
      socket.emit(SOCKET_EVENTS.ROOM_NOT_FOUND)
      return
    }

    const result = addPlayerToRoom(room, socket.id, playerName)
    if (!result.success) {
      socket.emit(SOCKET_EVENTS.ROOM_FULL)
      return
    }

    rooms.set(normalizedId, result.room)
    socket.join(normalizedId)
    socket.data.roomId = normalizedId
    socket.data.playerName = playerName

    io.to(normalizedId).emit(SOCKET_EVENTS.ROOM_UPDATED, sanitizeRoom(result.room))
  })

  socket.on(SOCKET_EVENTS.START_GAME, () => {
    const roomId = socket.data.roomId
    const room = rooms.get(roomId)
    if (!room) return

    if (socket.id !== room.hostId) return
    if (room.players.length < GAME_CONSTANTS.MIN_PLAYERS) return

    const updatedRoom = startGame(room)
    rooms.set(roomId, updatedRoom)

    for (const player of updatedRoom.players) {
      const view = privateGameView(updatedRoom.gameState, player.id)
      io.to(player.id).emit(SOCKET_EVENTS.GAME_STATE, view)
    }

    startTurnTimer(io, rooms, roomId)
  })
}
