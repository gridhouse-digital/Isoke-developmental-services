# Isoke embedded chatbot — Phase 1–2 plan (team consensus)

**Winston (Architect):** Single repo: Vite app + `api/` at same root. One Vercel deployment serves static site and serverless routes. No separate backend deploy.

**John (PM):** Scope: anonymous FAQ + contact answers, streaming replies, floating widget, quick replies, “Request a callback,” off-hours message. No auth, no DB, no file storage.

**Sally (UX):** One entry point: “Chat with us” in nav/footer opens the widget. Quick reply buttons: “Our services” | “Contact us” | “Request a callback” to reduce empty sends and clarify intent.

**Amelia (Dev):** Implementation order: (1) `api/chat.ts` with AI SDK `streamText`, Isoke system prompt, streamed response; (2) `api/callback.ts` POST → webhook or email for callback leads; (3) Chat widget component (button + drawer, message list, input, quick replies, consume stream); (4) Wire widget into App and add “Chat with us” link.

**Mary (Analyst):** Success = visitors get accurate FAQ/contact answers and a clear path to request a callback; off-hours sets expectations and still captures leads.

---

## Folder structure (same repo)

```
Website/isoke-redesign/
├── api/
│   ├── chat.ts          # POST /api/chat — streamText, system prompt
│   └── callback.ts      # POST /api/callback — forward to webhook / email
├── src/
│   ├── components/
│   │   └── ChatWidget.tsx
│   ├── App.tsx           # mounts ChatWidget
│   └── ...
├── package.json          # + ai, @ai-sdk/openai, @ai-sdk/react
├── vite.config.ts
└── vercel.json           # optional: ensure api routes
```

## Backend

- **Chat:** One serverless function `api/chat.ts`. Receives `{ messages }`, returns streamed reply via AI SDK `toDataStreamResponse`. Model: OpenAI (or AI Gateway). Env: `OPENAI_API_KEY` (or `AI_GATEWAY_API_KEY` on Vercel).
- **Callback:** `api/callback.ts` receives `{ name, phone, bestTime, service? }`, forwards to `CALLBACK_WEBHOOK_URL` or sends email. No DB.

## Deployment

- **Single Vercel deployment.** Project root = `Website/isoke-redesign` (or repo root with root directory set). Vercel builds Vite → static assets and runs `api/*` as serverless. No second deployment.

## Environment

- **AI_GATEWAY_API_KEY** — Required for chat. Used by [Vercel AI Gateway](https://vercel.com/docs/ai-gateway); set in Vercel project env or `.env` for `vercel dev`. One key gives access to many models (e.g. `openai/gpt-4o-mini`).
- **CALLBACK_WEBHOOK_URL** — Optional. If set, `POST /api/callback` forwards `{ name, phone, bestTime?, service? }` to this URL. Otherwise returns 200 (placeholder for email later).
- **Local dev:** Run `vercel dev` in the project root so the Vite app and `api/` routes run together. Chat widget calls `/api/chat`; without `vercel dev`, use a proxy or deploy the API elsewhere.

## Phase 1–2 features

| Feature | How |
|--------|-----|
| FAQ + contact | System prompt with Isoke name, mission, services, address, phone, email, hours. |
| Streaming | `streamText` + `toDataStreamResponse`; client uses `useChat` or fetch + stream. |
| Floating widget | Button bottom-right; drawer with messages + input + quick replies. |
| Quick replies | “Our services” / “Contact us” / “Request a callback” send that message into the thread. |
| Off-hours message | In system prompt: if outside Mon–Fri 9–5 ET, first reply notes we’re outside hours and offers callback or next-business-day reply. |
| Request a callback | Bot collects name, phone, best time (and optionally service). Front-end then POSTs to `api/callback`; backend forwards to webhook or email. |
