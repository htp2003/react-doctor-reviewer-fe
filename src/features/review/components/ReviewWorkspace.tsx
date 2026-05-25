import { startTransition, useEffect, useState } from 'react'
import { useDeferredValue } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  fetchGitHubRepos,
  fetchGitHubSession,
  getGitHubConnectUrl,
  logoutGitHub,
  requestReview,
} from '@/features/review/api/review-api'
import { RecentReviewsPanel } from '@/features/review/components/RecentReviewsPanel'
import { ReviewHero } from '@/features/review/components/ReviewHero'
import { ReviewResultCard } from '@/features/review/components/ReviewResultCard'
import { getRecentReviews, saveRecentReview } from '@/features/review/model/review-history'
import type {
  GitHubRepository,
  GitHubSession,
  ReviewLoadingTarget,
  ReviewSourceMode,
} from '@/features/review/model/types'
import { getRepoName } from '@/features/review/model/review-utils'
import { validateRepoUrl } from '@/shared/lib/validateRepoUrl'

type RequestState = {
  error: string | null
}

const initialUrl = 'https://github.com/millionco/react-doctor'
const initialDiagnosticsPage = 1
const initialDiagnosticsPageSize = 25

export function ReviewWorkspace() {
  const navigate = useNavigate()
  const [sourceMode, setSourceMode] = useState<ReviewSourceMode>('public')
  const [repoUrl, setRepoUrl] = useState(initialUrl)
  const [selectedRepoFullName, setSelectedRepoFullName] = useState('')
  const [requestState, setRequestState] = useState<RequestState>({
    error: null,
  })
  const [session, setSession] = useState<GitHubSession>({
    connected: false,
    user: null,
  })
  const [repositories, setRepositories] = useState<GitHubRepository[]>([])
  const [sessionError, setSessionError] = useState<string | null>(null)
  const [reposError, setReposError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingSession, setIsLoadingSession] = useState(true)
  const [isLoadingRepos, setIsLoadingRepos] = useState(false)
  const [loadingTarget, setLoadingTarget] = useState<ReviewLoadingTarget | null>(null)
  const [loadingStartedAt, setLoadingStartedAt] = useState<number | null>(null)
  const deferredRepoUrl = useDeferredValue(repoUrl)
  const recentReviews = getRecentReviews()
  const validationMessage = sourceMode === 'public' ? validateRepoUrl(deferredRepoUrl) : null

  useEffect(() => {
    async function loadSession() {
      setIsLoadingSession(true)
      setSessionError(null)

      try {
        const nextSession = await fetchGitHubSession()
        setSession(nextSession)

        if (nextSession.connected) {
          await refreshRepos()
        } else {
          setRepositories([])
          setSelectedRepoFullName('')
        }
      } catch (error) {
        setSessionError(error instanceof Error ? error.message : 'Failed to load GitHub session')
      } finally {
        setIsLoadingSession(false)
      }
    }
    void loadSession()
  }, [])

  async function refreshRepos() {
    setIsLoadingRepos(true)
    setReposError(null)

    try {
      const nextRepositories = await fetchGitHubRepos()
      setRepositories(nextRepositories)
      setSelectedRepoFullName((currentValue) => {
        if (currentValue && nextRepositories.some((repo) => repo.fullName === currentValue)) {
          return currentValue
        }

        return nextRepositories[0]?.fullName ?? ''
      })
    } catch (error) {
      setRepositories([])
      setSelectedRepoFullName('')
      setReposError(error instanceof Error ? error.message : 'Failed to load private repositories')
    } finally {
      setIsLoadingRepos(false)
    }
  }

  async function handleDisconnectGitHub() {
    try {
      await logoutGitHub()
      setSession({
        connected: false,
        user: null,
      })
      setRepositories([])
      setSelectedRepoFullName('')
      setReposError(null)
    } catch (error) {
      setSessionError(error instanceof Error ? error.message : 'Failed to disconnect GitHub')
    }
  }

  function getReviewLoadingTarget(): ReviewLoadingTarget {
    if (sourceMode === 'private') {
      return {
        mode: 'private',
        repoLabel: selectedRepoFullName,
        sourceLabel: 'Private GitHub repo',
        targetValue: selectedRepoFullName,
      }
    }

    const normalizedRepoUrl = repoUrl.trim()

    return {
      mode: 'public',
      repoLabel: getRepoName(normalizedRepoUrl),
      sourceLabel: 'Public GitHub repo',
      targetValue: normalizedRepoUrl,
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (sourceMode === 'public') {
      const normalizedRepoUrl = repoUrl.trim()
      const nextValidationMessage = validateRepoUrl(normalizedRepoUrl)

      if (nextValidationMessage) {
        setRequestState({
          error: nextValidationMessage,
        })
        return
      }
    }

    if (sourceMode === 'private' && !selectedRepoFullName) {
      setRequestState({
        error: 'Choose a private repository before running the review.',
      })
      return
    }

    const nextLoadingTarget = getReviewLoadingTarget()

    setIsSubmitting(true)
    setLoadingTarget(nextLoadingTarget)
    setLoadingStartedAt(Date.now())
    setRequestState({
      error: null,
    })

    try {
      const report =
        sourceMode === 'public'
          ? await requestReview(
              { repoUrl: repoUrl.trim() },
              { page: initialDiagnosticsPage, pageSize: initialDiagnosticsPageSize },
            )
          : await requestReview(
              { repoFullName: selectedRepoFullName },
              { page: initialDiagnosticsPage, pageSize: initialDiagnosticsPageSize },
            )
      const reviewId = saveRecentReview(report, nextLoadingTarget)

      startTransition(() => {
        navigate(
          `/review/${reviewId}?page=${initialDiagnosticsPage}&page_size=${initialDiagnosticsPageSize}`,
        )
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unexpected review error'

      setRequestState({
        error: message,
      })
    } finally {
      setIsSubmitting(false)
      setLoadingTarget(null)
      setLoadingStartedAt(null)
    }
  }

  return (
    <div className="review-page">
      <ReviewHero />

      <section className="review-builder-layout">
        <article className="panel panel-form">
          <div className="panel-heading">
            <p className="eyebrow">Repository Review</p>
            <h2>Scan a public URL or a private GitHub repository</h2>
            <p className="panel-copy">
              Public repos use a URL. Private repos use the GitHub App session from your backend.
            </p>
          </div>

          <form className="review-form" onSubmit={handleSubmit}>
            <div className="source-switch" role="tablist" aria-label="Repository source">
              <button
                className={`switch-button ${sourceMode === 'public' ? 'is-active' : ''}`}
                type="button"
                onClick={() => setSourceMode('public')}
              >
                Public URL
              </button>
              <button
                className={`switch-button ${sourceMode === 'private' ? 'is-active' : ''}`}
                type="button"
                onClick={() => setSourceMode('private')}
              >
                Private Repo
              </button>
            </div>

            {sourceMode === 'public' ? (
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
            ) : (
              <div className="private-review-panel">
                <div className="github-row">
                  <div>
                    <span className="field-label">GitHub connection</span>
                    <p className="panel-copy compact-copy">
                      {isLoadingSession
                        ? 'Checking your current GitHub session…'
                        : session.connected
                          ? `Connected as ${session.user?.login ?? 'GitHub user'}`
                          : 'Connect GitHub to load installed private repositories.'}
                    </p>
                  </div>
                  <div className="button-row">
                    {session.connected ? (
                      <>
                        <button
                          className="secondary-button"
                          type="button"
                          onClick={() => void refreshRepos()}
                          disabled={isLoadingRepos}
                        >
                          {isLoadingRepos ? 'Refreshing…' : 'Refresh repos'}
                        </button>
                        <button
                          className="secondary-button"
                          type="button"
                          onClick={() => void handleDisconnectGitHub()}
                        >
                          Disconnect
                        </button>
                      </>
                    ) : (
                      <a className="primary-button button-link" href={getGitHubConnectUrl()}>
                        Connect GitHub
                      </a>
                    )}
                  </div>
                </div>

                <label className="field">
                  <span className="field-label">Private repository</span>
                  <select
                    className="field-input field-select"
                    value={selectedRepoFullName}
                    onChange={(event) => setSelectedRepoFullName(event.target.value)}
                    disabled={!session.connected || isLoadingRepos || repositories.length === 0}
                  >
                    <option value="">
                      {session.connected
                        ? repositories.length > 0
                          ? 'Choose a repository'
                          : 'No repositories available'
                        : 'Connect GitHub first'}
                    </option>
                    {repositories.map((repo) => (
                      <option key={repo.fullName} value={repo.fullName}>
                        {repo.fullName}
                      </option>
                    ))}
                  </select>
                </label>

                {session.connected && selectedRepoFullName ? (
                  <p className="form-hint">
                    Reviewing <code>{selectedRepoFullName}</code> through GitHub App access.
                  </p>
                ) : null}
              </div>
            )}

            <div className="form-row">
              <button className="primary-button" type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Reviewing…' : 'Run review'}
              </button>
            </div>

            {validationMessage ? <p className="inline-message">{validationMessage}</p> : null}
            {sessionError ? <p className="inline-message inline-message-error">{sessionError}</p> : null}
            {reposError ? <p className="inline-message inline-message-error">{reposError}</p> : null}
            {requestState.error ? (
              <p className="inline-message inline-message-error">{requestState.error}</p>
            ) : null}
          </form>
        </article>

        <div className="review-side-stack">
          <section className="panel review-flow-panel">
            <div className="panel-heading">
              <p className="eyebrow">Review Flow</p>
              <h2>What happens after you click run</h2>
            </div>
            <ol className="review-flow-list">
              <li>We fetch the selected repository through the active source mode.</li>
              <li>React Doctor scans the project and groups diagnostics by priority.</li>
              <li>The finished result is saved locally so you can reopen it from recent reviews.</li>
            </ol>
          </section>

          <RecentReviewsPanel
            reviews={recentReviews}
            title="Recent scans"
            emptyTitle="No saved reviews yet"
            emptyMessage="Your last ten completed reviews will appear here for quick reopen."
          />
        </div>
      </section>

      <ReviewResultCard
        isLoading={isSubmitting}
        loadingTarget={loadingTarget}
        loadingStartedAt={loadingStartedAt}
      />
    </div>
  )
}
