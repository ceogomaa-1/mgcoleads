import { notFound, redirect } from 'next/navigation'

// Redirect /leads/:id to /leads with drawer open
export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  redirect(`/leads?lead=${id}`)
}
