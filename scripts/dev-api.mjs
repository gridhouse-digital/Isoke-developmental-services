import { createServer } from 'node:http'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { convertToModelMessages, gateway, streamText } from 'ai'

const ISOKE_SYSTEM_PROMPT = `You are the friendly, professional voice of Isoke Developmental Services. Isoke provides person-centered support for adults with intellectual and developmental disabilities (IDD) across Pennsylvania.

**About Isoke**
- Mission: Empower every ability through compassionate, individualized care.
- We serve adults with IDD and their families.

**Services we offer**
- Community Participation Support - connecting people to community activities and social opportunities
- Companion Services - in-home daily living support, medication reminders, social engagement
- Shift Nursing - licensed in-home nursing (medication management, vital signs, wound care)
- In-Home Community Support - skills for independent living (self-care, safety, finances, household management)
- Respite Services - short-term care so caregivers can take a break
- Transportation Services - reliable, trauma-informed transport for appointments, work, and community

**Contact**
- Address: 2061-63 N 62nd St, Suite A, Philadelphia, PA 19151
- Main phone: 1-(844) ISOKE-13 or 1-(844) 476-5313
- After-hours number: (267) 983-8856
- Email: intake@isokedevelops.com
- Hours: Mon-Fri 9am-5pm Eastern

**Off-hours**
If the user is likely contacting outside Mon-Fri 9am-5pm Eastern, briefly acknowledge we are currently outside business hours and that we will respond next business day. Explicitly mention the after-hours number ((267) 983-8856) and encourage them to leave a detailed message. After answering their question, ask if they would like a callback. Never say that Isoke does not have an after-hours number.

**Request a callback**
If the user wants a callback, or mentions that they tried calling and did not get a response, proactively offer to arrange a callback. Ask for: (1) name, (2) phone number, (3) best time to call, and optionally (4) service of interest. Do not confirm the callback request until you have at least name, phone number, and best time to call. If any of those are missing, ask only for the missing item. Once you have name, phone number, and best time, confirm: "We'll have someone call you at [phone] around [best time]. Is there a service you'd like us to focus on?" Do not make up a confirmation number. If they share callback details in one message, collect what is missing and confirm.

**Tone**
Warm, clear, professional. If you do not know something, direct them to call 1-(844) 476-5313, use the after-hours number (267) 983-8856 when relevant, or email intake@isokedevelops.com. Keep answers concise but helpful.`

const RESEND_API_URL = 'https://api.resend.com/emails'
const DEFAULT_CALLBACK_EMAIL_FROM = 'intake@callback.isokedevelops.com'

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

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function normalizeEnvValue(value) {
  return value?.replace(/\r?\n/g, '').trim() ?? ''
}

function normalizeEmailAddress(value) {
  return normalizeEnvValue(value).replace(/\s+/g, '')
}

function formatCallbackEmailHtml(payload) {
  return `
    <div style="font-family: Arial, sans-serif; color: #1f2937; line-height: 1.6;">
      <h2 style="margin: 0 0 16px;">New callback request from website chat</h2>
      <p style="margin: 0 0 16px;">A visitor requested a callback through the Isoke chatbot.</p>
      <table style="border-collapse: collapse; width: 100%; max-width: 560px;">
        <tr>
          <td style="padding: 8px 12px; border: 1px solid #e5e7eb; font-weight: 600;">Name</td>
          <td style="padding: 8px 12px; border: 1px solid #e5e7eb;">${escapeHtml(payload.name)}</td>
        </tr>
        <tr>
          <td style="padding: 8px 12px; border: 1px solid #e5e7eb; font-weight: 600;">Phone</td>
          <td style="padding: 8px 12px; border: 1px solid #e5e7eb;">${escapeHtml(payload.phone)}</td>
        </tr>
        <tr>
          <td style="padding: 8px 12px; border: 1px solid #e5e7eb; font-weight: 600;">Best time</td>
          <td style="padding: 8px 12px; border: 1px solid #e5e7eb;">${escapeHtml(payload.bestTime || 'Not provided')}</td>
        </tr>
        <tr>
          <td style="padding: 8px 12px; border: 1px solid #e5e7eb; font-weight: 600;">Service</td>
          <td style="padding: 8px 12px; border: 1px solid #e5e7eb;">${escapeHtml(payload.service || 'Not provided')}</td>
        </tr>
        <tr>
          <td style="padding: 8px 12px; border: 1px solid #e5e7eb; font-weight: 600;">Submitted at</td>
          <td style="padding: 8px 12px; border: 1px solid #e5e7eb;">${escapeHtml(payload.at)}</td>
        </tr>
      </table>
    </div>
  `.trim()
}

function formatCallbackEmailText(payload) {
  return [
    'New callback request from website chat',
    '',
    `Name: ${payload.name}`,
    `Phone: ${payload.phone}`,
    `Best time: ${payload.bestTime || 'Not provided'}`,
    `Service: ${payload.service || 'Not provided'}`,
    `Submitted at: ${payload.at}`,
  ].join('\n')
}

async function sendCallbackEmail(payload) {
  const apiKey = normalizeEnvValue(process.env.RESEND_API_KEY)
  const to = normalizeEmailAddress(process.env.CALLBACK_EMAIL_TO)
  const from = normalizeEmailAddress(process.env.CALLBACK_EMAIL_FROM) || DEFAULT_CALLBACK_EMAIL_FROM
  const replyTo = normalizeEmailAddress(process.env.CALLBACK_EMAIL_REPLY_TO)

  if (!apiKey || !to || !from) {
    return { ok: false, reason: 'email_not_configured' }
  }

  const idempotencyKey = `callback-${payload.phone.replace(/\D/g, '')}-${payload.bestTime
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')}`

  const res = await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': idempotencyKey,
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: `New callback request from ${payload.name}`,
      html: formatCallbackEmailHtml(payload),
      text: formatCallbackEmailText(payload),
      ...(replyTo ? { reply_to: replyTo } : {}),
    }),
  })

  if (!res.ok) {
    const errorBody = await res.text()
    throw new Error(`Resend email failed: ${res.status} ${errorBody}`)
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
  const { messages } = JSON.parse(body)
  const result = streamText({
    model: gateway('openai/gpt-4o-mini'),
    system: ISOKE_SYSTEM_PROMPT,
    messages: convertToModelMessages(messages),
  })

  return result.toUIMessageStreamResponse()
}

async function handleCallback(body) {
  const parsed = JSON.parse(body)
  const name = parsed.name?.trim?.() ?? ''
  const phone = parsed.phone?.trim?.() ?? ''
  const bestTime = parsed.bestTime?.trim?.() ?? ''
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
