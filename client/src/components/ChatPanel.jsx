import { useState, useRef, useEffect } from 'react'
import { useGame } from '../context/GameContext'
import socket from '../socket/socketClient'
import { SOCKET_EVENTS } from '../../../shared/constants.js'

export default function ChatPanel() {
  const { state } = useGame()
  const { chat } = state
  const [text, setText] = useState('')
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chat])

  function handleSend(e) {
    e.preventDefault()
    const trimmed = text.trim()
    if (!trimmed || trimmed.length > 200) return
    socket.emit(SOCKET_EVENTS.CHAT_MESSAGE, { text: trimmed })
    setText('')
  }

  return (
    <div className="flex flex-col h-full bg-table/50 rounded-xl overflow-hidden">
      <div className="px-3 py-2 border-b border-green-800 text-sm font-semibold text-gray-300">
        צ'אט
      </div>

      <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1 text-xs min-h-0">
        {chat.length === 0 && (
          <p className="text-gray-500 italic text-center mt-4">אין הודעות עדיין</p>
        )}
        {chat.map((msg, i) => (
          <div key={i} className={msg.isSystem ? 'text-yellow-400 italic' : 'text-gray-100'}>
            {msg.isSystem ? (
              <span>{msg.text}</span>
            ) : (
              <>
                <span className="font-semibold text-yellow-300">{msg.senderName}: </span>
                <span>{msg.text}</span>
              </>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="flex border-t border-green-800 shrink-0">
        <input
          type="text"
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="הודעה..."
          maxLength={200}
          className="flex-1 bg-transparent px-2 py-2 text-xs outline-none text-right"
        />
        <button
          type="submit"
          className="px-3 text-yellow-400 text-xs font-bold hover:text-yellow-300 transition"
        >
          שלח
        </button>
      </form>
    </div>
  )
}
