import type { FormEvent, KeyboardEvent, ReactNode, RefObject } from 'react'
import { ArrowUpRight, Clock3, PhoneCall, Sparkles, X } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { ISOKE_CONTENT } from '../../../chatbot/isoke-content.js'
import type { ChatFlowState } from '../../lib/chatbot/flow'
import type { ChatWidgetTheme } from './types'

type ChatPanelProps = {
  children: ReactNode
  flowState: ChatFlowState
  input: string
  isLoading: boolean
  onClose: () => void
  onComposerKeyDown: (e: KeyboardEvent<HTMLTextAreaElement>) => void
  onInputChange: (value: string) => void
  onPhoneCtaClick: (placement: string) => void
  onSubmit: (e: FormEvent) => void
  open: boolean
  textareaRef: RefObject<HTMLTextAreaElement | null>
  widgetTheme: ChatWidgetTheme
}

export function ChatPanel({
  children,
  flowState,
  input,
  isLoading,
  onClose,
  onComposerKeyDown,
  onInputChange,
  onPhoneCtaClick,
  onSubmit,
  open,
  textareaRef,
  widgetTheme,
}: ChatPanelProps) {
  return (
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
            width: 'min(428px, calc(100vw - 32px))',
            height: 'min(640px, calc(100vh - 92px))',
            zIndex: 10000,
            borderRadius: '28px',
            background: widgetTheme.shellBg,
            border: `1px solid ${widgetTheme.shellBorder}`,
            boxShadow: widgetTheme.shellShadow,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            fontFamily: 'var(--font-body)',
          }}
        >
          <div
            style={{
              padding: '18px 18px 14px',
              borderBottom: `1px solid ${widgetTheme.footerBorder}`,
              background:
                'radial-gradient(circle at top right, rgba(232,149,109,0.18) 0%, transparent 32%), linear-gradient(135deg, rgba(30,18,48,0.98) 0%, rgba(123,94,167,0.96) 100%)',
              color: widgetTheme.headerText,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: '16px',
                    background: 'rgba(255,255,255,0.12)',
                    border: '1px solid rgba(255,255,255,0.16)',
                    display: 'grid',
                    placeItems: 'center',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.18)',
                  }}
                >
                  <Sparkles size={18} strokeWidth={2.1} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15.5 }}>Isoke Concierge</div>
                  <div style={{ fontSize: 12.5, opacity: 0.84, lineHeight: 1.45 }}>
                    Answers questions and helps route you to the right next step.
                  </div>
                </div>
              </div>
              <button
                type="button"
                aria-label="Close chat"
                onClick={onClose}
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  color: 'inherit',
                  cursor: 'pointer',
                  padding: 7,
                  borderRadius: 12,
                  display: 'flex',
                }}
              >
                <X size={18} />
              </button>
            </div>

            <div
              style={{
                marginTop: 14,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                flexWrap: 'wrap',
              }}
            >
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 10px',
                  borderRadius: 999,
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  fontSize: 12.5,
                }}
              >
                <Clock3 size={14} />
                {ISOKE_CONTENT.contact.businessHours}
              </div>
              <a
                href={ISOKE_CONTENT.contact.mainPhoneHref}
                onClick={() => onPhoneCtaClick('header')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 12px',
                  borderRadius: 999,
                  background: 'rgba(255,255,255,0.16)',
                  border: '1px solid rgba(255,255,255,0.16)',
                  color: 'inherit',
                  fontSize: 12.5,
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                <PhoneCall size={14} />
                Call now
              </a>
            </div>
          </div>

          <div
            style={{
              padding: '12px 18px',
              borderBottom: `1px solid ${widgetTheme.footerBorder}`,
              background: widgetTheme.statusBg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: 'var(--muted)',
                  marginBottom: 4,
                }}
              >
                {flowState.badge}
              </div>
              <div style={{ fontSize: 13, color: widgetTheme.text, lineHeight: 1.45 }}>{flowState.description}</div>
            </div>
            <div
              style={{
                flexShrink: 0,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '7px 10px',
                borderRadius: 999,
                background: widgetTheme.pillBg,
                color: widgetTheme.badgeText,
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              <div
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  background: 'var(--teal)',
                }}
              />
              Callback available
            </div>
          </div>

          <div
            style={{
              flex: 1,
              overflow: 'auto',
              padding: '16px 16px 18px',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              background: widgetTheme.canvasBg,
            }}
          >
            {children}
          </div>

          <div
            style={{
              padding: '14px 14px 16px',
              borderTop: `1px solid ${widgetTheme.footerBorder}`,
              background: widgetTheme.footerBg,
              backdropFilter: 'blur(16px)',
            }}
          >
            <form id="chat-form" onSubmit={onSubmit} style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => onInputChange(e.target.value)}
                onKeyDown={onComposerKeyDown}
                placeholder="Type a message..."
                disabled={isLoading}
                rows={1}
                style={{
                  flex: 1,
                  padding: '11px 14px',
                  minHeight: 48,
                  maxHeight: 132,
                  borderRadius: 18,
                  border: `1px solid ${widgetTheme.inputBorder}`,
                  background: widgetTheme.inputBg,
                  color: widgetTheme.text,
                  fontSize: 14,
                  lineHeight: 1.5,
                  letterSpacing: '0.01em',
                  fontFamily: 'inherit',
                  outline: 'none',
                  resize: 'none',
                  overflowY: 'auto',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.8)',
                }}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                style={{
                  padding: '12px 16px',
                  borderRadius: 18,
                  border: 'none',
                  background: 'linear-gradient(135deg, var(--violet) 0%, var(--violet-deep) 100%)',
                  color: 'white',
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: isLoading || !input.trim() ? 'not-allowed' : 'pointer',
                  opacity: isLoading || !input.trim() ? 0.6 : 1,
                  fontFamily: 'inherit',
                  boxShadow: '0 10px 24px rgba(123,94,167,0.24)',
                }}
              >
                Send
              </button>
            </form>
            <div
              style={{
                marginTop: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 10,
                flexWrap: 'wrap',
                color: widgetTheme.mutedText,
                fontSize: 11.5,
              }}
            >
              <span>Press Enter to send. Shift+Enter for a new line.</span>
              <a
                href={ISOKE_CONTENT.contact.mainPhoneHref}
                onClick={() => onPhoneCtaClick('footer')}
                style={{
                  color: widgetTheme.linkAccent,
                  textDecoration: 'none',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                Call {ISOKE_CONTENT.contact.mainPhoneDisplay}
                <ArrowUpRight size={13} />
              </a>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
