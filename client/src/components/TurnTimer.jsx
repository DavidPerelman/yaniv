import { useState } from 'react'
import { useSocket } from '../hooks/useSocket'
import { SOCKET_EVENTS } from '../../../shared/constants.js'

export default function TurnTimer({ timerSeconds }) {
  const [remaining, setRemaining] = useState(timerSeconds)

  useSocket(SOCKET_EVENTS.TIMER_TICK, ({ remaining: r }) => {
    setRemaining(r)
  })

  useSocket(SOCKET_EVENTS.TURN_CHANGED, () => {
    setRemaining(timerSeconds)
  })

  if (!timerSeconds || timerSeconds === 0) return null

  const pct = remaining / timerSeconds
  const barColor = pct > 0.5
    ? 'bg-green-500'
    : pct > 0.25
      ? 'bg-yellow-400'
      : 'bg-red-500'

  return (
    <div className="w-full max-w-xs mx-auto flex flex-col items-center gap-1">
      <span className={`text-2xl font-bold ${pct <= 0.25 ? 'text-red-400' : pct <= 0.5 ? 'text-yellow-400' : 'text-green-400'}`}>
        {remaining}
      </span>
      <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${barColor}`}
          style={{ width: `${Math.max(0, pct * 100)}%` }}
        />
      </div>
    </div>
  )
}
