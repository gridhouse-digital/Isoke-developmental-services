import { Resend } from 'resend'
import {
  API_LIMITS,
  buildJsonResponse,
  buildRateLimitResponse,
  checkRateLimit,
  getClientId,
  readJsonBody,
  validateCallbackPayload,
} from '../chatbot/api-guardrails.js'
import {
  DEFAULT_CALLBACK_EMAIL_FROM,
  buildCallbackEmailContent,
  buildCallbackEmailTags,
  normalizeEmailAddress,
  normalizeEmailList,
  normalizeEnvValue,
  type CallbackPayload,
} from '../chatbot/callback-email-template.js'

/**
 * POST /api/callback
 * Body: { name: string, phone: string, bestTime?: string, location?: string, service?: string }
 *
 * Delivery options:
 * - Resend email when RESEND_API_KEY, CALLBACK_EMAIL_TO, and CALLBACK_EMAIL_FROM are set
 * - Optional blind copy when CALLBACK_EMAIL_BCC is set
 * - Optional webhook forwarding when CALLBACK_WEBHOOK_URL is set
 */

async function sendCallbackEmail(payload: CallbackPayload) {
  const apiKey = normalizeEnvValue(process.env.RESEND_API_KEY)
  const to = normalizeEmailAddress(process.env.CALLBACK_EMAIL_TO)
  const bcc = normalizeEmailList(process.env.CALLBACK_EMAIL_BCC)
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
    ...(bcc.length ? { bcc } : {}),
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
    const rateLimit = checkRateLimit({
      clientId: getClientId(req),
      limit: API_LIMITS.callbackMaxRequests,
      route: 'callback',
    })
    if (!rateLimit.ok) return buildRateLimitResponse(rateLimit)

    const body = await readJsonBody(req, API_LIMITS.callbackBodyBytes)
    if (body.error) return buildJsonResponse({ error: body.error }, body.status)

    const validation = validateCallbackPayload(body.data)
    if (validation.error) return buildJsonResponse({ error: validation.error }, 400)

    const payload: CallbackPayload = validation.payload

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
  } catch (e) {
    console.error(e)
    return buildJsonResponse(
      { error: 'Callback request could not be sent. Please call the team directly.' },
      500,
    )
  }
}
