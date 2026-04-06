export default function PrintLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        body {
          margin: 0; padding: 2mm 6mm 10mm;
          font-family: 'Inter', Arial, sans-serif;
          font-size: 9.5pt; color: #1C1C2E; background: white;
          -webkit-font-smoothing: antialiased;
        }
        @media print {
          @page { margin: 2mm 6mm 10mm; size: A4; }
          .print-btn { display: none !important; }
        }

        /* ── Palette documents
           #1E7BC4  bleu électrique  · accents, badges, bordures
           #2B4C8C  bleu marine      · éléments secondaires, section prestations
           #3D5068  ardoise profond  · titres, numéros, en-têtes de section
        ── */

        /* ── Gradient bar ── */
        .gradient-bar {
          height: 3pt;
          background: linear-gradient(90deg, #3D5068 0%, #2B4C8C 50%, #1E7BC4 100%);
          border-radius: 2pt;
          margin-bottom: 4pt;
        }

        /* ── Logo centré en haut ── */
        .logo-top {
          text-align: center;
          margin-bottom: 3pt;
        }
        .logo-img { height: 100pt; width: auto; object-fit: contain; display: inline-block; }

        /* ── Header ── */
        .header {
          display: flex; justify-content: space-between; align-items: flex-start;
          margin-bottom: 6pt; padding-bottom: 4pt;
        }
        .logo-wrap { display: none; }
        .company-info { font-size: 8pt; color: #64748b; line-height: 1.6; }

        .doc-title { text-align: right; }
        .doc-label  { font-size: 8pt; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.12em; }
        .doc-number { display: none; }
        .doc-status {
          display: inline-block; padding: 2.5pt 9pt;
          border-radius: 20pt; font-size: 7.5pt; font-weight: 700;
        }
        .status-BROUILLON  { background: #F4F6FA; color: #64748b; }
        .status-ENVOYE     { background: #ddeaf7; color: #1E7BC4; }
        .status-ACCEPTE    { background: #e6fdf4; color: #00875a; }
        .status-REFUSE     { background: #fff5f5; color: #dc2626; }
        .status-ABANDONNE  { background: #fff7ed; color: #c2410c; }
        .status-EN_COURS   { background: #ddeaf7; color: #1E7BC4; }
        .status-LIVRE      { background: #e6fdf4; color: #00875a; }
        .status-ANNULE     { background: #fff5f5; color: #dc2626; }

        /* ── Parties ── */
        .parties {
          display: grid; grid-template-columns: 1fr 1fr;
          gap: 14pt; margin-bottom: 14pt;
        }
        .party-box {
          padding: 10pt 12pt; background: #f5f8fc;
          border-radius: 6pt; border-left: 3pt solid #1E7BC4;
        }
        .party-label {
          font-size: 7pt; font-weight: 700; color: #1E7BC4;
          text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 5pt;
        }
        .party-name  { font-size: 10.5pt; font-weight: 700; color: #3D5068; }
        .party-line  { font-size: 8.5pt; color: #475569; margin-top: 1.5pt; }

        /* ── Meta ── */
        .meta {
          display: grid; grid-template-columns: repeat(4, 1fr);
          gap: 7pt; margin-bottom: 14pt;
        }
        .meta-item {
          padding: 7pt 8pt; border: 1pt solid #ddeaf7;
          border-radius: 5pt; background: white;
        }
        .meta-label { font-size: 7pt; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.06em; }
        .meta-value { font-size: 8.5pt; font-weight: 600; color: #3D5068; margin-top: 2pt; }

        /* ── Section titles ── */
        .section-title {
          font-size: 8.5pt; font-weight: 700; padding: 5pt 9pt;
          margin: 10pt 0 0; border-radius: 4pt 4pt 0 0;
          text-transform: uppercase; letter-spacing: 0.06em;
        }
        .section-abo   { background: #3D5068; color: white; }
        .section-prest { background: #2B4C8C; color: white; }

        /* ── Table ── */
        table { width: 100%; border-collapse: collapse; }
        thead tr { background: #f5f8fc; }
        th {
          padding: 5.5pt 8pt; text-align: left; font-size: 7.5pt;
          font-weight: 600; color: #64748b; text-transform: uppercase;
          letter-spacing: 0.05em; border-bottom: 1pt solid #ddeaf7;
        }
        th.right { text-align: right; }
        td { padding: 6pt 8pt; font-size: 9pt; border-bottom: 1pt solid #f5f8fc; vertical-align: top; }
        td.right { text-align: right; }
        .td-designation { font-weight: 500; color: #3D5068; }
        .td-desc { font-size: 7.5pt; color: #94a3b8; margin-top: 1.5pt; }

        /* ── Totals ── */
        .totals-wrapper { margin-top: 14pt; display: flex; justify-content: flex-end; }
        .totals { width: 240pt; }
        .totals-row {
          display: flex; justify-content: space-between;
          padding: 3.5pt 8pt; font-size: 9.5pt;
        }
        .totals-row.sep {
          border-top: 1pt solid #ddeaf7; margin-top: 3pt; padding-top: 7pt;
        }
        .totals-row.total {
          font-size: 11pt; font-weight: 700; color: white;
          padding: 7pt 12pt;
          background: linear-gradient(90deg, #3D5068, #2B4C8C, #1E7BC4);
          border-radius: 5pt; margin-top: 5pt;
        }

        /* ── Signature ── */
        .signature-grid {
          display: grid; grid-template-columns: 1fr 1fr;
          gap: 14pt; margin-top: 18pt;
        }
        .signature-box {
          border: 1pt solid #ddeaf7; border-radius: 5pt;
          padding: 9pt; min-height: 55pt;
          background: #f5f8fc;
        }
        .signature-label { font-size: 7.5pt; color: #94a3b8; margin-bottom: 7pt; }

        /* ── Footer ── */
        .footer {
          margin-top: 18pt; padding-top: 9pt;
          border-top: 1pt solid #ddeaf7;
          text-align: center; font-size: 7.5pt; color: #94a3b8;
        }

        /* ── Conditions ── */
        .conditions {
          margin-top: 12pt; padding: 9pt 10pt; background: #f5f8fc;
          border-radius: 4pt; font-size: 8.5pt; color: #64748b;
          border-left: 3pt solid #1E7BC4;
        }
      `}</style>
      {children}
    </>
  )
}
