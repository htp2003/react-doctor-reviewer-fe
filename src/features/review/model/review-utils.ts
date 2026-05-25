import type { ReviewDiagnostic, ReviewReport, ReviewSourceMode, ReviewSummary, Severity } from './types'

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

  if (summary.warningCount > 0) {
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

export function getReviewSourceMode(report: ReviewReport): ReviewSourceMode {
  return report.meta.private ? 'private' : 'public'
}

export function getReviewSourceLabel(sourceMode: ReviewSourceMode): string {
  return sourceMode === 'private' ? 'Private GitHub repo' : 'Public GitHub repo'
}

export function getReviewRepoLabel(report: ReviewReport): string {
  if (report.meta.repoFullName) {
    return report.meta.repoFullName
  }

  return getRepoName(report.meta.repoUrl)
}

export function formatReviewStatus(status: string): string {
  return status.replace(/_/g, ' ')
}

export function formatReviewTimestamp(timestamp: string): string {
  const date = new Date(timestamp)

  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}
