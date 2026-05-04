const RATE_LIMIT_STATE_KEY = '__ISOKE_API_RATE_LIMITS__'

export const API_LIMITS = {
  callbackBodyBytes: 8 * 1024,
  callbackMaxRequests: 5,
  chatBodyBytes: 64 * 1024,
  chatMaxMessages: 24,
  chatMaxRequests: 30,
  chatMaxTextChars: 12000,
  contactBodyBytes: 16 * 1024,
  contactMaxRequests: 5,
  rateWindowMs: 15 * 60 * 1000,
}

function getRateLimitStore() {
  if (!globalThis[RATE_LIMIT_STATE_KEY]) {
    globalThis[RATE_LIMIT_STATE_KEY] = new Map()
  }

  return globalThis[RATE_LIMIT_STATE_KEY]
}

function cleanSingleLine(value, maxLength) {
  return String(value ?? '')
    .replace(/[\u0000-\u001f\u007f]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength)
}

function cleanFreeText(value, maxLength) {
  return String(value ?? '')
    .replace(/\u0000/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .trim()
    .slice(0, maxLength)
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function countDigits(value) {
  return (value.match(/\d/g) ?? []).length
}

function isValidPhone(value) {
  if (!value) return false
  if (!/^[\d\s()+.-]+$/.test(value)) return false
  const digits = countDigits(value)
  return digits >= 7 && digits <= 20
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254
}

function getHeader(headers, name) {
  if (!headers) return ''
  if (typeof headers.get === 'function') return headers.get(name) || ''
  return headers[name.toLowerCase()] || headers[name] || ''
}

export function getClientId(req) {
  const forwardedFor = getHeader(req.headers, 'x-forwarded-for')
  const realIp = getHeader(req.headers, 'x-real-ip')
  const vercelIp = getHeader(req.headers, 'x-vercel-forwarded-for')
  const ip = (forwardedFor || vercelIp || realIp || 'unknown').split(',')[0]?.trim() || 'unknown'
  return ip.slice(0, 96)
}

export function checkRateLimit({ clientId, limit, route, windowMs = API_LIMITS.rateWindowMs }) {
  const now = Date.now()
  const key = `${route}:${clientId}`
  const store = getRateLimitStore()
  const current = store.get(key)

  if (!current || current.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return { ok: true, remaining: limit - 1, resetAt: now + windowMs }
  }

  if (current.count >= limit) {
    return { ok: false, remaining: 0, resetAt: current.resetAt }
  }

  current.count += 1
  store.set(key, current)
  return { ok: true, remaining: limit - current.count, resetAt: current.resetAt }
}

export function buildJsonResponse(body, status = 200, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  })
}

export function buildRateLimitResponse(result) {
  const retryAfterSeconds = Math.max(1, Math.ceil((result.resetAt - Date.now()) / 1000))
  return buildJsonResponse(
    { error: 'Too many requests. Please wait a few minutes and try again.' },
    429,
    { 'Retry-After': String(retryAfterSeconds) },
  )
}

export async function readJsonBody(req, maxBytes) {
  const lengthHeader = getHeader(req.headers, 'content-length')
  const contentLength = Number(lengthHeader)

  if (Number.isFinite(contentLength) && contentLength > maxBytes) {
    return { error: 'Request body is too large.', status: 413 }
  }

  const raw = await req.text()
  if (new TextEncoder().encode(raw).byteLength > maxBytes) {
    return { error: 'Request body is too large.', status: 413 }
  }

  try {
    return { data: raw ? JSON.parse(raw) : {} }
  } catch {
    return { error: 'Request body must be valid JSON.', status: 400 }
  }
}

export function sanitizeVisitorProfile(profile) {
  if (!isPlainObject(profile)) return {}

  return {
    cityState: cleanSingleLine(profile.cityState, 80) || undefined,
    firstName: cleanSingleLine(profile.firstName, 40) || undefined,
  }
}

function extractMessageText(message) {
  if (!isPlainObject(message)) return ''
  if (typeof message.content === 'string') return message.content
  if (!Array.isArray(message.parts)) return ''

  return message.parts
    .map((part) => (isPlainObject(part) && part.type === 'text' && typeof part.text === 'string' ? part.text : ''))
    .join('')
}

export function validateChatPayload(input) {
  if (!isPlainObject(input)) {
    return { error: 'Request body must be an object.' }
  }

  const messages = Array.isArray(input.messages) ? input.messages : []
  if (messages.length > API_LIMITS.chatMaxMessages) {
    return { error: `Chat is limited to the most recent ${API_LIMITS.chatMaxMessages} messages.` }
  }

  const totalTextChars = messages.reduce((total, message) => total + extractMessageText(message).length, 0)
  if (totalTextChars > API_LIMITS.chatMaxTextChars) {
    return { error: 'Chat request is too long. Please start a shorter message.' }
  }

  return {
    payload: {
      messages,
      visitorProfile: sanitizeVisitorProfile(input.visitorProfile),
    },
  }
}

export function validateCallbackPayload(input) {
  if (!isPlainObject(input)) {
    return { error: 'Request body must be an object.' }
  }

  const bestTime = cleanSingleLine(input.bestTime, 160)
  const location = cleanSingleLine(input.location, 120)
  const name = cleanSingleLine(input.name, 80)
  const phone = cleanSingleLine(input.phone, 40)
  const service = cleanSingleLine(input.service, 100)

  if (!name || !phone || !bestTime) {
    return { error: 'Please enter your name, phone number, and best time to call.' }
  }

  if (!isValidPhone(phone)) {
    return { error: 'Please enter a valid phone number.' }
  }

  return {
    payload: {
      at: new Date().toISOString(),
      bestTime,
      location,
      name,
      phone,
      service,
    },
  }
}

export function validateContactPayload(input) {
  if (!isPlainObject(input)) {
    return { error: 'Request body must be an object.' }
  }

  const email = cleanSingleLine(input.email, 254)
  const message = cleanFreeText(input.message, 3000)
  const name = cleanSingleLine(input.name, 80)
  const phone = cleanSingleLine(input.phone, 40)
  const subject = cleanSingleLine(input.subject, 120)

  if (!name || !email || !message) {
    return { error: 'Please enter your name, email, and message.' }
  }

  if (!isValidEmail(email)) {
    return { error: 'Please enter a valid email address.' }
  }

  if (phone && !isValidPhone(phone)) {
    return { error: 'Please enter a valid phone number.' }
  }

  return {
    payload: {
      at: new Date().toISOString(),
      email,
      message,
      name,
      phone,
      subject,
    },
  }
}
