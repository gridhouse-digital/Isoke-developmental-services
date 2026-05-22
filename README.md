# Isoke Website

React + TypeScript + Vite site for Isoke Developmental Services, including a guided chatbot, contact form, and callback intake.

**Stack:** Vite 7, React 19, TypeScript, Tailwind CSS v4, Framer Motion, react-router-dom v7

## Getting started

```bash
npm install
npm run dev:full
```

Open [http://localhost:5173](http://localhost:5173).

Use `npm run dev:full` when you need the chatbot, contact form, or callback flow to work locally. For frontend-only work, `npm run dev` is enough.

## Local development

`npm run dev:full` starts two processes via [`scripts/dev-full.mjs`](scripts/dev-full.mjs):

| Process | Command | URL | Purpose |
|---------|---------|-----|---------|
| Frontend | Vite | http://localhost:5173 | React app with HMR |
| API | `scripts/dev-api.mjs` | http://localhost:3001 | `/api/chat`, `/api/callback`, `/api/contact` |

Vite proxies `/api` requests to the local API server ([`vite.config.ts`](vite.config.ts)), so the browser can use `/api/*` on port 5173 while the API runs on 3001.

To confirm the API is running:

```bash
curl http://localhost:3001/health
```

Expected response: `{"ok":true}`

Press `Ctrl+C` once to stop both servers.

## Environment configuration

Chat and email features require a local `.env` file in the project root. The dev API loads it at startup.

- Do not commit `.env` or put secrets in tracked files.
- Copy required values from your team's secure secret store or deployment environment.
- See [`docs/chatbot/isoke-chatbot-handbook.md`](docs/chatbot/isoke-chatbot-handbook.md) for the full local setup and deployment checklist.

Without a configured `.env`, the site still runs, but chat and email-backed forms will return configuration errors.

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev:full` | Frontend + local API (recommended for full local testing) |
| `npm run dev` | Frontend only |
| `npm run dev:api` | Local API only |
| `npm run build` | Production build |
| `npm run preview` | Preview the production build (static site only) |
| `npm run typecheck` | TypeScript check |
| `npm run lint` | ESLint |
| `npm run test` | Node test runner |

## Windows note

This project lives in a path with spaces. npm scripts invoke Vite and TypeScript through `node` directly, so use the npm scripts above rather than calling `node_modules/.bin` yourself.

## Troubleshooting

- **Chat or forms fail locally** — Make sure `npm run dev:full` is running, not just `npm run dev`.
- **API routes return configuration errors** — Check that `.env` exists and restart the dev server after changes.
- **Email submissions fail** — Verify local env configuration and review server logs in the terminal running `dev:api`.

For chatbot-specific QA and production deployment steps, see [`docs/chatbot/isoke-chatbot-handbook.md`](docs/chatbot/isoke-chatbot-handbook.md).
