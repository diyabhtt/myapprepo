import { Globe2 } from 'lucide-react'
import { LANGUAGE_OPTIONS, type SupportedLanguage } from '@/types'

interface LanguageModalProps {
  title: string
  selectedLanguage: SupportedLanguage
  onClose: () => void
  onSelect: (language: SupportedLanguage) => void
}

export function LanguageModal({ title, selectedLanguage, onClose, onSelect }: LanguageModalProps) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/50 px-4">
      <div className="card w-full max-w-md p-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-full bg-[var(--color-brand-mint)] p-2 text-[var(--color-brand-ink)]">
            <Globe2 className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[var(--color-brand-ink)]">{title}</h2>
            <p className="text-sm text-[var(--color-brand-muted)]">Change language without leaving the current experience.</p>
          </div>
        </div>
        <div className="space-y-3">
          {LANGUAGE_OPTIONS.map((language) => (
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
              <span className="font-medium text-[var(--color-brand-ink)]">{language}</span>
              {language === selectedLanguage ? <span className="text-xs font-semibold text-[var(--color-brand-teal)]">Selected</span> : null}
            </button>
          ))}
        </div>
        <div className="mt-6 flex justify-end">
          <button type="button" className="focus-ring rounded-full border border-[var(--color-brand-border)] px-4 py-2 text-sm font-medium" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
