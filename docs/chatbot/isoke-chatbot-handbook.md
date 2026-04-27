# Isoke Chatbot Handbook

## Overview
The Isoke chatbot is a warm concierge chatbot with light intake. It answers approved service and contact questions, handles after-hours guidance, and converts support intent into callback requests sent through Resend. The public contact form also sends through Resend. The bot runs inside the same Vite + Vercel project as the marketing site.

Primary reference documents:
- `docs/chatbot/chatbot-rules-book.md` for operational behavior rules
- `docs/chatbot/isoke-chatbot-handbook.md` for architecture and implementation context
- `docs/chatbot/client-chatbot-playbook-template.md` for reuse on future client projects

## Architecture
- Frontend: `src/components/ChatWidget.tsx`
- Chat route: `api/chat.ts`
- Callback route: `api/callback.ts`
- Contact route: `api/contact.ts`
- Local API parity: `scripts/dev-api.mjs`
- Shared chatbot content source: `chatbot/isoke-content.js`
- Shared callback email template: `chatbot/callback-email-template.js`
- Shared contact email template: `chatbot/contact-email-template.js`
- Flow and analytics helpers: `src/lib/chatbot/flow.ts`, `src/lib/chatbot/analytics.ts`

Runtime shape:
1. A proactive teaser can appear shortly after page load near the launcher unless the visitor has dismissed it.
2. The user opens the widget from the launcher, teaser, or a guided starter.
3. `ChatWidget` sends UI messages to `POST /api/chat`.
4. `api/chat.ts` builds the system prompt from the structured content source and streams the reply through AI Gateway.
5. The widget manages explicit chat stages for teaser, welcome, service discovery, after-hours, profile collection, callback, and fallback states.
6. After meaningful engagement, the widget progressively asks for first name and then city/state without requesting browser geolocation.
7. If the user asks for a callback, the inline form posts to `POST /api/callback`.
8. `api/callback.ts` sends a Resend email and optionally forwards the payload to a webhook.
9. The public contact section form posts to `POST /api/contact` and sends a Resend email to the configured inbox.

## Content Model
Business facts live in `chatbot/isoke-content.js`, not hardcoded directly inside the route logic.

The content source holds:
- business identity and mission
- audience
- contact details
- after-hours number and business hours
- service catalog and short descriptions
- welcome actions and default prompts
- onboarding copy for the teaser and progressive profile prompts

The system prompt is generated from that source. The prompt should only define:
- tone
- allowed knowledge boundaries
- response rules
- fallback behavior
- callback escalation behavior

## Conversation Rules
Primary intents:
- teaser
- welcome
- service discovery
- contact and hours
- after-hours
- progressive profile collection
- callback offer
- callback form active
- fallback
- human handoff

Behavior rules:
- answer clearly using only approved Isoke information
- end most replies with one next step
- do not guess when uncertain
- use direct contact or callback when the question is unresolved
- treat after-hours as a special support state, not just another reply
- help first, then collect light visitor context progressively
- ask for first name after meaningful engagement
- ask for city and state only when it helps routing or follow-up
- do not request exact address or browser geolocation permission
- if a service, contact, or callback path starts before the quick introduction is complete, finish the intro prompts before showing deferred assistant replies or the callback form
- once first name and city/state are collected, pass that context into the next chat request so the assistant can greet the visitor naturally by name
- greeting-only follow-ups such as `hi` or `hello` are answered immediately in the UI with a personalized welcome instead of waiting on a full model round-trip

## Chat UI
The chatbot UI is designed to feel like a concierge layer inside the site, not a generic support drawer.

Current UI behaviors:
- proactive teaser bubble near the launcher, shown on fresh page loads unless dismissed
- stronger assistant identity in the header
- business-hours trust cue
- direct-call CTA in header and footer
- warm opening state with guided first actions
- streaming assistant reveal
- contextual action chips after assistant replies
- inline profile cards for first name and city/state
- inline callback form
- multi-line composer with `Enter` to send and `Shift+Enter` for newline
- state banners for after-hours, callback, and fallback moments

## Callback and Resend Delivery
The callback route is the single lead-delivery boundary.

Request body:
```json
{
  "name": "Visitor Name",
  "phone": "+15555550123",
  "bestTime": "Monday at 10 AM",
  "location": "Philadelphia, PA",
  "service": "Companion Services"
}
```

Delivery behavior:
- sends through the official `resend` Node SDK
- uses the verified sending domain `callback.isokedevelops.com`
- defaults sender to `intake@callback.isokedevelops.com`
- supports optional `replyTo`
- supports optional webhook forwarding
- attaches Resend tags:
  - `type=callback_request`
  - `client=isoke`
  - `source=chatbot`
  - `location=<normalized_location>`
  - `service=<normalized_service>`

