# Client Chatbot Playbook Template

## Purpose
Use this template to design, build, deploy, and operate a client chatbot using the same pattern as the Isoke implementation.

Recommended companion artifact:
- create a client-specific `chatbot-rules-book.md` early so product, UX, and engineering share one concise behavior contract

## 1. Discovery Checklist
Capture before implementation:
- business name
- mission or positioning statement
- primary audience
- approved services or offerings
- address, phone, email, hours
- after-hours process
- supported CTAs
- escalation contacts
- out-of-scope topics
- preferred tone
- compliance constraints
- whether a proactive teaser should appear and when
- what light profile fields are acceptable before handoff

## 2. Content Inventory Template
Document the approved facts in a structured content source:

```ts
{
  businessName: '',
  mission: '',
  audience: '',
  onboarding: {
    teaserTitle: '',
    teaserBody: '',
    namePrompt: '',
    locationPrompt: ''
  },
  contact: {
    mainPhoneDisplay: '',
    mainPhoneHref: '',
    afterHoursDisplay: '',
    afterHoursHref: '',
    email: '',
    businessHours: ''
  },
  services: [
    {
      name: '',
      shortDescription: '',
      prompt: ''
    }
  ]
}
```

Rule:
- keep facts in structured data
- keep behavior in prompt rules

## 3. Intent Catalog Template
Define a minimal intent set before UI work:
- teaser
- welcome
- service discovery
- contact and hours
- after-hours
- collecting name
- collecting location
- callback offer
- callback form active
- fallback
- human handoff

For each intent, define:
- trigger
- assistant response style
- next-step CTA
- escalation rule
- UI treatment

## 4. Conversation Design Rules
- narrow the scope before broadening it
- every turn should move the user toward a useful next step
- do not rely on the model alone for operational flows
- use structured forms for lead capture
- use progressive profiling instead of asking for every detail up front
- prefer city/state over browser geolocation for service routing
- if a service, contact, or callback flow begins before the quick introduction is complete, finish the intro prompts first and only then reveal deferred assistant content or the callback form
- once light profile data is collected, feed it into the next model request so the assistant can personalize the immediate follow-up naturally
- for greeting-only turns after intro, consider a local personalized welcome response to avoid unnecessary model latency
- design fallback and handoff explicitly
- do not hallucinate business facts

## 5. Prompt Template
Your prompt should cover:
- role and tone
- approved knowledge boundary
- service and contact summary
- after-hours rule
- callback and escalation rule
- fallback rule

Keep the prompt free of unnecessary implementation details.

## 6. UI Template
Recommended UI structure:
- floating entry button
- dismissible proactive teaser bubble that appears on fresh page loads without auto-opening the chat
- concierge-style header
- guided welcome state
- assistant messages with readable hierarchy
- action chips after key replies
- progressive profile cards
- inline callback form
- multi-line composer
- visible direct-contact CTA

## 7. Callback and Email Setup Template
Public route:
- `POST /api/callback`

Required request shape:
```json
{
  "name": "",
  "phone": "",
  "bestTime": "",
  "location": "",
  "service": ""
}
```

Recommended email provider pattern:
- Node serverless route
- official provider SDK
- reusable local email template module
- optional webhook forwarding
- tag outgoing emails for filtering and reporting
- apply the same delivery pattern to any public website contact form so callback and contact messages use one consistent email stack

## 8. Resend Setup Checklist
- verify the sending domain or subdomain
- set `RESEND_API_KEY`
- set `CALLBACK_EMAIL_TO`
- set `CALLBACK_EMAIL_FROM`
- optionally set `CALLBACK_EMAIL_REPLY_TO`
- optionally set `CONTACT_EMAIL_TO`
- optionally set `CONTACT_EMAIL_FROM`
- optionally set `CONTACT_EMAIL_REPLY_TO`
- send a direct test request to `/api/callback`
- send a direct test request to `/api/contact` if a public contact form exists
- confirm provider logs and recipient inbox

Operational notes:
- sender must match the verified domain
- use subdomains for sender reputation isolation
- prefer code-based templates first
- add provider event checks to launch QA

## 9. Analytics Checklist
Define an internal adapter first.

Recommended events:
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

Do not block launch on analytics vendor selection.

## 10. Launch Checklist
- structured content source completed
- prompt reviewed against approved facts
- after-hours rules confirmed
- callback flow tested directly and through chat
- contact form tested directly and through the public UI if one exists
- proactive teaser behavior reviewed across desktop and mobile
- progressive profile collection reviewed for drop-off and clarity
- email delivery verified
- fallback states reviewed
- mobile UI reviewed
- Vercel env vars configured
- handbook or client runbook published

## 11. Reusable Acceptance Criteria
- users can start from guided actions without typing
- proactive greeting invites engagement without hijacking the page
- chatbot answers approved questions accurately
- light profile prompts feel optional and proportional
- unresolved questions route to a human path
- callback submission works end to end
- UI feels brand-aligned and trustworthy
- another engineer can maintain the chatbot without reverse-engineering prompt logic
