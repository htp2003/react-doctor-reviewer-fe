import { formatDuration, getSummaryTone } from '@/features/review/model/review-utils'
import type { ReviewReport } from '@/features/review/model/types'

type ReviewResultCardProps = {
  report: ReviewReport | null
}

export function ReviewResultCard({ report }: ReviewResultCardProps) {
  if (!report) {
    return (
      <article className="panel panel-result panel-empty">
        <p className="eyebrow">Result</p>
        <h2>No review yet</h2>
        <p className="panel-copy">
          Run the form on the left to inspect a repository and surface the highest-priority
          diagnostics first.
        </p>
      </article>
    )
  }

  const tone = getSummaryTone(report.summary)
  const title = report.meta.repoFullName ?? report.meta.repoUrl
  const sourceLabel = report.meta.private ? 'Private GitHub repo' : 'Public GitHub repo'
  const scoreNumber = report.score ?? '—'

  return (
    <article className={`panel panel-result tone-${tone} score-${report.status}`}>
      <div className="panel-heading">
        <p className="eyebrow">Latest Result</p>
        <h2>{title}</h2>
      </div>

      <div className="score-ring">
        <span className="score-number">{scoreNumber}</span>
        <span className="score-label">{report.summary.scoreLabel}</span>
      </div>

      <dl className="stats-grid">
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
          <dt>Runtime</dt>
          <dd>{formatDuration(report.meta.elapsedMs)}</dd>
        </div>
      </dl>

      <p className="result-meta">
        Source: <strong>{sourceLabel}</strong>
      </p>
    </article>
  )
}
