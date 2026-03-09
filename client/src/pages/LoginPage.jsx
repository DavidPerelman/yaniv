import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useGame } from '../context/GameContext'

const FLOATERS = ['🃏', '♠', '♥', '♦', '♣', '🃏', '♠', '♥']

export default function LoginPage() {
  const { state, dispatch } = useGame()
  const [name, setName] = useState(state.playerName)
  const navigate = useNavigate()

  function handleSubmit(e) {
    e.preventDefault()
    const trimmed = name.trim()
    if (trimmed.length < 2) return
    dispatch({ type: 'SET_NAME', payload: trimmed })
    navigate('/lobby')
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center overflow-hidden relative"
      style={{ background: '#0f3d1a' }}
    >
      {/* Floating background symbols */}
      {FLOATERS.map((sym, i) => (
        <div
          key={i}
          className="absolute text-5xl pointer-events-none select-none"
          style={{
            left: `${(i / FLOATERS.length) * 100 + 4}%`,
            top: `${18 + (i % 3) * 24}%`,
            animation: `floatCard ${3 + i * 0.4}s ease-in-out infinite alternate`,
            animationDelay: `${i * 0.3}s`,
            opacity: 0.12,
          }}
        >
          {sym}
        </div>
      ))}

      {/* Login card */}
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        className="relative z-10 rounded-3xl p-8 w-80 shadow-2xl"
        style={{
          background: 'rgba(255,255,255,0.1)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.2)',
        }}
      >
        <div className="text-center mb-6">
          <h1
            style={{
              fontFamily: 'Fredoka One, cursive',
              fontSize: '64px',
              color: '#f5c842',
              lineHeight: 1,
              margin: 0,
            }}
          >
            יניב 🃏
          </h1>
          <p className="text-white/60 mt-2 text-sm">משחק הקלפים הישראלי</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="השם שלך"
            value={name}
            onChange={e => setName(e.target.value)}
            maxLength={20}
            className="rounded-2xl px-4 py-3 text-right text-white placeholder-white/50 outline-none text-base"
            style={{
              background: 'rgba(255,255,255,0.15)',
              border: '1px solid rgba(255,255,255,0.3)',
            }}
          />
          <motion.button
            type="submit"
            disabled={name.trim().length < 2}
            whileTap={{ scale: 0.95 }}
            className="rounded-2xl py-3 font-bold text-gray-900 disabled:opacity-40 disabled:cursor-not-allowed text-base"
            style={{ background: 'linear-gradient(135deg, #f5c842, #ffb300)' }}
          >
            המשך →
          </motion.button>
        </form>
      </motion.div>
    </div>
  )
}
