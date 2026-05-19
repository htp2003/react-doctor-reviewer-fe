import type { ReviewDiagnostic, ReviewSummary, Severity } from './types'

const severityRank: Record<Severity, number> = {
  error: 0,
  warning: 1,
  info: 2,
}

export function getDiagnosticsPreview(
  diagnostics: ReviewDiagnostic[],
  limit = 8,
): ReviewDiagnostic[] {
  return [...diagnostics]
    .sort((left, right) => {
      const severityDiff = severityRank[left.severity] - severityRank[right.severity]

      if (severityDiff !== 0) {
        return severityDiff
      }

      return left.filePath.localeCompare(right.filePath)
    })
    .slice(0, limit)
}

export function formatDuration(milliseconds: number): string {
  if (milliseconds < 1000) {
    return `${Math.round(milliseconds)} ms`
  }

  return `${(milliseconds / 1000).toFixed(1)} s`
}

export function getSummaryTone(summary: ReviewSummary): string {
  if (summary.errorCount > 0) {
    return 'needs-attention'
  }

  if (summary.warningCount > 20) {
    return 'watch-list'
  }

  return 'healthy'
}

export function getRepoName(repoUrl: string): string {
  try {
    const { pathname } = new URL(repoUrl)
    const trimmedPath = pathname.replace(/^\/+|\/+$/g, '')
    const segments = trimmedPath.split('/').filter(Boolean)

    return segments.slice(-2).join('/') || repoUrl
  } catch {
    return repoUrl
  }
}
