import { useCallback, useEffect, useRef, useState } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { Clock3, LifeBuoy, MapPin, PhoneCall, UserRound } from 'lucide-react'
import { ISOKE_CONTENT, WELCOME_ACTIONS } from '../../chatbot/isoke-content.js'
import { CallbackForm } from './chatbot/CallbackForm'
import { ChatLauncher } from './chatbot/ChatLauncher'
import { ChatPanel } from './chatbot/ChatPanel'
import { MessageList } from './chatbot/MessageList'
import { ProfilePrompt } from './chatbot/ProfilePrompt'
import type { CallbackDetails, CallbackNotice } from './chatbot/types'
import { trackChatbotEvent } from '../lib/chatbot/analytics'
import { deriveChatFlowState, type ChatAction, type ChatStage } from '../lib/chatbot/flow'
import {
  classifyChatInputIntent,
  findLatestUserServiceMatch,
  isCallbackRequest,
  isFallbackAssistantText,
  isGreetingPrompt,
} from '../lib/chatbot/intents'
import { reduceChatStage, type ChatStageTransition } from '../lib/chatbot/state'

const OPEN_CHAT_EVENT = 'isoke-open-chat'
const ASSISTANT_REVEAL_MS = 20
const ASSISTANT_REVEAL_CHARS = 2
const CHATBOT_TEASER_DISMISSED_KEY = 'isoke-chatbot-teaser-dismissed'
const CALLBACK_API_URL =
  typeof window !== 'undefined' && window.location.hostname === 'localhost'
    ? 'http://localhost:3001/api/callback'
    : '/api/callback'

type VisitorProfile = {
  cityState: string
  firstName: string
  locationResolved: boolean
  nameResolved: boolean
}

type ChatProfileContext = {
  cityState?: string
  firstName?: string
}

type PendingAction = 'callback' | null

function messageText(parts: Array<{ text?: string; type: string }>): string {
  return (parts || [])
    .filter((part): part is { type: 'text'; text: string } => part.type === 'text' && typeof part.text === 'string')
    .map((part) => part.text)
    .join('')
}

function isOutsideBusinessHoursNow() {
  const now = new Date()
  const formatter = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    hour12: false,
    timeZone: 'America/New_York',
    weekday: 'short',
  })
  const parts = formatter.formatToParts(now)
  const hour = Number(parts.find((part) => part.type === 'hour')?.value ?? '0')
  const weekday = parts.find((part) => part.type === 'weekday')?.value ?? 'Sun'
  const weekend = weekday === 'Sat' || weekday === 'Sun'

  return weekend || hour < 9 || hour >= 17
}

function getBannerCopy(intent: ReturnType<typeof deriveChatFlowState>['intent']) {
  if (intent === 'after_hours') {
    return {
      icon: Clock3,
      text: `Outside business hours. Use ${ISOKE_CONTENT.contact.afterHoursDisplay} now or request a callback.`,
      tone: 'after-hours' as const,
    }
  }

  if (intent === 'fallback') {
    return {
      icon: LifeBuoy,
      text: `Need a person? Call ${ISOKE_CONTENT.contact.mainPhoneDisplay} or request a callback.`,
      tone: 'fallback' as const,
    }
  }

  if (intent === 'callback_offer' || intent === 'callback_form_active') {
    return {
      icon: PhoneCall,
      text: 'The team can follow up by phone. Share your details or call directly.',
      tone: 'handoff' as const,
    }
  }

  return null
}

function buildChatProfileContext(profile: VisitorProfile | ChatProfileContext) {
  return {
    cityState: profile.cityState?.trim() || undefined,
    firstName: profile.firstName?.trim() || undefined,
  }
}

