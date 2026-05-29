import { Suspense } from 'react'
import { LeadsContent } from './LeadsContent'

export default function LeadsPage() {
  return (
    <Suspense fallback={<div style={{ padding: 32 }}>Loading…</div>}>
      <LeadsContent />
    </Suspense>
  )
}
