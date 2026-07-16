import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import App from '@/App'
import { AppProvider } from '@/context/AppContext'
import { buildAssistantHref } from '@/lib/conversationRouting'

function renderApp(initialEntries: string[] = ['/']): ReturnType<typeof render> {
  sessionStorage.clear()
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <AppProvider>
        <App />
      </AppProvider>
    </MemoryRouter>,
  )
}

describe('app flows', () => {
  it('logs in with the demo member and opens the dashboard', async () => {
    renderApp()
    await userEvent.type(screen.getByPlaceholderText('Enter member ID'), 'MBR00036')
    await userEvent.type(screen.getByPlaceholderText('First name'), 'Joshua')
    await userEvent.type(screen.getByPlaceholderText('Last name'), 'Davis')
    await userEvent.type(screen.getByLabelText('Date of birth'), '1970-07-02')
    await userEvent.click(screen.getByRole('button', { name: /continue securely/i }))
    await waitFor(() => expect(screen.getByText(/good morning, joshua/i)).toBeInTheDocument())
    expect(screen.getByText(/3 active authorizations on file/i)).toBeInTheDocument()
    expect(screen.getByText(/hannah fletcher/i)).toBeInTheDocument()
    expect(screen.getByText(/isabel brown/i)).toBeInTheDocument()
    expect(screen.getByText(/jeff wright/i)).toBeInTheDocument()
  })

  it('logs in as an authorized helper and shows helper context', async () => {
    renderApp()
    await userEvent.click(screen.getByRole('button', { name: /i’m helping a member/i }))
    await userEvent.type(screen.getByPlaceholderText('Enter member ID'), 'MBR00036')
    await userEvent.type(screen.getByPlaceholderText('First name'), 'Joshua')
    await userEvent.type(screen.getByPlaceholderText('Last name'), 'Davis')
    await userEvent.type(screen.getByLabelText('Date of birth'), '1970-07-02')
    await userEvent.type(screen.getByPlaceholderText('Enter your name as listed on ROI access'), 'Isabel Brown')
    await userEvent.selectOptions(screen.getByLabelText('Relationship to member'), 'Child')
    await userEvent.click(screen.getByRole('button', { name: /continue securely/i }))
    await waitFor(() => expect(screen.getByText(/signed in as isabel brown/i)).toBeInTheDocument())
  })

  it('opens the assistant from a needs-action claim route and preserves claim context', async () => {
    renderApp([buildAssistantHref('CLM000155', 'claim:CLM000155:test-thread')])
    await waitFor(() => expect(screen.getByText(/selected claim/i)).toBeInTheDocument())
    expect(screen.getByRole('heading', { name: /upper gi endoscopy with biopsy/i })).toBeInTheDocument()
  })

  it('keeps call language inside the call screen', async () => {
    renderApp(['/call?claimId=CLM000151&conversationId=claim%3ACLM000151%3Atest-thread'])
    await waitFor(() => expect(screen.getByText(/secure voice call/i)).toBeInTheDocument())
    await userEvent.click(screen.getByRole('button', { name: /language/i }))
    await userEvent.click(screen.getByRole('button', { name: /spanish/i }))
    expect(screen.getAllByText(/spanish/i).length).toBeGreaterThan(0)
  })
})
