'use client'

import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { createClient } from '@/lib/supabase/client'
import type { ScoringWeights, TierThresholds } from '@/lib/types'
import { toast } from 'sonner'

const WEIGHT_LABELS: Record<keyof ScoringWeights, string> = {
  no_website: 'No website',
  weak_website: 'Website without booking link',
  low_rating: 'Rating below 4.2',
  very_low_rating: 'Rating below 3.5',
  few_reviews: 'Fewer than 50 reviews',
  no_booking_link: 'No booking keyword in website URL',
  phone_listed: 'Phone number available',
  extended_hours: 'Extended or weekend hours',
  few_photos: 'Fewer than 5 photos',
  recently_active: 'Recent customer activity',
  missed_call_reviews: 'Reviews mention missed calls',
}

const DEFAULT_WEIGHTS: ScoringWeights = {
  no_website: 20,
  weak_website: 10,
  low_rating: 10,
  very_low_rating: 15,
  few_reviews: 10,
  no_booking_link: 12,
  phone_listed: 8,
  extended_hours: 10,
  few_photos: 10,
  recently_active: 5,
  missed_call_reviews: 15,
}

export default function SettingsPage() {
  const supabase = createClient()
  const [weights, setWeights] = useState<ScoringWeights>(DEFAULT_WEIGHTS)
  const [thresholds, setThresholds] = useState<TierThresholds>({ A: 70, B: 45 })
  const [allowedEmails, setAllowedEmails] = useState<string[]>([''])
  const [newEmail, setNewEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('settings')
        .select('key, value')
        .in('key', ['scoring_weights', 'tier_thresholds', 'allowed_emails'])

      data?.forEach(({ key, value }) => {
        if (key === 'scoring_weights') setWeights(value as ScoringWeights)
        if (key === 'tier_thresholds') setThresholds(value as TierThresholds)
        if (key === 'allowed_emails') setAllowedEmails(value as string[])
      })
      setLoading(false)
    }
    load()
  }, [])

  async function saveWeights() {
    setSaving(true)
    const { error } = await supabase
      .from('settings')
      .upsert({ key: 'scoring_weights', value: weights })
    setSaving(false)
    if (error) toast.error('Failed to save weights')
    else toast.success('Scoring weights saved')
  }

  async function saveThresholds() {
    setSaving(true)
    const { error } = await supabase
      .from('settings')
      .upsert({ key: 'tier_thresholds', value: thresholds })
    setSaving(false)
    if (error) toast.error('Failed to save thresholds')
    else toast.success('Tier thresholds saved')
  }

  async function saveEmails() {
    setSaving(true)
    const { error } = await supabase
      .from('settings')
      .upsert({ key: 'allowed_emails', value: allowedEmails.filter(Boolean) })
    setSaving(false)
    if (error) toast.error('Failed to save emails')
    else toast.success('Allowed emails saved')
  }

  async function addEmail() {
    if (!newEmail || allowedEmails.includes(newEmail)) return
    const next = [...allowedEmails, newEmail]
    setAllowedEmails(next)
    setNewEmail('')
  }

  function removeEmail(email: string) {
    setAllowedEmails(prev => prev.filter(e => e !== email))
  }

  if (loading) {
    return (
      <div style={{ maxWidth: 640 }}>
        <PageHeader label="Configuration" title="Settings" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="skeleton" style={{ height: 200, borderRadius: 12, marginBottom: 24 }} />
        ))}
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 640 }}>
      <PageHeader label="Configuration" title="Settings" />

      {/* Scoring weights */}
      <section style={sectionStyle}>
        <div style={{ marginBottom: 20 }}>
          <h2 style={sectionTitle}>Scoring Weights</h2>
          <p style={sectionDesc}>Adjust point values for each pain signal. Total score is capped at 100.</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {(Object.keys(weights) as (keyof ScoringWeights)[]).map(key => (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <label style={{ flex: 1, fontSize: 13, color: 'var(--text-secondary)' }}>
                {WEIGHT_LABELS[key]}
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                <input
                  type="range"
                  min={0}
                  max={30}
                  value={weights[key]}
                  onChange={e => setWeights({ ...weights, [key]: parseInt(e.target.value, 10) })}
                  style={{ width: 120, accentColor: 'var(--electric)', cursor: 'pointer' }}
                />
                <input
                  type="number"
                  min={0}
                  max={30}
                  value={weights[key]}
                  onChange={e => setWeights({ ...weights, [key]: Math.max(0, Math.min(30, parseInt(e.target.value, 10) || 0)) })}
                  style={{
                    width: 52,
                    background: 'var(--background)',
                    border: '1px solid var(--border)',
                    borderRadius: 6,
                    padding: '5px 8px',
                    fontSize: 13,
                    color: 'var(--text-primary)',
                    outline: 'none',
                    textAlign: 'center',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
        <button onClick={saveWeights} disabled={saving} style={saveBtnStyle}>
          {saving ? 'Saving…' : 'Save scoring weights'}
        </button>
      </section>

      {/* Tier thresholds */}
      <section style={sectionStyle}>
        <div style={{ marginBottom: 20 }}>
          <h2 style={sectionTitle}>Tier Thresholds</h2>
          <p style={sectionDesc}>Minimum scores required for Tier A and Tier B classification.</p>
        </div>
        <div style={{ display: 'flex', gap: 24, marginBottom: 20 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--tier-a)', display: 'block', marginBottom: 8 }}>
              Tier A minimum
            </label>
            <input
              type="number"
              min={0}
              max={100}
              value={thresholds.A}
              onChange={e => setThresholds({ ...thresholds, A: parseInt(e.target.value, 10) || 0 })}
              style={numberInputStyle}
            />
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--tier-b)', display: 'block', marginBottom: 8 }}>
              Tier B minimum
            </label>
            <input
              type="number"
              min={0}
              max={100}
              value={thresholds.B}
              onChange={e => setThresholds({ ...thresholds, B: parseInt(e.target.value, 10) || 0 })}
              style={numberInputStyle}
            />
          </div>
        </div>
        <button onClick={saveThresholds} disabled={saving} style={saveBtnStyle}>
          {saving ? 'Saving…' : 'Save thresholds'}
        </button>
      </section>

      {/* Allowed emails */}
      <section style={sectionStyle}>
        <div style={{ marginBottom: 20 }}>
          <h2 style={sectionTitle}>Allowed Emails</h2>
          <p style={sectionDesc}>Only these email addresses can sign in via magic link.</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
          {allowedEmails.map(email => (
            <div key={email} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                flex: 1,
                background: 'var(--background)',
                border: '1px solid var(--border)',
                borderRadius: 6,
                padding: '8px 12px',
                fontSize: 13,
                color: 'var(--text-secondary)',
              }}>
                {email}
              </span>
              <button
                onClick={() => removeEmail(email)}
                style={{
                  background: 'none',
                  border: '1px solid var(--border)',
                  borderRadius: 6,
                  padding: '7px 10px',
                  fontSize: 12,
                  color: 'var(--danger)',
                  cursor: 'pointer',
                }}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <input
            type="email"
            value={newEmail}
            onChange={e => setNewEmail(e.target.value)}
            placeholder="Add email address"
            onKeyDown={e => e.key === 'Enter' && addEmail()}
            style={{
              flex: 1,
              background: 'var(--background)',
              border: '1px solid var(--border)',
              borderRadius: 6,
              padding: '8px 12px',
              fontSize: 13,
              color: 'var(--text-primary)',
              outline: 'none',
            }}
          />
          <button onClick={addEmail} style={{ ...saveBtnStyle, marginTop: 0 }}>
            Add
          </button>
        </div>
        <button onClick={saveEmails} disabled={saving} style={saveBtnStyle}>
          {saving ? 'Saving…' : 'Save allowed emails'}
        </button>
      </section>
    </div>
  )
}

const sectionStyle: React.CSSProperties = {
  background: 'var(--panel)',
  border: '1px solid var(--border)',
  borderRadius: 12,
  padding: 24,
  marginBottom: 24,
}

const sectionTitle: React.CSSProperties = {
  fontSize: 16,
  fontWeight: 600,
  color: 'var(--text-primary)',
  marginBottom: 4,
}

const sectionDesc: React.CSSProperties = {
  fontSize: 13,
  color: 'var(--text-secondary)',
}

const saveBtnStyle: React.CSSProperties = {
  marginTop: 20,
  background: 'var(--electric)',
  color: '#0A0A0B',
  border: 'none',
  borderRadius: 8,
  padding: '8px 16px',
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'opacity 150ms ease-out',
}

const numberInputStyle: React.CSSProperties = {
  width: 80,
  background: 'var(--background)',
  border: '1px solid var(--border)',
  borderRadius: 6,
  padding: '8px 12px',
  fontSize: 18,
  fontWeight: 700,
  color: 'var(--text-primary)',
  outline: 'none',
  textAlign: 'center',
  fontVariantNumeric: 'tabular-nums',
}
