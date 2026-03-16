import { normalizeEmailAddress, normalizeEnvValue } from './callback-email-template.js'

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

  const html = `
    <div style="font-family: Arial, sans-serif; color: #1f2937; line-height: 1.6; background: #f5f0ec; padding: 24px;">
      <div style="max-width: 640px; margin: 0 auto; background: #ffffff; border: 1px solid #eadff5; border-radius: 22px; overflow: hidden; box-shadow: 0 16px 36px rgba(30,18,48,0.08);">
        <div style="padding: 24px; background: linear-gradient(135deg, #1e1230 0%, #7b5ea7 100%); color: #f5f0ec;">
          <div style="font-size: 11px; letter-spacing: 0.16em; text-transform: uppercase; opacity: 0.8; margin-bottom: 10px;">Isoke Website Lead</div>
          <h2 style="margin: 0; font-size: 24px; line-height: 1.2;">New contact form message</h2>
          <p style="margin: 10px 0 0; font-size: 14px; opacity: 0.88;">A visitor submitted the public contact form on the website.</p>
        </div>
        <div style="padding: 24px;">
          <table style="border-collapse: collapse; width: 100%;">
            <tr>
              <td style="padding: 10px 14px; border: 1px solid #ebe4f4; font-weight: 700; width: 34%; background: #faf7ff;">Name</td>
              <td style="padding: 10px 14px; border: 1px solid #ebe4f4;">${escapeHtml(payload.name)}</td>
            </tr>
            <tr>
              <td style="padding: 10px 14px; border: 1px solid #ebe4f4; font-weight: 700; background: #faf7ff;">Email</td>
              <td style="padding: 10px 14px; border: 1px solid #ebe4f4;">${escapeHtml(payload.email)}</td>
            </tr>
            <tr>
              <td style="padding: 10px 14px; border: 1px solid #ebe4f4; font-weight: 700; background: #faf7ff;">Phone</td>
              <td style="padding: 10px 14px; border: 1px solid #ebe4f4;">${escapeHtml(payload.phone || 'Not provided')}</td>
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
              <td style="padding: 10px 14px; border: 1px solid #ebe4f4;">${escapeHtml(payload.at)}</td>
            </tr>
          </table>
        </div>
      </div>
    </div>
  `.trim()

  const text = [
    'New contact form message from website',
    '',
    `Name: ${payload.name}`,
    `Email: ${payload.email}`,
    `Phone: ${payload.phone || 'Not provided'}`,
    `Subject: ${subjectLine}`,
    'Message:',
    payload.message,
    '',
    `Submitted at: ${payload.at}`,
  ].join('\n')

  return { html, subject, text }
}

export function resolveContactEmailConfig(env) {
  const apiKey = normalizeEnvValue(env.RESEND_API_KEY)
  const to = normalizeEmailAddress(env.CONTACT_EMAIL_TO) || normalizeEmailAddress(env.CALLBACK_EMAIL_TO)
  const from =
    normalizeEmailAddress(env.CONTACT_EMAIL_FROM) ||
    normalizeEmailAddress(env.CALLBACK_EMAIL_FROM) ||
    DEFAULT_CONTACT_EMAIL_FROM
  const replyTo =
    normalizeEmailAddress(env.CONTACT_EMAIL_REPLY_TO) ||
    normalizeEmailAddress(env.CALLBACK_EMAIL_REPLY_TO)

  return { apiKey, from, replyTo, to }
}
