import type { LucideIcon } from 'lucide-react'

export type CallbackDetails = {
  bestTime: string
  location?: string
  name: string
  phone: string
  service: string
}

export type CallbackNotice = {
  tone: 'error' | 'success'
  text: string
}

export type ChatWidgetTheme = {
  accent: string
  actionBg: string
  actionBorder: string
  assistantBg: string
  assistantBorder: string
  badgeBg: string
  badgeText: string
  canvasBg: string
  footerBg: string
  footerBorder: string
  headerText: string
  inputBg: string
  inputBorder: string
  linkAccent: string
  mutedText: string
  pillBg: string
  shellBg: string
  shellBorder: string
  shellShadow: string
  softBg: string
  softBorder: string
  statusBg: string
  surfaceBg: string
  surfaceSecondaryBg: string
  text: string
}

export type ProfilePromptConfig = {
  cta: string
  icon: LucideIcon
  placeholder: string
  prompt: string
  secondary: string
  title: string
}
