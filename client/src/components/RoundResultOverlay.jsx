import { motion } from "framer-motion";
import CardsRevealPanel from "./CardsRevealPanel";

function scoreDeltaCell(r, callerId, callerWasAssafed) {
  if (r.id === callerId && !callerWasAssafed && r.scoreDelta === 0) {
    return <span style={{ color: "#2e7d32", fontWeight: "bold" }}>✓ יניב</span>;
  }
  if (r.id === callerId && callerWasAssafed) {
    return (
      <span style={{ color: "#d32f2f", fontWeight: "bold" }}>
        +{r.scoreDelta} 😱
      </span>
    );
  }
  if (r.scoreDelta > 0) {
    return <span style={{ color: "#d32f2f" }}>+{r.scoreDelta}</span>;
  }
  return <span style={{ color: "#888" }}>-</span>;
}

export default function RoundResultOverlay({ roundResult, myId, onClose }) {
  if (!roundResult) return null;

  const { callerId, callerWasAssafed, playerResults } = roundResult;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-40 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.7)" }}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 22 }}
        className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl overflow-y-auto max-h-[90vh]"
        style={{ direction: "rtl", color: "#1a1a1a" }}
      >
        <h2
          className="text-2xl text-center mb-1"
          style={{ fontFamily: "Fredoka One, cursive" }}
        >
          סיבוב הסתיים
        </h2>
        <p
          className="text-center text-sm font-semibold mb-4"
          style={{ color: callerWasAssafed ? "#d32f2f" : "#2e7d32" }}
        >
          {callerWasAssafed ? "😱 אסף!" : "🎉 יניב!"}
        </p>

        <table className="w-full text-sm mb-3">
          <thead>
            <tr className="border-b" style={{ color: "#666" }}>
              <th className="pb-2 text-right font-semibold">שחקן</th>
              <th className="pb-2 text-center font-semibold">יד</th>
              <th className="pb-2 text-center font-semibold">שינוי</th>
              <th className="pb-2 text-center font-semibold">סה"כ</th>
            </tr>
          </thead>
          <tbody>
            {playerResults.map((r) => (
              <tr key={r.id} className={r.id === callerId ? "font-bold" : ""}>
                <td className="py-1 text-right">{r.name}</td>
                <td className="py-1 text-center">{r.handValue ?? "-"}</td>
                <td className="py-1 text-center">
                  {scoreDeltaCell(r, callerId, callerWasAssafed)}
                </td>
                <td className="py-1 text-center">
                  {r.newScore}
                  {r.eliminated && (
                    <span style={{ color: "#d32f2f", fontSize: "11px", marginRight: "4px" }}> ❌ נפסל</span>
                  )}
                  {r.bonusApplied && r.newScore === 0 && (
                    <span style={{ color: "#f5c842", fontSize: "11px", marginRight: "4px" }}> 🎉→0</span>
                  )}
                  {r.bonusApplied && r.newScore === 50 && (
                    <span style={{ color: "#f5c842", fontSize: "11px", marginRight: "4px" }}> 🎉→50</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {playerResults?.some((p) => p.hand?.length > 0) && (
          <div className="mt-4 border-t border-gray-200 pt-4">
            <div className="text-sm text-gray-500 text-center mb-3">קלפי הסיבוב</div>
            <CardsRevealPanel playerResults={playerResults} myId={myId} />
          </div>
        )}

        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onClose}
          className="w-full font-bold py-3 rounded-2xl text-gray-900 mt-3"
          style={{ background: "linear-gradient(135deg, #f5c842, #ffb300)" }}
        >
          סיבוב הבא →
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
