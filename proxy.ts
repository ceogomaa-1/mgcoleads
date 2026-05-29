import { NextResponse, type NextRequest } from 'next/server'

// Minimal pass-through proxy.
// Auth will be re-enabled after Supabase env vars are confirmed working in Vercel.
export function proxy(request: NextRequest) {
  return NextResponse.next({ request })
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
