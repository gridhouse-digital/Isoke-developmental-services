import { useEffect, useRef, useState } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { ArrowUpRight, ChevronRight, Clock3, LifeBuoy, MapPin, MessageCircle, PhoneCall, Sparkles, UserRound, X } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { ISOKE_CONTENT, WELCOME_ACTIONS, findServiceByText } from '../../chatbot/isoke-content.js'
import { trackChatbotEvent } from '../lib/chatbot/analytics'
import { deriveChatFlowState, type ChatAction, type ChatStage } from '../lib/chatbot/flow'

const OPEN_CHAT_EVENT = 'isoke-open-chat'
const ASSISTANT_REVEAL_MS = 20
const ASSISTANT_REVEAL_CHARS = 2
const CHATBOT_TEASER_DISMISSED_KEY = 'isoke-chatbot-teaser-dismissed'
const CALLBACK_API_URL =
  typeof window !== 'undefined' && window.location.hostname === 'localhost'
    ? 'http://localhost:3001/api/callback'
    : '/api/callback'

type CallbackDetails = {
  bestTime: string
  location?: string
  name: string
  phone: string
  service: string
}

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

type CallbackNotice = {
  tone: 'error' | 'success'
  text: string
}

type PendingAction = 'callback' | null

function messageText(parts: Array<{ text?: string; type: string }>): string {
  return (parts || [])
    .filter((part): part is { type: 'text'; text: string } => part.type === 'text' && typeof part.text === 'string')
    .map((part) => part.text)
    .join('')
}

function isCallbackRequest(text: string) {
  return /\b(callback|call\s*back|call me|call you|talk to someone)\b/i.test(text)
}

function isGreetingPrompt(text: string) {
  return /^(hi|hello|hey|good\s+(morning|afternoon|evening))(?:[.!?,\s]*)$/i.test(text.trim())
}

