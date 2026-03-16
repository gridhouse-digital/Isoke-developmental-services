import { createServer } from 'node:http'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { convertToModelMessages, gateway, streamText } from 'ai'
import { Resend } from 'resend'
import { CHATBOT_MODEL, buildIsokeSystemPrompt } from '../chatbot/isoke-content.js'
import {
  DEFAULT_CALLBACK_EMAIL_FROM,
  buildCallbackEmailContent,
  buildCallbackEmailTags,
  normalizeEmailAddress,
  normalizeEnvValue,
} from '../chatbot/callback-email-template.js'

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

async function sendCallbackEmail(payload) {
  const apiKey = normalizeEnvValue(process.env.RESEND_API_KEY)
  const to = normalizeEmailAddress(process.env.CALLBACK_EMAIL_TO)
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

async function handleChat(body) {
  const { messages = [], visitorProfile } = JSON.parse(body)
  const result = streamText({
    model: gateway(CHATBOT_MODEL),
    system: buildRequestSystemPrompt(visitorProfile),
    messages: convertToModelMessages(Array.isArray(messages) ? messages : []),
  })

  return result.toUIMessageStreamResponse()
}

async function handleCallback(body) {
  const parsed = JSON.parse(body)
  const name = parsed.name?.trim?.() ?? ''
  const phone = parsed.phone?.trim?.() ?? ''
  const bestTime = parsed.bestTime?.trim?.() ?? ''
  const location = parsed.location?.trim?.() ?? ''
  const service = parsed.service?.trim?.() ?? ''

  if (!name || !phone || !bestTime) {
    return new Response(JSON.stringify({ error: 'name, phone, and bestTime are required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const payload = {
    at: new Date().toISOString(),
    bestTime,
    location,
    name,
    phone,
    service,
  }

  const [emailResult, webhookResult] = await Promise.all([
    sendCallbackEmail(payload),
    forwardCallbackWebhook(payload),
  ])

  if (!emailResult.ok && !webhookResult.ok) {
    return new Response(JSON.stringify({ error: 'Callback delivery is not configured' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  return new Response(
    JSON.stringify({
      delivered: {
        email: emailResult.ok,
        webhook: webhookResult.ok,
      },
      ok: true,
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    },
  )
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
        res.end(JSON.stringify({ error: 'AI_GATEWAY_API_KEY not set' }))
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
      const response = await handleCallback(body)
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
    res.end(JSON.stringify({ error: e instanceof Error ? e.message : 'Request failed' }))
  }
})

server.listen(PORT, () => {
  console.log(`[dev-api] Chat API on http://localhost:${PORT}/api/chat`)
  console.log(`[dev-api] Callback API on http://localhost:${PORT}/api/callback`)
})
