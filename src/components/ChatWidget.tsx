import { useEffect, useRef, useState } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { MessageCircle, X } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'

const WELCOME_ACTIONS = [
  {
    label: 'Explore services',
    description: 'See the kinds of support Isoke provides.',
    text: 'What services do you offer?',
  },
  {
    label: 'Talk to someone',
    description: 'Start a callback request with our team.',
    text: "I'd like to request a callback",
  },
  {
    label: 'Get contact info',
    description: 'Find the best number, email, and hours.',
    text: 'How can I contact you?',
  },
]

const OPEN_CHAT_EVENT = 'isoke-open-chat'
const ASSISTANT_REVEAL_MS = 20
const ASSISTANT_REVEAL_CHARS = 2
const CALLBACK_API_URL =
  typeof window !== 'undefined' && window.location.hostname === 'localhost'
    ? 'http://localhost:3001/api/callback'
    : '/api/callback'
const CALLBACK_CONTEXT_RE = /\b(callback|call\s*back|call me|call you|call us|phone call)\b/i
const CALLBACK_SERVICE_OPTIONS = [
  'Community Participation Support',
  'Companion Services',
  'Shift Nursing',
  'In-Home Community Support',
  'Respite Services',
  'Transportation Services',
]

type CallbackDetails = {
  bestTime: string
  name: string
  phone: string
  service: string
}

type CallbackNotice = {
  tone: 'error' | 'success'
  text: string
}

function extractService(text: string) {
  const lowered = text.toLowerCase()
  const matched = CALLBACK_SERVICE_OPTIONS.find((service) => lowered.includes(service.toLowerCase()))
  return matched ?? ''
}

function hasCallbackContext(messages: Array<{ parts: Array<{ text?: string; type: string }>; role: string }>) {
  return messages.some((message) => CALLBACK_CONTEXT_RE.test(messageText(message.parts)))
}

function inferCallbackService(messages: Array<{ parts: Array<{ text?: string; type: string }>; role: string }>) {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const service = extractService(messageText(messages[index].parts))
    if (service) return service
  }

  return ''
}

function messageText(parts: Array<{ type: string; text?: string }>): string {
  return (parts || [])
    .filter((part): part is { type: 'text'; text: string } => part.type === 'text' && 'text' in part)
    .map((part) => part.text)
    .join('')
}

