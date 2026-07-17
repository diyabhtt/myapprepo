import { Globe2, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { languageMatchesSearch, languageOptionLabel, translateUi } from '@/lib/i18n'
import { LANGUAGE_OPTIONS, type SupportedLanguage } from '@/types'

interface LanguageModalProps {
  title: string
  selectedLanguage: SupportedLanguage
  onClose: () => void
  onSelect: (language: SupportedLanguage) => void
}

export function LanguageModal({ title, selectedLanguage, onClose, onSelect }: LanguageModalProps) {
  const [draftQuery, setDraftQuery] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const filteredLanguages = useMemo(
    () => LANGUAGE_OPTIONS.filter((language) => languageMatchesSearch(language, searchQuery)),
    [searchQuery],
  )

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/50 px-4">
      <div className="card w-full max-w-xl p-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-full bg-[var(--color-brand-mint)] p-2 text-[var(--color-brand-ink)]">
            <Globe2 className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[var(--color-brand-ink)]">{title}</h2>
            <p className="text-sm text-[var(--color-brand-muted)]">{translateUi(selectedLanguage, 'languageModalHint')}</p>
          </div>
        </div>
        <form
          className="mb-4 flex items-center gap-3"
          onSubmit={(event) => {
            event.preventDefault()
            setSearchQuery(draftQuery.trim())
          }}
        >
          <input
            aria-label={translateUi(selectedLanguage, 'searchLanguagesPlaceholder')}
            className="focus-ring min-w-0 flex-1 rounded-2xl border border-[var(--color-brand-border)] px-4 py-3 text-sm text-[var(--color-brand-ink)]"
            placeholder={translateUi(selectedLanguage, 'searchLanguagesPlaceholder')}
            value={draftQuery}
            onChange={(event) => {
              const nextValue = event.target.value
              setDraftQuery(nextValue)
              if (!nextValue.trim()) {
                setSearchQuery('')
              }
            }}
          />
          <button
            type="submit"
            className="focus-ring inline-flex items-center gap-2 rounded-2xl bg-[var(--color-brand-teal)] px-4 py-3 text-sm font-semibold text-white"
          >
            <Search className="h-4 w-4" />
            {translateUi(selectedLanguage, 'searchLanguages')}
          </button>
        </form>
        <div className="max-h-[420px] space-y-3 overflow-y-auto pr-1">
          {filteredLanguages.length > 0 ? (
            filteredLanguages.map((language) => (
              <button
                key={language}
                type="button"
                className={`focus-ring flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left ${
                  language === selectedLanguage
                    ? 'border-[var(--color-brand-lime)] bg-[var(--color-brand-mint)]'
                    : 'border-[var(--color-brand-border)]'
                }`}
                onClick={() => onSelect(language)}
              >
                <span className="font-medium text-[var(--color-brand-ink)]">{languageOptionLabel(language)}</span>
                {language === selectedLanguage ? (
                  <span className="text-xs font-semibold text-[var(--color-brand-teal)]">{translateUi(selectedLanguage, 'selected')}</span>
                ) : null}
              </button>
            ))
          ) : (
            <div className="rounded-2xl border border-[var(--color-brand-border)] px-4 py-5 text-sm text-[var(--color-brand-muted)]">
              {translateUi(selectedLanguage, 'noLanguagesFound')}
            </div>
          )}
        </div>
        <div className="mt-6 flex justify-end">
          <button type="button" className="focus-ring rounded-full border border-[var(--color-brand-border)] px-4 py-2 text-sm font-medium" onClick={onClose}>
            {translateUi(selectedLanguage, 'close')}
          </button>
        </div>
      </div>
    </div>
  )
}
