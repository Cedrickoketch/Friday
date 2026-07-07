import { useEffect, useRef, useState } from 'react'
import { useChatStore } from '../../store/chatStore'
import { useAuthStore } from '../../store/authStore'
import VoiceButton from './VoiceButton'

export default function ChatDrawer() {
  const { isOpen, close, messages, isLoading, sendMessage } = useChatStore()
  const { user } = useAuthStore()
  const [input, setInput] = useState('')
  const bottomRef = useRef(null)

  useEffect(() => {
    if (isOpen) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isOpen])

  const handleSend = async () => {
    const text = input.trim()
    if (!text || isLoading) return
    setInput('')
    await sendMessage(text)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 animate-fade-in"
          onClick={close}
        />
      )}

      {/* Drawer */}
      <div
        className={`
          fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-2xl z-50
          transition-transform duration-300 ease-out
          ${isOpen ? 'translate-y-0' : 'translate-y-full'}
        `}
      >
        <div className="bg-gray-900 border border-gray-800 border-b-0 rounded-t-3xl shadow-2xl flex flex-col"
          style={{ height: '70vh' }}>
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800 shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="font-semibold text-white">Friday</span>
              <span className="text-gray-500 text-xs">AI Assistant</span>
            </div>
            <div className="flex items-center gap-2">
              {user?.tier === 'free' && (
                <span className="text-xs text-gray-500">
                  {user.daily_message_count}/20 messages today
                </span>
              )}
              <button onClick={close} className="text-gray-500 hover:text-white transition-colors p-1">
                ✕
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-gray-600 mt-16 space-y-2">
                <p className="text-2xl">👋</p>
                <p className="font-medium text-gray-400">Hi, I'm Friday.</p>
                <p className="text-sm">Ask me anything, or say "create a task" to get started.</p>
              </div>
            )}
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}
              >
                <div
                  className={`
                    max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed
                    ${msg.role === 'user'
                      ? 'bg-friday-500 text-white rounded-br-sm'
                      : msg.isError
                        ? 'bg-red-900/40 text-red-300 border border-red-800 rounded-bl-sm'
                        : 'bg-gray-800 text-gray-100 rounded-bl-sm'
                    }
                  `}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-800 px-4 py-3 rounded-2xl rounded-bl-sm flex gap-1 items-center">
                  <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="px-5 py-4 border-t border-gray-800 flex gap-2 shrink-0">
            <VoiceButton onTranscript={(text) => setInput(text)} />
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask Friday anything..."
              rows={1}
              className="input resize-none"
              style={{ minHeight: '44px', maxHeight: '120px' }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed px-5 shrink-0"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
