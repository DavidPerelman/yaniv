export function sanitizeRoom(room) {
  return {
    id: room.id,
    hostId: room.hostId,
    status: room.status,
    settings: room.settings,
    players: room.players.map(p => ({ id: p.id, name: p.name, score: p.score ?? 0 })),
  }
}

export function privateGameView(gameState, playerId) {
  return {
    players: gameState.players.map(p => ({
      id: p.id,
      name: p.name,
      score: p.score,
      isEliminated: p.isEliminated,
      cardCount: p.hand.length,
    })),
    currentPlayerIndex: gameState.currentPlayerIndex,
    phase: gameState.phase,
    roundNumber: gameState.roundNumber,
    discardPile: {
      topCard: gameState.discardPile.at(-1) ?? null,
      drawableCard: gameState.drawableDiscardCard ?? null,
    },
    deckSize: gameState.deck.length,
    myHand: gameState.players.find(p => p.id === playerId)?.hand ?? [],
    winner: gameState.winner,
    settings: gameState.settings,
  }
}

export function getRoomBySocket(socket, rooms) {
  const roomId = socket.data.roomId
  return roomId ? rooms.get(roomId) : null
}

export function broadcastGameState(io, room, SOCKET_EVENTS) {
  for (const player of room.gameState.players) {
    const view = privateGameView(room.gameState, player.id)
    io.to(player.id).emit(SOCKET_EVENTS.GAME_STATE, view)
  }
}
