import test from 'node:test'
import assert from 'node:assert/strict'
import { getChatStageTransition, reduceChatStage } from '../src/lib/chatbot/state.ts'

test('opens the welcome panel from hidden or teaser states', () => {
  assert.equal(reduceChatStage('teaser_hidden', { type: 'open_chat' }), 'chat_open_welcome')
  assert.equal(reduceChatStage('teaser_visible', { type: 'open_chat' }), 'chat_open_welcome')
  assert.equal(reduceChatStage('fallback', { type: 'open_chat' }), 'fallback')
})

test('moves welcome conversations into profile collection during normal chat', () => {
  assert.equal(reduceChatStage('chat_open_welcome', { type: 'conversation_started' }), 'collecting_name')
  assert.equal(reduceChatStage('exploring_services', { type: 'conversation_started' }), 'exploring_services')
})

test('routes service intent into service exploration', () => {
  assert.equal(reduceChatStage('chat_open_welcome', { type: 'classified_input', stage: 'exploring_services' }), 'exploring_services')
})

test('protects callback and after-hours handoff states from fallback overrides', () => {
  assert.equal(reduceChatStage('callback_offer', { type: 'assistant_fallback' }), 'callback_offer')
  assert.equal(reduceChatStage('callback_form', { type: 'assistant_fallback' }), 'callback_form')
  assert.equal(reduceChatStage('after_hours', { type: 'assistant_fallback' }), 'after_hours')
  assert.equal(reduceChatStage('resolved', { type: 'assistant_fallback' }), 'fallback')
})

test('opens, closes, and completes callback form transitions', () => {
  assert.equal(reduceChatStage('callback_offer', { type: 'open_callback_form' }), 'callback_form')
  assert.equal(reduceChatStage('callback_form', { type: 'close_callback_form', hasMatchedService: true }), 'exploring_services')
  assert.equal(reduceChatStage('callback_form', { type: 'close_callback_form', hasMatchedService: false }), 'resolved')
  assert.equal(reduceChatStage('callback_form', { type: 'callback_submitted' }), 'resolved')
})

test('moves profile collection into handoff or normal resolved states', () => {
  assert.equal(
    reduceChatStage('collecting_name', {
      hasLocationResolved: false,
      hasPendingAction: false,
      hasPendingPrompt: false,
      type: 'profile_name_completed',
    }),
    'collecting_location',
  )
  assert.equal(
    reduceChatStage('collecting_name', {
      hasLocationResolved: true,
      hasPendingAction: true,
      hasPendingPrompt: false,
      type: 'profile_name_completed',
    }),
    'callback_form',
  )
  assert.equal(
    reduceChatStage('collecting_location', {
      hasMatchedService: true,
      hasNameResolved: true,
      hasPendingAction: false,
      hasPendingPrompt: false,
      type: 'profile_location_completed',
    }),
    'exploring_services',
  )
})

test('resolves queued prompt stage from classified input or normal chat fallback', () => {
  assert.equal(getChatStageTransition({ classifiedStage: 'contact_info', type: 'queued_prompt_resolved' }), 'contact_info')
  assert.equal(getChatStageTransition({ classifiedStage: null, type: 'queued_prompt_resolved' }), 'resolved')
})
