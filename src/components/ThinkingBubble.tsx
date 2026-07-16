export function ThinkingBubble() {
  return (
    <article
      className="message-pop motion-surface max-w-3xl rounded-3xl bg-white px-4 py-3 shadow-sm"
      aria-live="polite"
      aria-label="Assistant is thinking"
    >
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 animate-bounce rounded-full bg-[var(--color-brand-muted)] [animation-delay:0ms]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-[var(--color-brand-muted)] [animation-delay:150ms]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-[var(--color-brand-muted)] [animation-delay:300ms]" />
      </div>
      <div className="mt-3 space-y-2">
        <div className="h-3 w-3/4 animate-pulse rounded-full bg-[var(--color-brand-border)]" />
        <div className="h-3 w-1/2 animate-pulse rounded-full bg-[var(--color-brand-border)]" />
      </div>
    </article>
  )
}
