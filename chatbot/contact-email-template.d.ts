export type ContactPayload = {
  at: string
  email: string
  message: string
  name: string
  phone?: string
  subject?: string
}

export declare const DEFAULT_CONTACT_EMAIL_FROM: string

export declare function buildContactEmailContent(payload: ContactPayload): {
  html: string
  subject: string
  text: string
}

export declare function buildContactEmailTags(payload: ContactPayload): Array<{
  name: string
  value: string
}>

export declare function resolveContactEmailConfig(env: Record<string, string | undefined>): {
  apiKey: string
  from: string
  replyTo: string
  to: string
}
