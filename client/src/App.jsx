import { Routes, Route } from 'react-router-dom'
import { GameProvider } from './context/GameContext'
import SocketManager from './socket/SocketManager'
import LoginPage from './pages/LoginPage'
import LobbyPage from './pages/LobbyPage'
import WaitingPage from './pages/WaitingPage'
import GamePage from './pages/GamePage'
import EndPage from './pages/EndPage'

export default function App() {
  return (
    <GameProvider>
      <SocketManager />
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/lobby" element={<LobbyPage />} />
        <Route path="/waiting/:roomId" element={<WaitingPage />} />
        <Route path="/game/:roomId" element={<GamePage />} />
        <Route path="/end" element={<EndPage />} />
      </Routes>
    </GameProvider>
  )
}
