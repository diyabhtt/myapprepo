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

const languageMap: Record<SupportedLanguage, string> = {
  English: 'en-US',
  Spanish: 'es-US',
  Nepali: 'ne-NP',
  Hindi: 'hi-IN',
  Korean: 'ko-KR',
  Vietnamese: 'vi-VN',
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
  recognition.lang = languageMap[language]
  return recognition
}

export function speakText(text: string, language: SupportedLanguage, onEnd?: () => void): boolean {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    onEnd?.()
    return false
  }
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = languageMap[language]
  utterance.rate = 1
  utterance.onend = () => onEnd?.()
  window.speechSynthesis.speak(utterance)
  return true
}
