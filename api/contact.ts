import { Resend } from 'resend'
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
 */

async function sendContactEmail(payload: ContactPayload) {
  const { apiKey, from, replyTo, to } = resolveContactEmailConfig(process.env)

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
    replyTo: replyTo || payload.email,
  })

  if (response.error) {
    throw new Error(`Resend contact email failed: ${response.error.message}`)
  }

  return { ok: true as const }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      email?: string
      message?: string
      name?: string
      phone?: string
      subject?: string
    }

    const name = body.name?.trim() ?? ''
    const email = body.email?.trim() ?? ''
    const phone = body.phone?.trim() ?? ''
    const subject = body.subject?.trim() ?? ''
    const message = body.message?.trim() ?? ''

    if (!name || !email || !message) {
      return new Response(JSON.stringify({ error: 'name, email, and message are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const payload: ContactPayload = {
      at: new Date().toISOString(),
      email,
      message,
      name,
      phone,
      subject,
    }

    const emailResult = await sendContactEmail(payload)

    if (!emailResult.ok) {
      return new Response(JSON.stringify({ error: 'Contact form email delivery is not configured' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ delivered: { email: true }, ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (e) {
    console.error(e)
    const message = e instanceof Error ? e.message : 'Contact form submission failed'
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
