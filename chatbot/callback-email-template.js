export const DEFAULT_CALLBACK_EMAIL_FROM = 'intake@callback.isokedevelops.com'

export function normalizeEnvValue(value) {
  return value?.replace(/\r?\n/g, '').trim() ?? ''
}

export function normalizeEmailAddress(value) {
  return normalizeEnvValue(value).replace(/\s+/g, '')
}

export function normalizeEmailList(value) {
  return normalizeEnvValue(value)
    .split(',')
    .map((email) => normalizeEmailAddress(email))
    .filter(Boolean)
}

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

export function buildCallbackEmailTags(payload) {
  return [
    { name: 'type', value: 'callback_request' },
    { name: 'client', value: 'isoke' },
    { name: 'source', value: 'chatbot' },
    { name: 'location', value: sanitizeTagValue(payload.location || 'not_provided') },
    { name: 'service', value: sanitizeTagValue(payload.service || 'not_provided') },
  ]
}

export function buildCallbackEmailContent(payload) {
  const subject = `New callback request from ${payload.name}`
  const service = payload.service || 'Not provided'
  const location = payload.location || 'Not provided'
  const bestTime = payload.bestTime || 'Not provided'
  const submittedAt = formatSubmittedAt(payload.at)
  const phoneHref = buildPhoneHref(payload.phone)
  const preheader = `Callback requested by ${payload.name}. Best time: ${bestTime}. Service: ${service}.`

  const html = `
    <div style="font-family: Arial, sans-serif; color: #1f2937; line-height: 1.6; background: #f5f0ec; padding: 24px; color-scheme: light; supported-color-schemes: light;">
      <div style="display: none; max-height: 0; overflow: hidden; opacity: 0; color: transparent;">${escapeHtml(preheader)}</div>
      <div style="max-width: 640px; margin: 0 auto; background: #ffffff; border: 1px solid #eadff5; border-radius: 22px; overflow: hidden; box-shadow: 0 16px 36px rgba(30,18,48,0.08);">
        <div style="padding: 24px; background: linear-gradient(135deg, #1e1230 0%, #7b5ea7 100%); color: #f5f0ec;">
          <div style="font-size: 11px; letter-spacing: 0.16em; text-transform: uppercase; opacity: 0.8; margin-bottom: 10px;">Isoke Chatbot Lead</div>
          <h2 style="margin: 0; font-size: 24px; line-height: 1.2;">New callback request</h2>
          <p style="margin: 10px 0 0; font-size: 14px; opacity: 0.88;">A visitor requested a follow-up through the website chatbot.</p>
        </div>
        <div style="padding: 24px;">
          <div style="padding: 18px; border: 1px solid #d9c8f4; border-radius: 16px; background: #fbf8ff; margin-bottom: 18px;">
            <div style="font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; color: #7b5ea7; font-weight: 700; margin-bottom: 8px;">Action needed</div>
            <div style="font-size: 18px; line-height: 1.35; font-weight: 700; color: #1e1230; margin-bottom: 8px;">Call ${escapeHtml(payload.name)} back</div>
            <div style="font-size: 14px; color: #4b5563; margin-bottom: 14px;">Best time: ${escapeHtml(bestTime)}${service !== 'Not provided' ? ` &middot; Service: ${escapeHtml(service)}` : ''}</div>
            <a href="${escapeHtml(phoneHref)}" style="display: inline-block; padding: 11px 16px; border-radius: 999px; background: #7b5ea7; color: #ffffff; font-size: 14px; font-weight: 700; text-decoration: none;">Call visitor</a>
          </div>
          <table style="border-collapse: collapse; width: 100%;">
            <tr>
              <td style="padding: 10px 14px; border: 1px solid #ebe4f4; font-weight: 700; width: 34%; background: #faf7ff;">Name</td>
              <td style="padding: 10px 14px; border: 1px solid #ebe4f4;">${escapeHtml(payload.name)}</td>
            </tr>
            <tr>
              <td style="padding: 10px 14px; border: 1px solid #ebe4f4; font-weight: 700; background: #faf7ff;">Phone</td>
              <td style="padding: 10px 14px; border: 1px solid #ebe4f4;"><a href="${escapeHtml(phoneHref)}" style="color: #7b5ea7; font-weight: 700; text-decoration: none;">${escapeHtml(payload.phone)}</a></td>
            </tr>
            <tr>
              <td style="padding: 10px 14px; border: 1px solid #ebe4f4; font-weight: 700; background: #faf7ff;">Best time</td>
              <td style="padding: 10px 14px; border: 1px solid #ebe4f4;">${escapeHtml(bestTime)}</td>
            </tr>
            <tr>
              <td style="padding: 10px 14px; border: 1px solid #ebe4f4; font-weight: 700; background: #faf7ff;">Location</td>
              <td style="padding: 10px 14px; border: 1px solid #ebe4f4;">${escapeHtml(location)}</td>
            </tr>
            <tr>
              <td style="padding: 10px 14px; border: 1px solid #ebe4f4; font-weight: 700; background: #faf7ff;">Service</td>
              <td style="padding: 10px 14px; border: 1px solid #ebe4f4;">${escapeHtml(service)}</td>
            </tr>
            <tr>
              <td style="padding: 10px 14px; border: 1px solid #ebe4f4; font-weight: 700; background: #faf7ff;">Submitted at</td>
              <td style="padding: 10px 14px; border: 1px solid #ebe4f4;">${escapeHtml(submittedAt)}</td>
            </tr>
          </table>
          <p style="margin: 16px 0 0; color: #6b7280; font-size: 12px; line-height: 1.5;">This message was generated from the Isoke website chatbot. Use the visitor phone number above for follow-up.</p>
        </div>
      </div>
    </div>
  `.trim()

  const text = [
    'New callback request from website chat',
    '',
    `Action: Call visitor at ${payload.phone}`,
    `Name: ${payload.name}`,
    `Phone: ${payload.phone}`,
    `Best time: ${bestTime}`,
    `Location: ${location}`,
    `Service: ${service}`,
    `Submitted at: ${submittedAt}`,
    `Submitted ISO: ${payload.at}`,
  ].join('\n')

  return { html, subject, text }
}
