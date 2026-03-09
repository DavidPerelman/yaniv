import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGame } from '../context/GameContext'

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
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-table rounded-2xl p-8 w-80 shadow-xl text-center">
        <h1 className="text-4xl font-bold mb-6">יניב 🃏</h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="השם שלך"
            value={name}
            onChange={e => setName(e.target.value)}
            maxLength={20}
            className="rounded-lg px-4 py-2 text-black text-right text-lg outline-none"
          />
          <button
            type="submit"
            disabled={name.trim().length < 2}
            className="bg-yellow-400 hover:bg-yellow-300 disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold py-2 rounded-lg text-lg transition"
          >
            המשך
          </button>
        </form>
      </div>
    </div>
  )
}
