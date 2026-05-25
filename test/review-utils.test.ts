import test from 'node:test'
import assert from 'node:assert/strict'
import {
  getReviewLoadingSnapshot,
  getReviewLoadingSteps,
} from '../src/features/review/model/review-progress.ts'
import {
  getDiagnosticsPreview,
  getRepoName,
  getReviewRepoLabel,
  getReviewSourceLabel,
  getReviewSourceMode,
} from '../src/features/review/model/review-utils.ts'
import { validateRepoUrl } from '../src/shared/lib/validateRepoUrl.ts'

test('validateRepoUrl accepts github repository urls', () => {
  assert.equal(validateRepoUrl('https://github.com/htp2003/p-movie'), null)
})

test('validateRepoUrl trims surrounding whitespace', () => {
  assert.equal(validateRepoUrl('  https://github.com/htp2003/p-movie  '), null)
})

test('validateRepoUrl rejects invalid urls', () => {
  assert.equal(validateRepoUrl(''), 'Repository URL is required.')
  assert.equal(validateRepoUrl('https://gitlab.com/htp2003/p-movie'), 'Use a GitHub repository URL.')
})

test('getRepoName extracts owner and repository', () => {
  assert.equal(getRepoName('https://github.com/htp2003/p-movie'), 'htp2003/p-movie')
})

test('getDiagnosticsPreview sorts errors before warnings', () => {
  const preview = getDiagnosticsPreview(
    [
      {
        filePath: 'src/B.tsx',
        plugin: 'react-doctor',
        rule: 'warning-rule',
        severity: 'warning',
        message: 'warning',
        category: 'Performance',
      },
      {
        filePath: 'src/A.tsx',
        plugin: 'react-doctor',
        rule: 'error-rule',
        severity: 'error',
        message: 'error',
        category: 'Correctness',
      },
    ],
    2,
  )

  assert.equal(preview[0]?.severity, 'error')
  assert.equal(preview[0]?.filePath, 'src/A.tsx')
})

test('getReviewLoadingSteps adapts the first step for private repositories', () => {
  assert.equal(getReviewLoadingSteps('public')[0]?.label, 'Queueing review')
  assert.equal(getReviewLoadingSteps('private')[0]?.label, 'Authorizing GitHub access')
})

test('getReviewLoadingSnapshot advances through scan progress over time', () => {
  const snapshot = getReviewLoadingSnapshot('public', 3600)

  assert.equal(snapshot.activeStepIndex, 2)
  assert.equal(snapshot.steps[snapshot.activeStepIndex]?.label, 'Running scan')
  assert.ok(snapshot.progress >= 35)
  assert.ok(snapshot.progress <= 76)
})

test('getReviewLoadingSnapshot settles near completion while waiting for the response', () => {
  const snapshot = getReviewLoadingSnapshot('private', 20000)

  assert.equal(snapshot.activeStepIndex, 3)
  assert.equal(snapshot.progress, 96)
})

test('review view helpers map source and repo labels from report metadata', () => {
  const report = {
    score: 82,
    status: 'great',
    summary: {
      diagnosticsCount: 1,
      errorCount: 0,
      warningCount: 1,
      affectedFileCount: 1,
      totalDiagnosticCount: 1,
      scoreLabel: 'review complete',
    },
    diagnostics: [],
    raw: {},
    meta: {
      repoUrl: 'https://github.com/acme/portal',
      repoFullName: 'acme/portal',
      private: true,
      directory: '/tmp/review',
      failOn: 'none',
      offline: false,
      verbose: false,
      doctorVersion: '1.0.0',
      elapsedMs: 900,
    },
  } as const

  assert.equal(getReviewSourceMode(report), 'private')
  assert.equal(getReviewSourceLabel(getReviewSourceMode(report)), 'Private GitHub repo')
  assert.equal(getReviewRepoLabel(report), 'acme/portal')
})
