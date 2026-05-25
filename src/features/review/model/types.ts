export type Severity = 'error' | 'warning' | 'info'
export type ReviewStatus = 'great' | 'needs_work' | 'critical' | 'unknown'
export type ReviewSourceMode = 'public' | 'private'
export type ReviewLoadingStepKey = 'queue' | 'fetch' | 'scan' | 'report'

export type ReviewDiagnostic = {
  filePath: string
  plugin: string
  rule: string
  severity: Severity
  message: string
  help?: string
  category: string
  line?: number
  column?: number
}

export type ReviewSummary = {
  diagnosticsCount: number
  errorCount: number
  warningCount: number
  affectedFileCount: number
  totalDiagnosticCount: number
  scoreLabel: string
}

export type ReviewMeta = {
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

export type ReviewPagination = {
  page: number
  pageSize: number
  totalItems: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

export type ReviewReport = {
  reviewId?: string
  score: number | null
  status: ReviewStatus
  summary: ReviewSummary
  diagnostics: ReviewDiagnostic[]
  raw: unknown
  meta: ReviewMeta
  pagination?: ReviewPagination
}

export type ReviewApiError = {
  code: string
  message: string
}

export type ReviewApiResponse = {
  success: true
  data: ReviewReport
}

export type ReviewApiFailure = {
  success: false
  error: ReviewApiError
}

export type ReviewLoadingStep = {
  key: ReviewLoadingStepKey
  label: string
  detail: string
}

export type ReviewLoadingSnapshot = {
  steps: ReviewLoadingStep[]
  activeStepIndex: number
  progress: number
}

export type ReviewLoadingTarget = {
  mode: ReviewSourceMode
  repoLabel: string
  sourceLabel: string
  targetValue: string
}

export type ReviewRouteParams = {
  reviewId?: string
}

export type StoredReviewReport = {
  id: string
  createdAt: string
  repoLabel: string
  sourceMode: ReviewSourceMode
  sourceLabel: string
  targetValue: string
  report: ReviewReport
}

export type RecentReviewListItem = {
  id: string
  createdAt: string
  repoLabel: string
  sourceMode: ReviewSourceMode
  sourceLabel: string
  targetValue: string
  status: ReviewStatus
  score: number | null
  scoreLabel: string
  errorCount: number
  warningCount: number
  affectedFileCount: number
}

export type ReviewRequestInput =
  | {
      repoUrl: string
    }
  | {
      repoFullName: string
    }

export type ReviewRequestOptions = {
  page?: number
  pageSize?: number
}

export type GitHubUser = {
  id: number
  login: string
  avatarUrl?: string
}

export type GitHubSession = {
  connected: boolean
  user: GitHubUser | null
}

export type GitHubSessionResponse = {
  success: true
  data: GitHubSession
}

export type GitHubRepository = {
  id?: number
  fullName: string
  private?: boolean
  defaultBranch?: string
  installationId: number
  installationAccount?: string
  installationTargetType?: string
}

export type GitHubReposResponse = {
  success: true
  data: {
    repositories: GitHubRepository[]
  }
}
