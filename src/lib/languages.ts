import { type SupportedLanguage } from '@/types'

interface LanguageMetadata {
  nativeName: string
  locale: string
  voicePreferences: string[]
  searchTerms?: string[]
}

export const LANGUAGE_LOCALES: Record<SupportedLanguage, string> = {
  Amharic: 'am-ET',
  Arabic: 'ar-SA',
  Armenian: 'hy-AM',
  Bassa: 'en-US',
  Bengali: 'bn-BD',
  Cantonese: 'yue-HK',
  'Chinese (Simplified)': 'zh-CN',
  'Chinese (Traditional)': 'zh-TW',
  Croatian: 'hr-HR',
  English: 'en-US',
  Farsi: 'fa-IR',
  French: 'fr-FR',
  German: 'de-DE',
  Greek: 'el-GR',
  Gujarati: 'gu-IN',
  'Haitian Creole': 'ht-HT',
  Hebrew: 'he-IL',
  Hindi: 'hi-IN',
  Hmong: 'hmn-US',
  Igbo: 'ig-NG',
  Italian: 'it-IT',
  Japanese: 'ja-JP',
  Khmer: 'km-KH',
  Korean: 'ko-KR',
  Lao: 'lo-LA',
  'Mandarin Chinese': 'zh-CN',
  Mien: 'en-US',
  Navajo: 'en-US',
  Nepali: 'ne-NP',
  Polish: 'pl-PL',
  Portuguese: 'pt-BR',
  Punjabi: 'pa-IN',
  Russian: 'ru-RU',
  Spanish: 'es-US',
  Tagalog: 'tl-PH',
  Tamil: 'ta-IN',
  Telugu: 'te-IN',
  Thai: 'th-TH',
  Ukrainian: 'uk-UA',
  Urdu: 'ur-PK',
  Vietnamese: 'vi-VN',
  Yoruba: 'yo-NG',
}

