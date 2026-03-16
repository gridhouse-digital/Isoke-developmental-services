import { Resend } from 'resend'
import {
  DEFAULT_CALLBACK_EMAIL_FROM,
  buildCallbackEmailContent,
  buildCallbackEmailTags,
  normalizeEmailAddress,
  normalizeEnvValue,
  type CallbackPayload,
} from '../chatbot/callback-email-template.js'

/**
 * POST /api/callback
 * Body: { name: string, phone: string, bestTime?: string, location?: string, service?: string }
 *
 * Delivery options:
 * - Resend email when RESEND_API_KEY, CALLBACK_EMAIL_TO, and CALLBACK_EMAIL_FROM are set
 * - Optional webhook forwarding when CALLBACK_WEBHOOK_URL is set
 */

async function sendCallbackEmail(payload: CallbackPayload) {
  const apiKey = normalizeEnvValue(process.env.RESEND_API_KEY)
  const to = normalizeEmailAddress(process.env.CALLBACK_EMAIL_TO)
  const from = normalizeEmailAddress(process.env.CALLBACK_EMAIL_FROM) || DEFAULT_CALLBACK_EMAIL_FROM
  const replyTo = normalizeEmailAddress(process.env.CALLBACK_EMAIL_REPLY_TO)

  if (!apiKey || !to || !from) {
    return { ok: false as const, reason: 'email_not_configured' }
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

  return { ok: true as const }
}

async function forwardCallbackWebhook(payload: CallbackPayload) {
  const webhook = process.env.CALLBACK_WEBHOOK_URL
  if (!webhook) {
    return { ok: false as const, reason: 'webhook_not_configured' }
  }

  const res = await fetch(webhook, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    throw new Error(`Callback webhook failed: ${res.status}`)
  }

  return { ok: true as const }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      bestTime?: string
      location?: string
      name?: string
      phone?: string
      service?: string
    }

    const name = body.name?.trim() ?? ''
    const phone = body.phone?.trim() ?? ''
    const bestTime = body.bestTime?.trim() ?? ''
    const location = body.location?.trim() ?? ''
    const service = body.service?.trim() ?? ''

    if (!name || !phone || !bestTime) {
      return new Response(JSON.stringify({ error: 'name, phone, and bestTime are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const payload: CallbackPayload = {
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
  } catch (e) {
    console.error(e)
    const message = e instanceof Error ? e.message : 'Callback failed'
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
