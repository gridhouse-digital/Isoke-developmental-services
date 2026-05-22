import { ChevronRight, MessageCircle, Sparkles, X } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { ISOKE_CONTENT, WELCOME_ACTIONS } from '../../../chatbot/isoke-content.js'
import type { ChatStage } from '../../lib/chatbot/flow'
import type { ChatWidgetTheme } from './types'

type ChatLauncherProps = {
  chatStage: ChatStage
  messagesLength: number
  onDismissTeaser: () => void
  onOpen: (stage?: ChatStage) => void
  onWelcomeAction: (action: (typeof WELCOME_ACTIONS)[number], source: 'teaser') => void
  open: boolean
  teaserVisible: boolean
  widgetTheme: ChatWidgetTheme
}

export function ChatLauncher({
  chatStage,
  messagesLength,
  onDismissTeaser,
  onOpen,
  onWelcomeAction,
  open,
  teaserVisible,
  widgetTheme,
}: ChatLauncherProps) {
  return (
    <>
      <AnimatePresence>
        {teaserVisible && !open && (
          <motion.div
            initial={{ opacity: 0, y: 14, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 14, scale: 0.96 }}
            transition={{ duration: 0.24, ease: 'easeOut' }}
            style={{
              position: 'fixed',
              bottom: 102,
              right: 28,
              zIndex: 9989,
              width: 'min(336px, calc(100vw - 40px))',
              padding: '14px 14px 12px',
              borderRadius: 24,
              background: widgetTheme.shellBg,
              border: `1px solid ${widgetTheme.shellBorder}`,
              boxShadow: widgetTheme.shellShadow,
              fontFamily: 'var(--font-body)',
            }}
          >
            <button
              type="button"
              aria-label="Dismiss chat greeting"
              onClick={onDismissTeaser}
              style={{
                position: 'absolute',
                top: 12,
                right: 12,
                padding: 6,
                borderRadius: 10,
                border: `1px solid ${widgetTheme.softBorder}`,
                background: widgetTheme.softBg,
                color: widgetTheme.text,
                cursor: 'pointer',
                display: 'flex',
              }}
            >
              <X size={14} />
            </button>

            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 10px',
                borderRadius: 999,
                background: widgetTheme.badgeBg,
                color: widgetTheme.badgeText,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                marginBottom: 12,
              }}
            >
              <Sparkles size={13} />
              Isoke concierge
            </div>

            <div style={{ fontSize: 15, fontWeight: 700, color: widgetTheme.text, marginBottom: 6, paddingRight: 28 }}>
              {ISOKE_CONTENT.onboarding.teaserTitle}
            </div>
            <div style={{ fontSize: 13, lineHeight: 1.58, color: widgetTheme.mutedText, marginBottom: 14 }}>
              {ISOKE_CONTENT.onboarding.teaserBody}
            </div>

            <div style={{ display: 'grid', gap: 8 }}>
              <button
                type="button"
                onClick={() => onWelcomeAction(WELCOME_ACTIONS[0], 'teaser')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  padding: '11px 12px',
                  borderRadius: 16,
                  border: 'none',
                  background: 'linear-gradient(135deg, var(--violet) 0%, var(--violet-deep) 100%)',
                  color: 'white',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {WELCOME_ACTIONS[0].label}
                <ChevronRight size={15} />
              </button>
              <button
                type="button"
                onClick={() => onWelcomeAction(WELCOME_ACTIONS[1], 'teaser')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  padding: '11px 12px',
                  borderRadius: 16,
                  border: `1px solid ${widgetTheme.actionBorder}`,
                  background: widgetTheme.surfaceSecondaryBg,
                  color: widgetTheme.text,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {WELCOME_ACTIONS[1].label}
                <ChevronRight size={15} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        type="button"
        aria-label="Open chat"
        onClick={() => onOpen(messagesLength > 0 ? chatStage : 'chat_open_welcome')}
        style={{
          position: 'fixed',
          bottom: 32,
          right: 88,
          zIndex: 9990,
          width: 56,
          height: 56,
          borderRadius: '50%',
          border: '1px solid rgba(123,94,167,0.35)',
          background: 'linear-gradient(135deg, var(--violet) 0%, var(--violet-deep) 100%)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 12px 32px rgba(123,94,167,0.32)',
          fontFamily: 'var(--font-body)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-1px)'
          e.currentTarget.style.boxShadow = '0 16px 38px rgba(123,94,167,0.4)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.boxShadow = '0 12px 32px rgba(123,94,167,0.32)'
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            width: 9,
            height: 9,
            borderRadius: '50%',
            background: 'var(--teal)',
            boxShadow: '0 0 0 4px rgba(232,149,109,0.18)',
          }}
        />
        <MessageCircle size={26} strokeWidth={1.8} />
      </button>
    </>
  )
}
