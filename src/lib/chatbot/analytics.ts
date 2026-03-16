export type ChatbotEventName =
  | 'callback_failed'
  | 'callback_form_opened'
  | 'callback_submitted'
  | 'chat_session_started'
  | 'fallback_shown'
  | 'intent_entered'
  | 'phone_cta_clicked'
  | 'profile_location_collected'
  | 'profile_name_collected'
  | 'teaser_clicked'
  | 'teaser_dismissed'
  | 'teaser_shown'
  | 'welcome_action_clicked'

export type ChatbotAnalyticsPayload = {
  event: ChatbotEventName
  properties?: Record<string, string>
}

declare global {
  interface Window {
    __ISOKE_CHATBOT_ANALYTICS__?: (payload: ChatbotAnalyticsPayload) => void
  }
}

export function trackChatbotEvent(event: ChatbotEventName, properties: Record<string, string> = {}) {
  if (typeof window === 'undefined') return

  window.__ISOKE_CHATBOT_ANALYTICS__?.({
    event,
    properties,
  })
}
