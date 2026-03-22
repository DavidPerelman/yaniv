import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import socket from './socketClient'
import { useGame } from '../context/GameContext'
import { SOCKET_EVENTS } from '../../../shared/constants.js'

export default function SocketManager() {
  const { state, dispatch } = useGame()
  const navigate = useNavigate()
  const roomIdRef = useRef(null)
  const wasDisconnected = useRef(false)
  const [showRoomGoneToast, setShowRoomGoneToast] = useState(false)

  useEffect(() => {
    if (state.playerName) {
      localStorage.setItem('yaniv_playerName', state.playerName)
    }
  }, [state.playerName])

  useEffect(() => {
    socket.connect()

    socket.on(SOCKET_EVENTS.ROOM_UPDATED, (room) => {
      roomIdRef.current = room.id
      dispatch({ type: 'SET_ROOM', payload: room })
      if (room.status === 'waiting') navigate(`/waiting/${room.id}`)
    })

    socket.on(SOCKET_EVENTS.ROOM_NOT_FOUND, () => {
      dispatch({ type: 'SET_ERROR', payload: 'חדר לא נמצא' })
    })

    socket.on(SOCKET_EVENTS.ROOM_FULL, () => {
      dispatch({ type: 'SET_ERROR', payload: 'החדר מלא' })
    })

    socket.on(SOCKET_EVENTS.GAME_STATE, (state) => {
      dispatch({ type: 'SET_GAME_STATE', payload: state })
      if (state && !state.winner) navigate(`/game/${roomIdRef.current ?? ''}`)
    })

    socket.on(SOCKET_EVENTS.ROUND_END, (result) => {
      dispatch({ type: 'SET_ROUND_RESULT', payload: result })
    })

    socket.on(SOCKET_EVENTS.GAME_OVER, ({ winner, finalStandings }) => {
      dispatch({ type: 'SET_ROUND_RESULT', payload: null })
      dispatch({ type: 'SET_WINNER', payload: winner })
      dispatch({ type: 'SET_FINAL_STANDINGS', payload: finalStandings })
      navigate('/end')
    })

    socket.on(SOCKET_EVENTS.CHAT_MESSAGE, (msg) => {
      dispatch({ type: 'ADD_CHAT', payload: msg })
    })

    socket.on(SOCKET_EVENTS.SYSTEM_MESSAGE, (msg) => {
      dispatch({ type: 'ADD_CHAT', payload: { ...msg, isSystem: true } })
    })

    socket.on('disconnect', () => {
      wasDisconnected.current = true
      dispatch({ type: 'SET_DISCONNECTED', payload: true })
    })

    socket.on('connect', () => {
      if (wasDisconnected.current) {
        wasDisconnected.current = false
        dispatch({ type: 'SET_DISCONNECTED', payload: false })

        const path = window.location.pathname
        const match = path.match(/\/(waiting|game)\/([^/]+)/)
        if (match) {
          const roomId = match[2]
          const playerName = state.playerName || localStorage.getItem('yaniv_playerName') || ''
          console.log('emitting CHECK_ROOM with:', { roomId, playerName })
          socket.emit(SOCKET_EVENTS.CHECK_ROOM, { roomId, playerName })
        }
      }
    })

    socket.on(SOCKET_EVENTS.ROOM_OK, () => {
      console.log('ROOM_OK received')
    })

    socket.on(SOCKET_EVENTS.ROOM_GONE, () => {
      console.log('ROOM_GONE received')
      setShowRoomGoneToast(true)
      setTimeout(() => setShowRoomGoneToast(false), 4000)
      navigate('/lobby')
    })

    return () => socket.disconnect()
  }, [])

  return showRoomGoneToast ? (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-red-800 text-white px-6 py-3 rounded-xl shadow-lg text-center">
      החדר כבר לא קיים, חזרת ללובי
    </div>
  ) : null
}
