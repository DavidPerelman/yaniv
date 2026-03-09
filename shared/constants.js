export const GAME_CONSTANTS = {
  MAX_PLAYERS: 4,
  MIN_PLAYERS: 2,
  YANIV_THRESHOLD: 7,
  YANIV_PENALTY: 30,
  SCORE_LIMIT: 100,
  BONUS_50: 50,   // reaching exactly 50 → reset to 0
  BONUS_100: 100, // reaching exactly 100 → reset to 50
  TIMER_OPTIONS: [0, 15, 30, 60], // 0 = no timer
}

export const SOCKET_EVENTS = {
  // connection
  JOIN_LOBBY: 'join_lobby',
  // rooms
  CREATE_ROOM: 'create_room',
  JOIN_ROOM: 'join_room',
  ROOM_UPDATED: 'room_updated',
  ROOM_NOT_FOUND: 'room_not_found',
  ROOM_FULL: 'room_full',
  // game
  START_GAME: 'start_game',
  GAME_STATE: 'game_state',
  DISCARD: 'discard',
  DRAW: 'draw',
  CALL_YANIV: 'call_yaniv',
  TURN_CHANGED: 'turn_changed',
  ROUND_END: 'round_end',
  GAME_OVER: 'game_over',
  // chat
  CHAT_MESSAGE: 'chat_message',
  SYSTEM_MESSAGE: 'system_message',
  // timer
  TIMER_TICK: 'timer_tick',
  TIMER_EXPIRED: 'timer_expired',
}
