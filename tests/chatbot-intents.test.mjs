import test from 'node:test'
import assert from 'node:assert/strict'
import {
  classifyChatInputIntent,
  findLatestUserServiceMatch,
  findServiceIntent,
  isCallbackRequest,
  isFallbackAssistantText,
  isGreetingPrompt,
} from '../src/lib/chatbot/intents.ts'

test('detects simple greeting prompts without matching longer requests', () => {
  assert.equal(isGreetingPrompt('Hey!'), true)
  assert.equal(isGreetingPrompt('good afternoon'), true)
  assert.equal(isGreetingPrompt('hello, can you help with respite?'), false)
})

test('detects callback and human handoff requests', () => {
  assert.equal(isCallbackRequest('Can someone call me back tomorrow?'), true)
  assert.equal(isCallbackRequest("I'd like to talk to someone."), true)
  assert.equal(isCallbackRequest('What services do you offer?'), false)
})

test('classifies contact and after-hours input using business-hours context', () => {
  assert.equal(classifyChatInputIntent('What is your email address?', false), 'contact_info')
  assert.equal(classifyChatInputIntent('What are your hours?', true), 'after_hours')
  assert.equal(classifyChatInputIntent('Do you have after hours support?', false), 'after_hours')
})

test('detects assistant fallback copy only when uncertainty includes a human path', () => {
  assert.equal(
    isFallbackAssistantText(
      "I'm not sure I can answer that safely. Please call 1-(844) 476-5313 or request a callback.",
    ),
    true,
  )
  assert.equal(isFallbackAssistantText("I'm not sure which service you mean yet."), false)
})

test('matches service names and visitor aliases', () => {
  assert.equal(findServiceIntent('Can you help with nursing at home?')?.name, 'Shift Nursing')
  assert.equal(findServiceIntent('We need rides to appointments.')?.name, 'Transportation Services')
  assert.equal(findServiceIntent('Looking for respite care for a weekend.')?.name, 'Respite Services')
  assert.equal(findServiceIntent('Do you sell equipment?'), null)
})

test('finds service intent from the latest user message instead of the full transcript', () => {
  const latestMatch = findLatestUserServiceMatch([
    { role: 'user', text: 'Tell me about nursing.' },
    { role: 'assistant', text: 'Shift Nursing includes licensed in-home nursing.' },
    { role: 'user', text: 'Actually, I need a ride to appointments.' },
  ])

  assert.equal(latestMatch?.name, 'Transportation Services')
})
