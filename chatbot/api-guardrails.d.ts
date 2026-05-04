export declare const API_LIMITS: {
  callbackBodyBytes: number
  callbackMaxRequests: number
  chatBodyBytes: number
  chatMaxMessages: number
  chatMaxRequests: number
  chatMaxTextChars: number
  contactBodyBytes: number
  contactMaxRequests: number
  rateWindowMs: number
}

export type RateLimitResult =
  | {
      ok: true
      remaining: number
      resetAt: number
    }
  | {
      ok: false
      remaining: 0
      resetAt: number
    }

export type SanitizedVisitorProfile = {
  cityState?: string
  firstName?: string
}

export declare function getClientId(req: Request): string
export declare function checkRateLimit(options: {
  clientId: string
  limit: number
  route: string
  windowMs?: number
}): RateLimitResult
export declare function buildJsonResponse(body: Record<string, unknown>, status?: number, headers?: HeadersInit): Response
export declare function buildRateLimitResponse(result: RateLimitResult): Response
export declare function readJsonBody(
  req: Request,
  maxBytes: number,
): Promise<{ data: unknown; error?: never; status?: never } | { data?: never; error: string; status: number }>
export declare function sanitizeVisitorProfile(profile: unknown): SanitizedVisitorProfile
export declare function validateChatPayload(input: unknown):
  | {
      payload: {
        messages: unknown[]
        visitorProfile: SanitizedVisitorProfile
      }
      error?: never
    }
  | { payload?: never; error: string }
export declare function validateCallbackPayload(input: unknown):
  | {
      payload: {
        at: string
        bestTime: string
        location: string
        name: string
        phone: string
        service: string
      }
      error?: never
    }
  | { payload?: never; error: string }
export declare function validateContactPayload(input: unknown):
  | {
      payload: {
        at: string
        email: string
        message: string
        name: string
        phone: string
        subject: string
      }
      error?: never
    }
  | { payload?: never; error: string }
