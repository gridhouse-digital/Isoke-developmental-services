import test from 'node:test'
import assert from 'node:assert/strict'
import {
  API_LIMITS,
  checkRateLimit,
  sanitizeVisitorProfile,
  validateCallbackPayload,
  validateChatPayload,
  validateContactPayload,
} from '../chatbot/api-guardrails.js'
import { buildCallbackEmailContent, normalizeEmailList } from '../chatbot/callback-email-template.js'
import { buildContactEmailContent, resolveContactEmailConfig } from '../chatbot/contact-email-template.js'

test('validates and normalizes callback payloads', () => {
  const result = validateCallbackPayload({
    bestTime: '  Monday morning  ',
    location: '  Philadelphia, PA ',
    name: ' Jane Smith ',
    phone: ' (267) 555-1212 ',
    service: 'Companion Services',
  })

  assert.equal(result.error, undefined)
  assert.equal(result.payload.name, 'Jane Smith')
  assert.equal(result.payload.phone, '(267) 555-1212')
  assert.equal(result.payload.bestTime, 'Monday morning')
  assert.match(result.payload.at, /^\d{4}-\d{2}-\d{2}T/)
})

test('rejects invalid callback phone numbers', () => {
  const result = validateCallbackPayload({
    bestTime: 'Tomorrow',
    name: 'Jane',
    phone: 'call me maybe',
  })

  assert.equal(result.error, 'Please enter a valid phone number.')
})

test('validates contact payload email and message fields server-side', () => {
  const invalid = validateContactPayload({
    email: 'not-an-email',
    message: 'Hello',
    name: 'Jane',
  })

  assert.equal(invalid.error, 'Please enter a valid email address.')

  const valid = validateContactPayload({
    email: 'jane@example.com',
    message: 'I would like to learn more about services.',
    name: 'Jane',
    phone: '+1 267 555 1212',
    subject: 'Respite Services',
  })

  assert.equal(valid.error, undefined)
  assert.equal(valid.payload.email, 'jane@example.com')
})

test('limits chat message count and text size', () => {
  const tooMany = validateChatPayload({
    messages: Array.from({ length: API_LIMITS.chatMaxMessages + 1 }, (_, index) => ({
      id: String(index),
      parts: [{ text: 'hello', type: 'text' }],
      role: 'user',
    })),
  })

  assert.match(tooMany.error, /most recent/)

  const tooLong = validateChatPayload({
    messages: [
      {
        id: '1',
        parts: [{ text: 'x'.repeat(API_LIMITS.chatMaxTextChars + 1), type: 'text' }],
        role: 'user',
      },
    ],
  })

  assert.equal(tooLong.error, 'Chat request is too long. Please start a shorter message.')
})

test('sanitizes visitor profile before it reaches the prompt', () => {
  const profile = sanitizeVisitorProfile({
    cityState: ' Philadelphia,\n PA ',
    firstName: ' Jane\u0000<script> ',
  })

  assert.equal(profile.cityState, 'Philadelphia, PA')
  assert.equal(profile.firstName, 'Jane <script>')
})

test('rate limits by route and client id', () => {
  const route = `test-${Date.now()}-${Math.random()}`
  const clientId = '127.0.0.1'

  assert.equal(checkRateLimit({ clientId, limit: 2, route }).ok, true)
  assert.equal(checkRateLimit({ clientId, limit: 2, route }).ok, true)

  const blocked = checkRateLimit({ clientId, limit: 2, route })
  assert.equal(blocked.ok, false)
  assert.equal(blocked.remaining, 0)
})

test('normalizes bcc email lists and contact config fallback', () => {
  assert.deepEqual(normalizeEmailList(' one@example.com, two@example.com '), [
    'one@example.com',
    'two@example.com',
  ])

  const config = resolveContactEmailConfig({
    CALLBACK_EMAIL_BCC: 'hello@gridhouse.digital',
    CALLBACK_EMAIL_FROM: 'intake@callback.isokedevelops.com',
    CALLBACK_EMAIL_TO: 'admin@isokedevelops.com',
    RESEND_API_KEY: 'test-key',
  })

  assert.equal(config.to, 'admin@isokedevelops.com')
  assert.deepEqual(config.bcc, ['hello@gridhouse.digital'])
})

test('callback email includes staff action links and Eastern submitted time', () => {
  const email = buildCallbackEmailContent({
    at: '2026-04-27T18:14:00.000Z',
    bestTime: 'Monday morning',
    location: 'Philadelphia, PA',
    name: 'Jane Smith',
    phone: '(267) 555-1212',
    service: 'Companion Services',
  })

  assert.match(email.html, /Action needed/)
  assert.match(email.html, /color-scheme: light/)
  assert.match(email.html, /href="tel:2675551212"/)
  assert.match(email.html, /Call visitor/)
  assert.match(email.html, /Apr 27, 2026, 2:14 PM ET/)
  assert.match(email.text, /Action: Call visitor at \(267\) 555-1212/)
  assert.match(email.text, /Submitted ISO: 2026-04-27T18:14:00.000Z/)
})

test('contact email includes triage context, reply link, and Eastern submitted time', () => {
  const email = buildContactEmailContent({
    at: '2026-04-27T18:14:00.000Z',
    email: 'jane@example.com',
    message: 'Please send more information.',
    name: 'Jane Smith',
    phone: '(267) 555-1212',
    subject: 'Respite Services',
  })

  assert.match(email.html, /Lead triage/)
  assert.match(email.html, /color-scheme: light/)
  assert.match(email.html, /href="mailto:jane@example.com"/)
  assert.match(email.html, /href="tel:2675551212"/)
  assert.match(email.html, /Reply to visitor/)
  assert.match(email.html, /Apr 27, 2026, 2:14 PM ET/)
  assert.match(email.text, /Action: Reply to visitor at jane@example.com/)
  assert.match(email.text, /Submitted ISO: 2026-04-27T18:14:00.000Z/)
})
