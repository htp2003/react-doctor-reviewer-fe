import { useEffect, useState } from 'react'
import { useDeferredValue } from 'react'
import type { FormEvent } from 'react'
import {
  fetchGitHubRepos,
  fetchGitHubSession,
  getGitHubConnectUrl,
  logoutGitHub,
  requestReview,
} from '@/features/review/api/review-api'
import { DiagnosticsList } from '@/features/review/components/DiagnosticsList'
import { ReviewHero } from '@/features/review/components/ReviewHero'
import { ReviewResultCard } from '@/features/review/components/ReviewResultCard'
import type {
  GitHubRepository,
  GitHubSession,
  ReviewReport,
  ReviewSourceMode,
} from '@/features/review/model/types'
import { API_BASE_URL } from '@/shared/config/env'
import { validateRepoUrl } from '@/shared/lib/validateRepoUrl'

type RequestState = {
  error: string | null
  report: ReviewReport | null
}

const initialUrl = 'https://github.com/millionco/react-doctor'

export function ReviewWorkspace() {
  const [sourceMode, setSourceMode] = useState<ReviewSourceMode>('public')
  const [repoUrl, setRepoUrl] = useState(initialUrl)
  const [selectedRepoFullName, setSelectedRepoFullName] = useState('')
  const [requestState, setRequestState] = useState<RequestState>({
    error: null,
    report: null,
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
  const deferredRepoUrl = useDeferredValue(repoUrl)
  const validationMessage = sourceMode === 'public' ? validateRepoUrl(deferredRepoUrl) : null

  useEffect(() => {
    void refreshSession()
  }, [])

  async function refreshSession() {
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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (sourceMode === 'public') {
      const normalizedRepoUrl = repoUrl.trim()
      const nextValidationMessage = validateRepoUrl(normalizedRepoUrl)

      if (nextValidationMessage) {
        setRequestState((currentState) => ({
          ...currentState,
          error: nextValidationMessage,
        }))
        return
      }
    }

    if (sourceMode === 'private' && !selectedRepoFullName) {
      setRequestState({
        error: 'Choose a private repository before running the review.',
        report: null,
      })
      return
    }

    setIsSubmitting(true)
    setRequestState({
      error: null,
      report: null,
    })

    try {
      const report =
        sourceMode === 'public'
          ? await requestReview({ repoUrl: repoUrl.trim() })
          : await requestReview({ repoFullName: selectedRepoFullName })

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
              <p className="form-hint">
                Backend endpoint: <code>{API_BASE_URL}</code>
              </p>
            </div>

            {validationMessage ? <p className="inline-message">{validationMessage}</p> : null}
            {sessionError ? <p className="inline-message inline-message-error">{sessionError}</p> : null}
            {reposError ? <p className="inline-message inline-message-error">{reposError}</p> : null}
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
