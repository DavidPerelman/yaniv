import { SOCKET_EVENTS } from '../../shared/constants.js'
import { getRoomBySocket } from '../utils/sanitize.js'

export function registerChatHandlers(io, socket, rooms) {
  socket.on(SOCKET_EVENTS.CHAT_MESSAGE, ({ text }) => {
    if (typeof text !== 'string' || text.trim().length === 0 || text.length > 200) return

    const room = getRoomBySocket(socket, rooms)
    if (!room) return

    io.to(room.id).emit(SOCKET_EVENTS.CHAT_MESSAGE, {
      senderId: socket.id,
      senderName: socket.data.playerName,
      text: text.trim(),
      timestamp: Date.now(),
    })
  })
}
