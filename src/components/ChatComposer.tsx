import { SendHorizontal } from 'lucide-react'
import { useState } from 'react'

interface ChatComposerProps {
  placeholder: string
  onSend: (message: string) => void
}

export function ChatComposer({ placeholder, onSend }: ChatComposerProps) {
  const [value, setValue] = useState('')

  function submit(): void {
    const trimmed = value.trim()
    if (!trimmed) return
    onSend(trimmed)
    setValue('')
  }

  return (
    <div className="glow-ring motion-surface rounded-3xl border border-[var(--color-brand-border)] bg-white/96 p-3 shadow-sm backdrop-blur">
      <div className="flex items-end gap-3">
        <textarea
          aria-label="Message composer"
          className="focus-ring min-h-[64px] flex-1 resize-none rounded-2xl border-0 bg-transparent px-3 py-2 text-sm text-[var(--color-brand-ink)]"
          placeholder={placeholder}
          value={value}
          onChange={(event) => setValue(event.target.value)}
        />
        <button
          type="button"
          className="focus-ring inline-flex h-11 w-11 items-center justify-center rounded-full bg-[var(--color-brand-lime)] text-[var(--color-brand-ink)] shadow-[0_10px_24px_rgba(132,204,22,0.25)] hover:scale-105"
          aria-label="Send message"
          onClick={submit}
        >
          <SendHorizontal className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}
