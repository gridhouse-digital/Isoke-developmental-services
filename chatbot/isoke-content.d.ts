export type IsokeService = {
  name: string
  prompt: string
  shortDescription: string
}

export type WelcomeAction = {
  description: string
  id: string
  intent: string
  label: string
  text: string
}

export declare const CHATBOT_MODEL: string

export declare const ISOKE_CONTENT: {
  address: {
    city: string
    line1: string
    state: string
    zip: string
  }
  audience: string
  businessName: string
  contact: {
    afterHoursDisplay: string
    afterHoursHref: string
    businessHours: string
    email: string
    mainPhoneDisplay: string
    mainPhoneHref: string
    mainPhoneWordmark: string
  }
  onboarding: {
    locationPrompt: string
    namePrompt: string
    teaserBody: string
    teaserPrimaryText: string
    teaserSecondaryText: string
    teaserTitle: string
  }
  mission: string
  services: IsokeService[]
}

export declare const WELCOME_ACTIONS: WelcomeAction[]

export declare function buildIsokeSystemPrompt(): string
export declare function findServiceByText(text: string): IsokeService | null
