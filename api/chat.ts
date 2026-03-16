import { convertToModelMessages, gateway, streamText, type UIMessage } from 'ai'
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
    return new Response(JSON.stringify({ error: 'AI_GATEWAY_API_KEY not set' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const { messages = [], visitorProfile } = (await req.json()) as {
      messages?: UIMessage[]
      visitorProfile?: { cityState?: string; firstName?: string }
    }
    const result = streamText({
      model: gateway(CHATBOT_MODEL),
      system: buildRequestSystemPrompt(visitorProfile),
      messages: convertToModelMessages(Array.isArray(messages) ? messages : []),
    })

    return result.toUIMessageStreamResponse()
  } catch (e) {
    console.error(e)
    return new Response(JSON.stringify({ error: 'Chat failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
