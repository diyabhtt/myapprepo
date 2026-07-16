import type { ReactNode } from 'react'
import { useEffect } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useAppContext } from '@/context/AppContext'
import { AssistantPage } from '@/pages/AssistantPage'
import { CallPage } from '@/pages/CallPage'
import { ClaimsPage } from '@/pages/ClaimsPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { LoginPage } from '@/pages/LoginPage'

function RequireMember({ children }: { children: ReactNode }) {
  const { currentMember } = useAppContext()
  const location = useLocation()
  if (!currentMember) {
    return <Navigate to="/" replace state={{ from: location.pathname }} />
  }
  return children
}

export default function App() {
  const location = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [location.pathname, location.search])

  return (
    <div key={`${location.pathname}${location.search}`} className="page-shell">
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route
          path="/dashboard"
          element={
            <RequireMember>
              <DashboardPage />
            </RequireMember>
          }
        />
        <Route
          path="/claims"
          element={
            <RequireMember>
              <ClaimsPage />
            </RequireMember>
          }
        />
        <Route path="/assistant" element={<AssistantPage />} />
        <Route path="/call" element={<CallPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}
