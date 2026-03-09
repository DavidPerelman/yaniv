export default function OpponentArea({ player, isCurrentTurn }) {
  return (
    <div
      className={[
        'flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition',
        isCurrentTurn ? 'bg-yellow-400/20 ring-2 ring-yellow-400' : 'bg-table',
        player.isEliminated ? 'opacity-40' : '',
      ].join(' ')}
    >
      <span className="font-semibold text-sm">{player.name}</span>
      <span className="text-xs text-gray-300">ניקוד: {player.score}</span>
      <div className="flex gap-1 mt-1">
        {Array.from({ length: player.cardCount }).map((_, i) => (
          <div
            key={i}
            className="w-7 h-10 rounded bg-blue-800 border border-blue-600"
          />
        ))}
      </div>
      {player.isEliminated && <span className="text-red-400 text-xs">פסול</span>}
      {isCurrentTurn && !player.isEliminated && (
        <span className="text-yellow-400 text-xs font-bold">תורו</span>
      )}
    </div>
  )
}