function buildPersonalizedWelcome(firstName?: string) {
  const greeting = firstName?.trim() ? `Hi ${firstName.trim()}, glad to have you here.` : 'Hi there!'

  return `${greeting} We offer a range of person-centered supports for adults with intellectual and developmental disabilities across Pennsylvania.

- Community Participation Support: Help connecting to community activities, routines, and social opportunities.
- Companion Services: In-home support with daily living, social engagement, and medication reminders.
- Shift Nursing: Licensed in-home nursing for medication management, vital signs, and wound care.
- In-Home Community Support: Support with self-care, safety, finances, and household management.
- Respite Services: Short-term care so caregivers can rest, work, or attend to other needs.
- Transportation Services: Reliable, trauma-informed transportation for appointments, work, and community activities.

Would you like me to help you explore which service might fit your needs?`
}

function buildIntroLeadMessage({
  pendingAction,
  pendingPrompt,
}: {
  pendingAction: PendingAction
  pendingPrompt: string | null
}) {
  if (pendingAction === 'callback') {
    return 'I can help with that callback. Before I open the form, let me get a quick introduction from you.'
  }

  if (pendingPrompt) {
    return 'I can help with that. Before I answer, let me get a quick introduction from you so I can keep the conversation personal.'
  }

  return 'Before we continue, let me get a quick introduction from you.'
}

