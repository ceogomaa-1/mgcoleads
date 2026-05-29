'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/api/auth/callback`,
      },
    })

    setLoading(false)

    if (error) {
      toast.error(error.message)
      return
    }

    setSent(true)
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: 'var(--background)' }}
    >
      {/* Subtle grid pattern */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(circle at 50% 0%, rgba(0, 217, 255, 0.04) 0%, transparent 70%)',
        }}
      />

      <div
        className="relative w-full max-w-sm mx-4"
        style={{
          background: 'var(--panel)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '40px',
        }}
      >
        {/* Logo / Brand */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-6">
            <div
              style={{
                width: 32,
                height: 32,
                background: 'var(--electric)',
                borderRadius: 6,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span style={{ color: '#0A0A0B', fontWeight: 700, fontSize: 14 }}>M</span>
            </div>
            <span style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: 16 }}>
              mgcoleads
            </span>
          </div>
          <h1
            style={{
              color: 'var(--text-primary)',
              fontSize: 22,
              fontWeight: 600,
              marginBottom: 8,
            }}
          >
            Sign in
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
            Enter your email to receive a magic link.
          </p>
        </div>

        {sent ? (
          <div
            style={{
              background: 'rgba(0, 217, 255, 0.08)',
              border: '1px solid rgba(0, 217, 255, 0.2)',
              borderRadius: 8,
              padding: '16px',
              textAlign: 'center',
            }}
          >
            <p style={{ color: 'var(--electric)', fontWeight: 600, marginBottom: 4 }}>
              Check your inbox
            </p>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
              We sent a magic link to{' '}
              <strong style={{ color: 'var(--text-primary)' }}>{email}</strong>
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label
                htmlFor="email"
                style={{
                  display: 'block',
                  fontSize: 11,
                  fontWeight: 500,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: 'var(--text-muted)',
                  marginBottom: 8,
                }}
              >
                Email address
              </label>
              <input
                id="email"
                type="email"
                required
                autoFocus
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                style={{
                  width: '100%',
                  background: 'var(--background)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  padding: '10px 14px',
                  fontSize: 14,
                  color: 'var(--text-primary)',
                  outline: 'none',
                  transition: 'border-color 150ms ease-out',
                }}
                onFocus={e => {
                  e.target.style.borderColor = 'var(--electric)'
                }}
                onBlur={e => {
                  e.target.style.borderColor = 'var(--border)'
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading || !email}
              style={{
                width: '100%',
                background: loading || !email ? 'rgba(0, 217, 255, 0.3)' : 'var(--electric)',
                color: loading || !email ? 'rgba(10, 10, 11, 0.5)' : '#0A0A0B',
                border: 'none',
                borderRadius: 8,
                padding: '10px 16px',
                fontSize: 14,
                fontWeight: 600,
                cursor: loading || !email ? 'not-allowed' : 'pointer',
                transition: 'all 150ms ease-out',
              }}
            >
              {loading ? 'Sending…' : 'Send magic link'}
            </button>
          </form>
        )}

        <p
          style={{
            marginTop: 24,
            fontSize: 12,
            color: 'var(--text-muted)',
            textAlign: 'center',
          }}
        >
          MG&CO Technologies — internal use only
        </p>
      </div>
    </div>
  )
}
