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

  return (
    <article className={`panel panel-result tone-${tone}`}>
      <div className="panel-heading">
        <p className="eyebrow">Latest Result</p>
        <h2>{report.projects[0]?.project.projectName ?? 'Repository result'}</h2>
      </div>

      <div className="score-ring">
        <span className="score-number">{report.summary.score}</span>
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
          <dd>{formatDuration(report.elapsedMilliseconds)}</dd>
        </div>
      </dl>

      <p className="result-meta">
        Framework: <strong>{report.projects[0]?.project.framework ?? 'unknown'}</strong>
      </p>
    </article>
  )
}
