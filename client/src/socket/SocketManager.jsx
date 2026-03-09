import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import socket from './socketClient'
import { useGame } from '../context/GameContext'
import { SOCKET_EVENTS } from '../../../shared/constants.js'

export default function SocketManager() {
  const { dispatch } = useGame()
  const navigate = useNavigate()
  const roomIdRef = useRef(null)

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

    socket.on(SOCKET_EVENTS.GAME_OVER, ({ winner }) => {
      dispatch({ type: 'SET_ROUND_RESULT', payload: null })
      navigate('/end')
    })

    socket.on(SOCKET_EVENTS.CHAT_MESSAGE, (msg) => {
      dispatch({ type: 'ADD_CHAT', payload: msg })
    })

    socket.on(SOCKET_EVENTS.SYSTEM_MESSAGE, (msg) => {
      dispatch({ type: 'ADD_CHAT', payload: { ...msg, isSystem: true } })
    })

    return () => socket.disconnect()
  }, [])

  return null
}
