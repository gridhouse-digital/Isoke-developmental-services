export type CallbackPayload = {
  at: string
  bestTime: string
  location?: string
  name: string
  phone: string
  service: string
}

export declare const DEFAULT_CALLBACK_EMAIL_FROM: string

export declare function buildCallbackEmailContent(payload: CallbackPayload): {
  html: string
  subject: string
  text: string
}

export declare function buildCallbackEmailTags(payload: CallbackPayload): Array<{
  name: string
  value: string
}>

export declare function normalizeEmailAddress(value: string | undefined): string
export declare function normalizeEmailList(value: string | undefined): string[]
export declare function normalizeEnvValue(value: string | undefined): string
