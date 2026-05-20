import type { PropsWithChildren } from 'react'

export function Shell({ children }: PropsWithChildren) {
  return (
    <div className="app-shell">
      <main className="app-shell__content">{children}</main>
    </div>
  )
}
