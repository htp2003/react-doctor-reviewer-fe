import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import type { ReviewResultCardProps } from '@/features/review/components/review-component.types'
import { getReviewLoadingSnapshot } from '@/features/review/model/review-progress'

export function ReviewResultCard({
  isLoading,
  loadingTarget,
  loadingStartedAt,
}: ReviewResultCardProps) {
  const [currentTimeMs, setCurrentTimeMs] = useState(0)

  useEffect(() => {
    if (!isLoading || !loadingTarget || !loadingStartedAt) {
      return
    }

    const intervalId = window.setInterval(() => {
      setCurrentTimeMs(Date.now())
    }, 120)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [isLoading, loadingStartedAt, loadingTarget])

  if (isLoading && loadingTarget) {
    const elapsedMs = loadingStartedAt ? Math.max(0, currentTimeMs - loadingStartedAt) : 0
    const snapshot = getReviewLoadingSnapshot(loadingTarget.mode, elapsedMs)
    const activeStep = snapshot.steps[snapshot.activeStepIndex]

    return (
      <article className="panel panel-result panel-loading" aria-live="polite">
        <div className="panel-heading">
          <p className="eyebrow">Latest Result</p>
          <h2>{loadingTarget.repoLabel}</h2>
          <p className="panel-copy">{loadingTarget.sourceLabel}</p>
        </div>

        <div className="review-progress-heading">
          <div className="review-progress-copy">
            <p className="review-progress-kicker">Review in progress</p>
            <h3>{activeStep?.label ?? 'Running review'}</h3>
            <p>{activeStep?.detail ?? 'Preparing your review result.'}</p>
          </div>
          <span className="review-progress-value">{snapshot.progress}%</span>
        </div>

        <div
          className="review-progress-track"
          role="progressbar"
          aria-label="Review progress"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={snapshot.progress}
        >
          <div
            className="review-progress-bar"
            style={{ '--review-progress-width': `${snapshot.progress}%` } as CSSProperties}
          />
        </div>

        <ul className="review-progress-steps">
          {snapshot.steps.map((step, index) => {
            const stepState =
              index < snapshot.activeStepIndex
                ? 'complete'
                : index === snapshot.activeStepIndex
                  ? 'active'
                  : 'pending'

            return (
              <li
                key={step.key}
                className={`review-progress-step review-progress-step-${stepState}`}
              >
                <span className="review-progress-dot" aria-hidden="true" />
                <div>
                  <strong>{step.label}</strong>
                  <p>{step.detail}</p>
                </div>
              </li>
            )
          })}
        </ul>
      </article>
    )
  }

  return null
}
