import { ArrowUpRight, ChevronRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { WELCOME_ACTIONS } from '../../../chatbot/isoke-content.js'
import type { ChatAction, ChatFlowState } from '../../lib/chatbot/flow'
import type { ChatWidgetTheme } from './types'
import type { ElementType } from 'react'

type ChatMessage = {
  id: string
  parts: Array<{ text?: string; type: string }>
  role: string
}

type Banner = {
  icon: ElementType
  text: string
  tone: 'after-hours' | 'fallback' | 'handoff'
}

type MessageListProps = {
  banner: Banner | null
  flowState: ChatFlowState
  getMessageText: (parts: Array<{ text?: string; type: string }>) => string
  isLoading: boolean
  messages: ChatMessage[]
  onFlowAction: (action: ChatAction) => void
  onPhoneCtaClick: (placement: string) => void
  onWelcomeAction: (action: (typeof WELCOME_ACTIONS)[number]) => void
  revealedAssistantText: Record<string, string>
  widgetTheme: ChatWidgetTheme
}

export function MessageList({
  banner,
  flowState,
  getMessageText,
  isLoading,
  messages,
  onFlowAction,
  onPhoneCtaClick,
  onWelcomeAction,
  revealedAssistantText,
  widgetTheme,
}: MessageListProps) {
  return (
    <>
      {messages.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          style={{
            alignSelf: 'stretch',
            marginBottom: 4,
            padding: '14px',
            borderRadius: 20,
            background: widgetTheme.surfaceBg,
            border: `1px solid ${widgetTheme.softBorder}`,
            boxShadow: '0 12px 30px rgba(30,18,48,0.06)',
          }}
        >
          <div
            style={{
              alignSelf: 'stretch',
              marginBottom: 10,
            }}
          >
            <div
              style={{
                marginBottom: 5,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'var(--muted)',
                paddingLeft: 6,
              }}
            >
              Isoke concierge
            </div>
            <div
              style={{
                padding: '12px 14px',
                borderRadius: '18px 18px 18px 8px',
                fontSize: 14,
                lineHeight: 1.55,
                letterSpacing: '0.005em',
                background: widgetTheme.assistantBg,
                border: `1px solid ${widgetTheme.assistantBorder}`,
                color: widgetTheme.text,
                boxShadow: '0 10px 24px rgba(30,18,48,0.05)',
              }}
            >
              Hi, I can help with services, contact details, or a callback.
            </div>
          </div>

          <div style={{ display: 'grid', gap: 7 }}>
            {WELCOME_ACTIONS.map((action) => (
              <button
                key={action.id}
                type="button"
                onClick={() => onWelcomeAction(action)}
                style={{
                  textAlign: 'left',
                  padding: '10px 12px',
                  borderRadius: 14,
                  border: `1px solid ${widgetTheme.actionBorder}`,
                  background: widgetTheme.surfaceSecondaryBg,
                  color: widgetTheme.text,
                  cursor: 'pointer',
                  transition: 'transform 140ms ease, border-color 140ms ease, box-shadow 140ms ease',
                  boxShadow: '0 4px 14px rgba(30,18,48,0.04)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 10,
                }}
              >
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 700, marginBottom: 2 }}>{action.label}</div>
                  <div style={{ fontSize: 12, lineHeight: 1.42, color: 'var(--muted)' }}>{action.description}</div>
                </div>
                <ChevronRight size={16} style={{ color: widgetTheme.linkAccent, flexShrink: 0 }} />
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {messages.map((message) => {
        const isAssistant = message.role === 'assistant'
        return (
          <div
            key={message.id}
            style={{
              alignSelf: isAssistant ? 'flex-start' : 'flex-end',
              maxWidth: isAssistant ? '92%' : '84%',
            }}
          >
            {isAssistant && (
              <div
                style={{
                  marginBottom: 6,
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: 'var(--muted)',
                  paddingLeft: 6,
                }}
              >
                Isoke concierge
              </div>
            )}
            <div
              style={{
                padding: isAssistant ? '14px 16px' : '12px 14px',
                borderRadius: isAssistant ? '18px 18px 18px 8px' : '18px 18px 8px 18px',
                fontSize: isAssistant ? 15 : 14,
                lineHeight: isAssistant ? 1.72 : 1.6,
                letterSpacing: isAssistant ? '0.005em' : '0.01em',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                boxShadow: isAssistant ? '0 10px 24px rgba(30,18,48,0.05)' : '0 10px 22px rgba(123,94,167,0.18)',
                ...(isAssistant
                  ? {
                      background: widgetTheme.assistantBg,
                      border: `1px solid ${widgetTheme.assistantBorder}`,
                      color: widgetTheme.text,
                    }
                  : {
                      background: 'linear-gradient(135deg, var(--violet) 0%, var(--ink-soft) 100%)',
                      color: 'white',
                    }),
              }}
            >
              {isAssistant ? revealedAssistantText[message.id] ?? '' : getMessageText(message.parts)}
            </div>
          </div>
        )
      })}

      {isLoading && messages[messages.length - 1]?.role === 'user' && (
        <div
          style={{
            alignSelf: 'flex-start',
            padding: '12px 16px',
            borderRadius: '18px 18px 18px 8px',
            background: widgetTheme.assistantBg,
            border: `1px solid ${widgetTheme.assistantBorder}`,
            color: widgetTheme.mutedText,
            fontSize: 15,
            letterSpacing: '0.12em',
            boxShadow: '0 10px 24px rgba(30,18,48,0.05)',
          }}
        >
          ...
        </div>
      )}

      {banner && (
        <div
          style={{
            alignSelf: 'stretch',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '12px 14px',
            borderRadius: 16,
            background:
              banner.tone === 'after-hours'
                ? 'rgba(232,149,109,0.12)'
                : banner.tone === 'fallback'
                  ? 'rgba(123,94,167,0.08)'
                  : 'rgba(52, 211, 153, 0.12)',
            border:
              banner.tone === 'after-hours'
                ? '1px solid rgba(232,149,109,0.2)'
                : banner.tone === 'fallback'
                  ? '1px solid rgba(123,94,167,0.14)'
                  : '1px solid rgba(16,185,129,0.16)',
            color: widgetTheme.text,
            fontSize: 13,
            lineHeight: 1.55,
          }}
        >
          <banner.icon size={16} style={{ flexShrink: 0, color: widgetTheme.badgeText }} />
          <span>{banner.text}</span>
        </div>
      )}

      {messages.length > 0 && flowState.actions.length > 0 && !isLoading && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {flowState.actions.map((action) =>
            action.kind === 'link' ? (
              <a
                key={action.id}
                href={action.href}
                onClick={() => onPhoneCtaClick(action.id)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '9px 12px',
                  borderRadius: 999,
                  border: `1px solid ${widgetTheme.actionBorder}`,
                  background: widgetTheme.actionBg,
                  color: widgetTheme.text,
                  textDecoration: 'none',
                  fontSize: 12.5,
                  fontWeight: 600,
                  boxShadow: '0 6px 16px rgba(30,18,48,0.04)',
                }}
              >
                {action.label}
                <ArrowUpRight size={14} />
              </a>
            ) : (
              <button
                key={action.id}
                type="button"
                onClick={() => onFlowAction(action)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '9px 12px',
                  borderRadius: 999,
                  border: `1px solid ${widgetTheme.actionBorder}`,
                  background: action.kind === 'callback' ? widgetTheme.pillBg : widgetTheme.actionBg,
                  color: widgetTheme.text,
                  cursor: 'pointer',
                  fontSize: 12.5,
                  fontWeight: 600,
                  boxShadow: '0 6px 16px rgba(30,18,48,0.04)',
                }}
              >
                {action.label}
                <ChevronRight size={14} />
              </button>
            ),
          )}
        </div>
      )}
    </>
  )
}
