'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  Search,
  History,
  Settings,
  ChevronLeft,
  ChevronRight,
  Zap,
} from 'lucide-react'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const NAV_ITEMS = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard, shortcut: 'gd' },
  { href: '/leads', label: 'Leads', icon: Users, shortcut: 'gl' },
  { href: '/scrape', label: 'New Scrape', icon: Search, shortcut: 'n' },
  { href: '/runs', label: 'Scrape Runs', icon: History },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside
      style={{
        width: collapsed ? 64 : 240,
        minWidth: collapsed ? 64 : 240,
        background: 'var(--panel)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 200ms ease-out, min-width 200ms ease-out',
        position: 'relative',
        zIndex: 10,
      }}
    >
      {/* Brand */}
      <div
        style={{
          height: 56,
          display: 'flex',
          alignItems: 'center',
          padding: collapsed ? '0 16px' : '0 20px',
          borderBottom: '1px solid var(--border)',
          gap: 10,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: 28,
            height: 28,
            background: 'var(--electric)',
            borderRadius: 6,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Zap size={14} color="#0A0A0B" strokeWidth={2.5} />
        </div>
        {!collapsed && (
          <span
            style={{
              color: 'var(--text-primary)',
              fontWeight: 700,
              fontSize: 15,
              letterSpacing: '-0.01em',
              whiteSpace: 'nowrap',
            }}
          >
            mgcoleads
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {NAV_ITEMS.map(item => {
          const isActive = item.href === '/'
            ? pathname === '/'
            : pathname.startsWith(item.href)
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: collapsed ? '9px 14px' : '9px 12px',
                borderRadius: 8,
                background: isActive ? 'var(--panel-hover)' : 'transparent',
                border: `1px solid ${isActive ? 'var(--border-hover)' : 'transparent'}`,
                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontSize: 14,
                fontWeight: isActive ? 500 : 400,
                textDecoration: 'none',
                transition: 'all 150ms ease-out',
                overflow: 'hidden',
                whiteSpace: 'nowrap',
              }}
              className="hover:!text-[var(--text-primary)] hover:!bg-[var(--panel-hover)]"
            >
              <Icon
                size={16}
                strokeWidth={isActive ? 2 : 1.5}
                style={{ flexShrink: 0, color: isActive ? 'var(--electric)' : 'inherit' }}
              />
              {!collapsed && item.label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div
        style={{
          padding: '12px 8px',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}
      >
        {!collapsed && (
          <div
            style={{
              padding: '8px 12px',
              fontSize: 11,
              color: 'var(--text-muted)',
              letterSpacing: '0.04em',
            }}
          >
            MG&CO Technologies
          </div>
        )}
        <button
          onClick={handleSignOut}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: collapsed ? '9px 14px' : '9px 12px',
            borderRadius: 8,
            background: 'transparent',
            border: '1px solid transparent',
            color: 'var(--text-muted)',
            fontSize: 13,
            cursor: 'pointer',
            transition: 'all 150ms ease-out',
            width: '100%',
            textAlign: 'left',
          }}
          className="hover:!text-[var(--text-secondary)] hover:!bg-[var(--panel-hover)]"
        >
          {!collapsed && 'Sign out'}
        </button>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        style={{
          position: 'absolute',
          top: '50%',
          right: -12,
          transform: 'translateY(-50%)',
          width: 24,
          height: 24,
          background: 'var(--panel)',
          border: '1px solid var(--border)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: 'var(--text-muted)',
          zIndex: 20,
          transition: 'all 150ms ease-out',
        }}
        className="hover:!border-[var(--border-hover)] hover:!text-[var(--text-secondary)]"
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>
    </aside>
  )
}
