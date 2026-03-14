/**
 * POST /api/callback — forward callback lead to webhook or log.
 * Body: { name: string, phone: string, bestTime?: string, service?: string }
 * Env: CALLBACK_WEBHOOK_URL (optional) — POSTs JSON to this URL.
 *      If unset, returns 200 and logs (you can add email later).
 */
export const config = { runtime: 'edge' }

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      name?: string
      phone?: string
      bestTime?: string
      service?: string
    }
    const { name, phone, bestTime, service } = body
    if (!name || !phone) {
      return new Response(JSON.stringify({ error: 'name and phone required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    const payload = { name, phone, bestTime: bestTime ?? '', service: service ?? '', at: new Date().toISOString() }
    const webhook = process.env.CALLBACK_WEBHOOK_URL
    if (webhook) {
      const res = await fetch(webhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        return new Response(JSON.stringify({ error: 'Webhook failed' }), { status: 502, headers: { 'Content-Type': 'application/json' } })
      }
    }
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (e) {
    console.error(e)
    return new Response(JSON.stringify({ error: 'Callback failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
