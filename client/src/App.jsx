import { useState, useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { GameProvider } from './context/GameContext'
import { useGame } from './context/GameContext'
import SocketManager from './socket/SocketManager'
import LoginPage from './pages/LoginPage'
import LobbyPage from './pages/LobbyPage'
import WaitingPage from './pages/WaitingPage'
import GamePage from './pages/GamePage'
import EndPage from './pages/EndPage'

function AppContent() {
  const { state } = useGame()

  return (
    <>
      <SocketManager />
      {state.isDisconnected && (
        <div className="fixed inset-0 bg-black/70 z-50 flex flex-col items-center justify-center text-white text-center px-6">
          <span className="text-5xl mb-4 animate-pulse">📶</span>
          <p className="text-xl font-semibold">החיבור אבד, מנסה להתחבר מחדש...</p>
        </div>
      )}
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/lobby" element={<LobbyPage />} />
        <Route path="/waiting/:roomId" element={<WaitingPage />} />
        <Route path="/game/:roomId" element={<GamePage />} />
        <Route path="/end" element={<EndPage />} />
      </Routes>
    </>
  )
}

export default function App() {
  const [serverReady, setServerReady] = useState(false)
  const [timedOut, setTimedOut] = useState(false)

  useEffect(() => {
    if (!import.meta.env.VITE_SERVER_URL) {
      setServerReady(true)
      return
    }

    const startTime = Date.now()
    const TIMEOUT_MS = 40000
    const POLL_INTERVAL_MS = 2000

    const poll = async () => {
      const url = `${import.meta.env.VITE_SERVER_URL}/health`
      console.log('polling health:', url)
      try {
        const res = await fetch(url)
        if (res.ok) {
          setServerReady(true)
          return
        }
      } catch {
        // server not yet up
      }

      if (Date.now() - startTime >= TIMEOUT_MS) {
        setTimedOut(true)
        return
      }

      setTimeout(poll, POLL_INTERVAL_MS)
    }

    poll()
  }, [])

  if (timedOut) {
    return (
      <div className="fixed inset-0 bg-gray-900 flex flex-col items-center justify-center text-white text-center px-6">
        <p className="text-xl font-semibold mb-4">השרת לא מגיב. רענן את הדף ונסה שוב.</p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium transition-colors"
        >
          רענן
        </button>
      </div>
    )
  }

  if (!serverReady) {
    return (
      <div className="fixed inset-0 bg-gray-900 flex flex-col items-center justify-center text-white text-center px-6">
        <div className="mb-6 w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin" />
        <p className="text-xl font-semibold mb-2">מתחבר לשרת...</p>
        <p className="text-sm text-gray-400">השרת מתעורר, זה עלול לקחת כחצי דקה</p>
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      <GameProvider>
        <AppContent />
      </GameProvider>
    </div>
  )
}
