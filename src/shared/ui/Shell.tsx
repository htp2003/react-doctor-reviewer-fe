import type { PropsWithChildren } from 'react'

export function Shell({ children }: PropsWithChildren) {
  return (
    <div className="app-shell">
      <div className="app-shell__glow app-shell__glow-left" />
      <div className="app-shell__glow app-shell__glow-right" />
      <main className="app-shell__content">{children}</main>
    </div>
  )
}
