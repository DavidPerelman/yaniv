import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { SOCKET_EVENTS } from "../shared/constants.js";
import { registerRoomHandlers } from "./handlers/roomHandlers.js";
import { registerGameHandlers } from "./handlers/gameHandlers.js";
import { registerChatHandlers } from "./handlers/chatHandlers.js";
import { removePlayerFromRoom } from "./game/room.js";
import { sanitizeRoom, broadcastGameState } from "./utils/sanitize.js";

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: "*" },
});

// Shared in-memory store - passed to every handler
const rooms = new Map(); // roomId → room object

app.get("/health", (req, res) => res.json({ status: "ok" }));

io.on("connection", (socket) => {
  console.log("connected:", socket.id);

  registerRoomHandlers(io, socket, rooms);
  registerGameHandlers(io, socket, rooms);
  registerChatHandlers(io, socket, rooms);

  socket.on("disconnect", () => {
    console.log("disconnected:", socket.id);
    const roomId = socket.data.roomId;
    if (!roomId) return;
    const room = rooms.get(roomId);
    if (!room) return;

    if (room.status === "waiting") {
      const updatedRoom = removePlayerFromRoom(room, socket.id);
      if (updatedRoom.players.length === 0) {
        rooms.delete(roomId);
      } else {
        rooms.set(roomId, updatedRoom);
        io.to(roomId).emit(
          SOCKET_EVENTS.ROOM_UPDATED,
          sanitizeRoom(updatedRoom),
        );
      }
    } else if (room.status === "playing") {
      io.to(roomId).emit(SOCKET_EVENTS.SYSTEM_MESSAGE, {
        text: `${socket.data.playerName} התנתק`,
        timestamp: Date.now(),
      });
      const p = room.gameState?.players.find((p) => p.id === socket.id);
      if (p) p.isEliminated = true;
      broadcastGameState(io, room, SOCKET_EVENTS);
    }
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => console.log(`Server running on port ${PORT}`));
