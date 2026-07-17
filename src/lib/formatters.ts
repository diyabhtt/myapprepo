import { CURRENT_DATE, type SupportedLanguage } from '@/types'
import { nativeLanguageName, translateUi } from '@/lib/i18n'

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
})

const longDateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'long',
  day: 'numeric',
  year: 'numeric',
})

const shortDateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
})

const timeFormatter = new Intl.DateTimeFormat('en-US', {
  hour: 'numeric',
  minute: '2-digit',
})

export function formatCurrency(value: number): string {
  return currencyFormatter.format(Number.isFinite(value) ? value : 0)
}

export function formatLongDate(value?: string): string {
  if (!value) return 'Not available'
  return longDateFormatter.format(new Date(`${value}T12:00:00`))
}

export function formatShortDate(value?: string): string {
  if (!value) return 'Not available'
  return shortDateFormatter.format(new Date(`${value}T12:00:00`))
}

export function formatTime(value: string): string {
  return timeFormatter.format(new Date(`${CURRENT_DATE}T${value}`))
}

export function formatTimer(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const remaining = seconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(remaining).padStart(2, '0')}`
}

export function maskMemberId(memberId: string): string {
  return `•••• ${memberId.slice(-4)}`
}

export function relativeToneLabel(language: SupportedLanguage): string {
  return translateUi(language, 'assistantLanguageTone', { language: nativeLanguageName(language) })
}

export function normalizeText(value: string): string {
  return value.trim().toLowerCase()
}
