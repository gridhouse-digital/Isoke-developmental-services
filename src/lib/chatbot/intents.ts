import { ISOKE_CONTENT, findServiceByText, type IsokeService } from '../../../chatbot/isoke-content.js'
import type { ChatStage } from './flow'

export type ChatIntentMessage = {
  role: string
  text: string
}

export function isCallbackRequest(text: string) {
  return /\b(callback|call\s*back|call me|call you|talk to someone)\b/i.test(text)
}

export function isGreetingPrompt(text: string) {
  return /^(hi|hello|hey|good\s+(morning|afternoon|evening))(?:[.!?,\s]*)$/i.test(text.trim())
}

export function isFallbackAssistantText(text: string) {
  const lowered = text.toLowerCase()
  const uncertainty =
    /\b(i do not know|i don't know|i am not sure|i'm not sure|cannot answer|can't answer)\b/.test(lowered) ||
    lowered.includes('do not guess')
  const humanPath =
    lowered.includes(ISOKE_CONTENT.contact.mainPhoneDisplay.toLowerCase()) ||
    lowered.includes(ISOKE_CONTENT.contact.email.toLowerCase()) ||
    lowered.includes('request a callback')

  return uncertainty && humanPath
}

export function findServiceIntent(text: string): IsokeService | null {
  return findServiceByText(text)
}

export function findLatestUserServiceMatch(messages: ChatIntentMessage[]): IsokeService | null {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index]
    if (message.role !== 'user') continue

    const service = findServiceIntent(message.text)
    if (service) return service
  }

  return null
}

export function classifyChatInputIntent(text: string, isOutsideBusinessHours: boolean): ChatStage | null {
  const lowered = text.toLowerCase()

  if (isCallbackRequest(lowered)) return 'callback_offer'
  if (lowered.includes('after-hours') || lowered.includes('after hours')) return 'after_hours'
  if (lowered.includes('contact') || lowered.includes('hours') || lowered.includes('phone') || lowered.includes('email')) {
    return isOutsideBusinessHours ? 'after_hours' : 'contact_info'
  }
  if (findServiceIntent(lowered)) return 'exploring_services'
  if (lowered.includes('service') || lowered.includes('support')) return 'exploring_services'

  return null
}
