import type {
  RecentReviewListItem,
  ReviewLoadingTarget,
  ReviewReport,
  StoredReviewReport,
} from '@/features/review/model/types'

type ReviewStorageLike = {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

type SaveReviewHistoryOptions = {
  id?: string
  createdAt?: string
}

type StoredHistoryPayload = {
  reviews: StoredReviewReport[]
}

const REVIEW_HISTORY_STORAGE_KEY = 'react-doctor-review-history'
const MAX_RECENT_REVIEWS = 10

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function getStorage(storage?: ReviewStorageLike): ReviewStorageLike | null {
  if (storage) {
    return storage
  }

  if (typeof window === 'undefined') {
    return null
  }

  return window.localStorage
}

function isStoredReviewReport(value: unknown): value is StoredReviewReport {
  if (!isObject(value)) {
    return false
  }

  return (
    typeof value.id === 'string' &&
    typeof value.createdAt === 'string' &&
    typeof value.repoLabel === 'string' &&
    (value.sourceMode === 'public' || value.sourceMode === 'private') &&
    typeof value.sourceLabel === 'string' &&
    typeof value.targetValue === 'string' &&
    isObject(value.report)
  )
}

function readStoredHistory(storage?: ReviewStorageLike): StoredReviewReport[] {
  const storageClient = getStorage(storage)

  if (!storageClient) {
    return []
  }

  try {
    const rawValue = storageClient.getItem(REVIEW_HISTORY_STORAGE_KEY)

    if (!rawValue) {
      return []
    }

    const parsedValue = JSON.parse(rawValue) as unknown

    if (!isObject(parsedValue) || !Array.isArray(parsedValue.reviews)) {
      return []
    }

    return parsedValue.reviews.filter(isStoredReviewReport)
  } catch {
    return []
  }
}

function writeStoredHistory(reviews: StoredReviewReport[], storage?: ReviewStorageLike) {
  const storageClient = getStorage(storage)

  if (!storageClient) {
    return
  }

  const payload: StoredHistoryPayload = {
    reviews,
  }

  storageClient.setItem(REVIEW_HISTORY_STORAGE_KEY, JSON.stringify(payload))
}

function replaceStoredReview(
  updatedReview: StoredReviewReport,
  storage?: ReviewStorageLike,
) {
  const currentReviews = readStoredHistory(storage)
  const nextReviews = currentReviews.map((review) =>
    review.id === updatedReview.id ? updatedReview : review,
  )

  writeStoredHistory(nextReviews, storage)
}

export function createStoredReviewReport(
  report: ReviewReport,
  target: ReviewLoadingTarget,
  options?: SaveReviewHistoryOptions,
): StoredReviewReport {
  return {
    id: options?.id ?? globalThis.crypto.randomUUID(),
    createdAt: options?.createdAt ?? new Date().toISOString(),
    repoLabel: target.repoLabel,
    sourceMode: target.mode,
    sourceLabel: target.sourceLabel,
    targetValue: target.targetValue,
    report,
  }
}

export function toRecentReviewListItem(review: StoredReviewReport): RecentReviewListItem {
  return {
    id: review.id,
    createdAt: review.createdAt,
    repoLabel: review.repoLabel,
    sourceMode: review.sourceMode,
    sourceLabel: review.sourceLabel,
    targetValue: review.targetValue,
    status: review.report.status,
    score: review.report.score,
    scoreLabel: review.report.summary.scoreLabel,
    errorCount: review.report.summary.errorCount,
    warningCount: review.report.summary.warningCount,
    affectedFileCount: review.report.summary.affectedFileCount,
  }
}

export function saveRecentReview(
  report: ReviewReport,
  target: ReviewLoadingTarget,
  storage?: ReviewStorageLike,
  options?: SaveReviewHistoryOptions,
): string {
  const nextReview = createStoredReviewReport(report, target, options)
  const currentReviews = readStoredHistory(storage)
  const dedupedReviews = currentReviews.filter(
    (review) =>
      !(review.sourceMode === nextReview.sourceMode && review.targetValue === nextReview.targetValue),
  )
  const nextReviews = [nextReview, ...dedupedReviews].slice(0, MAX_RECENT_REVIEWS)

  writeStoredHistory(nextReviews, storage)

  return nextReview.id
}

export function getStoredReviewById(
  reviewId: string,
  storage?: ReviewStorageLike,
): StoredReviewReport | null {
  const reviews = readStoredHistory(storage)

  return reviews.find((review) => review.id === reviewId) ?? null
}

export function getRecentReviews(storage?: ReviewStorageLike): RecentReviewListItem[] {
  return readStoredHistory(storage).map(toRecentReviewListItem)
}

export function updateStoredReviewReport(
  reviewId: string,
  report: ReviewReport,
  storage?: ReviewStorageLike,
): StoredReviewReport | null {
  const currentReview = getStoredReviewById(reviewId, storage)

  if (!currentReview) {
    return null
  }

  const nextReview = {
    ...currentReview,
    report,
  }

  replaceStoredReview(nextReview, storage)

  return nextReview
}
