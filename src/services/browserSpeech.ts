import { LANGUAGE_LOCALES, languageVoicePreferences } from '@/lib/languages'
import { type SupportedLanguage } from '@/types'

export interface BrowserSpeechRecognitionAlternative {
  transcript: string
}

export interface BrowserSpeechRecognitionResult {
  isFinal: boolean
  length: number
  [index: number]: BrowserSpeechRecognitionAlternative
}

export interface BrowserSpeechRecognitionEvent {
  resultIndex: number
  results: ArrayLike<BrowserSpeechRecognitionResult>
}

export interface BrowserSpeechRecognition {
  continuous: boolean
  interimResults: boolean
  lang: string
  onresult: ((event: BrowserSpeechRecognitionEvent) => void) | null
  onerror: ((event: { error: string }) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
  abort: () => void
}

type SpeechRecognitionCtor = new () => BrowserSpeechRecognition

function normalizeLocale(value: string | undefined): string {
  return (value ?? '').trim().toLowerCase()
}

const NON_LATIN_SCRIPT_LANGUAGES = new Set<SupportedLanguage>([
  'Amharic',
  'Arabic',
  'Armenian',
  'Bengali',
  'Cantonese',
  'Chinese (Simplified)',
  'Chinese (Traditional)',
  'Farsi',
  'Greek',
  'Gujarati',
  'Hebrew',
  'Hindi',
  'Japanese',
  'Khmer',
  'Korean',
  'Lao',
  'Mandarin Chinese',
  'Nepali',
  'Punjabi',
  'Russian',
  'Tamil',
  'Telugu',
  'Thai',
  'Ukrainian',
  'Urdu',
])

function looksMostlyAscii(text: string): boolean {
  const compact = text.replace(/\s+/g, '')
  if (!compact) return false
  const asciiCharacters = compact.replace(/[^\x00-\x7F]/g, '').length
  return asciiCharacters / compact.length > 0.9
}

export function resolveSpeechLanguageFromText(text: string, preferredLanguage: SupportedLanguage): SupportedLanguage {
  const trimmed = text.trim()
  if (!trimmed) return preferredLanguage

  if (/[\u3040-\u30ff]/u.test(trimmed)) return 'Japanese'
  if (/[\uac00-\ud7af]/u.test(trimmed)) return 'Korean'
  if (/[\u1780-\u17ff]/u.test(trimmed)) return 'Khmer'
  if (/[\u0e80-\u0eff]/u.test(trimmed)) return 'Lao'
  if (/[\u0e00-\u0e7f]/u.test(trimmed)) return 'Thai'
  if (/[\u0c00-\u0c7f]/u.test(trimmed)) return 'Telugu'
  if (/[\u0b80-\u0bff]/u.test(trimmed)) return 'Tamil'
  if (/[\u0a80-\u0aff]/u.test(trimmed)) return 'Gujarati'
  if (/[\u0980-\u09ff]/u.test(trimmed)) return 'Bengali'
  if (/[\u0a00-\u0a7f]/u.test(trimmed)) return 'Punjabi'
  if (/[\u0900-\u097f]/u.test(trimmed)) return preferredLanguage === 'Nepali' ? 'Nepali' : 'Hindi'
  if (/[\u0590-\u05ff]/u.test(trimmed)) return 'Hebrew'
  if (/[\u0530-\u058f]/u.test(trimmed)) return 'Armenian'
  if (/[\u0370-\u03ff]/u.test(trimmed)) return 'Greek'
  if (/[\u1200-\u137f]/u.test(trimmed)) return 'Amharic'
  if (/[\u0400-\u04ff]/u.test(trimmed)) {
    return preferredLanguage === 'Ukrainian' ? 'Ukrainian' : 'Russian'
  }
  if (/[\u0600-\u06ff\u0750-\u077f\u08a0-\u08ff]/u.test(trimmed)) {
    if (preferredLanguage === 'Farsi') return 'Farsi'
    if (preferredLanguage === 'Urdu') return 'Urdu'
    return 'Arabic'
  }
  if (/[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/u.test(trimmed)) {
    if (preferredLanguage === 'Chinese (Traditional)' || preferredLanguage === 'Cantonese') {
      return preferredLanguage
    }
    if (preferredLanguage === 'Japanese') return 'Japanese'
    return preferredLanguage === 'Mandarin Chinese' ? 'Mandarin Chinese' : 'Chinese (Simplified)'
  }
  if (looksMostlyAscii(trimmed) && NON_LATIN_SCRIPT_LANGUAGES.has(preferredLanguage)) {
    return 'English'
  }

  return preferredLanguage
}

export function pickSpeechVoice(language: SupportedLanguage, voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | undefined {
  if (!voices.length) return undefined

  const preferences = languageVoicePreferences(language).map(normalizeLocale)
  for (const preference of preferences) {
    const exactMatch = voices.find((voice) => normalizeLocale(voice.lang) === preference)
    if (exactMatch) return exactMatch
  }

  const baseLanguages = preferences.map((locale) => locale.split('-')[0])
  for (const baseLanguage of baseLanguages) {
    const baseMatch = voices.find((voice) => normalizeLocale(voice.lang).split('-')[0] === baseLanguage)
    if (baseMatch) return baseMatch
  }

  return voices[0]
}

function getRecognitionCtor(): SpeechRecognitionCtor | undefined {
  if (typeof window === 'undefined') return undefined
  const extendedWindow = window as Window & {
    SpeechRecognition?: SpeechRecognitionCtor
    webkitSpeechRecognition?: SpeechRecognitionCtor
  }
  return extendedWindow.SpeechRecognition ?? extendedWindow.webkitSpeechRecognition
}

export function browserSpeechSupported(): boolean {
  return Boolean(getRecognitionCtor())
}

export function createSpeechRecognition(language: SupportedLanguage): BrowserSpeechRecognition | null {
  const Recognition = getRecognitionCtor()
  if (!Recognition) return null
  const recognition = new Recognition()
  recognition.continuous = true
  recognition.interimResults = true
  recognition.lang = LANGUAGE_LOCALES[language]
  return recognition
}

export function speakText(
  text: string,
  language: SupportedLanguage,
  onEnd?: () => void,
  contentLanguage?: SupportedLanguage,
): boolean {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    onEnd?.()
    return false
  }

  const synth = window.speechSynthesis
  synth.cancel()

  const resolvedLanguage = contentLanguage ?? resolveSpeechLanguageFromText(text, language)
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = LANGUAGE_LOCALES[resolvedLanguage]
  utterance.rate = 1

  let finished = false
  utterance.onend = () => {
    finished = true
    onEnd?.()
  }
  utterance.onerror = () => {
    if (finished) return
    finished = true
    onEnd?.()
  }

  let started = false
  const startSpeaking = () => {
    if (started) return
    started = true
    const voices = synth.getVoices()
    const voice = pickSpeechVoice(resolvedLanguage, voices)
    if (voice) {
      utterance.voice = voice
      utterance.lang = voice.lang || utterance.lang
    }
    synth.speak(utterance)
  }

  const voices = synth.getVoices()
  if (voices.length > 0) {
    startSpeaking()
    return true
  }

  const handleVoicesChanged = () => {
    if (typeof synth.removeEventListener === 'function') {
      synth.removeEventListener('voiceschanged', handleVoicesChanged)
    }
    startSpeaking()
  }

  if (typeof synth.addEventListener === 'function') {
    synth.addEventListener('voiceschanged', handleVoicesChanged)
  }

  window.setTimeout(startSpeaking, 150)
  return true
}
