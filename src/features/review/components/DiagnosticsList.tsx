import { getDiagnosticsPreview } from '@/features/review/model/review-utils'
import type { ReviewReport } from '@/features/review/model/types'

type DiagnosticsListProps = {
  report: ReviewReport | null
}

export function DiagnosticsList({ report }: DiagnosticsListProps) {
  const diagnostics = report ? getDiagnosticsPreview(report.diagnostics) : []

  return (
    <section className="panel diagnostics-panel">
      <div className="panel-heading">
        <p className="eyebrow">Priority Diagnostics</p>
        <h2>What to fix first</h2>
      </div>

      {diagnostics.length === 0 ? (
        <p className="panel-copy">
          Nothing yet. When a review completes, the most important findings will surface
          here first.
        </p>
      ) : (
        <ul className="diagnostics-list">
          {diagnostics.map((diagnostic) => (
            <li
              key={`${diagnostic.filePath}:${diagnostic.rule}:${diagnostic.line ?? 0}`}
              className={`diagnostic-item diagnostic-item-${diagnostic.severity}`}
            >
              <div className="diagnostic-row">
                <span className={`severity-pill severity-${diagnostic.severity}`}>
                  {diagnostic.severity}
                </span>
                <span className={`diagnostic-category diagnostic-category-${diagnostic.severity}`}>
                  {diagnostic.category}
                </span>
              </div>
              <h3>{diagnostic.message}</h3>
              <p>{diagnostic.filePath}</p>
              <code>{diagnostic.plugin}/{diagnostic.rule}</code>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
