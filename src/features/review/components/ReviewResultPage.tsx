import { useEffect, useRef, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { fetchReviewPage } from '@/features/review/api/review-api'
import { DiagnosticsList } from '@/features/review/components/DiagnosticsList'
import { RecentReviewsPanel } from '@/features/review/components/RecentReviewsPanel'
import {
  getRecentReviews,
  getStoredReviewById,
  updateStoredReviewReport,
} from '@/features/review/model/review-history'
import type { ReviewRouteParams } from '@/features/review/model/types'
import {
  formatDuration,
  formatReviewStatus,
  formatReviewTimestamp,
  getReviewSourceLabel,
  getSummaryTone,
} from '@/features/review/model/review-utils'

export function ReviewResultPage() {
  const { reviewId } = useParams<ReviewRouteParams>()
  const [, setSearchParams] = useSearchParams()
  const [pageError, setPageError] = useState<string | null>(null)
  const [isPageLoading, setIsPageLoading] = useState(false)
  const [, setStorageVersion] = useState(0)
  const diagnosticsSectionRef = useRef<HTMLDivElement | null>(null)
  const shouldScrollToDiagnosticsRef = useRef(false)
  const review = reviewId ? getStoredReviewById(reviewId) : null
  const recentReviews = getRecentReviews()
  const pagination = review?.report.pagination
  const currentPage = pagination?.page ?? 1

  async function handlePageChange(nextPage: number) {
    if (!reviewId || !review?.report.reviewId) {
      setPageError('This review page is not available anymore. Run a new scan to reload diagnostics.')
      return
    }

    const currentPagination = review.report.pagination
    const pageSize = currentPagination?.pageSize ?? 25

    setIsPageLoading(true)
    setPageError(null)

    try {
      const nextReport = await fetchReviewPage(review.report.reviewId, nextPage, pageSize)
      updateStoredReviewReport(reviewId, nextReport)
      shouldScrollToDiagnosticsRef.current = true
      setSearchParams({
        page: String(nextPage),
        page_size: String(pageSize),
      })
      setStorageVersion((value) => value + 1)
    } catch (error) {
      setPageError(error instanceof Error ? error.message : 'Failed to load more diagnostics')
    } finally {
      setIsPageLoading(false)
    }
  }

  useEffect(() => {
    if (!shouldScrollToDiagnosticsRef.current) {
      return
    }

    diagnosticsSectionRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
    shouldScrollToDiagnosticsRef.current = false
  }, [currentPage])

  if (!review) {
    return (
      <div className="review-detail-page">
        <section className="panel review-missing-panel">
          <p className="eyebrow">Review Result</p>
          <h1>Review not found</h1>
          <p className="panel-copy">
            This saved result is no longer available in your browser. Start a new scan to rebuild the detail view.
          </p>
          <div className="detail-actions">
            <Link className="primary-button" to="/review">
              Go to review workspace
            </Link>
          </div>
        </section>
      </div>
    )
  }

  const report = review.report
  const tone = getSummaryTone(report.summary)
  const scoreNumber = report.score ?? '—'
  const pageSize = pagination?.pageSize ?? (report.diagnostics.length > 0 ? report.diagnostics.length : 25)
  const currentPageLabel =
    pagination && pagination.totalItems > 0
      ? `${(currentPage - 1) * pageSize + 1}-${Math.min(currentPage * pageSize, pagination.totalItems)}`
      : '0-0'

  const metadataItems = [
    {
      label: 'Reviewed at',
      value: formatReviewTimestamp(review.createdAt),
    },
    {
      label: 'Source',
      value: review.sourceLabel,
    },
    {
      label: 'Runtime',
      value: formatDuration(report.meta.elapsedMs),
    },
    {
      label: 'Doctor version',
      value: report.meta.doctorVersion,
    },
    {
      label: 'Fail on',
      value: report.meta.failOn,
    },
    {
      label: 'Repository URL',
      value: report.meta.repoUrl,
    },
    {
      label: 'Directory',
      value: report.meta.directory,
    },
    {
      label: 'Project',
      value: report.meta.project,
    },
    {
      label: 'Installation ID',
      value:
        typeof report.meta.installationId === 'number'
          ? String(report.meta.installationId)
          : null,
    },
    {
      label: 'Offline',
      value: report.meta.offline ? 'Enabled' : 'Disabled',
    },
    {
      label: 'Verbose',
      value: report.meta.verbose ? 'Enabled' : 'Disabled',
    },
  ].filter((item) => item.value)

  return (
    <div className="review-detail-page">
      <div className="review-detail-topbar">
        <div>
          <p className="eyebrow">Review Result</p>
          <h1>{review.repoLabel}</h1>
          <p className="hero-copy">
            Revisit the latest diagnostics, metadata, and nearby scans without rerunning the review.
          </p>
        </div>
        <div className="detail-actions">
          <Link className="secondary-button" to="/review">
            Run another review
          </Link>
        </div>
      </div>

      <section className={`panel review-summary-panel tone-${tone} score-${report.status}`}>
        <div className="review-summary-main">
          <div className="panel-heading">
            <p className="eyebrow">Scan Snapshot</p>
            <h2>{review.repoLabel}</h2>
            <p className="panel-copy">
              {getReviewSourceLabel(review.sourceMode)} · {formatReviewStatus(report.status)}
            </p>
          </div>

          <dl className="review-summary-stats">
            <div>
              <dt>Errors</dt>
              <dd>{report.summary.errorCount}</dd>
            </div>
            <div>
              <dt>Warnings</dt>
              <dd>{report.summary.warningCount}</dd>
            </div>
            <div>
              <dt>Files hit</dt>
              <dd>{report.summary.affectedFileCount}</dd>
            </div>
            <div>
              <dt>Total diagnostics</dt>
              <dd>{pagination?.totalItems ?? report.summary.totalDiagnosticCount}</dd>
            </div>
          </dl>
        </div>

        <div className="review-summary-score">
          <div className="score-ring">
            <span className="score-number">{scoreNumber}</span>
            <span className="score-label">{report.summary.scoreLabel}</span>
          </div>
          <time className="result-meta" dateTime={review.createdAt}>
            Saved {formatReviewTimestamp(review.createdAt)}
          </time>
        </div>
      </section>

      <section className="review-detail-layout">
        <div className="review-detail-main">
          <div ref={diagnosticsSectionRef} className="review-diagnostics-section">
            <DiagnosticsList
              report={report}
              title="Diagnostics on this page"
              subtitle="Paged Findings"
              emptyMessage="This review came back clean. No diagnostics were recorded for this scan."
              limit={report.diagnostics.length}
            />

            {pagination ? (
              <section className="diagnostics-pagination-bar">
                <div className="diagnostics-pagination-copy">
                  <p className="diagnostics-pagination-summary">
                    Showing {currentPageLabel} of {pagination.totalItems}
                  </p>
                  <p className="diagnostics-pagination-meta">
                    Page {pagination.page} of {pagination.totalPages || 1}
                  </p>
                </div>
                <div className="diagnostics-pagination-actions">
                  <button
                    className="secondary-button pagination-button"
                    type="button"
                    onClick={() => void handlePageChange(pagination.page - 1)}
                    disabled={!pagination.hasPreviousPage || isPageLoading}
                  >
                    Previous
                  </button>
                  <button
                    className="secondary-button pagination-button"
                    type="button"
                    onClick={() => void handlePageChange(pagination.page + 1)}
                    disabled={!pagination.hasNextPage || isPageLoading}
                  >
                    {isPageLoading ? 'Loading…' : 'Next'}
                  </button>
                </div>
                {pageError ? (
                  <p className="inline-message inline-message-error diagnostics-pagination-error">
                    {pageError}
                  </p>
                ) : null}
              </section>
            ) : null}
          </div>

          <section className="panel review-metadata-panel">
            <div className="panel-heading">
              <p className="eyebrow">Review Metadata</p>
              <h2>Scan context</h2>
            </div>

            <dl className="review-metadata-grid">
              {metadataItems.map((item) => (
                <div key={item.label}>
                  <dt>{item.label}</dt>
                  <dd>{item.value}</dd>
                </div>
              ))}
            </dl>
          </section>
        </div>

        <div className="review-detail-sidebar">
          <RecentReviewsPanel
            reviews={recentReviews}
            activeReviewId={review.id}
            title="Recent scans"
            emptyTitle="No saved reviews yet"
            emptyMessage="Recent results will appear here after you complete a review."
          />
        </div>
      </section>
    </div>
  )
}
