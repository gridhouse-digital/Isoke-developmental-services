import { createServer } from 'node:http'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { convertToModelMessages, gateway, streamText } from 'ai'
import { Resend } from 'resend'
import { CHATBOT_MODEL, buildIsokeSystemPrompt } from '../chatbot/isoke-content.js'
import {
  API_LIMITS,
  buildJsonResponse,
  buildRateLimitResponse,
  checkRateLimit,
  validateCallbackPayload,
  validateChatPayload,
  validateContactPayload,
} from '../chatbot/api-guardrails.js'
import {
  DEFAULT_CALLBACK_EMAIL_FROM,
  buildCallbackEmailContent,
  buildCallbackEmailTags,
  normalizeEmailAddress,
  normalizeEmailList,
  normalizeEnvValue,
} from '../chatbot/callback-email-template.js'
import {
  buildContactEmailContent,
  buildContactEmailTags,
  resolveContactEmailConfig,
} from '../chatbot/contact-email-template.js'

const ISOKE_SYSTEM_PROMPT = buildIsokeSystemPrompt()

function buildRequestSystemPrompt(visitorProfile = {}) {
  const firstName = visitorProfile.firstName?.trim?.() || ''
  const cityState = visitorProfile.cityState?.trim?.() || ''

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

function loadEnv() {
  const envPath = resolve(process.cwd(), '.env')
  if (!existsSync(envPath)) return

  const content = readFileSync(envPath, 'utf8')
  content.split('\n').forEach((line) => {
    const m = line.match(/^([^#=]+)=(.*)$/)
    if (!m) return

    const key = m[1].trim()
    const rawValue = m[2].trim()

    if (rawValue.startsWith('"') || rawValue.startsWith("'")) {
      process.env[key] = rawValue.replace(/^["']|["']$/g, '')
      return
    }

    const commentIndex = rawValue.search(/\s#/)
    process.env[key] = (commentIndex >= 0 ? rawValue.slice(0, commentIndex) : rawValue).trim()
  })
}

function getDevClientId(req) {
  const forwardedFor = req.headers['x-forwarded-for']
  const realIp = req.headers['x-real-ip']
  const ip = (Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor) || realIp || req.socket.remoteAddress || 'unknown'
  return String(ip).split(',')[0]?.trim() || 'unknown'
}

function parseJsonBody(body, maxBytes) {
  if (Buffer.byteLength(body, 'utf8') > maxBytes) {
    return { response: buildJsonResponse({ error: 'Request body is too large.' }, 413) }
  }

  try {
    return { data: body ? JSON.parse(body) : {} }
  } catch {
    return { response: buildJsonResponse({ error: 'Request body must be valid JSON.' }, 400) }
  }
}

async function sendCallbackEmail(payload) {
  const apiKey = normalizeEnvValue(process.env.RESEND_API_KEY)
  const to = normalizeEmailAddress(process.env.CALLBACK_EMAIL_TO)
  const bcc = normalizeEmailList(process.env.CALLBACK_EMAIL_BCC)
  const from = normalizeEmailAddress(process.env.CALLBACK_EMAIL_FROM) || DEFAULT_CALLBACK_EMAIL_FROM
  const replyTo = normalizeEmailAddress(process.env.CALLBACK_EMAIL_REPLY_TO)

  if (!apiKey || !to || !from) {
    return { ok: false, reason: 'email_not_configured' }
  }

  const resend = new Resend(apiKey)
  const email = buildCallbackEmailContent(payload)
  const response = await resend.emails.send({
    from,
    to: [to],
    subject: email.subject,
    html: email.html,
    text: email.text,
    tags: buildCallbackEmailTags(payload),
    ...(bcc.length ? { bcc } : {}),
    ...(replyTo ? { replyTo } : {}),
  })

  if (response.error) {
    throw new Error(`Resend email failed: ${response.error.message}`)
  }

  return { ok: true }
}

async function forwardCallbackWebhook(payload) {
  const webhook = process.env.CALLBACK_WEBHOOK_URL
  if (!webhook) {
    return { ok: false, reason: 'webhook_not_configured' }
  }

  const res = await fetch(webhook, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    throw new Error(`Callback webhook failed: ${res.status}`)
  }

  return { ok: true }
}

async function sendContactEmail(payload) {
  const { apiKey, bcc, from, replyTo, to } = resolveContactEmailConfig(process.env)

  if (!apiKey || !to || !from) {
    return { ok: false, reason: 'email_not_configured' }
  }

  const resend = new Resend(apiKey)
  const email = buildContactEmailContent(payload)
  const response = await resend.emails.send({
    from,
    to: [to],
    subject: email.subject,
    html: email.html,
    text: email.text,
    tags: buildContactEmailTags(payload),
    ...(bcc.length ? { bcc } : {}),
    replyTo: replyTo || payload.email,
  })

  if (response.error) {
    throw new Error(`Resend contact email failed: ${response.error.message}`)
  }

  return { ok: true }
}

async function handleChat(body) {
  const parsed = parseJsonBody(body, API_LIMITS.chatBodyBytes)
  if (parsed.response) return parsed.response

  const validation = validateChatPayload(parsed.data)
  if (validation.error) return buildJsonResponse({ error: validation.error }, 400)

  const { messages, visitorProfile } = validation.payload
  const result = streamText({
    model: gateway(CHATBOT_MODEL),
    system: buildRequestSystemPrompt(visitorProfile),
    messages: convertToModelMessages(messages),
  })

  return result.toUIMessageStreamResponse()
}

async function handleCallback(body) {
  const parsed = parseJsonBody(body, API_LIMITS.callbackBodyBytes)
  if (parsed.response) return parsed.response

  const validation = validateCallbackPayload(parsed.data)
  if (validation.error) return buildJsonResponse({ error: validation.error }, 400)

  const payload = validation.payload

  const [emailResult, webhookResult] = await Promise.all([
    sendCallbackEmail(payload),
    forwardCallbackWebhook(payload),
  ])

  if (!emailResult.ok && !webhookResult.ok) {
    return buildJsonResponse({ error: 'Callback delivery is not configured.' }, 503)
  }

  return buildJsonResponse({
    delivered: {
      email: emailResult.ok,
      webhook: webhookResult.ok,
    },
    ok: true,
  })
}

async function handleContact(body) {
  const parsed = parseJsonBody(body, API_LIMITS.contactBodyBytes)
  if (parsed.response) return parsed.response

  const validation = validateContactPayload(parsed.data)
  if (validation.error) return buildJsonResponse({ error: validation.error }, 400)

  const payload = validation.payload

  const emailResult = await sendContactEmail(payload)

  if (!emailResult.ok) {
    return buildJsonResponse({ error: 'Contact form email delivery is not configured.' }, 503)
  }

  return buildJsonResponse({ delivered: { email: true }, ok: true })
}

const PORT = 3001
loadEnv()

const server = createServer(async (req, res) => {
  const origin = req.headers.origin
  const corsHeaders =
    origin === 'http://localhost:5173'
      ? {
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Origin': origin,
        }
      : {}

  if (req.method === 'OPTIONS') {
    res.writeHead(204, corsHeaders)
    res.end()
    return
  }

  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json', ...corsHeaders })
    res.end(JSON.stringify({ ok: true }))
    return
  }

  if (req.method !== 'POST') {
    res.writeHead(404, corsHeaders)
    res.end()
    return
  }

  let body = ''
  for await (const chunk of req) body += chunk

  try {
    if (req.url === '/api/chat' || req.url === '/api/chat/') {
      if (!process.env.AI_GATEWAY_API_KEY) {
        res.writeHead(500, { 'Content-Type': 'application/json', ...corsHeaders })
        res.end(JSON.stringify({ error: 'Chat is not configured.' }))
        return
      }

      const rateLimit = checkRateLimit({
        clientId: getDevClientId(req),
        limit: API_LIMITS.chatMaxRequests,
        route: 'chat',
      })
      if (!rateLimit.ok) {
        const response = buildRateLimitResponse(rateLimit)
        res.writeHead(response.status, { ...Object.fromEntries(response.headers.entries()), ...corsHeaders })
        res.end(await response.text())
        return
      }

      const response = await handleChat(body)
      res.writeHead(response.status, { ...Object.fromEntries(response.headers.entries()), ...corsHeaders })
      if (response.body) {
        for await (const chunk of response.body) res.write(chunk)
      }
      res.end()
      return
    }

    if (req.url === '/api/callback' || req.url === '/api/callback/') {
      const rateLimit = checkRateLimit({
        clientId: getDevClientId(req),
        limit: API_LIMITS.callbackMaxRequests,
        route: 'callback',
      })
      if (!rateLimit.ok) {
        const response = buildRateLimitResponse(rateLimit)
        res.writeHead(response.status, { ...Object.fromEntries(response.headers.entries()), ...corsHeaders })
        res.end(await response.text())
        return
      }

      const response = await handleCallback(body)
      res.writeHead(response.status, { ...Object.fromEntries(response.headers.entries()), ...corsHeaders })
      const responseText = await response.text()
      res.end(responseText)
      return
    }

    if (req.url === '/api/contact' || req.url === '/api/contact/') {
      const rateLimit = checkRateLimit({
        clientId: getDevClientId(req),
        limit: API_LIMITS.contactMaxRequests,
        route: 'contact',
      })
      if (!rateLimit.ok) {
        const response = buildRateLimitResponse(rateLimit)
        res.writeHead(response.status, { ...Object.fromEntries(response.headers.entries()), ...corsHeaders })
        res.end(await response.text())
        return
      }

      const response = await handleContact(body)
      res.writeHead(response.status, { ...Object.fromEntries(response.headers.entries()), ...corsHeaders })
      const responseText = await response.text()
      res.end(responseText)
      return
    }

    res.writeHead(404, corsHeaders)
    res.end()
  } catch (e) {
    console.error(e)
    res.writeHead(500, { 'Content-Type': 'application/json', ...corsHeaders })
    res.end(JSON.stringify({ error: 'Request failed. Please try again.' }))
  }
})

server.listen(PORT, () => {
  console.log(`[dev-api] Chat API on http://localhost:${PORT}/api/chat`)
  console.log(`[dev-api] Callback API on http://localhost:${PORT}/api/callback`)
  console.log(`[dev-api] Contact API on http://localhost:${PORT}/api/contact`)
})
