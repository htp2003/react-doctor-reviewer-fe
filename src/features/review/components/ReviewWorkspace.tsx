import { useDeferredValue, useState } from 'react'
import type { FormEvent } from 'react'
import { requestReview } from '@/features/review/api/review-api'
import { DiagnosticsList } from '@/features/review/components/DiagnosticsList'
import { ReviewHero } from '@/features/review/components/ReviewHero'
import { ReviewResultCard } from '@/features/review/components/ReviewResultCard'
import { validateRepoUrl } from '@/shared/lib/validateRepoUrl'
import { API_BASE_URL } from '@/shared/config/env'
import type { ReviewReport } from '@/features/review/model/types'

type RequestState = {
  error: string | null
  report: ReviewReport | null
}

const initialUrl = 'https://github.com/htp2003/p-movie'

export function ReviewWorkspace() {
  const [repoUrl, setRepoUrl] = useState(initialUrl)
  const [requestState, setRequestState] = useState<RequestState>({
    error: null,
    report: null,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const deferredRepoUrl = useDeferredValue(repoUrl)
  const validationMessage = validateRepoUrl(deferredRepoUrl)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const normalizedRepoUrl = repoUrl.trim()
    const nextValidationMessage = validateRepoUrl(normalizedRepoUrl)

    if (nextValidationMessage) {
      setRequestState((currentState) => ({
        ...currentState,
        error: nextValidationMessage,
      }))
      return
    }

    setIsSubmitting(true)
    setRequestState({
      error: null,
      report: null,
    })

    try {
      const report = await requestReview(normalizedRepoUrl)

      setRequestState({
        error: null,
        report,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unexpected review error'

      setRequestState({
        error: message,
        report: null,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="review-page">
      <ReviewHero />

      <section className="review-layout">
        <article className="panel panel-form">
          <div className="panel-heading">
            <p className="eyebrow">Repository Review</p>
            <h2>Scan a GitHub repo with React Doctor</h2>
            <p className="panel-copy">
              Paste a public repository URL and get a structured frontend review from your
              backend.
            </p>
          </div>

          <form className="review-form" onSubmit={handleSubmit}>
            <label className="field">
              <span className="field-label">GitHub repository URL</span>
              <input
                className="field-input"
                name="repoUrl"
                value={repoUrl}
                onChange={(event) => setRepoUrl(event.target.value)}
                placeholder="https://github.com/owner/repository"
                autoComplete="off"
              />
            </label>

            <div className="form-row">
              <button className="primary-button" type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Reviewing…' : 'Run review'}
              </button>
              <p className="form-hint">
                Backend endpoint: <code>{API_BASE_URL}</code>
              </p>
            </div>

            {validationMessage ? <p className="inline-message">{validationMessage}</p> : null}
            {requestState.error ? (
              <p className="inline-message inline-message-error">{requestState.error}</p>
            ) : null}
          </form>
        </article>

        <ReviewResultCard report={requestState.report} />
      </section>

      <DiagnosticsList report={requestState.report} />
    </div>
  )
}
