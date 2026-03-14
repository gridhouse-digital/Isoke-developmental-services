import { useState, useRef, useEffect } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { MessageCircle, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const QUICK_REPLIES = [
  'What services do you offer?',
  'How can I contact you?',
  "I'd like to request a callback",
]

const OPEN_CHAT_EVENT = 'isoke-open-chat'

function messageText(parts: Array<{ type: string; text?: string }>): string {
  return (parts || [])
    .filter((p): p is { type: 'text'; text: string } => p.type === 'text' && 'text' in p)
    .map((p) => p.text)
    .join('')
}

export function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = () => setOpen(true)
    window.addEventListener(OPEN_CHAT_EVENT, handler)
    return () => window.removeEventListener(OPEN_CHAT_EVENT, handler)
  }, [])

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: '/api/chat' }),
  })
  const isLoading = status === 'submitted' || status === 'streaming'

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const onQuickReply = (text: string) => {
    sendMessage({ text })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const t = input.trim()
    if (!t || isLoading) return
    setInput('')
    sendMessage({ text: t })
  }

  return (
    <>
      <button
        type="button"
        aria-label="Open chat"
        onClick={() => setOpen(true)}
        style={{
          position: 'fixed',
          bottom: 32,
          right: 88,
          zIndex: 9990,
          width: 52,
          height: 52,
          borderRadius: '50%',
          border: '1px solid rgba(123,94,167,0.35)',
          background: 'var(--violet)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 4px 20px rgba(123,94,167,0.4)',
          fontFamily: 'var(--font-body)',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = 'var(--violet-mid)'
          e.currentTarget.style.boxShadow = '0 6px 28px rgba(123,94,167,0.5)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = 'var(--violet)'
          e.currentTarget.style.boxShadow = '0 4px 20px rgba(123,94,167,0.4)'
        }}
      >
        <MessageCircle size={26} strokeWidth={1.8} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 24 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            style={{
              position: 'fixed',
              bottom: 24,
              right: 24,
              width: 'min(420px, calc(100vw - 48px))',
              height: 'min(560px, calc(100vh - 120px))',
              zIndex: 10000,
              borderRadius: 'var(--radius-card)',
              background: 'var(--card-bg)',
              border: '1px solid var(--card-border)',
              boxShadow: '0 20px 60px rgba(30,18,48,0.25)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              fontFamily: 'var(--font-body)',
            }}
          >
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid var(--card-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'linear-gradient(135deg, var(--violet-deep) 0%, var(--ink) 100%)',
                color: 'var(--cream)',
              }}
            >
              <span style={{ fontWeight: 600, fontSize: 15 }}>Chat with Isoke</span>
              <button
                type="button"
                aria-label="Close chat"
                onClick={() => setOpen(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'inherit',
                  cursor: 'pointer',
                  padding: 4,
                  display: 'flex',
                }}
              >
                <X size={20} />
              </button>
            </div>

            <div
              style={{
                flex: 1,
                overflow: 'auto',
                padding: 16,
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}
            >
              {messages.length === 0 && (
                <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 8 }}>
                  Ask about our services, hours, or request a callback.
                </p>
              )}
              {messages.map((m) => (
                <div
                  key={m.id}
                  style={{
                    alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                    maxWidth: '88%',
                    padding: '10px 14px',
                    borderRadius: 12,
                    fontSize: 14,
                    lineHeight: 1.5,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    ...(m.role === 'user'
                      ? {
                          background: 'var(--violet)',
                          color: 'white',
                        }
                      : {
                          background: 'var(--input-bg)',
                          border: '1px solid var(--input-border)',
                          color: 'var(--ink)',
                        }),
                  }}
                >
                  {messageText(m.parts)}
                </div>
              ))}
              {isLoading && messages[messages.length - 1]?.role === 'user' && (
                <div
                  style={{
                    alignSelf: 'flex-start',
                    padding: '10px 14px',
                    borderRadius: 12,
                    background: 'var(--input-bg)',
                    border: '1px solid var(--input-border)',
                    color: 'var(--muted)',
                    fontSize: 14,
                  }}
                >
                  …
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div style={{ padding: 12, borderTop: '1px solid var(--card-border)' }}>
              {messages.length === 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                  {QUICK_REPLIES.map((text) => (
                    <button
                      key={text}
                      type="button"
                      onClick={() => onQuickReply(text)}
                      style={{
                        padding: '8px 12px',
                        borderRadius: 20,
                        border: '1px solid var(--input-border)',
                        background: 'var(--input-bg)',
                        color: 'var(--ink)',
                        fontSize: 13,
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                      }}
                    >
                      {text}
                    </button>
                  ))}
                </div>
              )}
              <form
                id="chat-form"
                onSubmit={handleSubmit}
                style={{ display: 'flex', gap: 8, alignItems: 'center' }}
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type a message…"
                  disabled={isLoading}
                  style={{
                    flex: 1,
                    padding: '10px 14px',
                    borderRadius: 20,
                    border: '1px solid var(--input-border)',
                    background: 'var(--input-bg)',
                    color: 'var(--ink)',
                    fontSize: 14,
                    fontFamily: 'inherit',
                    outline: 'none',
                  }}
                />
                <button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  style={{
                    padding: '10px 16px',
                    borderRadius: 20,
                    border: 'none',
                    background: 'var(--violet)',
                    color: 'white',
                    fontWeight: 600,
                    fontSize: 13,
                    cursor: isLoading || !input.trim() ? 'not-allowed' : 'pointer',
                    opacity: isLoading || !input.trim() ? 0.6 : 1,
                    fontFamily: 'inherit',
                  }}
                >
                  Send
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