const LANGUAGE_METADATA: Record<SupportedLanguage, LanguageMetadata> = {
  Amharic: {
    nativeName: 'አማርኛ',
    locale: 'am-ET',
    voicePreferences: ['am-ET', 'am', 'en-US', 'en'],
  },
  Arabic: {
    nativeName: 'العربية',
    locale: 'ar-SA',
    voicePreferences: ['ar-SA', 'ar-EG', 'ar', 'en-US', 'en'],
  },
  Armenian: {
    nativeName: 'Հայերեն',
    locale: 'hy-AM',
    voicePreferences: ['hy-AM', 'hy', 'en-US', 'en'],
  },
  Bassa: {
    nativeName: 'Bǎsɔ́ɔ̀̀',
    locale: 'en-US',
    voicePreferences: ['bsq-LR', 'bsq', 'en-US', 'en'],
    searchTerms: ['bassa'],
  },
  Bengali: {
    nativeName: 'বাংলা',
    locale: 'bn-BD',
    voicePreferences: ['bn-BD', 'bn-IN', 'bn', 'en-US', 'en'],
  },
  Cantonese: {
    nativeName: '廣東話',
    locale: 'yue-HK',
    voicePreferences: ['yue-HK', 'zh-HK', 'yue', 'zh-TW', 'zh-CN', 'zh', 'en-US', 'en'],
    searchTerms: ['cantonese', 'hong kong chinese'],
  },
  'Chinese (Simplified)': {
    nativeName: '简体中文',
    locale: 'zh-CN',
    voicePreferences: ['zh-CN', 'cmn-Hans-CN', 'cmn', 'zh', 'en-US', 'en'],
    searchTerms: ['simplified chinese', 'mandarin', 'chinese'],
  },
  'Chinese (Traditional)': {
    nativeName: '繁體中文',
    locale: 'zh-TW',
    voicePreferences: ['zh-TW', 'zh-HK', 'zh', 'en-US', 'en'],
    searchTerms: ['traditional chinese', 'chinese'],
  },
  Croatian: {
    nativeName: 'Hrvatski',
    locale: 'hr-HR',
    voicePreferences: ['hr-HR', 'hr', 'en-US', 'en'],
  },
  English: {
    nativeName: 'English',
    locale: 'en-US',
    voicePreferences: ['en-US', 'en'],
  },
  Farsi: {
    nativeName: 'فارسی',
    locale: 'fa-IR',
    voicePreferences: ['fa-IR', 'fa', 'en-US', 'en'],
    searchTerms: ['persian'],
  },
  French: {
    nativeName: 'Français',
    locale: 'fr-FR',
    voicePreferences: ['fr-FR', 'fr-CA', 'fr', 'en-US', 'en'],
  },
  German: {
    nativeName: 'Deutsch',
    locale: 'de-DE',
    voicePreferences: ['de-DE', 'de', 'en-US', 'en'],
  },
  Greek: {
    nativeName: 'Ελληνικά',
    locale: 'el-GR',
    voicePreferences: ['el-GR', 'el', 'en-US', 'en'],
  },
  Gujarati: {
    nativeName: 'ગુજરાતી',
    locale: 'gu-IN',
    voicePreferences: ['gu-IN', 'gu', 'hi-IN', 'hi', 'en-US', 'en'],
  },
  'Haitian Creole': {
    nativeName: 'Kreyòl Ayisyen',
    locale: 'ht-HT',
    voicePreferences: ['ht-HT', 'ht', 'fr-FR', 'fr', 'en-US', 'en'],
  },
  Hebrew: {
    nativeName: 'עברית',
    locale: 'he-IL',
    voicePreferences: ['he-IL', 'he', 'en-US', 'en'],
  },
  Hindi: {
    nativeName: 'हिन्दी',
    locale: 'hi-IN',
    voicePreferences: ['hi-IN', 'hi', 'en-US', 'en'],
  },
  Hmong: {
    nativeName: 'Hmoob',
    locale: 'hmn-US',
    voicePreferences: ['hmn-US', 'hmn', 'en-US', 'en'],
  },
  Igbo: {
    nativeName: 'Igbo',
    locale: 'ig-NG',
    voicePreferences: ['ig-NG', 'ig', 'en-US', 'en'],
    searchTerms: ['bekee'],
  },
  Italian: {
    nativeName: 'Italiano',
    locale: 'it-IT',
    voicePreferences: ['it-IT', 'it', 'en-US', 'en'],
  },
  Japanese: {
    nativeName: '日本語',
    locale: 'ja-JP',
    voicePreferences: ['ja-JP', 'ja', 'en-US', 'en'],
  },
  Khmer: {
    nativeName: 'ភាសាខ្មែរ',
    locale: 'km-KH',
    voicePreferences: ['km-KH', 'km', 'en-US', 'en'],
  },
  Korean: {
    nativeName: '한국어',
    locale: 'ko-KR',
    voicePreferences: ['ko-KR', 'ko', 'en-US', 'en'],
  },
  Lao: {
    nativeName: 'ພາສາລາວ',
    locale: 'lo-LA',
    voicePreferences: ['lo-LA', 'lo', 'th-TH', 'th', 'en-US', 'en'],
  },
  'Mandarin Chinese': {
    nativeName: '普通话',
    locale: 'zh-CN',
    voicePreferences: ['zh-CN', 'cmn-Hans-CN', 'cmn', 'zh', 'en-US', 'en'],
    searchTerms: ['mandarin', 'chinese'],
  },
  Mien: {
    nativeName: 'Mienh',
    locale: 'en-US',
    voicePreferences: ['mien', 'en-US', 'en'],
    searchTerms: ['lu mien'],
  },
  Navajo: {
    nativeName: 'Diné',
    locale: 'en-US',
    voicePreferences: ['nv-US', 'nv', 'en-US', 'en'],
  },
  Nepali: {
    nativeName: 'नेपाली',
    locale: 'ne-NP',
    voicePreferences: ['ne-NP', 'ne-IN', 'ne', 'hi-IN', 'hi', 'en-US', 'en'],
  },
  Polish: {
    nativeName: 'Polski',
    locale: 'pl-PL',
    voicePreferences: ['pl-PL', 'pl', 'en-US', 'en'],
  },
  Portuguese: {
    nativeName: 'Português',
    locale: 'pt-BR',
    voicePreferences: ['pt-BR', 'pt-PT', 'pt', 'en-US', 'en'],
  },
  Punjabi: {
    nativeName: 'ਪੰਜਾਬੀ',
    locale: 'pa-IN',
    voicePreferences: ['pa-IN', 'pa', 'hi-IN', 'hi', 'en-US', 'en'],
  },
  Russian: {
    nativeName: 'Русский',
    locale: 'ru-RU',
    voicePreferences: ['ru-RU', 'ru', 'en-US', 'en'],
  },
  Spanish: {
    nativeName: 'Español',
    locale: 'es-US',
    voicePreferences: ['es-US', 'es-MX', 'es-ES', 'es', 'en-US', 'en'],
  },
  Tagalog: {
    nativeName: 'Tagalog',
    locale: 'tl-PH',
    voicePreferences: ['tl-PH', 'fil-PH', 'tl', 'fil', 'en-US', 'en'],
    searchTerms: ['filipino'],
  },
  Tamil: {
    nativeName: 'தமிழ்',
    locale: 'ta-IN',
    voicePreferences: ['ta-IN', 'ta', 'en-US', 'en'],
  },
  Telugu: {
    nativeName: 'తెలుగు',
    locale: 'te-IN',
    voicePreferences: ['te-IN', 'te', 'hi-IN', 'hi', 'en-US', 'en'],
  },
  Thai: {
    nativeName: 'ภาษาไทย',
    locale: 'th-TH',
    voicePreferences: ['th-TH', 'th', 'en-US', 'en'],
  },
  Ukrainian: {
    nativeName: 'Українська',
    locale: 'uk-UA',
    voicePreferences: ['uk-UA', 'uk', 'en-US', 'en'],
  },
  Urdu: {
    nativeName: 'اردو',
    locale: 'ur-PK',
    voicePreferences: ['ur-PK', 'ur-IN', 'ur', 'hi-IN', 'hi', 'en-US', 'en'],
  },
  Vietnamese: {
    nativeName: 'Tiếng Việt',
    locale: 'vi-VN',
    voicePreferences: ['vi-VN', 'vi', 'en-US', 'en'],
  },
  Yoruba: {
    nativeName: 'Yorùbá',
    locale: 'yo-NG',
    voicePreferences: ['yo-NG', 'yo', 'en-US', 'en'],
    searchTerms: ['òyìnbó'],
  },
}

function normalizeText(value: string): string {
  return value.trim().toLowerCase()
}

export function nativeLanguageName(language: SupportedLanguage): string {
  return LANGUAGE_METADATA[language]?.nativeName ?? language
}

export function languageOptionLabel(language: SupportedLanguage): string {
  const nativeName = nativeLanguageName(language)
  return nativeName === language ? language : `${language} · ${nativeName}`
}

export function languageVoicePreferences(language: SupportedLanguage): string[] {
  const metadata = LANGUAGE_METADATA[language]
  return metadata?.voicePreferences ?? [metadata?.locale ?? 'en-US', 'en-US', 'en']
}

export function languageMatchesSearch(language: SupportedLanguage, query: string): boolean {
  const normalizedQuery = normalizeText(query)
  if (!normalizedQuery) return true
  const metadata = LANGUAGE_METADATA[language]
  const haystack = [
    language,
    metadata?.nativeName ?? '',
    ...(metadata?.searchTerms ?? []),
  ]
    .join(' ')
    .toLowerCase()
  return haystack.includes(normalizedQuery)
}
