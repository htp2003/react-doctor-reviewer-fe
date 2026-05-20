import { API_BASE_URL } from '@/shared/config/env'
import type {
  GitHubReposResponse,
  GitHubRepository,
  GitHubSession,
  GitHubSessionResponse,
  ReviewApiFailure,
  ReviewDiagnostic,
  ReviewReport,
  ReviewRequestInput,
  ReviewStatus,
  Severity,
} from '@/features/review/model/types'

type ServerReviewMeta = {
  repoUrl: string
  repoFullName?: string
  private?: boolean
  installationId?: number
  directory: string
  project?: string
  diff?: string
  failOn: string
  offline: boolean
  verbose: boolean
  doctorVersion: string
  elapsedMs: number
}

type ServerReviewPayload = {
  score?: number
  status?: string
  summary?: {
    diagnosticsCount?: number
  }
  diagnostics?: unknown[]
  raw: unknown
  meta: ServerReviewMeta
}

type ServerReviewApiResponse = {
  success: true
  data: ServerReviewPayload
}

type JsonObject = Record<string, unknown>

function isObject(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null
}

function normalizeSeverity(value: unknown): Severity {
  if (value === 'error' || value === 'warning' || value === 'info') {
    return value
  }

  return 'info'
}

function normalizeStatus(value: unknown): ReviewStatus {
  if (value === 'great' || value === 'needs_work' || value === 'critical' || value === 'unknown') {
    return value
  }

  return 'unknown'
}

function getNestedObject(source: JsonObject, key: string): JsonObject | null {
  const value = source[key]
  return isObject(value) ? value : null
}

function getNumberValue(source: JsonObject | null | undefined, key: string): number | null {
  if (!source) {
    return null
  }

  return typeof source[key] === 'number' ? source[key] : null
}

function getStringValue(source: JsonObject | null | undefined, key: string): string | null {
  if (!source) {
    return null
  }

  return typeof source[key] === 'string' ? source[key] : null
}

function normalizeDiagnostic(item: unknown, index: number): ReviewDiagnostic {
  const source = isObject(item) ? item : {}
  const location = isObject(source.location) ? source.location : {}

  return {
    filePath:
      typeof source.filePath === 'string'
        ? source.filePath
        : typeof source.file === 'string'
          ? source.file
          : `diagnostic-${index + 1}`,
    plugin:
      typeof source.plugin === 'string'
        ? source.plugin
        : typeof source.source === 'string'
          ? source.source
          : 'react-doctor',
    rule:
      typeof source.rule === 'string'
        ? source.rule
        : typeof source.ruleId === 'string'
          ? source.ruleId
          : 'unknown-rule',
    severity: normalizeSeverity(source.severity),
    message:
      typeof source.message === 'string'
        ? source.message
        : typeof source.description === 'string'
          ? source.description
          : 'No diagnostic message provided',
    help: typeof source.help === 'string' ? source.help : undefined,
    category:
      typeof source.category === 'string'
        ? source.category
        : typeof source.categoryName === 'string'
          ? source.categoryName
          : 'General',
    line:
      typeof source.line === 'number'
        ? source.line
        : typeof location.line === 'number'
          ? location.line
          : undefined,
    column:
      typeof source.column === 'number'
        ? source.column
        : typeof location.column === 'number'
          ? location.column
          : undefined,
  }
}

function extractRawDiagnostics(raw: unknown): unknown[] {
  const rawObject = isObject(raw) ? raw : null
  if (!rawObject) {
    return []
  }

  if (Array.isArray(rawObject.diagnostics)) {
    return rawObject.diagnostics
  }

  const projects = Array.isArray(rawObject.projects) ? rawObject.projects : []

  return projects.flatMap((project) => {
    if (!isObject(project) || !Array.isArray(project.diagnostics)) {
      return []
    }

    return project.diagnostics
  })
}

function deriveStatusFromCounts(
  score: number | null,
  errorCount: number,
  warningCount: number,
  diagnosticsCount: number,
): ReviewStatus {
  if (typeof score === 'number') {
    if (score >= 75) {
      return 'great'
    }

    if (score >= 50) {
      return 'needs_work'
    }

    return 'critical'
  }

  if (errorCount > 0) {
    return 'critical'
  }

  if (warningCount > 0) {
    return 'needs_work'
  }

  if (diagnosticsCount === 0) {
    return 'great'
  }

  return 'unknown'
}

function getScoreLabel(status: ReviewStatus, score: number | null, diagnosticsCount: number): string {
  if (typeof score === 'number') {
    return status.replace('_', ' ')
  }

  if (diagnosticsCount === 0) {
    return 'clean scan'
  }

  if (status === 'critical') {
    return 'errors found'
  }

  if (status === 'needs_work') {
    return 'warnings found'
  }

  return 'review complete'
}

