import { useState } from "react";
import socket from "../socket/socketClient";

export default function DevPanel() {
  const [open, setOpen] = useState(false);

  if (!import.meta.env.DEV) return null;

  const emit = (event, data) => socket.emit(event, data);

  const scenarios = [
    {
      label: "🃏 יד נמוכה - אני קורא",
      description: 'תור שלי, יד=2 → לחץ "קרא יניב!" אחר כך',
      action: () =>
        emit("dev_setup_scenario", {
          myScore: 0,
          opponentScore: 0,
          role: "caller",
        }),
    },
    {
      label: "🎯 קרא יניב!",
      description: "שלח קריאת יניב לשרת",
      action: () => emit("call_yaniv"),
    },
    {
      label: "🎉 בונוס 50→0 (היריב קורא)",
      description:
        "אני=45 יד=5, היריב=20 יד=2 → לאחר מכן: עבור לטאב היריב ולחץ קרא יניב!",
      action: () =>
        emit("dev_setup_scenario", {
          myScore: 45,
          opponentScore: 0,
          role: "receiver",
        }),
    },
    {
      label: "🎉 בונוס 100→50 (היריב קורא)",
      description:
        "אני=95 יד=5, היריב=20 יד=2 → לאחר מכן: עבור לטאב היריב ולחץ קרא יניב!",
      action: () =>
        emit("dev_setup_scenario", {
          myScore: 95,
          opponentScore: 0,
          role: "receiver",
        }),
    },
    {
      label: "💀 פסילת יריב - אני קורא",
      description: "יריב=98, אני=0 יד=2 → יניב → יריב מקבל ~20 → נפסל",
      action: () =>
        emit("dev_setup_scenario", {
          myScore: 0,
          opponentScore: 98,
          role: "caller",
        }),
    },
    {
      label: "🏆 ניצחון - אני קורא",
      description: "יריב=99, אני=0 יד=2 → יניב → יריב נפסל → אני מנצח",
      action: () =>
        emit("dev_setup_scenario", {
          myScore: 0,
          opponentScore: 99,
          role: "caller",
        }),
    },
    {
      label: "😱 אסף - אני קורא",
      description: "שנינו יד=2 → אני קורא יניב → אסף! (+30)",
      action: () => {
        emit("dev_setup_scenario", {
          myScore: 0,
          opponentScore: 0,
          role: "caller",
        });
        setTimeout(() => emit("dev_force_opponent_low_hand"), 200);
      },
    },
  ];

  return (
    <div className="fixed bottom-4 left-4 z-[9999]">
      <button
        onClick={() => setOpen((o) => !o)}
        className="bg-purple-800 text-white text-xs px-3 py-2 rounded-xl shadow-lg opacity-70 hover:opacity-100 transition-opacity"
      >
        🧪 {open ? "סגור" : "Dev Panel"}
      </button>

      {open && (
        <div className="absolute bottom-10 left-0 bg-gray-900 border border-purple-500 rounded-2xl p-4 w-72 shadow-2xl">
          <div className="text-purple-300 font-bold text-sm mb-3 text-center">
            🧪 לוח בדיקות - Dev Only
          </div>
          <div className="space-y-2">
            {scenarios.map((s, i) => (
              <button
                key={i}
                onClick={s.action}
                className="w-full text-right bg-gray-800 hover:bg-gray-700 text-white rounded-xl px-3 py-2 transition-colors"
              >
                <div className="text-sm font-semibold">{s.label}</div>
                <div className="text-xs text-gray-400 mt-0.5">
                  {s.description}
                </div>
              </button>
            ))}
          </div>
          <div className="text-gray-500 text-xs text-center mt-3">
            נעלם אוטומטית ב-production
          </div>
        </div>
      )}
    </div>
  );
}
