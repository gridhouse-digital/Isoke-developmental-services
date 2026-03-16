import { ISOKE_CONTENT, WELCOME_ACTIONS, type WelcomeAction } from '../../../chatbot/isoke-content.js'

export type ChatStage =
  | 'after_hours'
  | 'callback_form'
  | 'callback_offer'
  | 'chat_open_welcome'
  | 'collecting_location'
  | 'collecting_name'
  | 'contact_info'
  | 'exploring_services'
  | 'fallback'
  | 'resolved'
  | 'teaser_hidden'
  | 'teaser_visible'

export type ChatAction =
  | {
      href: string
      id: string
      kind: 'link'
      label: string
    }
  | {
      id: string
      kind: 'message'
      label: string
      text: string
    }
  | {
      id: string
      kind: 'callback'
      label: string
    }

export type ChatFlowState = {
  actions: ChatAction[]
  badge: string
  description: string
  intent:
    | 'after_hours'
    | 'callback_form_active'
    | 'callback_offer'
    | 'contact_hours'
    | 'fallback'
    | 'human_handoff'
    | 'service_discovery'
    | 'welcome'
  specialTone: 'after_hours' | 'fallback' | 'handoff' | 'standard'
}

type ChatFlowContext = {
  callbackFormOpen: boolean
  firstName?: string
  serviceName?: string
  stage: ChatStage
}

function welcomeActionsToFlow(actions: WelcomeAction[]): ChatAction[] {
  return actions.map((action) => ({
    id: action.id,
    kind: 'message' as const,
    label: action.label,
    text: action.text,
  }))
}

export function deriveChatFlowState(context: ChatFlowContext): ChatFlowState {
  const { callbackFormOpen, firstName, serviceName, stage } = context

  if (callbackFormOpen || stage === 'callback_form') {
    return {
      actions: [
        { id: 'call-now', kind: 'link', label: 'Call now', href: ISOKE_CONTENT.contact.mainPhoneHref },
        { id: 'after-hours', kind: 'link', label: 'After-hours line', href: ISOKE_CONTENT.contact.afterHoursHref },
      ],
      badge: 'Callback',
      description: 'Share your details and the team will follow up.',
      intent: 'callback_form_active',
      specialTone: 'handoff',
    }
  }

  if (stage === 'teaser_hidden' || stage === 'teaser_visible' || stage === 'chat_open_welcome') {
    return {
      actions: welcomeActionsToFlow(WELCOME_ACTIONS),
      badge: 'Concierge',
      description: firstName ? `Welcome back, ${firstName}.` : 'Ask about services, contact details, or a callback.',
      intent: 'welcome',
      specialTone: 'standard',
    }
  }

  if (stage === 'collecting_name') {
    return {
      actions: [
        { id: 'services', kind: 'message', label: 'Explore services', text: 'What services do you offer?' },
        { id: 'skip-name', kind: 'message', label: 'Skip for now', text: 'Let us keep going without my name.' },
      ],
      badge: 'Getting started',
      description: 'A first name helps keep the conversation personal without asking for too much too soon.',
      intent: 'welcome',
      specialTone: 'standard',
    }
  }

  if (stage === 'collecting_location') {
    return {
      actions: [
        { id: 'skip-location', kind: 'message', label: 'Skip for now', text: 'Let us keep going without my location.' },
        { id: 'contact', kind: 'message', label: 'Contact details', text: 'How can I contact you?' },
      ],
      badge: 'Routing help',
      description: 'City and state help the team guide the conversation without needing exact geolocation.',
      intent: 'contact_hours',
      specialTone: 'standard',
    }
  }

  if (stage === 'after_hours') {
    return {
      actions: [
        { id: 'after-hours-call', kind: 'link', label: 'Call after-hours', href: ISOKE_CONTENT.contact.afterHoursHref },
        { id: 'callback', kind: 'callback', label: 'Request callback' },
        { id: 'contact', kind: 'message', label: 'Get contact details', text: 'How can I contact you?' },
      ],
      badge: 'After-hours',
      description: 'Use the after-hours number now or request a callback.',
      intent: 'after_hours',
      specialTone: 'after_hours',
    }
  }

  if (stage === 'fallback') {
    return {
      actions: [
        { id: 'callback', kind: 'callback', label: 'Request callback' },
        { id: 'call-team', kind: 'link', label: 'Call the team', href: ISOKE_CONTENT.contact.mainPhoneHref },
        { id: 'contact', kind: 'message', label: 'Contact details', text: 'How can I contact you?' },
      ],
      badge: 'Need support',
      description: 'If the bot cannot answer fully, it should route you to a person quickly.',
      intent: 'fallback',
      specialTone: 'fallback',
    }
  }

  if (stage === 'callback_offer') {
    return {
      actions: [
        { id: 'callback', kind: 'callback', label: 'Open callback form' },
        { id: 'call-team', kind: 'link', label: 'Call now', href: ISOKE_CONTENT.contact.mainPhoneHref },
      ],
      badge: 'Follow-up',
      description: 'Choose a callback or call the team directly.',
      intent: 'callback_offer',
      specialTone: 'handoff',
    }
  }

  if (stage === 'contact_info') {
    return {
      actions: [
        { id: 'call-main', kind: 'link', label: 'Call main line', href: ISOKE_CONTENT.contact.mainPhoneHref },
        { id: 'request-callback', kind: 'callback', label: 'Request callback' },
        { id: 'after-hours', kind: 'message', label: 'After-hours help', text: 'What is your after-hours number?' },
      ],
      badge: 'Contact',
      description: 'Use the best contact option for your timing and needs.',
      intent: 'contact_hours',
      specialTone: 'standard',
    }
  }

  if (stage === 'resolved') {
    return {
      actions: [
        { id: 'services', kind: 'message', label: 'Explore services', text: 'What services do you offer?' },
        { id: 'callback', kind: 'callback', label: 'Request callback' },
        { id: 'contact', kind: 'message', label: 'Contact details', text: 'How can I contact you?' },
      ],
      badge: 'Next step',
      description: 'Continue exploring, connect with the team, or request a callback.',
      intent: 'service_discovery',
      specialTone: 'standard',
    }
  }

  return {
    actions: serviceName
      ? [
          { id: 'callback', kind: 'callback', label: 'Talk to someone' },
          { id: 'contact', kind: 'message', label: 'Contact details', text: 'How can I contact you?' },
          { id: 'another-service', kind: 'message', label: 'Another service', text: 'What other services do you offer?' },
        ]
      : [
          { id: 'services', kind: 'message', label: 'Explore services', text: 'What services do you offer?' },
          { id: 'callback', kind: 'callback', label: 'Request callback' },
          { id: 'contact', kind: 'message', label: 'Contact details', text: 'How can I contact you?' },
        ],
    badge: serviceName ? 'Service match' : 'Service guide',
    description: serviceName
      ? `Explore ${serviceName} further or connect with the team.`
      : 'Browse services or choose the best next contact step.',
    intent: 'service_discovery',
    specialTone: 'standard',
  }
}
