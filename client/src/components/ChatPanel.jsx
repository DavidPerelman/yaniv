import { useState, useRef, useEffect } from "react";
import { useGame } from "../context/GameContext";
import socket from "../socket/socketClient";
import { SOCKET_EVENTS } from "../../../shared/constants.js";

export default function ChatPanel({ onClose }) {
  const { state } = useGame();
  const { chat } = state;
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  function handleSend() {
    const trimmed = inputText.trim();
    if (!trimmed || trimmed.length > 200) return;
    socket.emit(SOCKET_EVENTS.CHAT_MESSAGE, { text: trimmed });
    setInputText("");
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-white/10 shrink-0">
        <span className="text-white/70 text-sm font-semibold">💬 צ'אט</span>
        {onClose && (
          <button
            onClick={onClose}
            className="text-white/50 hover:text-white text-2xl leading-none px-2"
          >
            ✕
          </button>
        )}
      </div>

      {/* Messages - scrollable */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
        {chat.length === 0 && (
          <p className="text-gray-500 italic text-center mt-4 text-xs">
            אין הודעות עדיין
          </p>
        )}
        {chat.map((msg, i) => (
          <div
            key={i}
            className={`text-xs ${msg.isSystem ? "text-yellow-400 italic" : "text-gray-100"}`}
          >
            {msg.isSystem ? (
              <span>{msg.text}</span>
            ) : (
              <>
                <span className="font-semibold text-yellow-300">
                  {msg.senderName}:{" "}
                </span>
                <span>{msg.text}</span>
              </>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input - always visible at bottom */}
      <div className="shrink-0 border-t border-white/10 px-3 py-3 flex gap-2 items-center">
        <input
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="הודעה..."
          className="flex-1 min-w-0 bg-white/10 text-white placeholder-white/40 rounded-xl px-3 py-2 text-sm focus:outline-none focus:bg-white/20"
        />
        <button
          onClick={handleSend}
          className="shrink-0 bg-yellow-400 text-black font-bold px-3 py-2 rounded-xl text-sm"
        >
          שלח
        </button>
      </div>
    </div>
  );
}
