import Link from 'next/link'

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: {
    label: string
    href?: string
    onClick?: () => void
  }
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '64px 32px',
        textAlign: 'center',
      }}
    >
      {icon && (
        <div style={{ color: 'var(--text-muted)', marginBottom: 16, fontSize: 32 }}>
          {icon}
        </div>
      )}
      <p style={{ color: 'var(--text-secondary)', fontSize: 14, fontWeight: 500, marginBottom: 6 }}>
        {title}
      </p>
      {description && (
        <p style={{ color: 'var(--text-muted)', fontSize: 13, maxWidth: 340, marginBottom: 20 }}>
          {description}
        </p>
      )}
      {action && (
        action.href ? (
          <Link
            href={action.href}
            style={{
              background: 'var(--electric)',
              color: '#0A0A0B',
              padding: '8px 16px',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              textDecoration: 'none',
              transition: 'opacity 150ms ease-out',
            }}
          >
            {action.label}
          </Link>
        ) : (
          <button
            onClick={action.onClick}
            style={{
              background: 'var(--electric)',
              color: '#0A0A0B',
              padding: '8px 16px',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
              transition: 'opacity 150ms ease-out',
            }}
          >
            {action.label}
          </button>
        )
      )}
    </div>
  )
}
