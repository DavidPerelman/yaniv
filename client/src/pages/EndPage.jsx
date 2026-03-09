import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useGame } from "../context/GameContext";

export default function EndPage() {
  const { state, dispatch } = useGame();
  const { winner, finalStandings } = state;
  const navigate = useNavigate();

  const winnerName = winner?.name ?? "-";

  function handleBack() {
    dispatch({ type: "RESET" });
    navigate("/lobby");
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-4">
      <h1 className="text-4xl font-bold">המשחק הסתיים!</h1>

      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, delay: 0.3 }}
        className="text-center mb-4"
      >
        <div className="text-7xl mb-3">🏆</div>
        <div
          className="text-4xl font-bold text-yellow-400"
          style={{ fontFamily: "Fredoka One, cursive" }}
        >
          {winnerName} ניצח!
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-table rounded-2xl p-6 w-full max-w-sm"
      >
        <h2 className="text-lg font-semibold mb-4 text-center">
          תוצאות סופיות
        </h2>
        <table className="w-full text-center">
          <thead>
            <tr className="text-gray-300 text-sm border-b border-green-700">
              <th className="pb-2">מקום</th>
              <th className="pb-2">שחקן</th>
              <th className="pb-2">ניקוד</th>
            </tr>
          </thead>
          <tbody>
            {finalStandings.map((p, i) => (
              <tr
                key={p.id}
                style={{
                  color: p.id === winner?.id ? "#f5c842" : "inherit",
                  fontWeight: p.id === winner?.id ? "bold" : "normal",
                }}
              >
                <td className="py-1">{i === 0 ? "🏆" : i + 1}</td>
                <td className="py-1">{p.name}</td>
                <td className="py-1">
                  {p.score}
                  {p.isEliminated && (
                    <span className="text-red-400 text-xs mr-1"> ❌ נפסל</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </motion.div>

      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleBack}
        className="font-bold py-3 px-8 rounded-xl text-lg transition text-black"
        style={{ background: "linear-gradient(135deg, #f5c842, #ffb300)" }}
      >
        חזור ללובי
      </motion.button>
    </div>
  );
}
