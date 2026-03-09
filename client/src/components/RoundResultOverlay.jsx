export default function RoundResultOverlay({ roundResult, onClose }) {
  if (!roundResult) return null

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-table rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        <h2 className="text-xl font-bold text-center mb-2">
          {roundResult.callerWasAssafed ? '😱 אסף!' : '🎉 יניב!'}
        </h2>
        <p className="text-center text-sm text-gray-300 mb-4">
          {roundResult.callerWasAssafed
            ? 'מישהו תפס אותך — קנס +30'
            : 'קראת יניב בהצלחה!'}
        </p>

        <table className="w-full text-sm text-center mb-4">
          <thead>
            <tr className="text-gray-400 border-b border-green-700">
              <th className="pb-1">שחקן</th>
              <th className="pb-1">יד</th>
              <th className="pb-1">שינוי</th>
              <th className="pb-1">סך הכל</th>
            </tr>
          </thead>
          <tbody>
            {roundResult.playerResults
              .filter(r => !r.eliminated || r.scoreDelta !== 0)
              .map(r => (
                <tr key={r.id} className={r.id === roundResult.callerId ? 'font-bold text-yellow-400' : ''}>
                  <td className="py-1">{r.name}</td>
                  <td className="py-1">{r.handValue ?? '—'}</td>
                  <td className="py-1">{r.scoreDelta > 0 ? `+${r.scoreDelta}` : r.scoreDelta}</td>
                  <td className="py-1">{r.newScore}</td>
                </tr>
              ))}
          </tbody>
        </table>

        <button
          onClick={onClose}
          className="w-full bg-yellow-400 hover:bg-yellow-300 text-black font-bold py-2 rounded-lg transition"
        >
          המשך
        </button>
      </div>
    </div>
  )
}
