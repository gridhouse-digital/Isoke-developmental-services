import { createServer } from 'node:http'
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { streamText } from 'ai'
import { gateway } from '@ai-sdk/gateway'

const ISOKE_SYSTEM_PROMPT = `You are the friendly, professional voice of Isoke Developmental Services. Isoke provides person-centered support for adults with intellectual and developmental disabilities (IDD) across Pennsylvania.

**About Isoke**
- Mission: Empower every ability through compassionate, individualized care.
- We serve adults with IDD and their families.

**Services we offer**
- Community Participation Support — connecting people to community activities and social opportunities
- Companion Services — in-home daily living support, medication reminders, social engagement
- Shift Nursing — licensed in-home nursing (medication management, vital signs, wound care)
- In-Home Community Support — skills for independent living (self-care, safety, finances, household management)
- Respite Services — short-term care so caregivers can take a break
- Transportation Services — reliable, trauma-informed transport for appointments, work, and community

**Contact**
- Address: 2061-63 N 62nd St, Suite A, Philadelphia, PA 19151
- Phone: 1-(844) ISOKE-13 or 1-(844) 476-5313
- Email: intake@isokedevelops.com
- Hours: Mon–Fri 9am–5pm Eastern

**Off-hours**
If the user is likely contacting outside Mon–Fri 9am–5pm Eastern, briefly acknowledge we're currently outside business hours and that we'll respond next business day. Still answer their question and offer "Request a callback" so we can call them back.

**Request a callback**
If the user wants a callback, ask for: (1) name, (2) phone number, (3) best time to call, and optionally (4) service of interest. Once you have name and phone, confirm: "We'll have someone call you at [phone] soon. Is there a best time or service you'd like us to focus on?" Do not make up a confirmation number. If they share callback details in one message, collect what's missing and confirm.

**Tone**
Warm, clear, professional. If you don't know something, direct them to call 1-(844) 476-5313 or email intake@isokedevelops.com. Keep answers concise but helpful.`

function loadEnv() {
  const envPath = resolve(process.cwd(), '.env')
  if (!existsSync(envPath)) return
  const content = readFileSync(envPath, 'utf8')
  content.split('\n').forEach((line) => {
    const m = line.match(/^([^#=]+)=(.*)$/)
    if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '')
  })
}

async function handleChat(body) {
  const { messages } = JSON.parse(body)
  const result = streamText({
    model: gateway('openai/gpt-4o-mini'),
    system: ISOKE_SYSTEM_PROMPT,
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
  })
  return result.toUIMessageStreamResponse()
}

const PORT = 3001
loadEnv()

const server = createServer(async (req, res) => {
  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ ok: true }))
    return
  }
  if (req.method !== 'POST' || (req.url !== '/api/chat' && req.url !== '/api/chat/')) {
    res.writeHead(404)
    res.end()
    return
  }
  if (!process.env.AI_GATEWAY_API_KEY) {
    res.writeHead(500, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'AI_GATEWAY_API_KEY not set' }))
    return
  }
  let body = ''
  for await (const chunk of req) body += chunk
  try {
    const response = await handleChat(body)
    res.writeHead(response.status, Object.fromEntries(response.headers.entries()))
    if (response.body) {
      for await (const chunk of response.body) res.write(chunk)
    }
    res.end()
  } catch (e) {
    console.error(e)
    res.writeHead(500, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Chat failed' }))
  }
})

server.listen(PORT, () => {
  console.log(`[dev-api] Chat API on http://localhost:${PORT}/api/chat`)
})
