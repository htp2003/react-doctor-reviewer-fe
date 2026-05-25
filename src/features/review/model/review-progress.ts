import type {
  ReviewLoadingSnapshot,
  ReviewLoadingStep,
  ReviewSourceMode,
} from '@/features/review/model/types'

const publicSteps: ReviewLoadingStep[] = [
  {
    key: 'queue',
    label: 'Queueing review',
    detail: 'Preparing your request and reserving a worker.',
  },
  {
    key: 'fetch',
    label: 'Fetching repository',
    detail: 'Pulling the latest source from the GitHub URL you provided.',
  },
  {
    key: 'scan',
    label: 'Running scan',
    detail: 'Analyzing project files and collecting review diagnostics.',
  },
  {
    key: 'report',
    label: 'Compiling diagnostics',
    detail: 'Grouping findings into a clean result summary.',
  },
]

const privateSteps: ReviewLoadingStep[] = [
  {
    key: 'queue',
    label: 'Authorizing GitHub access',
    detail: 'Using your connected GitHub session to prepare repository access.',
  },
  {
    key: 'fetch',
    label: 'Fetching repository',
    detail: 'Loading the selected private repository for review.',
  },
  {
    key: 'scan',
    label: 'Running scan',
    detail: 'Analyzing project files and collecting review diagnostics.',
  },
  {
    key: 'report',
    label: 'Compiling diagnostics',
    detail: 'Grouping findings into a clean result summary.',
  },
]

const timelineDurations = [700, 1500, 5200, 2200]
const timelineProgress = [14, 34, 76, 94]
const initialProgress = 6
const settledProgress = 96

export function getReviewLoadingSteps(mode: ReviewSourceMode): ReviewLoadingStep[] {
  return mode === 'private' ? privateSteps : publicSteps
}

export function getReviewLoadingSnapshot(
  mode: ReviewSourceMode,
  elapsedMs: number,
): ReviewLoadingSnapshot {
  const steps = getReviewLoadingSteps(mode)
  const safeElapsedMs = Math.max(0, elapsedMs)
  let activeStepIndex = steps.length - 1
  let progressStart = initialProgress
  let durationCursor = 0

  for (let index = 0; index < timelineDurations.length; index += 1) {
    const duration = timelineDurations[index] ?? 0
    const progressEnd = timelineProgress[index] ?? settledProgress

    if (safeElapsedMs < durationCursor + duration) {
      const localElapsedMs = safeElapsedMs - durationCursor
      const ratio = duration === 0 ? 1 : localElapsedMs / duration
      const easedRatio = 1 - (1 - ratio) * (1 - ratio)

      activeStepIndex = index

      return {
        steps,
        activeStepIndex,
        progress: Math.round(progressStart + (progressEnd - progressStart) * easedRatio),
      }
    }

    durationCursor += duration
    progressStart = progressEnd
  }

  return {
    steps,
    activeStepIndex,
    progress: settledProgress,
  }
}
