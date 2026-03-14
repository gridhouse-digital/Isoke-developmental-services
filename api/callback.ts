import { Resend } from 'resend'

/**
 * POST /api/callback
 * Body: { name: string, phone: string, bestTime?: string, service?: string }
 *
 * Delivery options:
 * - Resend email when RESEND_API_KEY, CALLBACK_EMAIL_TO, and CALLBACK_EMAIL_FROM are set
 * - Optional webhook forwarding when CALLBACK_WEBHOOK_URL is set
 */

type CallbackPayload = {
  at: string
  bestTime: string
  name: string
  phone: string
  service: string
}

const DEFAULT_CALLBACK_EMAIL_FROM = 'intake@callback.isokedevelops.com'

function normalizeEnvValue(value: string | undefined) {
  return value?.replace(/\r?\n/g, '').trim() ?? ''
}

function normalizeEmailAddress(value: string | undefined) {
  return normalizeEnvValue(value).replace(/\s+/g, '')
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function formatCallbackEmailHtml(payload: CallbackPayload) {
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

function formatCallbackEmailText(payload: CallbackPayload) {
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

async function sendCallbackEmail(payload: CallbackPayload) {
  const apiKey = normalizeEnvValue(process.env.RESEND_API_KEY)
  const to = normalizeEmailAddress(process.env.CALLBACK_EMAIL_TO)
  const from = normalizeEmailAddress(process.env.CALLBACK_EMAIL_FROM) || DEFAULT_CALLBACK_EMAIL_FROM
  const replyTo = normalizeEmailAddress(process.env.CALLBACK_EMAIL_REPLY_TO)

  if (!apiKey || !to || !from) {
    return { ok: false as const, reason: 'email_not_configured' }
  }

  const resend = new Resend(apiKey)
  const response = await resend.emails.send({
    from,
    to: [to],
    subject: `New callback request from ${payload.name}`,
    html: formatCallbackEmailHtml(payload),
    text: formatCallbackEmailText(payload),
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
      name?: string
      phone?: string
      service?: string
    }

    const name = body.name?.trim() ?? ''
    const phone = body.phone?.trim() ?? ''
    const bestTime = body.bestTime?.trim() ?? ''
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
