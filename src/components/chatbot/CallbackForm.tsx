import type { FormEvent } from 'react'
import { PhoneCall, X } from 'lucide-react'
import { ISOKE_CONTENT } from '../../../chatbot/isoke-content.js'
import type { CallbackDetails, ChatWidgetTheme } from './types'

type CallbackFormProps = {
  callbackForm: CallbackDetails
  callbackSubmitting: boolean
  onClose: () => void
  onFieldChange: (field: keyof CallbackDetails, value: string) => void
  onPhoneCtaClick: (placement: string) => void
  onSubmit: (e: FormEvent) => void
  widgetTheme: ChatWidgetTheme
}

export function CallbackForm({
  callbackForm,
  callbackSubmitting,
  onClose,
  onFieldChange,
  onPhoneCtaClick,
  onSubmit,
  widgetTheme,
}: CallbackFormProps) {
  return (
    <div
      style={{
        alignSelf: 'stretch',
        padding: '16px',
        borderRadius: 22,
        background: widgetTheme.surfaceBg,
        border: `1px solid ${widgetTheme.softBorder}`,
        boxShadow: '0 14px 32px rgba(30,18,48,0.08)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          marginBottom: 10,
        }}
      >
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: widgetTheme.text, marginBottom: 4 }}>
            Request a callback
          </div>
          <div style={{ fontSize: 12.5, lineHeight: 1.55, color: widgetTheme.mutedText }}>
            Share the best details for a follow-up from the Isoke team.
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          style={{
            padding: 6,
            borderRadius: 10,
            border: `1px solid ${widgetTheme.actionBorder}`,
            background: widgetTheme.surfaceSecondaryBg,
            color: widgetTheme.text,
            cursor: 'pointer',
          }}
        >
          <X size={15} />
        </button>
      </div>

      <form onSubmit={onSubmit} style={{ display: 'grid', gap: 10 }}>
        <input
          type="text"
          value={callbackForm.name}
          onChange={(e) => onFieldChange('name', e.target.value)}
          placeholder="Your name"
          disabled={callbackSubmitting}
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
        <input
          type="tel"
          value={callbackForm.phone}
          onChange={(e) => onFieldChange('phone', e.target.value)}
          placeholder="Phone number"
          disabled={callbackSubmitting}
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
        <input
          type="text"
          value={callbackForm.location ?? ''}
          onChange={(e) => onFieldChange('location', e.target.value)}
          placeholder="City and state (optional)"
          disabled={callbackSubmitting}
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
        <textarea
          value={callbackForm.bestTime}
          onChange={(e) => onFieldChange('bestTime', e.target.value)}
          placeholder="Best time to call"
          disabled={callbackSubmitting}
          rows={2}
          style={{
            minHeight: 80,
            padding: '11px 12px',
            borderRadius: 14,
            border: `1px solid ${widgetTheme.inputBorder}`,
            background: widgetTheme.inputBg,
            color: widgetTheme.text,
            fontSize: 14,
            lineHeight: 1.5,
            fontFamily: 'inherit',
            outline: 'none',
            resize: 'vertical',
          }}
        />
        <select
          value={callbackForm.service}
          onChange={(e) => onFieldChange('service', e.target.value)}
          disabled={callbackSubmitting}
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
        >
          <option value="">Service of interest (optional)</option>
          {ISOKE_CONTENT.services.map((service) => (
            <option key={service.name} value={service.name}>
              {service.name}
            </option>
          ))}
        </select>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            type="submit"
            disabled={callbackSubmitting}
            style={{
              flex: 1,
              minWidth: 160,
              padding: '11px 14px',
              borderRadius: 999,
              border: 'none',
              background: 'linear-gradient(135deg, var(--violet) 0%, var(--violet-deep) 100%)',
              color: 'white',
              fontWeight: 700,
              fontSize: 13,
              fontFamily: 'inherit',
              cursor: callbackSubmitting ? 'not-allowed' : 'pointer',
              opacity: callbackSubmitting ? 0.7 : 1,
            }}
          >
            {callbackSubmitting ? 'Sending...' : 'Send callback request'}
          </button>
          <a
            href={ISOKE_CONTENT.contact.mainPhoneHref}
            onClick={() => onPhoneCtaClick('callback_form')}
            style={{
              padding: '11px 14px',
              borderRadius: 999,
              border: `1px solid ${widgetTheme.actionBorder}`,
              background: widgetTheme.surfaceSecondaryBg,
              color: widgetTheme.text,
              fontSize: 13,
              fontWeight: 700,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <PhoneCall size={14} />
            Call instead
          </a>
        </div>
      </form>
    </div>
  )
}
