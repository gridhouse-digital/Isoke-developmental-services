import { normalizeEmailAddress, normalizeEmailList, normalizeEnvValue } from './callback-email-template.js'

export const DEFAULT_CONTACT_EMAIL_FROM = 'intake@callback.isokedevelops.com'

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function sanitizeTagValue(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 256) || 'not_provided'
}

function formatSubmittedAt(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return `${new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    hour: 'numeric',
    hour12: true,
    minute: '2-digit',
    month: 'short',
    timeZone: 'America/New_York',
    year: 'numeric',
  }).format(date)} ET`
}

function buildPhoneHref(value) {
  return `tel:${value.replace(/[^\d+]/g, '')}`
}

function buildMailtoHref(value) {
  return `mailto:${normalizeEmailAddress(value)}`
}

export function buildContactEmailTags(payload) {
  return [
    { name: 'type', value: 'contact_form_submission' },
    { name: 'client', value: 'isoke' },
    { name: 'source', value: 'website_contact_form' },
    { name: 'subject', value: sanitizeTagValue(payload.subject || 'general_inquiry') },
  ]
}

export function buildContactEmailContent(payload) {
  const subjectLine = payload.subject || 'General inquiry'
  const subject = `New contact form message from ${payload.name}`
  const phone = payload.phone || 'Not provided'
  const submittedAt = formatSubmittedAt(payload.at)
  const replyHref = buildMailtoHref(payload.email)
  const phoneHref = payload.phone ? buildPhoneHref(payload.phone) : ''
  const preheader = `Website message from ${payload.name}. Subject: ${subjectLine}. Reply to ${payload.email}.`

  const html = `
    <div style="font-family: Arial, sans-serif; color: #1f2937; line-height: 1.6; background: #f5f0ec; padding: 24px; color-scheme: light; supported-color-schemes: light;">
      <div style="display: none; max-height: 0; overflow: hidden; opacity: 0; color: transparent;">${escapeHtml(preheader)}</div>
      <div style="max-width: 640px; margin: 0 auto; background: #ffffff; border: 1px solid #eadff5; border-radius: 22px; overflow: hidden; box-shadow: 0 16px 36px rgba(30,18,48,0.08);">
        <div style="padding: 24px; background: linear-gradient(135deg, #1e1230 0%, #7b5ea7 100%); color: #f5f0ec;">
          <div style="font-size: 11px; letter-spacing: 0.16em; text-transform: uppercase; opacity: 0.8; margin-bottom: 10px;">Isoke Website Lead</div>
          <h2 style="margin: 0; font-size: 24px; line-height: 1.2;">New contact form message</h2>
          <p style="margin: 10px 0 0; font-size: 14px; opacity: 0.88;">A visitor submitted the public contact form on the website.</p>
        </div>
        <div style="padding: 24px;">
          <div style="padding: 18px; border: 1px solid #d9c8f4; border-radius: 16px; background: #fbf8ff; margin-bottom: 18px;">
            <div style="font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; color: #7b5ea7; font-weight: 700; margin-bottom: 8px;">Lead triage</div>
            <div style="font-size: 18px; line-height: 1.35; font-weight: 700; color: #1e1230; margin-bottom: 8px;">Reply to ${escapeHtml(payload.name)}</div>
            <div style="font-size: 14px; color: #4b5563; margin-bottom: 14px;">Source: website contact form &middot; Subject: ${escapeHtml(subjectLine)} &middot; Phone: ${escapeHtml(phone)}</div>
            <a href="${escapeHtml(replyHref)}" style="display: inline-block; padding: 11px 16px; border-radius: 999px; background: #7b5ea7; color: #ffffff; font-size: 14px; font-weight: 700; text-decoration: none;">Reply to visitor</a>
            ${
              phoneHref
                ? `<a href="${escapeHtml(phoneHref)}" style="display: inline-block; margin-left: 8px; padding: 11px 16px; border-radius: 999px; background: #ffffff; border: 1px solid #d9c8f4; color: #7b5ea7; font-size: 14px; font-weight: 700; text-decoration: none;">Call visitor</a>`
                : ''
            }
            <div style="font-size: 12px; color: #6b7280; margin-top: 12px;">Use reply-to or the visitor email below when responding. The sender address is automated.</div>
          </div>
          <table style="border-collapse: collapse; width: 100%;">
            <tr>
              <td style="padding: 10px 14px; border: 1px solid #ebe4f4; font-weight: 700; width: 34%; background: #faf7ff;">Name</td>
              <td style="padding: 10px 14px; border: 1px solid #ebe4f4;">${escapeHtml(payload.name)}</td>
            </tr>
            <tr>
              <td style="padding: 10px 14px; border: 1px solid #ebe4f4; font-weight: 700; background: #faf7ff;">Email</td>
              <td style="padding: 10px 14px; border: 1px solid #ebe4f4;"><a href="${escapeHtml(replyHref)}" style="color: #7b5ea7; font-weight: 700; text-decoration: none;">${escapeHtml(payload.email)}</a></td>
            </tr>
            <tr>
              <td style="padding: 10px 14px; border: 1px solid #ebe4f4; font-weight: 700; background: #faf7ff;">Phone</td>
              <td style="padding: 10px 14px; border: 1px solid #ebe4f4;">${
                phoneHref
                  ? `<a href="${escapeHtml(phoneHref)}" style="color: #7b5ea7; font-weight: 700; text-decoration: none;">${escapeHtml(phone)}</a>`
                  : escapeHtml(phone)
              }</td>
            </tr>
            <tr>
              <td style="padding: 10px 14px; border: 1px solid #ebe4f4; font-weight: 700; background: #faf7ff;">Subject</td>
              <td style="padding: 10px 14px; border: 1px solid #ebe4f4;">${escapeHtml(subjectLine)}</td>
            </tr>
            <tr>
              <td style="padding: 10px 14px; border: 1px solid #ebe4f4; font-weight: 700; background: #faf7ff; vertical-align: top;">Message</td>
              <td style="padding: 10px 14px; border: 1px solid #ebe4f4; white-space: pre-wrap;">${escapeHtml(payload.message)}</td>
            </tr>
            <tr>
              <td style="padding: 10px 14px; border: 1px solid #ebe4f4; font-weight: 700; background: #faf7ff;">Submitted at</td>
              <td style="padding: 10px 14px; border: 1px solid #ebe4f4;">${escapeHtml(submittedAt)}</td>
            </tr>
          </table>
          <p style="margin: 16px 0 0; color: #6b7280; font-size: 12px; line-height: 1.5;">This message was generated from the Isoke website contact form. Use the visitor email or phone number above for follow-up.</p>
        </div>
      </div>
    </div>
  `.trim()

  const text = [
    'New contact form message from website',
    '',
    `Action: Reply to visitor at ${payload.email}`,
    `Name: ${payload.name}`,
    `Email: ${payload.email}`,
    `Phone: ${phone}`,
    `Subject: ${subjectLine}`,
    'Message:',
    payload.message,
    '',
    `Submitted at: ${submittedAt}`,
    `Submitted ISO: ${payload.at}`,
  ].join('\n')

  return { html, subject, text }
}

export function resolveContactEmailConfig(env) {
  const apiKey = normalizeEnvValue(env.RESEND_API_KEY)
  const to = normalizeEmailAddress(env.CONTACT_EMAIL_TO) || normalizeEmailAddress(env.CALLBACK_EMAIL_TO)
  const contactBcc = normalizeEmailList(env.CONTACT_EMAIL_BCC)
  const bcc = contactBcc.length ? contactBcc : normalizeEmailList(env.CALLBACK_EMAIL_BCC)
  const from =
    normalizeEmailAddress(env.CONTACT_EMAIL_FROM) ||
    normalizeEmailAddress(env.CALLBACK_EMAIL_FROM) ||
    DEFAULT_CONTACT_EMAIL_FROM
  const replyTo =
    normalizeEmailAddress(env.CONTACT_EMAIL_REPLY_TO) ||
    normalizeEmailAddress(env.CALLBACK_EMAIL_REPLY_TO)

  return { apiKey, bcc, from, replyTo, to }
}