export function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [showCallbackForm, setShowCallbackForm] = useState(false)
  const [callbackSubmitting, setCallbackSubmitting] = useState(false)
  const [callbackForm, setCallbackForm] = useState<CallbackDetails>({
    bestTime: '',
    name: '',
    phone: '',
    service: '',
  })
  const [callbackNotice, setCallbackNotice] = useState<CallbackNotice | null>(null)
  const [revealedAssistantText, setRevealedAssistantText] = useState<Record<string, string>>({})
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const revealTimersRef = useRef<Record<string, ReturnType<typeof window.setInterval>>>({})
  const assistantTargetsRef = useRef<Record<string, string>>({})

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
  }, [messages, revealedAssistantText])

  useEffect(() => {
    const activeMessageIds = new Set(messages.map((message) => message.id))

    messages.forEach((message) => {
      if (message.role !== 'assistant') return

      const fullText = messageText(message.parts)
      assistantTargetsRef.current[message.id] = fullText

      if (!fullText) return
      if (revealTimersRef.current[message.id]) return
      if ((revealedAssistantText[message.id] ?? '').length >= fullText.length) return

      revealTimersRef.current[message.id] = window.setInterval(() => {
        setRevealedAssistantText((current) => {
          const targetText = assistantTargetsRef.current[message.id] ?? ''
          const currentText = current[message.id] ?? ''

          if (currentText.length >= targetText.length) {
            window.clearInterval(revealTimersRef.current[message.id])
            delete revealTimersRef.current[message.id]
            return currentText === targetText ? current : { ...current, [message.id]: targetText }
          }

          return {
            ...current,
            [message.id]: targetText.slice(0, currentText.length + ASSISTANT_REVEAL_CHARS),
          }
        })
      }, ASSISTANT_REVEAL_MS)
    })

    Object.keys(revealTimersRef.current).forEach((messageId) => {
      if (!activeMessageIds.has(messageId)) {
        window.clearInterval(revealTimersRef.current[messageId])
        delete revealTimersRef.current[messageId]
        delete assistantTargetsRef.current[messageId]
      }
    })
  }, [messages, revealedAssistantText])

  useEffect(() => {
    return () => {
      Object.values(revealTimersRef.current).forEach((timerId) => window.clearInterval(timerId))
    }
  }, [])

  useEffect(() => {
    if (callbackNotice?.tone === 'success') return
    if (!hasCallbackContext(messages)) return

    setShowCallbackForm(true)

    const inferredService = inferCallbackService(messages)
    if (inferredService) {
      setCallbackForm((current) => (current.service ? current : { ...current, service: inferredService }))
    }
  }, [messages])

  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return

    textarea.style.height = '0px'
    textarea.style.height = `${Math.min(textarea.scrollHeight, 132)}px`
  }, [input, open])

  const onQuickReply = (text: string) => {
    sendMessage({ text })
  }

  const submitInput = () => {
    const text = input.trim()
    if (!text || isLoading) return false
    setInput('')
    sendMessage({ text })
    return true
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    submitInput()
  }

  const handleComposerKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== 'Enter' || e.shiftKey) return

    e.preventDefault()
    submitInput()
  }

  const handleCallbackFieldChange = (field: keyof CallbackDetails, value: string) => {
    setCallbackForm((current) => ({ ...current, [field]: value }))
    if (callbackNotice?.tone === 'error') setCallbackNotice(null)
  }

  const handleCallbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const payload = {
      bestTime: callbackForm.bestTime.trim(),
      name: callbackForm.name.trim(),
      phone: callbackForm.phone.trim(),
      service: callbackForm.service.trim(),
    }

    if (!payload.name || !payload.phone || !payload.bestTime) {
      setCallbackNotice({
        text: 'Please enter your name, phone number, and best time to call.',
        tone: 'error',
      })
      return
    }

    setCallbackSubmitting(true)
    setCallbackNotice(null)

    try {
      const response = await fetch(CALLBACK_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = (await response.json().catch(() => null)) as { error?: string } | null
      if (!response.ok) {
        throw new Error(data?.error ?? 'Callback request failed')
      }

      setCallbackNotice({
        text: 'Callback details sent to the Isoke team.',
        tone: 'success',
      })
      setShowCallbackForm(false)
      setCallbackForm({
        bestTime: '',
        name: '',
        phone: '',
        service: '',
      })
    } catch (error) {
      console.error(error)
      setCallbackNotice({
        text: 'We could not send the callback request automatically. Please call 1-(844) 476-5313.',
        tone: 'error',
      })
    } finally {
      setCallbackSubmitting(false)
    }
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
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'var(--violet-mid)'
          e.currentTarget.style.boxShadow = '0 6px 28px rgba(123,94,167,0.5)'
        }}
        onMouseLeave={(e) => {
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
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                  style={{
                    alignSelf: 'flex-start',
                    maxWidth: '94%',
                    marginBottom: 4,
                    padding: '14px 16px 16px',
                    borderRadius: 18,
                    background:
                      'linear-gradient(180deg, rgba(255,255,255,0.8) 0%, rgba(212,196,236,0.18) 100%)',
                    border: '1px solid rgba(123,94,167,0.16)',
                    boxShadow: '0 12px 30px rgba(30,18,48,0.08)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      marginBottom: 10,
                    }}
                  >
                    <div
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, var(--teal) 0%, var(--violet) 100%)',
                        boxShadow: '0 0 0 4px rgba(232,149,109,0.12)',
                        flexShrink: 0,
                      }}
                    />
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: '0.14em',
                        textTransform: 'uppercase',
                        color: 'var(--muted)',
                      }}
                    >
                      Welcome
                    </span>
                  </div>

                  <div
                    style={{
                      color: 'var(--ink)',
                      fontSize: 15,
                      lineHeight: 1.72,
                      letterSpacing: '0.005em',
                      marginBottom: 14,
                    }}
                  >
                    Hi, I&apos;m Isoke&apos;s virtual assistant. I can help you explore services, find contact
                    information, or start a callback request.
                  </div>

                  <div style={{ display: 'grid', gap: 8 }}>
                    {WELCOME_ACTIONS.map((action) => (
                      <button
                        key={action.label}
                        type="button"
                        onClick={() => onQuickReply(action.text)}
                        style={{
                          textAlign: 'left',
                          padding: '12px 14px',
                          borderRadius: 14,
                          border: '1px solid rgba(123,94,167,0.14)',
                          background: 'rgba(255,255,255,0.56)',
                          color: 'var(--ink)',
                          cursor: 'pointer',
                          transition: 'transform 140ms ease, border-color 140ms ease, box-shadow 140ms ease',
                          boxShadow: '0 4px 14px rgba(30,18,48,0.04)',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-1px)'
                          e.currentTarget.style.borderColor = 'rgba(123,94,167,0.28)'
                          e.currentTarget.style.boxShadow = '0 10px 20px rgba(30,18,48,0.08)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)'
                          e.currentTarget.style.borderColor = 'rgba(123,94,167,0.14)'
                          e.currentTarget.style.boxShadow = '0 4px 14px rgba(30,18,48,0.04)'
                        }}
                      >
                        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 3 }}>{action.label}</div>
                        <div style={{ fontSize: 12, lineHeight: 1.55, color: 'var(--muted)' }}>
                          {action.description}
                        </div>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {messages.map((message) => (
                <div
                  key={message.id}
                  style={{
                    alignSelf: message.role === 'user' ? 'flex-end' : 'flex-start',
                    maxWidth: '90%',
                    padding: message.role === 'assistant' ? '12px 16px' : '10px 14px',
                    borderRadius: 14,
                    fontSize: message.role === 'assistant' ? 15 : 14,
                    lineHeight: message.role === 'assistant' ? 1.72 : 1.58,
                    letterSpacing: message.role === 'assistant' ? '0.005em' : '0.01em',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    ...(message.role === 'user'
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
                  {message.role === 'assistant'
                    ? revealedAssistantText[message.id] ?? ''
                    : messageText(message.parts)}
                </div>
              ))}

              {isLoading && messages[messages.length - 1]?.role === 'user' && (
                <div
                  style={{
                    alignSelf: 'flex-start',
                    padding: '12px 16px',
                    borderRadius: 14,
                    background: 'var(--input-bg)',
                    border: '1px solid var(--input-border)',
                    color: 'var(--muted)',
                    fontSize: 15,
                    letterSpacing: '0.12em',
                  }}
                >
                  ...
                </div>
              )}

              {showCallbackForm && (
                <div
                  style={{
                    alignSelf: 'flex-start',
                    maxWidth: '94%',
                    padding: '14px 16px',
                    borderRadius: 18,
                    background: 'rgba(255,255,255,0.82)',
                    border: '1px solid rgba(123,94,167,0.18)',
                    boxShadow: '0 12px 30px rgba(30,18,48,0.08)',
                  }}
                >
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)', marginBottom: 6 }}>
                    Request a callback
                  </div>
                  <div style={{ fontSize: 12, lineHeight: 1.55, color: 'var(--muted)', marginBottom: 12 }}>
                    Share your details here and the Isoke team will follow up.
                  </div>

                  <form onSubmit={handleCallbackSubmit} style={{ display: 'grid', gap: 10 }}>
                    <input
                      type="text"
                      value={callbackForm.name}
                      onChange={(e) => handleCallbackFieldChange('name', e.target.value)}
                      placeholder="Your name"
                      disabled={callbackSubmitting}
                      style={{
                        padding: '10px 12px',
                        borderRadius: 12,
                        border: '1px solid var(--input-border)',
                        background: 'var(--input-bg)',
                        color: 'var(--ink)',
                        fontSize: 14,
                        fontFamily: 'inherit',
                        outline: 'none',
                      }}
                    />
                    <input
                      type="tel"
                      value={callbackForm.phone}
                      onChange={(e) => handleCallbackFieldChange('phone', e.target.value)}
                      placeholder="Phone number"
                      disabled={callbackSubmitting}
                      style={{
                        padding: '10px 12px',
                        borderRadius: 12,
                        border: '1px solid var(--input-border)',
                        background: 'var(--input-bg)',
                        color: 'var(--ink)',
                        fontSize: 14,
                        fontFamily: 'inherit',
                        outline: 'none',
                      }}
                    />
                    <textarea
                      value={callbackForm.bestTime}
                      onChange={(e) => handleCallbackFieldChange('bestTime', e.target.value)}
                      placeholder="Best time to call"
                      disabled={callbackSubmitting}
                      rows={2}
                      style={{
                        minHeight: 72,
                        padding: '10px 12px',
                        borderRadius: 12,
                        border: '1px solid var(--input-border)',
                        background: 'var(--input-bg)',
                        color: 'var(--ink)',
                        fontSize: 14,
                        lineHeight: 1.5,
                        fontFamily: 'inherit',
                        outline: 'none',
                        resize: 'vertical',
                      }}
                    />
                    <select
                      value={callbackForm.service}
                      onChange={(e) => handleCallbackFieldChange('service', e.target.value)}
                      disabled={callbackSubmitting}
                      style={{
                        padding: '10px 12px',
                        borderRadius: 12,
                        border: '1px solid var(--input-border)',
                        background: 'var(--input-bg)',
                        color: 'var(--ink)',
                        fontSize: 14,
                        fontFamily: 'inherit',
                        outline: 'none',
                      }}
                    >
                      <option value="">Service of interest (optional)</option>
                      {CALLBACK_SERVICE_OPTIONS.map((service) => (
                        <option key={service} value={service}>
                          {service}
                        </option>
                      ))}
                    </select>
                    <button
                      type="submit"
                      disabled={callbackSubmitting}
                      style={{
                        padding: '10px 14px',
                        borderRadius: 999,
                        border: 'none',
                        background: 'var(--violet)',
                        color: 'white',
                        fontWeight: 600,
                        fontSize: 13,
                        fontFamily: 'inherit',
                        cursor: callbackSubmitting ? 'not-allowed' : 'pointer',
                        opacity: callbackSubmitting ? 0.7 : 1,
                      }}
                    >
                      {callbackSubmitting ? 'Sending...' : 'Send callback request'}
                    </button>
                  </form>
                </div>
              )}

              {callbackNotice && (
                <div
                  style={{
                    alignSelf: 'center',
                    maxWidth: '92%',
                    padding: '10px 14px',
                    borderRadius: 12,
                    background:
                      callbackNotice.tone === 'success'
                        ? 'rgba(232, 149, 109, 0.14)'
                        : 'rgba(185, 28, 28, 0.1)',
                    border:
                      callbackNotice.tone === 'success'
                        ? '1px solid rgba(232, 149, 109, 0.3)'
                        : '1px solid rgba(185, 28, 28, 0.22)',
                    color: callbackNotice.tone === 'success' ? 'var(--ink)' : '#991b1b',
                    fontSize: 12,
                    lineHeight: 1.55,
                    textAlign: 'center',
                  }}
                >
                  {callbackNotice.text}
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            <div style={{ padding: 12, borderTop: '1px solid var(--card-border)' }}>
              <form
                id="chat-form"
                onSubmit={handleSubmit}
                style={{ display: 'flex', gap: 8, alignItems: 'center' }}
              >
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleComposerKeyDown}
                  placeholder="Type a message..."
                  disabled={isLoading}
                  rows={1}
                  style={{
                    flex: 1,
                    padding: '10px 14px',
                    minHeight: 44,
                    maxHeight: 132,
                    borderRadius: 18,
                    border: '1px solid var(--input-border)',
                    background: 'var(--input-bg)',
                    color: 'var(--ink)',
                    fontSize: 14,
                    lineHeight: 1.5,
                    letterSpacing: '0.01em',
                    fontFamily: 'inherit',
                    outline: 'none',
                    resize: 'none',
                    overflowY: 'auto',
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
