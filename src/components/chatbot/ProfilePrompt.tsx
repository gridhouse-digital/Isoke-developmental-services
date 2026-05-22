import type { FormEvent, RefObject } from 'react'
import type { ChatWidgetTheme, ProfilePromptConfig } from './types'

type ProfilePromptProps = {
  introLeadMessage: string
  onDraftChange: (value: string) => void
  onSkip: () => void
  onSubmit: (e: FormEvent) => void
  profileDraft: string
  profileInputRef: RefObject<HTMLInputElement | null>
  profilePrompt: ProfilePromptConfig
  profilePromptRef: RefObject<HTMLDivElement | null>
  widgetTheme: ChatWidgetTheme
}

export function ProfilePrompt({
  introLeadMessage,
  onDraftChange,
  onSkip,
  onSubmit,
  profileDraft,
  profileInputRef,
  profilePrompt,
  profilePromptRef,
  widgetTheme,
}: ProfilePromptProps) {
  return (
    <>
      <div
        style={{
          alignSelf: 'flex-start',
          maxWidth: '92%',
        }}
      >
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
        <div
          style={{
            padding: '14px 16px',
            borderRadius: '18px 18px 18px 8px',
            fontSize: 15,
            lineHeight: 1.72,
            letterSpacing: '0.005em',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            background: widgetTheme.assistantBg,
            border: `1px solid ${widgetTheme.assistantBorder}`,
            color: widgetTheme.text,
            boxShadow: '0 10px 24px rgba(30,18,48,0.05)',
          }}
        >
          {introLeadMessage}
        </div>
      </div>

      <div
        ref={profilePromptRef}
        style={{
          alignSelf: 'stretch',
          padding: '16px',
          borderRadius: 22,
          background: widgetTheme.surfaceBg,
          border: `1px solid ${widgetTheme.softBorder}`,
          boxShadow: '0 14px 30px rgba(30,18,48,0.07)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 14,
              background: widgetTheme.pillBg,
              color: widgetTheme.badgeText,
              display: 'grid',
              placeItems: 'center',
              flexShrink: 0,
            }}
          >
            <profilePrompt.icon size={18} />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: widgetTheme.text, marginBottom: 4 }}>
              {profilePrompt.title}
            </div>
            <div style={{ fontSize: 12.5, lineHeight: 1.58, color: widgetTheme.mutedText }}>
              {profilePrompt.prompt}
            </div>
          </div>
        </div>

        <form onSubmit={onSubmit} style={{ display: 'grid', gap: 10 }}>
          <input
            ref={profileInputRef}
            type="text"
            value={profileDraft}
            onChange={(e) => onDraftChange(e.target.value)}
            placeholder={profilePrompt.placeholder}
            style={{
              padding: '11px 12px',
              borderRadius: 14,
              border: `1px solid ${widgetTheme.inputBorder}`,
              background: widgetTheme.inputBg,
              color: widgetTheme.text,
              fontSize: 14,
              fontFamily: 'inherit',
              outline: 'none',
            }}
          />
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              type="submit"
              disabled={!profileDraft.trim()}
              style={{
                flex: 1,
                minWidth: 140,
                padding: '11px 14px',
                borderRadius: 999,
                border: 'none',
                background: 'linear-gradient(135deg, var(--violet) 0%, var(--violet-deep) 100%)',
                color: 'white',
                fontWeight: 700,
                fontSize: 13,
                cursor: profileDraft.trim() ? 'pointer' : 'not-allowed',
                opacity: profileDraft.trim() ? 1 : 0.65,
                fontFamily: 'inherit',
              }}
            >
              {profilePrompt.cta}
            </button>
            <button
              type="button"
              onClick={onSkip}
              style={{
                padding: '11px 14px',
                borderRadius: 999,
                border: `1px solid ${widgetTheme.actionBorder}`,
                background: widgetTheme.surfaceSecondaryBg,
                color: widgetTheme.text,
                fontWeight: 700,
                fontSize: 13,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              {profilePrompt.secondary}
            </button>
          </div>
        </form>
      </div>
    </>
  )
}
