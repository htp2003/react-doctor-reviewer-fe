import test from 'node:test'
import assert from 'node:assert/strict'
import {
  createStoredReviewReport,
  getRecentReviews,
  getStoredReviewById,
  saveRecentReview,
  updateStoredReviewReport,
} from '../src/features/review/model/review-history.ts'
import type { ReviewLoadingTarget, ReviewReport } from '../src/features/review/model/types.ts'

type MemoryStorageRecord = Record<string, string>

type MemoryStorage = {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

function createMemoryStorage(): MemoryStorage {
  const values: MemoryStorageRecord = {}

  return {
    getItem(key: string) {
      return values[key] ?? null
    },
    setItem(key: string, value: string) {
      values[key] = value
    },
  }
}

function createReviewReport(score: number, repoUrl: string, repoFullName?: string): ReviewReport {
  return {
    score,
    status: score >= 75 ? 'great' : score >= 50 ? 'needs_work' : 'critical',
    summary: {
      diagnosticsCount: score,
      errorCount: score >= 75 ? 0 : 1,
      warningCount: score >= 50 ? 1 : 2,
      affectedFileCount: 3,
      totalDiagnosticCount: 4,
      scoreLabel: 'review complete',
    },
    diagnostics: [],
    raw: {},
    meta: {
      repoUrl,
      repoFullName,
      private: Boolean(repoFullName),
      directory: '/tmp/review',
      failOn: 'none',
      offline: false,
      verbose: false,
      doctorVersion: '1.0.0',
      elapsedMs: 1200,
    },
  }
}

function createTarget(mode: 'public' | 'private', targetValue: string): ReviewLoadingTarget {
  return {
    mode,
    repoLabel: mode === 'private' ? targetValue : 'owner/repo',
    sourceLabel: mode === 'private' ? 'Private GitHub repo' : 'Public GitHub repo',
    targetValue,
  }
}

test('saveRecentReview stores a review and allows lookup by id', () => {
  const storage = createMemoryStorage()
  const report = createReviewReport(82, 'https://github.com/acme/app')
  const target = createTarget('public', 'https://github.com/acme/app')
  const reviewId = saveRecentReview(report, target, storage, {
    id: 'review-1',
    createdAt: '2026-05-25T10:00:00.000Z',
  })

  assert.equal(reviewId, 'review-1')
  assert.equal(getRecentReviews(storage).length, 1)
  assert.equal(getStoredReviewById(reviewId, storage)?.repoLabel, 'owner/repo')
})

test('saveRecentReview replaces older entries for the same target', () => {
  const storage = createMemoryStorage()
  const target = createTarget('public', 'https://github.com/acme/app')

  saveRecentReview(createReviewReport(82, 'https://github.com/acme/app'), target, storage, {
    id: 'review-1',
    createdAt: '2026-05-25T10:00:00.000Z',
  })
  saveRecentReview(createReviewReport(65, 'https://github.com/acme/app'), target, storage, {
    id: 'review-2',
    createdAt: '2026-05-25T11:00:00.000Z',
  })

  const reviews = getRecentReviews(storage)

  assert.equal(reviews.length, 1)
  assert.equal(reviews[0]?.id, 'review-2')
  assert.equal(reviews[0]?.score, 65)
})

test('saveRecentReview keeps the newest ten reviews first', () => {
  const storage = createMemoryStorage()

  for (let index = 0; index < 12; index += 1) {
    saveRecentReview(
      createReviewReport(90 - index, `https://github.com/acme/repo-${index}`),
      createTarget('public', `https://github.com/acme/repo-${index}`),
      storage,
      {
        id: `review-${index}`,
        createdAt: `2026-05-25T${String(index).padStart(2, '0')}:00:00.000Z`,
      },
    )
  }

  const reviews = getRecentReviews(storage)

  assert.equal(reviews.length, 10)
  assert.equal(reviews[0]?.id, 'review-11')
  assert.equal(reviews[9]?.id, 'review-2')
})

test('getStoredReviewById returns null for missing reviews', () => {
  const storage = createMemoryStorage()

  assert.equal(getStoredReviewById('missing', storage), null)
})

test('createStoredReviewReport preserves the persisted view model fields', () => {
  const report = createReviewReport(88, 'https://github.com/acme/app', 'acme/app')
  const storedReview = createStoredReviewReport(report, createTarget('private', 'acme/app'), {
    id: 'review-9',
    createdAt: '2026-05-25T12:00:00.000Z',
  })

  assert.equal(storedReview.id, 'review-9')
  assert.equal(storedReview.repoLabel, 'acme/app')
  assert.equal(storedReview.sourceMode, 'private')
  assert.equal(storedReview.report.meta.repoFullName, 'acme/app')
})

test('updateStoredReviewReport replaces the stored page data for an existing review', () => {
  const storage = createMemoryStorage()
  const target = createTarget('public', 'https://github.com/acme/app')

  saveRecentReview(createReviewReport(82, 'https://github.com/acme/app'), target, storage, {
    id: 'review-1',
    createdAt: '2026-05-25T10:00:00.000Z',
  })

  const updatedReport = {
    ...createReviewReport(82, 'https://github.com/acme/app'),
    reviewId: 'server-review-1',
    pagination: {
      page: 2,
      pageSize: 25,
      totalItems: 60,
      totalPages: 3,
      hasNextPage: true,
      hasPreviousPage: true,
    },
    diagnostics: [
      {
        filePath: 'src/page.tsx',
        plugin: 'react-doctor',
        rule: 'warning-rule',
        severity: 'warning',
        message: 'warning',
        category: 'Performance',
      },
    ],
  }

  const nextReview = updateStoredReviewReport('review-1', updatedReport, storage)

  assert.equal(nextReview?.report.reviewId, 'server-review-1')
  assert.equal(nextReview?.report.pagination?.page, 2)
  assert.equal(getStoredReviewById('review-1', storage)?.report.pagination?.totalPages, 3)
})
