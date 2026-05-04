import { convertToModelMessages, gateway, streamText, type UIMessage } from 'ai'
import {
  API_LIMITS,
  buildJsonResponse,
  buildRateLimitResponse,
  checkRateLimit,
  getClientId,
  readJsonBody,
  validateChatPayload,
} from '../chatbot/api-guardrails.js'
import { CHATBOT_MODEL, buildIsokeSystemPrompt } from '../chatbot/isoke-content.js'

const ISOKE_SYSTEM_PROMPT = buildIsokeSystemPrompt()

function buildRequestSystemPrompt(visitorProfile?: { cityState?: string; firstName?: string }) {
  const firstName = visitorProfile?.firstName?.trim()
  const cityState = visitorProfile?.cityState?.trim()

  if (!firstName && !cityState) {
    return ISOKE_SYSTEM_PROMPT
  }

  return `${ISOKE_SYSTEM_PROMPT}

Known visitor context
- First name: ${firstName || 'Not provided'}
- City and state: ${cityState || 'Not provided'}

Personalization rule
- If a first name is available, use it naturally in the next assistant reply to make the conversation feel warm and personal.
- When the user greets you or resumes the conversation, start the reply with a natural greeting that includes the first name.
- Do not overuse the name in every sentence.
- If city and state are available, use them only when they help route or personalize the guidance.`
}

export const config = { runtime: 'edge' }

export async function POST(req: Request) {
  if (!process.env.AI_GATEWAY_API_KEY) {
    return buildJsonResponse({ error: 'Chat is not configured.' }, 500)
  }

  try {
    const rateLimit = checkRateLimit({
      clientId: getClientId(req),
      limit: API_LIMITS.chatMaxRequests,
      route: 'chat',
    })
    if (!rateLimit.ok) return buildRateLimitResponse(rateLimit)

    const body = await readJsonBody(req, API_LIMITS.chatBodyBytes)
    if (body.error) return buildJsonResponse({ error: body.error }, body.status)

    const validation = validateChatPayload(body.data)
    if (validation.error) return buildJsonResponse({ error: validation.error }, 400)

    const { messages, visitorProfile } = validation.payload
    const result = streamText({
      model: gateway(CHATBOT_MODEL),
      system: buildRequestSystemPrompt(visitorProfile),
      messages: convertToModelMessages(messages as UIMessage[]),
    })

    return result.toUIMessageStreamResponse()
  } catch (e) {
    console.error(e)
    return buildJsonResponse({ error: 'Chat failed. Please try again or call the team directly.' }, 500)
  }
}