function isFallbackAssistantText(text: string) {
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

function classifyStageFromInput(text: string, isOutsideBusinessHours: boolean): ChatStage | null {
  const lowered = text.toLowerCase()

  if (isCallbackRequest(lowered)) return 'callback_offer'
  if (lowered.includes('after-hours') || lowered.includes('after hours')) return 'after_hours'
  if (lowered.includes('contact') || lowered.includes('hours') || lowered.includes('phone') || lowered.includes('email')) {
    return isOutsideBusinessHours ? 'after_hours' : 'contact_info'
  }
  if (findServiceByText(lowered)) return 'exploring_services'
  if (lowered.includes('service') || lowered.includes('support')) return 'exploring_services'

  return null
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

  useEffect(() => {
    const handler = () => {
      setOpen(true)
      setTeaserVisible(false)
      setChatStage((current) =>
        current === 'teaser_hidden' || current === 'teaser_visible' ? 'chat_open_welcome' : current,
      )
    }
    window.addEventListener(OPEN_CHAT_EVENT, handler)
    return () => window.removeEventListener(OPEN_CHAT_EVENT, handler)
  }, [])

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

  const matchedService = findServiceByText(messages.map((message) => messageText(message.parts)).join('\n'))
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
      setChatStage((current) => (current === 'teaser_hidden' ? 'teaser_visible' : current))
      trackChatbotEvent('teaser_shown')
    }, 1600)

    return () => window.clearTimeout(timeoutId)
  }, [open])

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
      const nextStage = classifyStageFromInput(lastText, isOutsideBusinessHours)
      if (nextStage) {
        setChatStage(nextStage)
      } else if (messages.length >= 2) {
        setChatStage((current) => (current === 'chat_open_welcome' ? 'collecting_name' : current))
      }
    }

    const assistantFallback = lastMessage.role === 'assistant' && isFallbackAssistantText(lastText)

    if (assistantFallback) {
      setChatStage((current) =>
        current === 'after_hours' || current === 'callback_form' || current === 'callback_offer' ? current : 'fallback',
      )
      return
    }

    if (!visitorProfile.nameResolved && messages.length >= 2 && !showCallbackForm) {
      setChatStage((current) =>
        current === 'callback_offer' || current === 'callback_form' ? current : 'collecting_name',
      )
    }

    if (visitorProfile.nameResolved && !visitorProfile.locationResolved && messages.length >= 2 && !showCallbackForm) {
      setChatStage((current) =>
        current === 'callback_offer' || current === 'callback_form' || current === 'after_hours'
          ? current
          : 'collecting_location',
      )
    }
  }, [isOutsideBusinessHours, messages, showCallbackForm, visitorProfile.locationResolved, visitorProfile.nameResolved])

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
    setChatStage(stage)
  }

  const dismissTeaser = () => {
    setTeaserVisible(false)
    setChatStage((current) => (current === 'teaser_visible' ? 'teaser_hidden' : current))
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
    setChatStage('callback_form')
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
    setChatStage(matchedService ? 'exploring_services' : 'resolved')
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
      setChatStage('resolved')
      pushInstantAssistantMessage(buildPersonalizedWelcome(visitorProfile.firstName))
      return true
    } else if (!introComplete) {
      setInput('')
      beginDeferredIntroduction(text)
      return true
    } else if (showCallbackForm) {
      setShowCallbackForm(false)
      setCallbackNotice(null)
      setChatStage(classifyStageFromInput(text, isOutsideBusinessHours) ?? 'resolved')
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
      setChatStage('resolved')
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
      const nextStage = classifyStageFromInput(action.text, isOutsideBusinessHours)
      if (nextStage) {
        setChatStage(nextStage)
      } else if (showCallbackForm) {
        setChatStage('resolved')
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
        setChatStage(classifyStageFromInput(queuedPrompt, isOutsideBusinessHours) ?? 'resolved')
        if (isGreetingPrompt(queuedPrompt)) {
          pushInstantAssistantMessage(buildPersonalizedWelcome(nextProfile.firstName))
        } else {
          sendProfileAwareMessage(queuedPrompt, nextProfile)
        }
      } else {
        setChatStage('collecting_location')
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
        setChatStage(classifyStageFromInput(queuedPrompt, isOutsideBusinessHours) ?? 'resolved')
        if (isGreetingPrompt(queuedPrompt)) {
          pushInstantAssistantMessage(buildPersonalizedWelcome(nextProfile.firstName))
        } else {
          sendProfileAwareMessage(queuedPrompt, nextProfile)
        }
      } else {
        setChatStage(matchedService ? 'exploring_services' : 'resolved')
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
        setChatStage(classifyStageFromInput(queuedPrompt, isOutsideBusinessHours) ?? 'resolved')
        if (isGreetingPrompt(queuedPrompt)) {
          pushInstantAssistantMessage(buildPersonalizedWelcome(visitorProfile.firstName))
        } else {
          sendProfileAwareMessage(queuedPrompt)
        }
      } else {
        setChatStage('collecting_location')
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
        setChatStage(classifyStageFromInput(queuedPrompt, isOutsideBusinessHours) ?? 'resolved')
        if (isGreetingPrompt(queuedPrompt)) {
          pushInstantAssistantMessage(buildPersonalizedWelcome(visitorProfile.firstName))
        } else {
          sendProfileAwareMessage(queuedPrompt)
        }
      } else {
        setChatStage(matchedService ? 'exploring_services' : 'resolved')
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
              onClick={dismissTeaser}
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
        onClick={() => openChatPanel(messages.length > 0 ? chatStage : 'chat_open_welcome')}
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
                  onClick={() => setOpen(false)}
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
                  onClick={() => trackChatbotEvent('phone_cta_clicked', { placement: 'header' })}
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
                          <div style={{ fontSize: 12, lineHeight: 1.42, color: 'var(--muted)' }}>
                            {action.description}
                          </div>
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
                      {isAssistant ? revealedAssistantText[message.id] ?? '' : messageText(message.parts)}
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
                        onClick={() => trackChatbotEvent('phone_cta_clicked', { placement: action.id })}
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
                        onClick={() => handleFlowAction(action)}
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

              {showCallbackForm && (
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
                      onClick={closeCallbackForm}
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

                  <form onSubmit={handleCallbackSubmit} style={{ display: 'grid', gap: 10 }}>
                    <input
                      type="text"
                      value={callbackForm.name}
                      onChange={(e) => handleCallbackFieldChange('name', e.target.value)}
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
                      onChange={(e) => handleCallbackFieldChange('phone', e.target.value)}
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
                      onChange={(e) => handleCallbackFieldChange('location', e.target.value)}
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
                      onChange={(e) => handleCallbackFieldChange('bestTime', e.target.value)}
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
                      onChange={(e) => handleCallbackFieldChange('service', e.target.value)}
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
                        onClick={() => trackChatbotEvent('phone_cta_clicked', { placement: 'callback_form' })}
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
              )}

              {callbackNotice && (
                <div
                  style={{
                    alignSelf: 'stretch',
                    padding: '11px 14px',
                    borderRadius: 16,
                    background:
                      callbackNotice.tone === 'success'
                        ? 'rgba(52, 211, 153, 0.12)'
                        : 'rgba(185, 28, 28, 0.1)',
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
                      {buildIntroLeadMessage({ pendingAction, pendingPrompt })}
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

                    <form onSubmit={handleProfileSubmit} style={{ display: 'grid', gap: 10 }}>
                      <input
                        ref={profileInputRef}
                        type="text"
                        value={profileDraft}
                        onChange={(e) => setProfileDraft(e.target.value)}
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
                          onClick={skipProfilePrompt}
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
              )}

              <div ref={messagesEndRef} />
            </div>

            <div
              style={{
                padding: '14px 14px 16px',
                borderTop: `1px solid ${widgetTheme.footerBorder}`,
                background: widgetTheme.footerBg,
                backdropFilter: 'blur(16px)',
              }}
            >
              <form id="chat-form" onSubmit={handleSubmit} style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleComposerKeyDown}
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
                  onClick={() => trackChatbotEvent('phone_cta_clicked', { placement: 'footer' })}
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
    </>
  )
}
