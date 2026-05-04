import { Resend } from 'resend'
import {
  API_LIMITS,
  buildJsonResponse,
  buildRateLimitResponse,
  checkRateLimit,
  getClientId,
  readJsonBody,
  validateContactPayload,
} from '../chatbot/api-guardrails.js'
import {
  buildContactEmailContent,
  buildContactEmailTags,
  resolveContactEmailConfig,
  type ContactPayload,
} from '../chatbot/contact-email-template.js'

/**
 * POST /api/contact
 * Body: { name: string, email: string, phone?: string, subject?: string, message: string }
 *
 * Delivery options:
 * - Resend email when RESEND_API_KEY and recipient/sender env vars are configured
 * - Optional blind copy when CONTACT_EMAIL_BCC or CALLBACK_EMAIL_BCC is set
 */

async function sendContactEmail(payload: ContactPayload) {
  const { apiKey, bcc, from, replyTo, to } = resolveContactEmailConfig(process.env)

  if (!apiKey || !to || !from) {
    return { ok: false as const, reason: 'email_not_configured' }
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

  return { ok: true as const }
}

export async function POST(req: Request) {
  try {
    const rateLimit = checkRateLimit({
      clientId: getClientId(req),
      limit: API_LIMITS.contactMaxRequests,
      route: 'contact',
    })
    if (!rateLimit.ok) return buildRateLimitResponse(rateLimit)

    const body = await readJsonBody(req, API_LIMITS.contactBodyBytes)
    if (body.error) return buildJsonResponse({ error: body.error }, body.status)

    const validation = validateContactPayload(body.data)
    if (validation.error) return buildJsonResponse({ error: validation.error }, 400)

    const payload: ContactPayload = validation.payload

    const emailResult = await sendContactEmail(payload)

    if (!emailResult.ok) {
      return buildJsonResponse({ error: 'Contact form email delivery is not configured.' }, 503)
    }

    return buildJsonResponse({ delivered: { email: true }, ok: true })
  } catch (e) {
    console.error(e)
    return buildJsonResponse(
      { error: 'Contact form submission could not be sent. Please call or email the team directly.' },
      500,
    )
  }
}
