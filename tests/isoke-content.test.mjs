import test from 'node:test'
import assert from 'node:assert/strict'
import { ISOKE_CONTENT, buildIsokeSystemPrompt, findServiceByText } from '../chatbot/isoke-content.js'

test('system prompt is generated from canonical Isoke content', () => {
  const prompt = buildIsokeSystemPrompt()

  assert.ok(prompt.includes(ISOKE_CONTENT.businessName))
  assert.ok(prompt.includes(ISOKE_CONTENT.contact.afterHoursDisplay))
  assert.ok(prompt.includes(ISOKE_CONTENT.contact.email))
  assert.ok(prompt.includes(ISOKE_CONTENT.privacyNotice))

  for (const service of ISOKE_CONTENT.services) {
    assert.ok(prompt.includes(service.name))
    assert.ok(prompt.includes(service.shortDescription))
    assert.ok(prompt.includes(service.aliases[0]))
  }
})

test('service lookup matches approved service names and aliases', () => {
  assert.equal(findServiceByText('Tell me about Respite Services')?.name, 'Respite Services')
  assert.equal(findServiceByText('Do you offer rides to appointments?')?.name, 'Transportation Services')
  assert.equal(findServiceByText('Can you help with nursing care?')?.name, 'Shift Nursing')
  assert.equal(findServiceByText('Do you provide unknown services?'), null)
})
