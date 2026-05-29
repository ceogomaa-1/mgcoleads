'use client'

import { Search } from 'lucide-react'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { useSearchStore } from '@/hooks/useSearchStore'

const BREADCRUMB_MAP: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/dashboard/leads': 'Leads',
  '/dashboard/scrape': 'New Scrape',
  '/dashboard/runs': 'Scrape Runs',
  '/dashboard/settings': 'Settings',
}

export function Topbar() {
  const pathname = usePathname()
  const router = useRouter()
  const searchRef = useRef<HTMLInputElement>(null)
  const { globalSearch, setGlobalSearch } = useSearchStore()
  const [searchValue, setSearchValue] = useState('')

  const breadcrumb = BREADCRUMB_MAP[pathname] ?? pathname.split('/').filter(Boolean).pop() ?? 'mgcoleads'

  // Keyboard shortcuts
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable
      if (!isInput && e.key === '/') {
        e.preventDefault()
        searchRef.current?.focus()
      }
      if (!isInput && e.key === 'n') {
        router.push('/dashboard/scrape')
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [router])

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    setSearchValue(val)
    if (pathname === '/dashboard/leads') {
      setGlobalSearch(val)
    }
  }

  function handleSearchKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      searchRef.current?.blur()
      setSearchValue('')
      setGlobalSearch('')
    }
    if (e.key === 'Enter' && searchValue && pathname !== '/dashboard/leads') {
      router.push(`/dashboard/leads?search=${encodeURIComponent(searchValue)}`)
    }
  }

  return (
    <header
      style={{
        height: 56,
        background: 'var(--panel)',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        paddingLeft: 24,
        paddingRight: 24,
        gap: 16,
        position: 'sticky',
        top: 0,
        zIndex: 5,
      }}
    >
      {/* Breadcrumb */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span
          style={{
            color: 'var(--text-muted)',
            fontSize: 11,
            fontWeight: 500,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          mgcoleads
        </span>
        <span style={{ color: 'var(--border-hover)' }}>/</span>
        <span style={{ color: 'var(--text-primary)', fontSize: 13, fontWeight: 500 }}>
          {breadcrumb}
        </span>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', width: 280 }}>
        <Search
          size={14}
          style={{
            position: 'absolute',
            left: 10,
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--text-muted)',
            pointerEvents: 'none',
          }}
        />
        <input
          ref={searchRef}
          type="text"
          value={searchValue}
          onChange={handleSearchChange}
          onKeyDown={handleSearchKeyDown}
          placeholder="Search leads…"
          style={{
            width: '100%',
            background: 'var(--background)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            padding: '7px 36px 7px 32px',
            fontSize: 13,
            color: 'var(--text-primary)',
            outline: 'none',
            transition: 'border-color 150ms ease-out',
          }}
          onFocus={e => { e.target.style.borderColor = 'var(--electric)' }}
          onBlur={e => { e.target.style.borderColor = 'var(--border)' }}
        />
        <kbd
          style={{
            position: 'absolute',
            right: 8,
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: 10,
            color: 'var(--text-muted)',
            background: 'var(--border)',
            borderRadius: 4,
            padding: '1px 5px',
            pointerEvents: 'none',
          }}
        >
          /
        </kbd>
      </div>
    </header>
  )
}
