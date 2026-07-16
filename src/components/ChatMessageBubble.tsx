import { formatShortDate } from '@/lib/formatters'
import { type ChatMessage } from '@/types'

interface ChatMessageBubbleProps {
  message: ChatMessage
}

export function ChatMessageBubble({ message }: ChatMessageBubbleProps) {
  const isAssistant = message.role === 'assistant'
  return (
    <article
      className={`message-pop max-w-3xl rounded-3xl px-4 py-3 text-sm leading-6 transition-all duration-300 ease-out ${
        isAssistant
          ? 'motion-surface lift-hover bg-white text-[var(--color-brand-ink)] shadow-sm'
          : 'ml-auto bg-[var(--color-brand-teal)] text-white shadow-[0_12px_30px_rgba(15,118,110,0.18)]'
      }`}
    >
      <div className="whitespace-pre-wrap">{message.content}</div>
      <div className={`mt-2 text-xs ${isAssistant ? 'text-[var(--color-brand-muted)]' : 'text-white/75'}`}>{formatShortDate(message.timestamp.slice(0, 10))}</div>
    </article>
  )
}
