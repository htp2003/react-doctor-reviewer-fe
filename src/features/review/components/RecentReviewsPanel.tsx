import { Link } from 'react-router-dom'
import type { RecentReviewsPanelProps } from '@/features/review/components/review-component.types'
import { formatReviewStatus, formatReviewTimestamp } from '@/features/review/model/review-utils'

export function RecentReviewsPanel({
  reviews,
  activeReviewId,
  title,
  emptyTitle,
  emptyMessage,
}: RecentReviewsPanelProps) {
  return (
    <section className="panel recent-reviews-panel">
      <div className="panel-heading">
        <p className="eyebrow">Review History</p>
        <h2>{title}</h2>
      </div>

      {reviews.length === 0 ? (
        <div className="recent-reviews-empty">
          <h3>{emptyTitle}</h3>
          <p>{emptyMessage}</p>
        </div>
      ) : (
        <ul className="recent-reviews-list">
          {reviews.map((review) => (
            <li key={review.id}>
              <Link
                className={`recent-review-link ${review.id === activeReviewId ? 'is-active' : ''}`}
                to={`/review/${review.id}`}
              >
                <div className="recent-review-header">
                  <strong>{review.repoLabel}</strong>
                  <span className={`recent-review-status recent-review-status-${review.status}`}>
                    {typeof review.score === 'number' ? review.score : review.scoreLabel}
                  </span>
                </div>
                <p>{review.sourceLabel}</p>
                <dl className="recent-review-metrics">
                  <div>
                    <dt>Status</dt>
                    <dd>{formatReviewStatus(review.status)}</dd>
                  </div>
                  <div>
                    <dt>Files</dt>
                    <dd>{review.affectedFileCount}</dd>
                  </div>
                  <div>
                    <dt>Errors</dt>
                    <dd>{review.errorCount}</dd>
                  </div>
                  <div>
                    <dt>Warnings</dt>
                    <dd>{review.warningCount}</dd>
                  </div>
                </dl>
                <time className="recent-review-time" dateTime={review.createdAt}>
                  {formatReviewTimestamp(review.createdAt)}
                </time>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
