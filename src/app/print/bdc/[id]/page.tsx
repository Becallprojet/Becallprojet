import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { formatMontant, formatDate } from '@/lib/utils'
import PrintButton from '@/components/PrintButton'

export default async function PrintBdcPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const bdc = await prisma.bonDeCommande.findUnique({
    where: { id },
    include: {
      contact: true,
      devis: { select: { numero: true, dureeEngagement: true } },
      lignes: { orderBy: { ordre: 'asc' } },
    },
  })

  if (!bdc) notFound()

  const abonnementLignes = bdc.lignes.filter((l) => l.type === 'ABONNEMENT')
  const locationLignes = bdc.lignes.filter((l) => l.type === 'LOCATION')
  const prestationLignes = bdc.lignes.filter((l) => l.type === 'PRESTATION')

  const companyName = process.env.COMPANY_NAME || 'BECALL'
  const companyAddress = process.env.COMPANY_ADDRESS || ''
  const companyPhone = process.env.COMPANY_PHONE || ''
  const companySiret = process.env.COMPANY_SIRET || ''
  const companyTva = process.env.COMPANY_TVA || ''

  const statutLabels: Record<string, string> = {
    EN_COURS: 'EN COURS', LIVRE: 'LIVRÉ', ANNULE: 'ANNULÉ',
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  return (
    <>
      <PrintButton downloadUrl={`/api/pdf/bdc/${id}`} />

      {/* Logo centré en haut de page */}
      <div className="logo-top">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`${appUrl}/logo.png`} alt="BECALL" className="logo-img" />
      </div>

      <div className="gradient-bar" />

      <div className="header">
        <div className="company-info">
          {companyAddress && <div>{companyAddress}</div>}
          {companyPhone && <div>{companyPhone}</div>}
          {companySiret && <div>SIRET : {companySiret}</div>}
          {companyTva && <div>TVA : {companyTva}</div>}
        </div>
        <div className="doc-title">
          <div className="doc-label">Bon de Commande</div>
          {bdc.statut !== 'EN_COURS' && (
            <div className={`doc-status status-${bdc.statut}`}>{statutLabels[bdc.statut] ?? bdc.statut}</div>
          )}
        </div>
      </div>

      <div className="parties">
        <div className="party-box">
          <div className="party-label">Fournisseur</div>
          <div className="party-name">{companyName}</div>
          {companyAddress && <div className="party-line">{companyAddress}</div>}
          {companyPhone && <div className="party-line">{companyPhone}</div>}
        </div>
        <div className="party-box">
          <div className="party-label">Client</div>
          {bdc.contact.societe && <div className="party-name">{bdc.contact.societe}</div>}
          <div className={`party-line${!bdc.contact.societe ? ' party-name' : ''}`}>
            {bdc.contact.prenom} {bdc.contact.nom}
          </div>
          {bdc.contact.telephoneMobile && <div className="party-line">{bdc.contact.telephoneMobile}</div>}
          {bdc.contact.adresseFacturation && <div className="party-line" style={{ marginTop: '4pt' }}>{bdc.contact.adresseFacturation}</div>}
          {(bdc.contact.codePostal || bdc.contact.ville) && (
            <div className="party-line">{bdc.contact.codePostal} {bdc.contact.ville}</div>
          )}
        </div>
      </div>

      <div className="meta">
<div className="meta-item"><div className="meta-label">Numéro BDC</div><div className="meta-value">{bdc.numero}</div></div>
        <div className="meta-item"><div className="meta-label">Devis origine</div><div className="meta-value">{bdc.devis.numero}</div></div>
        <div className="meta-item"><div className="meta-label">Engagement</div><div className="meta-value">{bdc.devis.dureeEngagement ? `${bdc.devis.dureeEngagement} mois` : '—'}</div></div>
        <div className="meta-item"><div className="meta-label">Date</div><div className="meta-value">{formatDate(bdc.createdAt)}</div></div>
      </div>

      {abonnementLignes.length > 0 && (
        <>
          <div className="section-title section-abo">Abonnements services</div>
          <table>
            <thead><tr>
              <th style={{ width: '50%' }}>Désignation</th>
              <th className="right" style={{ width: '10%' }}>Qté</th>
              <th className="right" style={{ width: '20%' }}>PU HT</th>
              <th className="right" style={{ width: '20%' }}>Total HT</th>
            </tr></thead>
            <tbody>
              {abonnementLignes.map((l) => (
                <tr key={l.id}>
                  <td><div className="td-designation">{l.designation}</div>{l.description && <div className="td-desc">{l.description}</div>}</td>
                  <td className="right">{l.quantite}</td>
                  <td className="right">{formatMontant(l.prixUnitaireHT)}</td>
                  <td className="right" style={{ fontWeight: 600 }}>{formatMontant(l.totalHT)}</td>
                </tr>
              ))}
              <tr style={{ borderTop: '2pt solid #3D5068' }}>
                <td colSpan={3} style={{ textAlign: 'right', paddingRight: '8pt', fontSize: '8.5pt', color: '#475569', fontStyle: 'italic' }}>
                  Sous-total abonnements
                </td>
                <td className="right" style={{ fontWeight: 700, color: '#3D5068' }}>
                  {formatMontant(abonnementLignes.reduce((s, l) => s + l.totalHT, 0))}
                </td>
              </tr>
            </tbody>
          </table>
          {bdc.noteAbonnements && (
            <div style={{ margin: '6pt 0 0 0', padding: '6pt 10pt', background: '#ddeaf7', borderLeft: '3pt solid #1E7BC4', borderRadius: '3pt', fontSize: '8.5pt', color: '#1C1C2E', whiteSpace: 'pre-wrap' }}>
              <strong style={{ color: '#1E7BC4' }}>Note : </strong>{bdc.noteAbonnements}
            </div>
          )}
        </>
      )}

      {locationLignes.length > 0 && (
        <>
          <div className="section-title section-abo" style={{ marginTop: abonnementLignes.length ? '12pt' : '0' }}>Location de matériel</div>
          <table>
            <thead><tr>
              <th style={{ width: '60%' }}>Désignation</th>
              <th className="right" style={{ width: '10%' }}>Qté</th>
              <th className="right" style={{ width: '30%' }}>Total HT</th>
            </tr></thead>
            <tbody>
              {locationLignes.map((l) => (
                <tr key={l.id}>
                  <td><div className="td-designation">{l.designation}</div>{l.description && <div className="td-desc">{l.description}</div>}</td>
                  <td className="right">{l.quantite}</td>
                  <td className="right" style={{ color: '#94a3b8', fontSize: '8pt' }}>—</td>
                </tr>
              ))}
              <tr style={{ borderTop: '2pt solid #3D5068' }}>
                <td colSpan={2} style={{ textAlign: 'right', paddingRight: '8pt', fontSize: '8.5pt', color: '#475569', fontStyle: 'italic' }}>
                  Sous-total location
                </td>
                <td className="right" style={{ fontWeight: 700, color: '#3D5068' }}>
                  {formatMontant(locationLignes.reduce((s, l) => s + l.totalHT, 0))}
                </td>
              </tr>
            </tbody>
          </table>
          {bdc.noteLocation && (
            <div style={{ margin: '6pt 0 0 0', padding: '6pt 10pt', background: '#ddeaf7', borderLeft: '3pt solid #1E7BC4', borderRadius: '3pt', fontSize: '8.5pt', color: '#1C1C2E', whiteSpace: 'pre-wrap' }}>
              <strong style={{ color: '#1E7BC4' }}>Note : </strong>{bdc.noteLocation}
            </div>
          )}
        </>
      )}

      {prestationLignes.length > 0 && (
        <>
          <div className="section-title section-abo" style={{ marginTop: (abonnementLignes.length || locationLignes.length) ? '12pt' : '0' }}>
            Prestations ponctuelles
          </div>
          <table>
            <thead><tr>
              <th style={{ width: '50%' }}>Désignation</th>
              <th className="right" style={{ width: '10%' }}>Qté</th>
              <th className="right" style={{ width: '20%' }}>PU HT</th>
              <th className="right" style={{ width: '20%' }}>Total HT</th>
            </tr></thead>
            <tbody>
              {prestationLignes.map((l) => (
                <tr key={l.id}>
                  <td><div className="td-designation">{l.designation}</div>{l.description && <div className="td-desc">{l.description}</div>}</td>
                  <td className="right">{l.quantite}</td>
                  <td className="right">{formatMontant(l.prixUnitaireHT)}</td>
                  <td className="right" style={{ fontWeight: 600 }}>{formatMontant(l.totalHT)}</td>
                </tr>
              ))}
              <tr style={{ borderTop: '2pt solid #3D5068' }}>
                <td colSpan={3} style={{ textAlign: 'right', paddingRight: '8pt', fontSize: '8.5pt', color: '#475569', fontStyle: 'italic' }}>
                  Sous-total prestations
                </td>
                <td className="right" style={{ fontWeight: 700, color: '#3D5068' }}>
                  {formatMontant(prestationLignes.reduce((s, l) => s + l.totalHT, 0))}
                </td>
              </tr>
            </tbody>
          </table>
          {bdc.notePrestation && (
            <div style={{ margin: '6pt 0 0 0', padding: '6pt 10pt', background: '#ddeaf7', borderLeft: '3pt solid #1E7BC4', borderRadius: '3pt', fontSize: '8.5pt', color: '#1C1C2E', whiteSpace: 'pre-wrap' }}>
              <strong style={{ color: '#1E7BC4' }}>Note : </strong>{bdc.notePrestation}
            </div>
          )}
        </>
      )}

      <div className="totals-wrapper">
        <div className="totals">
          {bdc.totalAbonnementHT > 0 && (
            <div className="totals-row"><span style={{ color: '#64748b' }}>Abonnements HT</span><span style={{ fontWeight: 600 }}>{formatMontant(bdc.totalAbonnementHT)}</span></div>
          )}
          {bdc.totalPrestationsHT > 0 && (
            <div className="totals-row"><span style={{ color: '#64748b' }}>Prestations HT</span><span style={{ fontWeight: 600 }}>{formatMontant(bdc.totalPrestationsHT)}</span></div>
          )}
          <div className="totals-row sep"><span style={{ color: '#64748b' }}>Total HT</span><span style={{ fontWeight: 600 }}>{formatMontant(bdc.totalHT)}</span></div>
          <div className="totals-row"><span style={{ color: '#64748b' }}>TVA 20%</span><span style={{ fontWeight: 600 }}>{formatMontant(bdc.tva)}</span></div>
          <div className="totals-row total"><span>TOTAL TTC</span><span>{formatMontant(bdc.totalTTC)}</span></div>
        </div>
      </div>

      <div className="signature-grid">
        <div className="signature-box">
          <div className="signature-label">Bon pour accord — Signature et cachet client</div>
          <div style={{ fontSize: '9pt', color: '#64748b' }}>Date : ____________________</div>
        </div>
        <div className="signature-box">
          <div className="signature-label">Validé par</div>
          <div style={{ fontSize: '9pt', fontWeight: 600, color: '#3D5068' }}>{companyName}</div>
        </div>
      </div>

      <div className="footer">
        <div className="gradient-bar" style={{ marginBottom: '6pt' }} />
        <p>{companyName}{companySiret ? ` — SIRET ${companySiret}` : ''}</p>
      </div>
    </>
  )
}