Environment variables:
- `AI_GATEWAY_API_KEY`
- `RESEND_API_KEY`
- `CALLBACK_EMAIL_TO`
- `CALLBACK_EMAIL_FROM`
- `CALLBACK_EMAIL_REPLY_TO` optional
- `CALLBACK_WEBHOOK_URL` optional
- `CONTACT_EMAIL_TO` optional, falls back to `CALLBACK_EMAIL_TO`
- `CONTACT_EMAIL_FROM` optional, falls back to `CALLBACK_EMAIL_FROM`
- `CONTACT_EMAIL_REPLY_TO` optional, falls back to `CALLBACK_EMAIL_REPLY_TO`

## Contact Form Delivery
The public contact section uses a separate route from the chatbot callback flow.

Request body:
```json
{
  "name": "Visitor Name",
  "email": "visitor@example.com",
  "phone": "+15555550123",
  "subject": "Companion Services",
  "message": "I would like to learn more about support options."
}
```

Delivery behavior:
- sends through the official `resend` Node SDK
- uses the same verified sender domain pattern as the callback route
- defaults to the callback inbox/sender env vars when contact-specific env vars are not set
- uses the visitor email as `replyTo` when no explicit reply-to env var is configured
- attaches Resend tags:
  - `type=contact_form_submission`
  - `client=isoke`
  - `source=website_contact_form`
  - `subject=<normalized_subject>`

## Resend Operational Notes
Important Resend findings for this stack:
- The callback route should stay on Node serverless runtime, not Edge, because the official `resend` SDK is used.
- The `from` address must match the verified domain or subdomain exactly.
- A mailbox does not have to be separately created in Resend; any address on the verified domain can be used as sender.
- Hosted template usage is not required for this project. Local code-based email templates are the default.
- Delivery debugging should use Resend event visibility:
  - `email.sent`
  - `email.delivered`
  - `email.failed`
  - `email.suppressed`

Operational checks:
1. Verify the domain or subdomain in Resend.
2. Confirm `CALLBACK_EMAIL_FROM` uses that verified domain.
3. Directly `POST` to `/api/callback`.
4. Verify the response body reports `delivered.email=true`.
5. Check Resend logs and recipient inbox.

## Analytics Contract
The frontend exposes a lightweight no-op analytics hook through `trackChatbotEvent`.

Defined events:
- `chat_session_started`
- `welcome_action_clicked`
- `intent_entered`
- `fallback_shown`
- `callback_form_opened`
- `callback_submitted`
- `callback_failed`
- `phone_cta_clicked`
- `teaser_shown`
- `teaser_clicked`
- `teaser_dismissed`
- `profile_name_collected`
- `profile_location_collected`

Default behavior:
- no vendor dependency
- optional future integration through `window.__ISOKE_CHATBOT_ANALYTICS__`

## Local Development
Use:
```bash
npm run dev:full
```

Why:
- Vite serves the frontend on `http://localhost:5173`
- `scripts/dev-api.mjs` serves `/api/chat`, `/api/callback`, and `/api/contact` on `http://localhost:3001`
- the widget and contact form automatically use the local API endpoint when running on localhost

## Vercel Deployment
Deployment assumptions:
- one Vercel project
- project root is `Website/isoke-redesign`
- static app + `api/*` routes deploy together

Post-deploy checks:
1. open the site and test a normal FAQ message
2. test after-hours behavior
3. test callback submission from the inline form
4. verify callback email in Resend and recipient inbox
5. test the public contact form and verify contact email delivery

## QA Checklist
- teaser appears on fresh page loads unless dismissed and does not auto-open the full panel
- teaser CTAs open the correct guided path
- address, phones, email, and hours match the structured content source
- after-hours response shows the after-hours number
- first-name prompt appears after meaningful engagement
- city/state prompt appears after first-name capture or skip
- no browser geolocation request is used
- callback form opens from starter, direct callback ask, and guided callback chips
- callback form pre-fills known name, city/state, and matched service when available
- callback submission succeeds end to end
- contact form submission succeeds end to end
- fallback states provide direct contact or callback options
- action chips remain relevant to the conversation
- composer supports `Shift+Enter`
- mobile layout remains usable

## Troubleshooting
If chat fails:
- check `AI_GATEWAY_API_KEY`
- check `/api/chat` logs in Vercel
- verify the model route is valid

If callback email fails:
- check `RESEND_API_KEY`
- check `CALLBACK_EMAIL_FROM`
- verify the sending domain in Resend
- inspect `/api/callback` response body
- inspect Resend event logs

If contact form email fails:
- check `RESEND_API_KEY`
- check `CONTACT_EMAIL_TO` / `CONTACT_EMAIL_FROM` or their callback fallbacks
- inspect `/api/contact` response body
- inspect Resend event logs

If local callback fails:
- ensure `npm run dev:full` is running
- ensure the browser is calling `http://localhost:3001/api/callback`

If local contact form submission fails:
- ensure `npm run dev:full` is running
- ensure the browser is calling `http://localhost:3001/api/contact`

## Lessons Learned
- prompt-only callback parsing is brittle; structured inline forms are more reliable
- local and production parity matters for serverless-style flows
- sender domain alignment is the main Resend integration constraint
- proactive greeting works best as a dismissible teaser, not an auto-open panel
- progressive profiling collects better quality context than front-loading a large intake form
- guided action chips improve both UX and conversion without requiring a full intent engine
