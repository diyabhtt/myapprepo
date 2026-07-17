import { pickSpeechVoice, resolveSpeechLanguageFromText } from '@/services/browserSpeech'

function makeVoice(lang: string, name: string): SpeechSynthesisVoice {
  return {
    default: false,
    lang,
    localService: true,
    name,
    voiceURI: `${name}-${lang}`,
  }
}

describe('browserSpeech', () => {
  it('falls back to a Hindi voice for Nepali speech when a Nepali voice is unavailable', () => {
    const voices = [makeVoice('en-US', 'English'), makeVoice('hi-IN', 'Hindi')]

    const selected = pickSpeechVoice('Nepali', voices)

    expect(selected?.lang).toBe('hi-IN')
  })

  it('uses English speech when untranslated ASCII text is spoken under a non-Latin language', () => {
    const resolved = resolveSpeechLanguageFromText(
      'Hello. I reviewed claim CLM000151. The current status is needing action.',
      'Japanese',
    )

    expect(resolved).toBe('English')
  })

  it('keeps Japanese speech when the text is actually Japanese', () => {
    const resolved = resolveSpeechLanguageFromText('こんにちは。請求 CLM000151 を確認しました。', 'Japanese')

    expect(resolved).toBe('Japanese')
  })
})
