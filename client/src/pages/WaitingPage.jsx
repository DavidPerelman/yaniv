import { useNavigate } from 'react-router-dom'
import { useGame } from '../context/GameContext'
import socket from '../socket/socketClient'
import { SOCKET_EVENTS, GAME_CONSTANTS } from '../../../shared/constants.js'

const TIMER_LABELS = { 0: 'ללא תזמון', 15: '15 שניות', 30: '30 שניות', 60: '60 שניות' }

export default function WaitingPage() {
  const { state } = useGame()
  const { room } = state
  const navigate = useNavigate()

  if (!room) {
    navigate('/')
    return null
  }

  const isHost = socket.id === room.hostId
  const canStart = room.players.length >= GAME_CONSTANTS.MIN_PLAYERS

  function copyCode() {
    navigator.clipboard.writeText(room.id).catch(() => {})
  }

  function handleStart() {
    socket.emit(SOCKET_EVENTS.START_GAME)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-4">
      <h1 className="text-3xl font-bold">המתנה להתחלה</h1>

      <button
        onClick={copyCode}
        className="bg-table rounded-2xl px-8 py-4 text-center hover:bg-green-800 transition"
        title="לחץ להעתקה"
      >
        <p className="text-sm text-gray-300 mb-1">קוד חדר</p>
        <p className="text-4xl font-bold tracking-widest">{room.id}</p>
        <p className="text-xs text-gray-400 mt-1">לחץ להעתקה</p>
      </button>

      <div className="bg-table rounded-2xl p-6 w-full max-w-sm">
        <h2 className="text-lg font-semibold mb-3">שחקנים ({room.players.length}/{GAME_CONSTANTS.MAX_PLAYERS})</h2>
        <ul className="flex flex-col gap-2">
          {room.players.map(p => (
            <li key={p.id} className="flex items-center gap-2">
              <span>{p.name}</span>
              {p.id === room.hostId && <span className="text-yellow-400 text-sm">(מארח)</span>}
            </li>
          ))}
        </ul>
      </div>

      <div className="text-sm text-gray-300">
        טיימר לתור: {TIMER_LABELS[room.settings?.timerSeconds] ?? 'ללא תזמון'}
      </div>

      {isHost ? (
        <button
          onClick={handleStart}
          disabled={!canStart}
          className="bg-yellow-400 hover:bg-yellow-300 disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold py-3 px-8 rounded-xl text-lg transition"
        >
          התחל משחק
        </button>
      ) : (
        <p className="text-gray-300 text-lg">ממתין למארח...</p>
      )}
    </div>
  )
}
