import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { formatMontant, formatDate } from '@/lib/utils'
import PrintButton from '@/components/PrintButton'

export default async function PrintDevisPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const devis = await prisma.devis.findUnique({
    where: { id },
    include: {
      contact: true,
      lignes: { orderBy: { ordre: 'asc' } },
    },
  })

  if (!devis) notFound()

  const abonnementLignes = devis.lignes.filter((l) => l.type === 'ABONNEMENT')
  const locationLignes = devis.lignes.filter((l) => l.type === 'LOCATION')
  const prestationLignes = devis.lignes.filter((l) => l.type === 'PRESTATION')

  const companyName = process.env.COMPANY_NAME || 'BECALL'
  const companyAddress = process.env.COMPANY_ADDRESS || ''
  const companyPhone = process.env.COMPANY_PHONE || ''
  const companySiret = process.env.COMPANY_SIRET || ''
  const companyTva = process.env.COMPANY_TVA || ''

  const statutLabels: Record<string, string> = {
    BROUILLON: 'BROUILLON', ENVOYE: 'ENVOYÉ', ACCEPTE: 'ACCEPTÉ', REFUSE: 'REFUSÉ', ABANDONNE: 'ABANDONNÉ',
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  return (
    <>
      <PrintButton downloadUrl={`/api/pdf/devis/${id}`} />

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
        <div className="doc-title" />
      </div>

      <div className="parties">
        <div className="party-box">
          <div className="party-label">Émetteur</div>
          <div className="party-name">{companyName}</div>
          {companyAddress && <div className="party-line">{companyAddress}</div>}
          {companyPhone && <div className="party-line">{companyPhone}</div>}
        </div>
        <div className="party-box">
          <div className="party-label">Destinataire</div>
          {devis.contact.societe && <div className="party-name">{devis.contact.societe}</div>}
          <div className={`party-line${!devis.contact.societe ? ' party-name' : ''}`}>
            {devis.contact.prenom} {devis.contact.nom}
            {devis.contact.poste && ` — ${devis.contact.poste}`}
          </div>
          {devis.contact.telephoneMobile && <div className="party-line">{devis.contact.telephoneMobile}</div>}
          {devis.contact.adresseFacturation && <div className="party-line" style={{ marginTop: '4pt' }}>{devis.contact.adresseFacturation}</div>}
          {(devis.contact.codePostal || devis.contact.ville) && (
            <div className="party-line">{devis.contact.codePostal} {devis.contact.ville}</div>
          )}
        </div>
      </div>

      <div className="meta">
        <div className="meta-item">
          <div className="meta-label">Numéro</div>
          <div className="meta-value">{devis.numero}</div>
        </div>
        <div className="meta-item">
          <div className="meta-label">Date</div>
          <div className="meta-value">{formatDate(devis.createdAt)}</div>
        </div>
        <div className="meta-item">
          <div className="meta-label">Engagement</div>
          <div className="meta-value">{devis.dureeEngagement ? `${devis.dureeEngagement} mois` : 'Sans'}</div>
        </div>
        <div className="meta-item">
          <div className="meta-label">Validité</div>
          <div className="meta-value">{devis.validite} jours</div>
        </div>
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
          {devis.noteAbonnements && (
            <div style={{ margin: '6pt 0 0 0', padding: '6pt 10pt', background: '#ddeaf7', borderLeft: '3pt solid #1E7BC4', borderRadius: '3pt', fontSize: '8.5pt', color: '#1C1C2E', whiteSpace: 'pre-wrap' }}>
              <strong style={{ color: '#1E7BC4' }}>Note : </strong>{devis.noteAbonnements}
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
          {devis.noteLocation && (
            <div style={{ margin: '6pt 0 0 0', padding: '6pt 10pt', background: '#ddeaf7', borderLeft: '3pt solid #1E7BC4', borderRadius: '3pt', fontSize: '8.5pt', color: '#1C1C2E', whiteSpace: 'pre-wrap' }}>
              <strong style={{ color: '#1E7BC4' }}>Note : </strong>{devis.noteLocation}
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
          {devis.notePrestation && (
            <div style={{ margin: '6pt 0 0 0', padding: '6pt 10pt', background: '#ddeaf7', borderLeft: '3pt solid #1E7BC4', borderRadius: '3pt', fontSize: '8.5pt', color: '#1C1C2E', whiteSpace: 'pre-wrap' }}>
              <strong style={{ color: '#1E7BC4' }}>Note : </strong>{devis.notePrestation}
            </div>
          )}
        </>
      )}

      <div className="totals-wrapper">
        <div className="totals">
          {devis.totalAbonnementHT > 0 && (
            <div className="totals-row">
              <span style={{ color: '#64748b' }}>Abonnements HT</span>
              <span style={{ fontWeight: 600 }}>{formatMontant(devis.totalAbonnementHT)}</span>
            </div>
          )}
          {devis.totalPrestationsHT > 0 && (
            <div className="totals-row">
              <span style={{ color: '#64748b' }}>Prestations HT</span>
              <span style={{ fontWeight: 600 }}>{formatMontant(devis.totalPrestationsHT)}</span>
            </div>
          )}
          <div className="totals-row sep">
            <span style={{ color: '#64748b' }}>Total HT</span>
            <span style={{ fontWeight: 600 }}>{formatMontant(devis.totalHT)}</span>
          </div>
          <div className="totals-row">
            <span style={{ color: '#64748b' }}>TVA 20%</span>
            <span style={{ fontWeight: 600 }}>{formatMontant(devis.tva)}</span>
          </div>
          <div className="totals-row total">
            <span>TOTAL TTC</span>
            <span>{formatMontant(devis.totalTTC)}</span>
          </div>
        </div>
      </div>

      {devis.conditions && (
        <div className="conditions"><strong>Conditions :</strong> {devis.conditions}</div>
      )}

      <div className="signature-grid">
        <div className="signature-box">
          <div className="signature-label">Bon pour accord — Signature et cachet client</div>
          <div style={{ fontSize: '9pt', color: '#64748b' }}>Date : ____________________</div>
        </div>
        <div className="signature-box">
          <div className="signature-label">Émis par</div>
          <div style={{ fontSize: '9pt', fontWeight: 600, color: '#3D5068' }}>{companyName}</div>
        </div>
      </div>

      <div className="footer">
        <p>{companyName}{companySiret ? ` — SIRET ${companySiret}` : ''}</p>
      </div>
    </>
  )
}
