import { getDiagnosticsPreview } from '@/features/review/model/review-utils'
import type { DiagnosticsListProps } from '@/features/review/components/review-component.types'

export function DiagnosticsList({
  report,
  title = 'What to fix first',
  subtitle = 'Priority Diagnostics',
  emptyMessage = 'Nothing yet. When a review completes, the most important findings will surface here first.',
  limit = 8,
}: DiagnosticsListProps) {
  const diagnostics = report ? getDiagnosticsPreview(report.diagnostics, limit) : []

  return (
    <section className="panel diagnostics-panel">
      <div className="panel-heading">
        <p className="eyebrow">{subtitle}</p>
        <h2>{title}</h2>
      </div>

      {diagnostics.length === 0 ? (
        <p className="panel-copy">{emptyMessage}</p>
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
