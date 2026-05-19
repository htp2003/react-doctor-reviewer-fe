export type Severity = 'error' | 'warning' | 'info'

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
  errorCount: number
  warningCount: number
  affectedFileCount: number
  totalDiagnosticCount: number
  score: number
  scoreLabel: string
}

export type ReviewProject = {
  directory: string
  project: {
    rootDirectory: string
    projectName: string
    reactVersion: string
    framework: string
    hasTypeScript: boolean
    hasReactCompiler: boolean
    hasTanStackQuery: boolean
    sourceFileCount: number
  }
  diagnostics: ReviewDiagnostic[]
}

export type ReviewReport = {
  schemaVersion: number
  version: string
  ok: boolean
  directory: string
  mode: string
  projects: ReviewProject[]
  diagnostics: ReviewDiagnostic[]
  summary: ReviewSummary
  elapsedMilliseconds: number
}

export type ReviewApiResponse = {
  success: boolean
  data: ReviewReport
}

export type ReviewFormState = {
  repoUrl: string
}
