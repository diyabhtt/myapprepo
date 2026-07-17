import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LanguageModal } from '@/components/LanguageModal'

describe('LanguageModal', () => {
  it('filters the alphabetical language list with the search control', async () => {
    render(
      <LanguageModal
        title="Chat language"
        selectedLanguage="English"
        onClose={() => {}}
        onSelect={() => {}}
      />,
    )

    expect(screen.getByRole('button', { name: /amharic/i })).toBeInTheDocument()

    await userEvent.type(screen.getByLabelText('Search languages'), 'tel')
    await userEvent.click(screen.getByRole('button', { name: /search/i }))

    expect(screen.getByRole('button', { name: /telugu/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /amharic/i })).not.toBeInTheDocument()
  })
})
