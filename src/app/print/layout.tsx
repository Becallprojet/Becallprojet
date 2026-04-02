export default function PrintLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        body {
          margin: 0; padding: 14mm 16mm;
          font-family: 'Inter', Arial, sans-serif;
          font-size: 9.5pt; color: #1C1C2E; background: white;
          -webkit-font-smoothing: antialiased;
        }
        @media print {
          @page { margin: 14mm 16mm; size: A4; }
          .print-btn { display: none !important; }
        }

        /* ── Gradient bar ── */
        .gradient-bar {
          height: 3pt;
          background: linear-gradient(90deg, #0F2A6B 0%, #1A5FBF 40%, #00C2FF 75%, #00E5A0 100%);
          border-radius: 2pt;
          margin-bottom: 14pt;
        }

        /* ── Header ── */
        .header {
          display: flex; justify-content: space-between; align-items: flex-start;
          margin-bottom: 18pt; padding-bottom: 14pt;
          border-bottom: 2pt solid #E8F0FD;
        }
        .logo-wrap { display: flex; flex-direction: column; gap: 5pt; }
        .logo-img  { height: 52pt; width: auto; object-fit: contain; }
        .company-info { font-size: 8pt; color: #64748b; line-height: 1.6; }

        .doc-title { text-align: right; }
        .doc-label  { font-size: 8pt; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.12em; }
        .doc-number { font-size: 20pt; font-weight: 700; color: #0F2A6B; letter-spacing: -0.02em; margin: 3pt 0; }
        .doc-status {
          display: inline-block; padding: 2.5pt 9pt;
          border-radius: 20pt; font-size: 7.5pt; font-weight: 700;
        }
        .status-BROUILLON  { background: #F4F6FA; color: #64748b; }
        .status-ENVOYE     { background: #E8F0FD; color: #1A5FBF; }
        .status-ACCEPTE    { background: #e6fdf4; color: #00875a; }
        .status-REFUSE     { background: #fff5f5; color: #dc2626; }
        .status-ABANDONNE  { background: #fff7ed; color: #c2410c; }
        .status-EN_COURS   { background: #E8F0FD; color: #1A5FBF; }
        .status-LIVRE      { background: #e6fdf4; color: #00875a; }
        .status-ANNULE     { background: #fff5f5; color: #dc2626; }

        /* ── Parties ── */
        .parties {
          display: grid; grid-template-columns: 1fr 1fr;
          gap: 14pt; margin-bottom: 14pt;
        }
        .party-box {
          padding: 10pt 12pt; background: #F4F6FA;
          border-radius: 6pt; border-left: 3pt solid #1A5FBF;
        }
        .party-label {
          font-size: 7pt; font-weight: 700; color: #1A5FBF;
          text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 5pt;
        }
        .party-name  { font-size: 10.5pt; font-weight: 700; color: #0F2A6B; }
        .party-line  { font-size: 8.5pt; color: #475569; margin-top: 1.5pt; }

        /* ── Meta ── */
        .meta {
          display: grid; grid-template-columns: repeat(4, 1fr);
          gap: 7pt; margin-bottom: 14pt;
        }
        .meta-item {
          padding: 7pt 8pt; border: 1pt solid #E8F0FD;
          border-radius: 5pt; background: white;
        }
        .meta-label { font-size: 7pt; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.06em; }
        .meta-value { font-size: 9.5pt; font-weight: 600; color: #0F2A6B; margin-top: 2pt; }

        /* ── Section titles ── */
        .section-title {
          font-size: 8.5pt; font-weight: 700; padding: 5pt 9pt;
          margin: 10pt 0 0; border-radius: 4pt 4pt 0 0;
          text-transform: uppercase; letter-spacing: 0.06em;
        }
        .section-abo   { background: #0F2A6B; color: white; }
        .section-prest { background: #1C1C2E; color: white; }

        /* ── Table ── */
        table { width: 100%; border-collapse: collapse; }
        thead tr { background: #F4F6FA; }
        th {
          padding: 5.5pt 8pt; text-align: left; font-size: 7.5pt;
          font-weight: 600; color: #64748b; text-transform: uppercase;
          letter-spacing: 0.05em; border-bottom: 1pt solid #E8F0FD;
        }
        th.right { text-align: right; }
        td { padding: 6pt 8pt; font-size: 9pt; border-bottom: 1pt solid #F4F6FA; vertical-align: top; }
        td.right { text-align: right; }
        .td-designation { font-weight: 500; color: #0F2A6B; }
        .td-desc { font-size: 7.5pt; color: #94a3b8; margin-top: 1.5pt; }

        /* ── Totals ── */
        .totals-wrapper { margin-top: 14pt; display: flex; justify-content: flex-end; }
        .totals { width: 240pt; }
        .totals-row {
          display: flex; justify-content: space-between;
          padding: 3.5pt 8pt; font-size: 9.5pt;
        }
        .totals-row.sep {
          border-top: 1pt solid #E8F0FD; margin-top: 3pt; padding-top: 7pt;
        }
        .totals-row.total {
          font-size: 11pt; font-weight: 700; color: white;
          padding: 7pt 12pt;
          background: linear-gradient(90deg, #0F2A6B, #1A5FBF);
          border-radius: 5pt; margin-top: 5pt;
        }

        /* ── Signature ── */
        .signature-grid {
          display: grid; grid-template-columns: 1fr 1fr;
          gap: 14pt; margin-top: 18pt;
        }
        .signature-box {
          border: 1pt solid #E8F0FD; border-radius: 5pt;
          padding: 9pt; min-height: 55pt;
          background: #F4F6FA;
        }
        .signature-label { font-size: 7.5pt; color: #94a3b8; margin-bottom: 7pt; }

        /* ── Footer ── */
        .footer {
          margin-top: 18pt; padding-top: 9pt;
          border-top: 1pt solid #E8F0FD;
          text-align: center; font-size: 7.5pt; color: #94a3b8;
        }

        /* ── Conditions ── */
        .conditions {
          margin-top: 12pt; padding: 9pt 10pt; background: #F4F6FA;
          border-radius: 4pt; font-size: 8.5pt; color: #64748b;
          border-left: 3pt solid #00C2FF;
        }
      `}</style>
      {children}
    </>
  )
}
