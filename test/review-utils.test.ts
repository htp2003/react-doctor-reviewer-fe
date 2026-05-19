import test from 'node:test'
import assert from 'node:assert/strict'
import { getDiagnosticsPreview, getRepoName } from '../src/features/review/model/review-utils.ts'
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
