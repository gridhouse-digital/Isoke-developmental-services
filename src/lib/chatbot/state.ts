import type { ChatStage } from './flow'

export type ChatStageTransition =
  | { type: 'assistant_fallback' }
  | { type: 'callback_submitted' }
  | { type: 'classified_input'; stage: ChatStage }
  | { type: 'close_callback_form'; hasMatchedService: boolean }
  | { type: 'conversation_started' }
  | { type: 'dismiss_teaser' }
  | { type: 'open_callback_form' }
  | { type: 'open_chat'; stage?: ChatStage }
  | { type: 'profile_name_completed'; hasLocationResolved: boolean; hasPendingAction: boolean; hasPendingPrompt: boolean }
  | {
      type: 'profile_location_completed'
      hasMatchedService: boolean
      hasNameResolved: boolean
      hasPendingAction: boolean
      hasPendingPrompt: boolean
    }
  | { type: 'profile_prompt_needed'; needsLocation: boolean; needsName: boolean }
  | { type: 'queued_prompt_resolved'; classifiedStage: ChatStage | null }
  | { type: 'reset_after_callback_message'; classifiedStage: ChatStage | null }
  | { type: 'show_teaser' }

const HANDOFF_LOCKED_STAGES = new Set<ChatStage>(['after_hours', 'callback_form', 'callback_offer'])
const CALLBACK_LOCKED_STAGES = new Set<ChatStage>(['callback_form', 'callback_offer'])

export function getChatStageTransition(event: ChatStageTransition): ChatStage {
  switch (event.type) {
    case 'assistant_fallback':
      return 'fallback'
    case 'callback_submitted':
      return 'resolved'
    case 'classified_input':
      return event.stage
    case 'close_callback_form':
      return event.hasMatchedService ? 'exploring_services' : 'resolved'
    case 'conversation_started':
      return 'collecting_name'
    case 'dismiss_teaser':
      return 'teaser_hidden'
    case 'open_callback_form':
      return 'callback_form'
    case 'open_chat':
      return event.stage ?? 'chat_open_welcome'
    case 'profile_name_completed':
      if (event.hasPendingAction && event.hasLocationResolved) return 'callback_form'
      if (event.hasPendingPrompt && event.hasLocationResolved) return 'resolved'
      return 'collecting_location'
    case 'profile_location_completed':
      if (event.hasPendingAction && event.hasNameResolved) return 'callback_form'
      if (event.hasPendingPrompt && event.hasNameResolved) return 'resolved'
      return event.hasMatchedService ? 'exploring_services' : 'resolved'
    case 'profile_prompt_needed':
      return event.needsName ? 'collecting_name' : event.needsLocation ? 'collecting_location' : 'resolved'
    case 'queued_prompt_resolved':
    case 'reset_after_callback_message':
      return event.classifiedStage ?? 'resolved'
    case 'show_teaser':
      return 'teaser_visible'
  }
}

export function reduceChatStage(current: ChatStage, event: ChatStageTransition): ChatStage {
  if (event.type === 'assistant_fallback' && HANDOFF_LOCKED_STAGES.has(current)) return current
  if (event.type === 'conversation_started' && current !== 'chat_open_welcome') return current
  if (event.type === 'dismiss_teaser' && current !== 'teaser_visible') return current
  if (event.type === 'open_chat' && !event.stage && current !== 'teaser_hidden' && current !== 'teaser_visible') return current
  if (event.type === 'profile_prompt_needed' && CALLBACK_LOCKED_STAGES.has(current)) return current
  if (event.type === 'show_teaser' && current !== 'teaser_hidden') return current

  return getChatStageTransition(event)
}
