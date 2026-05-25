import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ReviewResultPage } from '@/features/review/components/ReviewResultPage'
import { ReviewWorkspace } from '@/features/review/components/ReviewWorkspace'
import { Shell } from '@/shared/ui/Shell'

export function App() {
  return (
    <BrowserRouter>
      <Shell>
        <Routes>
          <Route path="/" element={<Navigate to="/review" replace />} />
          <Route path="/review" element={<ReviewWorkspace />} />
          <Route path="/review/:reviewId" element={<ReviewResultPage />} />
          <Route path="*" element={<Navigate to="/review" replace />} />
        </Routes>
      </Shell>
    </BrowserRouter>
  )
}
