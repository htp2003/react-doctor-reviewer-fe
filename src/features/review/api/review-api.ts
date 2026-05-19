import type { ReviewApiResponse, ReviewReport } from '@/features/review/model/types'
import { API_BASE_URL } from '@/shared/config/env'

export async function requestReview(repoUrl: string): Promise<ReviewReport> {
  const response = await fetch(`${API_BASE_URL}/api/review`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ repoUrl }),
  })

  const payload = (await response.json().catch(() => null)) as
    | ReviewApiResponse
    | { error?: string }
    | null

  if (!response.ok || !payload || !('success' in payload)) {
    const message =
      payload && 'error' in payload && typeof payload.error === 'string'
        ? payload.error
        : 'Review request failed'

    throw new Error(message)
  }

  return payload.data
}
