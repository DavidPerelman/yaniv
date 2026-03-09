import { useNavigate } from 'react-router-dom'
import { useGame } from '../context/GameContext'

export default function EndPage() {
  const { state, dispatch } = useGame()
  const { room, gameState } = state
  const navigate = useNavigate()

  const players = gameState?.players ?? room?.players ?? []
  const winnerId = gameState?.winner ?? null
  const winnerName = players.find(p => p.id === winnerId)?.name ?? '—'

  function handleBack() {
    dispatch({ type: 'RESET' })
    navigate('/lobby')
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-4">
      <h1 className="text-4xl font-bold">המשחק הסתיים!</h1>

      <div className="flex flex-col items-center gap-1">
        <span className="text-5xl">🏆</span>
        <p className="text-2xl text-yellow-400 font-semibold">מנצח: {winnerName}</p>
      </div>

      <div className="bg-table rounded-2xl p-6 w-full max-w-sm">
        <h2 className="text-lg font-semibold mb-4 text-center">תוצאות סופיות</h2>
        <table className="w-full text-center">
          <thead>
            <tr className="text-gray-300 text-sm border-b border-green-700">
              <th className="pb-2">מקום</th>
              <th className="pb-2">שחקן</th>
              <th className="pb-2">ניקוד</th>
            </tr>
          </thead>
          <tbody>
            {[...players]
              .sort((a, b) => a.score - b.score)
              .map((p, i) => (
                <tr
                  key={p.id}
                  className={p.id === winnerId ? 'text-yellow-400 font-bold' : ''}
                >
                  <td className="py-1">{i === 0 ? '🏆' : i + 1}</td>
                  <td className="py-1">{p.name}</td>
                  <td className="py-1">{p.score}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <button
        onClick={handleBack}
        className="bg-yellow-400 hover:bg-yellow-300 text-black font-bold py-3 px-8 rounded-xl text-lg transition"
      >
        חזור ללובי
      </button>
    </div>
  )
}
