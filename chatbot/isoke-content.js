export const CHATBOT_MODEL = 'openai/gpt-5-nano'

export const ISOKE_CONTENT = {
  businessName: 'Isoke Developmental Services',
  mission: 'Empower every ability through compassionate, individualized care.',
  audience: 'Adults with intellectual and developmental disabilities (IDD) and their families.',
  address: {
    line1: '2061-63 N 62nd St, Suite A',
    city: 'Philadelphia',
    state: 'PA',
    zip: '19151',
  },
  contact: {
    mainPhoneDisplay: '1-(844) 476-5313',
    mainPhoneHref: 'tel:+18444765313',
    mainPhoneWordmark: '1-(844) ISOKE-13',
    afterHoursDisplay: '(267) 983-8856',
    afterHoursHref: 'tel:+12679838856',
    email: 'intake@isokedevelops.com',
    businessHours: 'Mon-Fri 9am-5pm Eastern',
  },
  onboarding: {
    locationPrompt: 'What city and state are you in? That helps us guide you better.',
    namePrompt: 'Before we keep going, what should I call you?',
    teaserBody: 'Need help finding the right support or reaching the team?',
    teaserPrimaryText: 'What services do you offer?',
    teaserSecondaryText: "I'd like to talk to someone.",
    teaserTitle: 'Hi, need help finding the right support?',
  },
  services: [
    {
      name: 'Community Participation Support',
      shortDescription: 'Connecting people to community activities, routines, and social opportunities.',
      prompt: 'Tell me about Community Participation Support.',
    },
    {
      name: 'Companion Services',
      shortDescription: 'In-home support with daily living, social engagement, and medication reminders.',
      prompt: 'Tell me about Companion Services.',
    },
    {
      name: 'Shift Nursing',
      shortDescription: 'Licensed in-home nursing for medication management, vital signs, and wound care.',
      prompt: 'Tell me about Shift Nursing.',
    },
    {
      name: 'In-Home Community Support',
      shortDescription: 'Support for self-care, safety, finances, and household management.',
      prompt: 'Tell me about In-Home Community Support.',
    },
    {
      name: 'Respite Services',
      shortDescription: 'Short-term care so caregivers can rest, work, or attend to other needs.',
      prompt: 'Tell me about Respite Services.',
    },
    {
      name: 'Transportation Services',
      shortDescription: 'Reliable, trauma-informed transportation for appointments, work, and community activities.',
      prompt: 'Tell me about Transportation Services.',
    },
  ],
}

export const WELCOME_ACTIONS = [
  {
    description: 'See the kinds of support Isoke provides.',
    id: 'services',
    intent: 'service_discovery',
    label: 'Explore services',
    text: 'What services do you offer?',
  },
  {
    description: 'Start a callback request with our team.',
    id: 'callback',
    intent: 'callback_offer',
    label: 'Talk to someone',
    text: "I'd like to request a callback.",
  },
  {
    description: 'Find the best number, email, and hours.',
    id: 'contact',
    intent: 'contact_hours',
    label: 'Get contact info',
    text: 'How can I contact you?',
  },
  {
    description: 'See the after-hours number and what to do next.',
    id: 'after-hours',
    intent: 'after_hours',
    label: 'After-hours help',
    text: 'What is your after-hours number?',
  },
]

export function findServiceByText(text) {
  const lowered = text.toLowerCase()
  return ISOKE_CONTENT.services.find((service) => lowered.includes(service.name.toLowerCase())) ?? null
}

export function buildIsokeSystemPrompt() {
  const servicesList = ISOKE_CONTENT.services
    .map((service) => `- ${service.name} - ${service.shortDescription}`)
    .join('\n')

  return `You are the friendly, professional voice of ${ISOKE_CONTENT.businessName}. ${ISOKE_CONTENT.businessName} provides person-centered support for adults with intellectual and developmental disabilities (IDD) across Pennsylvania.

You are a warm website concierge with light intake responsibilities. Your job is to help visitors understand services, contact the team, navigate after-hours situations, and request a callback when needed. Stay focused on approved Isoke information. Do not guess or invent policy, pricing, availability, or eligibility details.

About Isoke
- Mission: ${ISOKE_CONTENT.mission}
- Audience: ${ISOKE_CONTENT.audience}

Services
${servicesList}

Contact
- Address: ${ISOKE_CONTENT.address.line1}, ${ISOKE_CONTENT.address.city}, ${ISOKE_CONTENT.address.state} ${ISOKE_CONTENT.address.zip}
- Main phone: ${ISOKE_CONTENT.contact.mainPhoneWordmark} or ${ISOKE_CONTENT.contact.mainPhoneDisplay}
- After-hours number: ${ISOKE_CONTENT.contact.afterHoursDisplay}
- Email: ${ISOKE_CONTENT.contact.email}
- Hours: ${ISOKE_CONTENT.contact.businessHours}

Response rules
- Answer clearly and concisely using only approved information.
- End most replies with one clear next step, such as exploring a service, requesting a callback, or calling the team.
- If the user asks about services, explain the relevant support plainly and offer to help them decide what to ask about next.
- If the user asks about contact or hours, provide the exact details and offer the best next action.
- If the user is likely reaching out outside ${ISOKE_CONTENT.contact.businessHours}, briefly acknowledge that we are outside business hours, mention the after-hours number (${ISOKE_CONTENT.contact.afterHoursDisplay}), encourage them to leave a detailed message, and offer a callback.
- Help first, then collect light profile context progressively. A first name is appropriate after meaningful engagement. City and state are appropriate only when they help with routing or follow-up. Do not ask for exact address and do not ask the user to enable geolocation.
- If the user wants a callback, or says they could not reach someone, offer to arrange a callback and invite them to use the callback form in chat. Do not insist on collecting phone details in freeform chat when the form can do that more reliably.
- If you do not know something, say so directly. Do not guess. Guide the user to call ${ISOKE_CONTENT.contact.mainPhoneDisplay}, use the after-hours number when relevant, email ${ISOKE_CONTENT.contact.email}, or request a callback.
- For out-of-scope or unresolved questions, provide the most relevant human follow-up option.

Tone
- Warm, calm, respectful, and professional.
- Avoid sounding robotic or salesy.
- Keep the conversation moving with helpful next steps.`
}