export function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [teaserVisible, setTeaserVisible] = useState(false)
  const [chatStage, setChatStage] = useState<ChatStage>('teaser_hidden')
  const [showCallbackForm, setShowCallbackForm] = useState(false)
  const [pendingAction, setPendingAction] = useState<PendingAction>(null)
  const [pendingPrompt, setPendingPrompt] = useState<string | null>(null)
  const [callbackSubmitting, setCallbackSubmitting] = useState(false)
  const [callbackForm, setCallbackForm] = useState<CallbackDetails>({
    bestTime: '',
    location: '',
    name: '',
    phone: '',
    service: '',
  })
  const [visitorProfile, setVisitorProfile] = useState<VisitorProfile>({
    cityState: '',
    firstName: '',
    locationResolved: false,
    nameResolved: false,
  })
  const [profileDraft, setProfileDraft] = useState('')
  const [callbackNotice, setCallbackNotice] = useState<CallbackNotice | null>(null)
  const [revealedAssistantText, setRevealedAssistantText] = useState<Record<string, string>>({})
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const profilePromptRef = useRef<HTMLDivElement>(null)
  const profileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const revealTimersRef = useRef<Record<string, ReturnType<typeof window.setInterval>>>({})
  const assistantTargetsRef = useRef<Record<string, string>>({})
  const hasTrackedSessionRef = useRef(false)
  const lastIntentRef = useRef<string | null>(null)
  const lastFallbackSignatureRef = useRef('')
  const lastCallbackOpenRef = useRef(false)
  const hasShownTeaserRef = useRef(false)
  const isOutsideBusinessHours = isOutsideBusinessHoursNow()

  const transitionChatStage = useCallback((event: ChatStageTransition) => {
    setChatStage((current) => reduceChatStage(current, event))
  }, [])

  useEffect(() => {
    const handler = () => {
      setOpen(true)
      setTeaserVisible(false)
      transitionChatStage({ type: 'open_chat' })
    }
    window.addEventListener(OPEN_CHAT_EVENT, handler)
    return () => window.removeEventListener(OPEN_CHAT_EVENT, handler)
  }, [transitionChatStage])

  const { messages, sendMessage, setMessages, status } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat',
      prepareSendMessagesRequest: ({ body, id, messageId, messages, trigger }) => ({
        body: {
          ...(body ?? {}),
          id,
          ...(messageId ? { messageId } : {}),
          messages,
          trigger,
          visitorProfile: buildChatProfileContext(visitorProfile),
        },
      }),
    }),
  })

  const matchedService = findLatestUserServiceMatch(
    messages.map((message) => ({
      role: message.role,
      text: messageText(message.parts),
    })),
  )
  const flowState = deriveChatFlowState({
    callbackFormOpen: showCallbackForm,
    firstName: visitorProfile.firstName,
    serviceName: matchedService?.name,
    stage: chatStage,
  })
  const banner = getBannerCopy(flowState.intent)
  const isLoading = status === 'submitted' || status === 'streaming'
  const introComplete = visitorProfile.nameResolved && visitorProfile.locationResolved
  const isDarkMode = typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
  const widgetTheme = isDarkMode
    ? {
        accent: '#D9C8F4',
        actionBg: 'rgba(255,255,255,0.06)',
        actionBorder: 'rgba(184,159,216,0.22)',
        assistantBg: 'rgba(27,22,38,0.94)',
        assistantBorder: 'rgba(184,159,216,0.18)',
        badgeBg: 'rgba(184,159,216,0.16)',
        badgeText: '#E8DFFF',
        canvasBg:
          'radial-gradient(circle at top left, rgba(123,94,167,0.18) 0%, transparent 28%), linear-gradient(180deg, rgba(13,13,15,0.98) 0%, rgba(20,18,26,0.98) 100%)',
        footerBg: 'rgba(12,12,16,0.88)',
        footerBorder: 'rgba(184,159,216,0.14)',
        headerText: '#F5F0EC',
        inputBg: 'rgba(255,255,255,0.06)',
        inputBorder: 'rgba(184,159,216,0.22)',
        linkAccent: '#D9C8F4',
        mutedText: 'rgba(237,232,248,0.72)',
        pillBg: 'rgba(184,159,216,0.16)',
        shellBg:
          'linear-gradient(180deg, rgba(15,15,19,0.98) 0%, rgba(24,20,32,0.98) 42%, rgba(18,16,24,0.98) 100%)',
        shellBorder: 'rgba(184,159,216,0.18)',
        shellShadow: '0 24px 72px rgba(0,0,0,0.46)',
        softBg: 'rgba(255,255,255,0.08)',
        softBorder: 'rgba(184,159,216,0.18)',
        statusBg: 'rgba(255,255,255,0.05)',
        surfaceBg: 'rgba(22,19,30,0.94)',
        surfaceSecondaryBg: 'rgba(30,24,40,0.92)',
        text: '#EDE8F8',
      }
    : {
        accent: 'var(--violet-deep)',
        actionBg: 'rgba(255,255,255,0.74)',
        actionBorder: 'rgba(123,94,167,0.14)',
        assistantBg: 'rgba(255,255,255,0.88)',
        assistantBorder: 'rgba(123,94,167,0.12)',
        badgeBg: 'rgba(123,94,167,0.08)',
        badgeText: 'var(--violet-deep)',
        canvasBg:
          'radial-gradient(circle at top left, rgba(212,196,236,0.16) 0%, transparent 30%), linear-gradient(180deg, rgba(255,255,255,0.62) 0%, rgba(245,240,236,0.24) 100%)',
        footerBg: 'rgba(255,255,255,0.78)',
        footerBorder: 'rgba(123,94,167,0.1)',
        headerText: '#F5F0EC',
        inputBg: 'rgba(255,255,255,0.84)',
        inputBorder: 'rgba(123,94,167,0.14)',
        linkAccent: 'var(--violet)',
        mutedText: 'var(--muted)',
        pillBg: 'rgba(123,94,167,0.08)',
        shellBg:
          'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(250,246,255,0.96) 38%, rgba(245,240,236,0.98) 100%)',
        shellBorder: 'rgba(123,94,167,0.16)',
        shellShadow: '0 24px 72px rgba(30,18,48,0.2)',
        softBg: 'rgba(255,255,255,0.72)',
        softBorder: 'rgba(123,94,167,0.12)',
        statusBg: 'rgba(255,255,255,0.68)',
        surfaceBg: 'rgba(255,255,255,0.88)',
        surfaceSecondaryBg: 'rgba(255,255,255,0.78)',
        text: 'var(--ink)',
      }

  useEffect(() => {
    if (!open || hasTrackedSessionRef.current) return
    hasTrackedSessionRef.current = true
    trackChatbotEvent('chat_session_started')
  }, [open])

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (open) return
    if (window.sessionStorage.getItem(CHATBOT_TEASER_DISMISSED_KEY) === 'true') return
    if (hasShownTeaserRef.current) return

    const timeoutId = window.setTimeout(() => {
      hasShownTeaserRef.current = true
      setTeaserVisible(true)
      transitionChatStage({ type: 'show_teaser' })
      trackChatbotEvent('teaser_shown')
    }, 1600)

    return () => window.clearTimeout(timeoutId)
  }, [open, transitionChatStage])

  useEffect(() => {
    if (lastIntentRef.current === flowState.intent) return
    lastIntentRef.current = flowState.intent
    trackChatbotEvent('intent_entered', { intent: flowState.intent })
  }, [flowState.intent])

  useEffect(() => {
    if (flowState.intent !== 'fallback') return
    const signature = `${messages.length}-${flowState.intent}`
    if (lastFallbackSignatureRef.current === signature) return
    lastFallbackSignatureRef.current = signature
    trackChatbotEvent('fallback_shown')
  }, [flowState.intent, messages.length])

  useEffect(() => {
    if (showCallbackForm && !lastCallbackOpenRef.current) {
      trackChatbotEvent('callback_form_opened', {
        source_intent: chatStage,
      })
    }

    lastCallbackOpenRef.current = showCallbackForm
  }, [showCallbackForm, chatStage])

  useEffect(() => {
    if (messages.length === 0) return

    const lastMessage = messages[messages.length - 1]
    const lastText = messageText(lastMessage.parts)

    if (lastMessage.role === 'user') {
      const nextStage = classifyChatInputIntent(lastText, isOutsideBusinessHours)
      if (nextStage) {
        transitionChatStage({ type: 'classified_input', stage: nextStage })
      } else if (messages.length >= 2) {
        transitionChatStage({ type: 'conversation_started' })
      }
    }

    const assistantFallback = lastMessage.role === 'assistant' && isFallbackAssistantText(lastText)

    if (assistantFallback) {
      transitionChatStage({ type: 'assistant_fallback' })
      return
    }

    if (!visitorProfile.nameResolved && messages.length >= 2 && !showCallbackForm) {
      transitionChatStage({ type: 'profile_prompt_needed', needsLocation: false, needsName: true })
    }

    if (visitorProfile.nameResolved && !visitorProfile.locationResolved && messages.length >= 2 && !showCallbackForm) {
      transitionChatStage({ type: 'profile_prompt_needed', needsLocation: true, needsName: false })
    }
  }, [
    isOutsideBusinessHours,
    messages,
    showCallbackForm,
    transitionChatStage,
    visitorProfile.locationResolved,
    visitorProfile.nameResolved,
  ])

  useEffect(() => {
    if (callbackForm.service || !matchedService) return

    setCallbackForm((current) => ({
      ...current,
      service: current.service || matchedService.name,
    }))
  }, [callbackForm.service, matchedService])

  useEffect(() => {
    setCallbackForm((current) => ({
      ...current,
      location: current.location || visitorProfile.cityState,
      name: current.name || visitorProfile.firstName,
    }))
  }, [visitorProfile.cityState, visitorProfile.firstName])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, revealedAssistantText, showCallbackForm, callbackNotice])

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
    const revealTimers = revealTimersRef.current

    return () => {
      Object.values(revealTimers).forEach((timerId) => window.clearInterval(timerId))
    }
  }, [])

  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return

    textarea.style.height = '0px'
    textarea.style.height = `${Math.min(textarea.scrollHeight, 132)}px`
  }, [input, open])

  const openChatPanel = (stage: ChatStage = 'chat_open_welcome') => {
    setOpen(true)
    setTeaserVisible(false)
    hasShownTeaserRef.current = true
    transitionChatStage({ type: 'open_chat', stage })
  }

  const dismissTeaser = () => {
    setTeaserVisible(false)
    transitionChatStage({ type: 'dismiss_teaser' })
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem(CHATBOT_TEASER_DISMISSED_KEY, 'true')
    }
    trackChatbotEvent('teaser_dismissed')
  }

  const openCallbackForm = () => {
    setPendingAction(null)
    setCallbackForm((current) => ({
      ...current,
      location: current.location || visitorProfile.cityState,
      name: current.name || visitorProfile.firstName,
      service: current.service || matchedService?.name || '',
    }))
    setShowCallbackForm(true)
    transitionChatStage({ type: 'open_callback_form' })
  }

  const beginCallbackIntroduction = () => {
    setPendingAction('callback')
    setPendingPrompt(null)
    setShowCallbackForm(false)
    setCallbackNotice(null)
    openChatPanel(visitorProfile.nameResolved ? 'collecting_location' : 'collecting_name')
  }

  const beginDeferredIntroduction = (promptText: string) => {
    setPendingPrompt(promptText)
    setPendingAction(null)
    setShowCallbackForm(false)
    setCallbackNotice(null)
    openChatPanel(visitorProfile.nameResolved ? 'collecting_location' : 'collecting_name')
  }

  const closeCallbackForm = () => {
    setShowCallbackForm(false)
    transitionChatStage({ type: 'close_callback_form', hasMatchedService: Boolean(matchedService) })
  }

  const onWelcomeAction = (action: (typeof WELCOME_ACTIONS)[number], source: 'teaser' | 'welcome' = 'welcome') => {
    if (source === 'teaser') {
      trackChatbotEvent('teaser_clicked', {
        action: action.id,
      })
    } else {
      trackChatbotEvent('welcome_action_clicked', {
        action: action.id,
        intent: action.intent,
      })
    }

    const nextStage =
      action.intent === 'after_hours'
        ? 'after_hours'
        : action.intent === 'contact_hours'
          ? isOutsideBusinessHours
            ? 'after_hours'
            : 'contact_info'
          : action.intent === 'callback_offer'
            ? 'callback_offer'
            : 'exploring_services'

    openChatPanel(nextStage)

    if (source === 'teaser' && typeof window !== 'undefined') {
      window.sessionStorage.setItem(CHATBOT_TEASER_DISMISSED_KEY, 'true')
    }

    if (action.intent === 'callback_offer') {
      if (!introComplete) {
        beginCallbackIntroduction()
        return
      }
      openCallbackForm()
      return
    }

    if (!introComplete) {
      beginDeferredIntroduction(action.text)
      return
    }

    sendProfileAwareMessage(action.text)
  }

  const submitInput = () => {
    const text = input.trim()
    if (!text || isLoading) return false

    const callbackIntent = isCallbackRequest(text)

    if (callbackIntent) {
      if (!introComplete) {
        setInput('')
        beginCallbackIntroduction()
        return true
      }
      openCallbackForm()
    } else if (introComplete && isGreetingPrompt(text)) {
      setInput('')
      transitionChatStage({ type: 'queued_prompt_resolved', classifiedStage: null })
      pushInstantAssistantMessage(buildPersonalizedWelcome(visitorProfile.firstName))
      return true
    } else if (!introComplete) {
      setInput('')
      beginDeferredIntroduction(text)
      return true
    } else if (showCallbackForm) {
      setShowCallbackForm(false)
      setCallbackNotice(null)
      transitionChatStage({
        type: 'reset_after_callback_message',
        classifiedStage: classifyChatInputIntent(text, isOutsideBusinessHours),
      })
    }

    setInput('')
    sendProfileAwareMessage(text)
    return true
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    submitInput()
  }

  const sendProfileAwareMessage = (text: string, profileOverride?: ChatProfileContext) => {
    sendMessage(
      { text },
      {
        body: {
          visitorProfile: buildChatProfileContext(profileOverride ?? visitorProfile),
        },
      },
    )
  }

  const pushInstantAssistantMessage = (text: string) => {
    const id = `local-assistant-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

    setMessages((current) => [
      ...current,
      {
        id,
        parts: [{ type: 'text', text }],
        role: 'assistant',
      },
    ])
    setRevealedAssistantText((current) => ({
      ...current,
      [id]: text,
    }))
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
      location: callbackForm.location?.trim() || visitorProfile.cityState,
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

      trackChatbotEvent('callback_submitted', {
        service: payload.service || 'not_provided',
      })
      setCallbackNotice({
        text: 'Callback details sent to the Isoke team.',
        tone: 'success',
      })
      setShowCallbackForm(false)
      transitionChatStage({ type: 'callback_submitted' })
      setCallbackForm({
        bestTime: '',
        location: visitorProfile.cityState,
        name: '',
        phone: '',
        service: '',
      })
    } catch (error) {
      console.error(error)
      trackChatbotEvent('callback_failed')
      setCallbackNotice({
        text: `We could not send the callback request automatically. Please call ${ISOKE_CONTENT.contact.mainPhoneDisplay}.`,
        tone: 'error',
      })
    } finally {
      setCallbackSubmitting(false)
    }
  }

  const handleFlowAction = (action: ChatAction) => {
    if (action.kind === 'callback') {
      if (!introComplete) {
        beginCallbackIntroduction()
        return
      }
      openCallbackForm()
      return
    }

    if (action.kind === 'message') {
      if (!introComplete) {
        beginDeferredIntroduction(action.text)
        return
      }
      if (showCallbackForm && !isCallbackRequest(action.text)) {
        setShowCallbackForm(false)
        setCallbackNotice(null)
      }
      const nextStage = classifyChatInputIntent(action.text, isOutsideBusinessHours)
      if (nextStage) {
        transitionChatStage({ type: 'classified_input', stage: nextStage })
      } else if (showCallbackForm) {
        transitionChatStage({ type: 'queued_prompt_resolved', classifiedStage: null })
      }
      sendProfileAwareMessage(action.text)
    }
  }

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const value = profileDraft.trim()
    if (!value) return

    if (chatStage === 'collecting_name') {
      const locationAlreadyResolved = visitorProfile.locationResolved
      const firstName = value.split(/\s+/)[0] ?? value
      const nextProfile = {
        cityState: visitorProfile.cityState,
        firstName,
      }
      setVisitorProfile((current) => ({
        ...current,
        firstName,
        nameResolved: true,
      }))
      setCallbackForm((current) => ({
        ...current,
        name: current.name || value,
      }))
      trackChatbotEvent('profile_name_collected')
      if (pendingAction === 'callback' && locationAlreadyResolved) {
        openCallbackForm()
      } else if (pendingPrompt && locationAlreadyResolved) {
        const queuedPrompt = pendingPrompt
        setPendingPrompt(null)
        transitionChatStage({
          type: 'queued_prompt_resolved',
          classifiedStage: classifyChatInputIntent(queuedPrompt, isOutsideBusinessHours),
        })
        if (isGreetingPrompt(queuedPrompt)) {
          pushInstantAssistantMessage(buildPersonalizedWelcome(nextProfile.firstName))
        } else {
          sendProfileAwareMessage(queuedPrompt, nextProfile)
        }
      } else {
        transitionChatStage({
          type: 'profile_name_completed',
          hasLocationResolved: locationAlreadyResolved,
          hasPendingAction: pendingAction === 'callback',
          hasPendingPrompt: Boolean(pendingPrompt),
        })
      }
    } else if (chatStage === 'collecting_location') {
      const nameAlreadyResolved = visitorProfile.nameResolved
      const nextProfile = {
        cityState: value,
        firstName: visitorProfile.firstName,
      }
      setVisitorProfile((current) => ({
        ...current,
        cityState: value,
        locationResolved: true,
      }))
      setCallbackForm((current) => ({
        ...current,
        location: current.location || value,
      }))
      trackChatbotEvent('profile_location_collected')
      if (pendingAction === 'callback' && nameAlreadyResolved) {
        openCallbackForm()
      } else if (pendingPrompt && nameAlreadyResolved) {
        const queuedPrompt = pendingPrompt
        setPendingPrompt(null)
        transitionChatStage({
          type: 'queued_prompt_resolved',
          classifiedStage: classifyChatInputIntent(queuedPrompt, isOutsideBusinessHours),
        })
        if (isGreetingPrompt(queuedPrompt)) {
          pushInstantAssistantMessage(buildPersonalizedWelcome(nextProfile.firstName))
        } else {
          sendProfileAwareMessage(queuedPrompt, nextProfile)
        }
      } else {
        transitionChatStage({
          type: 'profile_location_completed',
          hasMatchedService: Boolean(matchedService),
          hasNameResolved: nameAlreadyResolved,
          hasPendingAction: pendingAction === 'callback',
          hasPendingPrompt: Boolean(pendingPrompt),
        })
      }
    }

    setProfileDraft('')
  }

  const skipProfilePrompt = () => {
    if (chatStage === 'collecting_name') {
      const locationAlreadyResolved = visitorProfile.locationResolved
      setVisitorProfile((current) => ({
        ...current,
        nameResolved: true,
      }))
      if (pendingAction === 'callback' && locationAlreadyResolved) {
        openCallbackForm()
      } else if (pendingPrompt && locationAlreadyResolved) {
        const queuedPrompt = pendingPrompt
        setPendingPrompt(null)
        transitionChatStage({
          type: 'queued_prompt_resolved',
          classifiedStage: classifyChatInputIntent(queuedPrompt, isOutsideBusinessHours),
        })
        if (isGreetingPrompt(queuedPrompt)) {
          pushInstantAssistantMessage(buildPersonalizedWelcome(visitorProfile.firstName))
        } else {
          sendProfileAwareMessage(queuedPrompt)
        }
      } else {
        transitionChatStage({
          type: 'profile_name_completed',
          hasLocationResolved: locationAlreadyResolved,
          hasPendingAction: pendingAction === 'callback',
          hasPendingPrompt: Boolean(pendingPrompt),
        })
      }
      return
    }

    if (chatStage === 'collecting_location') {
      const nameAlreadyResolved = visitorProfile.nameResolved
      setVisitorProfile((current) => ({
        ...current,
        locationResolved: true,
      }))
      if (pendingAction === 'callback' && nameAlreadyResolved) {
        openCallbackForm()
      } else if (pendingPrompt && nameAlreadyResolved) {
        const queuedPrompt = pendingPrompt
        setPendingPrompt(null)
        transitionChatStage({
          type: 'queued_prompt_resolved',
          classifiedStage: classifyChatInputIntent(queuedPrompt, isOutsideBusinessHours),
        })
        if (isGreetingPrompt(queuedPrompt)) {
          pushInstantAssistantMessage(buildPersonalizedWelcome(visitorProfile.firstName))
        } else {
          sendProfileAwareMessage(queuedPrompt)
        }
      } else {
        transitionChatStage({
          type: 'profile_location_completed',
          hasMatchedService: Boolean(matchedService),
          hasNameResolved: nameAlreadyResolved,
          hasPendingAction: pendingAction === 'callback',
          hasPendingPrompt: Boolean(pendingPrompt),
        })
      }
      return
    }
  }

  const profilePrompt =
    chatStage === 'collecting_name' && !visitorProfile.nameResolved
      ? {
          cta: 'Save first name',
          icon: UserRound,
          placeholder: 'First name',
          prompt:
            pendingAction === 'callback'
              ? 'Before I open the callback form, what should I call you?'
              : ISOKE_CONTENT.onboarding.namePrompt,
          secondary: 'Skip for now',
          title: pendingAction === 'callback' ? 'Before we start your callback request' : 'A quick introduction',
        }
      : chatStage === 'collecting_location' && !visitorProfile.locationResolved
        ? {
            cta: 'Save location',
            icon: MapPin,
            placeholder: 'City, State',
            prompt:
              pendingAction === 'callback'
                ? 'One more thing before the callback form: what city and state are you in?'
                : ISOKE_CONTENT.onboarding.locationPrompt,
            secondary: 'Skip for now',
            title: pendingAction === 'callback' ? 'A little routing context' : 'Optional routing context',
          }
        : null

  const profilePromptKey = profilePrompt?.placeholder ?? ''

  useEffect(() => {
    if (!profilePromptKey || showCallbackForm) return

    const timeoutId = window.setTimeout(() => {
      profilePromptRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      profileInputRef.current?.focus({ preventScroll: true })
    }, 80)

    return () => window.clearTimeout(timeoutId)
  }, [profilePromptKey, showCallbackForm])

  const handlePhoneCtaClick = (placement: string) => {
    trackChatbotEvent('phone_cta_clicked', { placement })
  }

  return (
    <>
      <ChatLauncher
        chatStage={chatStage}
        messagesLength={messages.length}
        onDismissTeaser={dismissTeaser}
        onOpen={openChatPanel}
        onWelcomeAction={onWelcomeAction}
        open={open}
        teaserVisible={teaserVisible}
        widgetTheme={widgetTheme}
      />

      <ChatPanel
        flowState={flowState}
        input={input}
        isLoading={isLoading}
        onClose={() => setOpen(false)}
        onComposerKeyDown={handleComposerKeyDown}
        onInputChange={setInput}
        onPhoneCtaClick={handlePhoneCtaClick}
        onSubmit={handleSubmit}
        open={open}
        textareaRef={textareaRef}
        widgetTheme={widgetTheme}
      >
        <MessageList
          banner={banner}
          flowState={flowState}
          getMessageText={messageText}
          isLoading={isLoading}
          messages={messages}
          onFlowAction={handleFlowAction}
          onPhoneCtaClick={handlePhoneCtaClick}
          onWelcomeAction={onWelcomeAction}
          revealedAssistantText={revealedAssistantText}
          widgetTheme={widgetTheme}
        />

        {showCallbackForm && (
          <CallbackForm
            callbackForm={callbackForm}
            callbackSubmitting={callbackSubmitting}
            onClose={closeCallbackForm}
            onFieldChange={handleCallbackFieldChange}
            onPhoneCtaClick={handlePhoneCtaClick}
            onSubmit={handleCallbackSubmit}
            widgetTheme={widgetTheme}
          />
        )}

        {callbackNotice && (
          <div
            style={{
              alignSelf: 'stretch',
              padding: '11px 14px',
              borderRadius: 16,
              background: callbackNotice.tone === 'success' ? 'rgba(52, 211, 153, 0.12)' : 'rgba(185, 28, 28, 0.1)',
              border:
                callbackNotice.tone === 'success'
                  ? '1px solid rgba(16,185,129,0.2)'
                  : '1px solid rgba(185, 28, 28, 0.16)',
              color: callbackNotice.tone === 'success' ? widgetTheme.text : '#fca5a5',
              fontSize: 12.5,
              lineHeight: 1.55,
              textAlign: 'center',
            }}
          >
            {callbackNotice.text}
          </div>
        )}

        {profilePrompt && !showCallbackForm && (
          <ProfilePrompt
            introLeadMessage={buildIntroLeadMessage({ pendingAction, pendingPrompt })}
            onDraftChange={setProfileDraft}
            onSkip={skipProfilePrompt}
            onSubmit={handleProfileSubmit}
            profileDraft={profileDraft}
            profileInputRef={profileInputRef}
            profilePrompt={profilePrompt}
            profilePromptRef={profilePromptRef}
            widgetTheme={widgetTheme}
          />
        )}

        <div ref={messagesEndRef} />
      </ChatPanel>
    </>
  )
}
