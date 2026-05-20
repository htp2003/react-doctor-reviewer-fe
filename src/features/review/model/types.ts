export type Severity = 'error' | 'warning' | 'info'
export type ReviewStatus = 'great' | 'needs_work' | 'critical' | 'unknown'
export type ReviewSourceMode = 'public' | 'private'

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

export type ReviewReport = {
  score: number | null
  status: ReviewStatus
  summary: ReviewSummary
  diagnostics: ReviewDiagnostic[]
  raw: unknown
  meta: ReviewMeta
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

export type ReviewRequestInput =
  | {
      repoUrl: string
    }
  | {
      repoFullName: string
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