function normalizeReport(payload: ServerReviewPayload): ReviewReport {
  const payloadDiagnostics = Array.isArray(payload.diagnostics) ? payload.diagnostics : []
  const rawObject = isObject(payload.raw) ? payload.raw : null
  const rawSummary = rawObject ? getNestedObject(rawObject, 'summary') : null
  const diagnosticsSource = payloadDiagnostics.length > 0 ? payloadDiagnostics : extractRawDiagnostics(payload.raw)
  const diagnostics = diagnosticsSource.map(normalizeDiagnostic)
  const uniqueFiles = new Set(diagnostics.map((diagnostic) => diagnostic.filePath))
  const errorCount = diagnostics.filter((diagnostic) => diagnostic.severity === 'error').length
  const warningCount = diagnostics.filter((diagnostic) => diagnostic.severity === 'warning').length
  const totalDiagnosticCount = diagnostics.length
  const score =
    typeof payload.score === 'number'
      ? payload.score
      : getNumberValue(rawSummary, 'score') ?? getNumberValue(rawObject, 'score')
  const status = normalizeStatus(payload.status) !== 'unknown'
    ? normalizeStatus(payload.status)
    : deriveStatusFromCounts(score, errorCount, warningCount, totalDiagnosticCount)
  const affectedFileCount =
    getNumberValue(rawSummary, 'affectedFileCount') ??
    uniqueFiles.size
  const diagnosticsCount =
    typeof payload.summary?.diagnosticsCount === 'number'
      ? payload.summary.diagnosticsCount
      : getNumberValue(rawSummary, 'diagnosticsCount') ?? totalDiagnosticCount

  return {
    score,
    status,
    diagnostics,
    raw: payload.raw,
    meta: {
      repoUrl: payload.meta.repoUrl,
      repoFullName: payload.meta.repoFullName,
      private: payload.meta.private,
      installationId: payload.meta.installationId,
      directory: payload.meta.directory,
      project: payload.meta.project,
      diff: payload.meta.diff,
      failOn: payload.meta.failOn,
      offline: payload.meta.offline,
      verbose: payload.meta.verbose,
      doctorVersion: payload.meta.doctorVersion,
      elapsedMs: payload.meta.elapsedMs,
    },
    summary: {
      diagnosticsCount,
      errorCount,
      warningCount,
      affectedFileCount,
      totalDiagnosticCount,
      scoreLabel: getStringValue(rawSummary, 'scoreLabel') ?? getScoreLabel(status, score, totalDiagnosticCount),
    },
  }
}

async function parseResponse<T>(response: Response): Promise<T | ReviewApiFailure | null> {
  return (await response.json().catch(() => null)) as T | ReviewApiFailure | null
}

function getErrorMessage(payload: ReviewApiFailure | { error?: string } | null, fallback: string): string {
  if (payload && 'error' in payload && isObject(payload.error) && typeof payload.error.message === 'string') {
    return payload.error.message
  }

  if (payload && 'error' in payload && typeof payload.error === 'string') {
    return payload.error
  }

  return fallback
}

export async function requestReview(input: ReviewRequestInput): Promise<ReviewReport> {
  const response = await fetch(`${API_BASE_URL}/api/review`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(input),
  })

  const payload = await parseResponse<ServerReviewApiResponse>(response)

  if (!response.ok || !payload || !('success' in payload) || !payload.success) {
    throw new Error(getErrorMessage(payload as ReviewApiFailure | null, 'Review request failed'))
  }

  return normalizeReport(payload.data)
}

export async function fetchGitHubSession(): Promise<GitHubSession> {
  const response = await fetch(`${API_BASE_URL}/api/github/session`, {
    credentials: 'include',
  })
  const payload = await parseResponse<GitHubSessionResponse>(response)

  if (!response.ok || !payload || !('success' in payload) || !payload.success) {
    throw new Error(getErrorMessage(payload as ReviewApiFailure | null, 'Failed to load GitHub session'))
  }

  return payload.data
}

export async function fetchGitHubRepos(): Promise<GitHubRepository[]> {
  const response = await fetch(`${API_BASE_URL}/api/github/repos`, {
    credentials: 'include',
  })
  const payload = await parseResponse<GitHubReposResponse>(response)

  if (!response.ok || !payload || !('success' in payload) || !payload.success) {
    throw new Error(getErrorMessage(payload as ReviewApiFailure | null, 'Failed to load private repositories'))
  }

  return payload.data.repositories
}

export async function logoutGitHub(): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/github/logout`, {
    method: 'POST',
    credentials: 'include',
  })

  if (!response.ok) {
    const payload = await parseResponse<ReviewApiFailure>(response)
    throw new Error(getErrorMessage(payload, 'Failed to disconnect GitHub'))
  }
}

export function getGitHubConnectUrl(): string {
  return `${API_BASE_URL}/api/github/connect`
}
