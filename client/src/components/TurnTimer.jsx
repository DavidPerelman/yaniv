import { useState } from "react";
import { useSocket } from "../hooks/useSocket";
import { SOCKET_EVENTS } from "../../../shared/constants.js";

export default function TurnTimer({ timerSeconds }) {
  const [remaining, setRemaining] = useState(timerSeconds);

  useSocket(SOCKET_EVENTS.TIMER_TICK, ({ remaining: r }) => {
    setRemaining(r);
  });

  useSocket(SOCKET_EVENTS.TURN_CHANGED, () => {
    setRemaining(timerSeconds);
  });

  if (!timerSeconds || timerSeconds === 0) return null;

  const pct = remaining / timerSeconds;
  const isLow = remaining <= 5;
  const barColor = pct > 0.5 ? "#22c55e" : pct > 0.25 ? "#facc15" : "#ef4444";

  return (
    <div className="flex items-center gap-2">
      {/* Bar - hidden on mobile */}
      <div className="hidden md:block w-24 h-2 rounded-full bg-white/20 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000"
          style={{
            width: `${Math.max(0, pct * 100)}%`,
            background: barColor,
          }}
        />
      </div>
      {/* Number - always visible */}
      <span
        className={`font-bold tabular-nums text-sm ${isLow ? "text-red-400" : "text-white"}`}
      >
        {remaining}s
      </span>
    </div>
  );
}
