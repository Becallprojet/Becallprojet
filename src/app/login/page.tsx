'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const res = await signIn('credentials', { email, password, redirect: false })
    setLoading(false)
    if (res?.error) {
      setError('Email ou mot de passe incorrect.')
    } else {
      router.push('/')
      router.refresh()
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: 'linear-gradient(145deg, #1a2d3f 0%, #2C3E50 55%, #1a2d3f 100%)' }}
    >
      {/* Background decorative circles */}
      <div style={{
        position: 'absolute', top: '-80px', right: '-80px',
        width: '400px', height: '400px', borderRadius: '50%',
        border: '1px solid rgba(0,123,255,0.12)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', top: '-40px', right: '-40px',
        width: '240px', height: '240px', borderRadius: '50%',
        border: '1px solid rgba(0,123,255,0.18)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '-100px', left: '-60px',
        width: '320px', height: '320px', borderRadius: '50%',
        border: '1px solid rgba(0,123,255,0.1)',
        pointerEvents: 'none',
      }} />

      <div className="w-full max-w-sm relative z-10 mx-4">
        {/* Card */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '16px',
            boxShadow: '0 24px 64px rgba(44,62,80,0.32)',
            overflow: 'hidden',
          }}
        >
          {/* Logo zone */}
          <div style={{ padding: '32px 32px 24px', borderBottom: '1px solid #EEF5FF', display: 'flex', justifyContent: 'center' }}>
            <Image src="/logo.png" alt="BECALL" width={160} height={107} className="object-contain" />
          </div>

          {/* Form */}
          <div style={{ padding: '28px 32px 32px' }}>
            <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#2C3E50', letterSpacing: '-0.02em', marginBottom: '4px' }}>
              Connexion
            </h1>
            <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '24px' }}>
              Accédez à votre espace commercial
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                  placeholder="votre@email.com"
                  style={{
                    width: '100%', padding: '10px 14px', fontSize: '14px',
                    border: '1px solid #c8deff', borderRadius: '8px',
                    outline: 'none', transition: 'all 0.15s',
                    color: '#1C1C2E', background: '#fff',
                  }}
                  onFocus={e => { e.currentTarget.style.borderColor = '#007BFF'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0,123,255,0.12)' }}
                  onBlur={e => { e.currentTarget.style.borderColor = '#c8deff'; e.currentTarget.style.boxShadow = 'none' }}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Mot de passe
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  style={{
                    width: '100%', padding: '10px 14px', fontSize: '14px',
                    border: '1px solid #c8deff', borderRadius: '8px',
                    outline: 'none', transition: 'all 0.15s',
                    color: '#1C1C2E', background: '#fff',
                  }}
                  onFocus={e => { e.currentTarget.style.borderColor = '#007BFF'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0,123,255,0.12)' }}
                  onBlur={e => { e.currentTarget.style.borderColor = '#c8deff'; e.currentTarget.style.boxShadow = 'none' }}
                />
              </div>

              {error && (
                <div style={{ background: '#fff5f5', border: '1px solid #fecaca', color: '#dc2626', fontSize: '13px', padding: '10px 14px', borderRadius: '8px' }}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%', padding: '11px', fontSize: '14px', fontWeight: 600,
                  color: 'white', borderRadius: '8px', border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                  background: loading ? '#94a3b8' : '#007BFF',
                  transition: 'all 0.15s', marginTop: '4px',
                  boxShadow: loading ? 'none' : '0 4px 12px rgba(0,123,255,0.3)',
                }}
                onMouseEnter={e => { if (!loading) { (e.currentTarget as HTMLElement).style.background = '#0066d6'; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(0,102,214,0.35)' } }}
                onMouseLeave={e => { if (!loading) { (e.currentTarget as HTMLElement).style.background = '#007BFF'; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 12px rgba(0,123,255,0.3)' } }}
              >
                {loading ? 'Connexion en cours…' : 'Se connecter'}
              </button>
            </form>
          </div>

          {/* Gradient bar */}
          <div style={{ height: '3px', background: 'linear-gradient(90deg, #2C3E50, #007BFF)' }} />
        </div>

        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '12px', color: 'rgba(255,255,255,0.35)' }}>
          BECALL · Solutions IT & Télécommunications
        </p>
      </div>
    </div>
  )
}
