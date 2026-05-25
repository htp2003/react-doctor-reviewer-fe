import type {
  RecentReviewListItem,
  ReviewLoadingTarget,
  ReviewReport,
  StoredReviewReport,
} from '@/features/review/model/types'

export type DiagnosticsListProps = {
  report: ReviewReport | null
  title?: string
  subtitle?: string
  emptyMessage?: string
  limit?: number
}

export type ReviewResultCardProps = {
  isLoading: boolean
  loadingTarget: ReviewLoadingTarget | null
  loadingStartedAt: number | null
}

export type RecentReviewsPanelProps = {
  reviews: RecentReviewListItem[]
  activeReviewId?: string
  title: string
  emptyTitle: string
  emptyMessage: string
}

export type ReviewResultPageLayoutProps = {
  review: StoredReviewReport
  recentReviews: RecentReviewListItem[]
}
