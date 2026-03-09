import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGame } from '../context/GameContext'
import socket from '../socket/socketClient'
import { SOCKET_EVENTS, GAME_CONSTANTS } from '../../../shared/constants.js'

const TIMER_LABELS = { 0: 'ללא תזמון', 15: '15 שניות', 30: '30 שניות', 60: '60 שניות' }

export default function LobbyPage() {
  const { state, dispatch } = useGame()
  const navigate = useNavigate()
  const [timerSeconds, setTimerSeconds] = useState(0)
  const [joinCode, setJoinCode] = useState('')

  useEffect(() => {
    if (!state.playerName) navigate('/')
  }, [state.playerName])

  // Auto-clear error after 3 seconds
  useEffect(() => {
    if (!state.error) return
    const t = setTimeout(() => dispatch({ type: 'CLEAR_ERROR' }), 3000)
    return () => clearTimeout(t)
  }, [state.error])

  function handleCreate() {
    socket.emit(SOCKET_EVENTS.CREATE_ROOM, {
      playerName: state.playerName,
      settings: { timerSeconds },
    })
  }

  function handleJoin() {
    const code = joinCode.trim().toUpperCase()
    if (code.length !== 6) return
    socket.emit(SOCKET_EVENTS.JOIN_ROOM, { playerName: state.playerName, roomId: code })
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-4">
      <h1 className="text-3xl font-bold">לובי — יניב</h1>

      <div className="flex flex-col md:flex-row gap-6 w-full max-w-xl">
        {/* Create room */}
        <div className="bg-table rounded-2xl p-6 flex-1 flex flex-col gap-4">
          <h2 className="text-xl font-semibold">יצירת חדר</h2>
          <label className="flex flex-col gap-1 text-sm">
            טיימר לתור
            <select
              value={timerSeconds}
              onChange={e => setTimerSeconds(Number(e.target.value))}
              className="rounded-lg px-3 py-2 text-black"
            >
              {GAME_CONSTANTS.TIMER_OPTIONS.map(t => (
                <option key={t} value={t}>{TIMER_LABELS[t]}</option>
              ))}
            </select>
          </label>
          <button
            onClick={handleCreate}
            className="bg-yellow-400 hover:bg-yellow-300 text-black font-bold py-2 rounded-lg transition"
          >
            צור חדר
          </button>
        </div>

        {/* Join room */}
        <div className="bg-table rounded-2xl p-6 flex-1 flex flex-col gap-4">
          <h2 className="text-xl font-semibold">הצטרפות לחדר</h2>
          <input
            type="text"
            placeholder="קוד חדר"
            value={joinCode}
            onChange={e => setJoinCode(e.target.value.toUpperCase().slice(0, 6))}
            className="rounded-lg px-4 py-2 text-black text-center text-xl tracking-widest uppercase outline-none"
            maxLength={6}
          />
          <button
            onClick={handleJoin}
            disabled={joinCode.trim().length !== 6}
            className="bg-blue-500 hover:bg-blue-400 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-2 rounded-lg transition"
          >
            הצטרף
          </button>
        </div>
      </div>

      {state.error && (
        <p className="text-red-400 font-semibold text-lg">{state.error}</p>
      )}
    </div>
  )
}
