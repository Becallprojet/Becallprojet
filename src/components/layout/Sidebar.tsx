'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Image from 'next/image'
import { signOut, useSession } from 'next-auth/react'
import {
  LayoutDashboard, Users, FileText,
  ClipboardList, BookOpen, ShieldCheck, LogOut, UserCheck, GitBranch, Calendar,
} from 'lucide-react'

const navItems = [
  { href: '/',            label: 'Tableau de bord',  icon: LayoutDashboard },
  { href: '/contacts',    label: 'Prospects',         icon: Users },
  { href: '/pipeline',    label: 'Pipeline',          icon: GitBranch },
  { href: '/calendrier',  label: 'Calendrier',        icon: Calendar },
  { href: '/clients',     label: 'Clients',           icon: UserCheck },
  { href: '/devis',       label: 'Devis',             icon: FileText },
  { href: '/bdc',         label: 'Bons de commande',  icon: ClipboardList },
  { href: '/catalogue',   label: 'Catalogue',         icon: BookOpen },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const isAdmin = (session?.user as any)?.role === 'ADMIN'

  const isActive = (href: string) => href === '/' ? pathname === '/' : pathname.startsWith(href)

  return (
    <aside
      className="flex flex-col flex-shrink-0"
      style={{
        width: '256px',
        background: '#2C3E50',
        borderRight: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* Logo */}
      <div style={{ background: '#ffffff', borderBottom: '1px solid #EEF5FF' }}>
        <Image
          src="/logo.png"
          alt="BECALL"
          width={256}
          height={171}
          className="block w-full h-auto"
          style={{ maxHeight: '160px', objectFit: 'contain', padding: '4px 8px' }}
        />
      </div>

      {/* Label section */}
      <div className="px-5 pt-6 pb-2">
        <p style={{ fontSize: '10px', fontWeight: 600, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          Navigation
        </p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = isActive(href)
          return (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all"
              style={active ? {
                background: 'rgba(0, 123, 255, 0.18)',
                color: '#007BFF',
                borderLeft: '3px solid #007BFF',
                paddingLeft: '9px',
              } : {
                color: 'rgba(255,255,255,0.55)',
                borderLeft: '3px solid transparent',
                paddingLeft: '9px',
              }}
              onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)' }}
              onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
            >
              <Icon size={16} className="flex-shrink-0" strokeWidth={1.75} />
              {label}
            </Link>
          )
        })}

        {isAdmin && (
          <>
            <div className="px-3 pt-5 pb-2">
              <p style={{ fontSize: '10px', fontWeight: 600, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                Admin
              </p>
            </div>
            <Link
              href="/admin"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all"
              style={isActive('/admin') ? {
                background: 'rgba(0, 123, 255, 0.18)',
                color: '#007BFF',
                borderLeft: '3px solid #007BFF',
                paddingLeft: '9px',
              } : {
                color: 'rgba(255,255,255,0.55)',
                borderLeft: '3px solid transparent',
                paddingLeft: '9px',
              }}
              onMouseEnter={e => { if (!isActive('/admin')) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)' }}
              onMouseLeave={e => { if (!isActive('/admin')) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
            >
              <ShieldCheck size={16} strokeWidth={1.75} />
              Administration
            </Link>
          </>
        )}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        {/* Gradient bar */}
        <div className="becall-bar mb-4" />

        {session?.user && (
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              {/* Avatar */}
              <div
                className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                style={{
                  background: isAdmin
                    ? 'linear-gradient(135deg, #007BFF, #00C2FF)'
                    : 'rgba(255,255,255,0.12)',
                  color: isAdmin ? '#ffffff' : 'white',
                }}
              >
                {(session.user.name?.[0] ?? '?').toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-white truncate">{session.user.name}</p>
                <p className="text-xs truncate" style={{ color: isAdmin ? '#007BFF' : 'rgba(255,255,255,0.35)' }}>
                  {isAdmin ? 'Administrateur' : 'Utilisateur'}
                </p>
              </div>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="flex-shrink-0 transition-colors"
              style={{ color: 'rgba(255,255,255,0.3)' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#007BFF')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.3)')}
              title="Se déconnecter"
            >
              <LogOut size={15} strokeWidth={1.75} />
            </button>
          </div>
        )}
      </div>
    </aside>
  )
}
