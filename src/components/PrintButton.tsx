'use client'

export default function PrintButton({ downloadUrl }: { downloadUrl?: string }) {
  return (
    <div
      className="print-btn"
      style={{
        position: 'fixed', top: '16px', right: '16px',
        display: 'flex', gap: '8px', zIndex: 100,
      }}
    >
      <button
        onClick={() => window.print()}
        style={{
          background: '#1B3A6B', color: 'white', border: 'none',
          padding: '10px 20px', borderRadius: '8px', cursor: 'pointer',
          fontSize: '13px', fontWeight: 600,
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
        }}
      >
        🖨 Imprimer
      </button>
      {downloadUrl && (
        <a
          href={downloadUrl}
          download
          style={{
            background: '#334155', color: 'white',
            padding: '10px 20px', borderRadius: '8px', cursor: 'pointer',
            fontSize: '13px', fontWeight: 600, textDecoration: 'none',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', gap: '6px',
          }}
        >
          ⬇ Télécharger PDF
        </a>
      )}
    </div>
  )
}
