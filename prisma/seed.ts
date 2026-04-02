import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding catalogue...')

  // Compte admin par défaut
  const adminEmail = 'admin@becall.fr'
  const existing = await prisma.user.findUnique({ where: { email: adminEmail } })
  if (!existing) {
    await prisma.user.create({
      data: {
        email: adminEmail,
        prenom: 'Admin',
        nom: 'BECALL',
        password: await bcrypt.hash('Admin1234!', 12),
        role: 'ADMIN',
      },
    })
    console.log('Admin créé : admin@becall.fr / Admin1234!')
  }

  const abonnements = [
    // Abonnements opérateur / cyber / maintenance
    { reference: 'ABO-OPE-FIBRE', nom: 'Fibre FTTH', type: 'Opérateur', categorie: 'ABONNEMENT', prixHT: 69.00 },
    { reference: 'ABO-OPE-4G-BACK', nom: 'Backup 4G', type: 'Opérateur', categorie: 'ABONNEMENT', prixHT: 20.00 },
    { reference: 'ABO-OPE-VPN-FW', nom: 'VPN Firewall', type: 'Opérateur', categorie: 'ABONNEMENT', prixHT: 20.00 },
    { reference: 'ABO-OPE-SUBNET', nom: 'Subnet /30 (2adresses)', type: 'Opérateur', categorie: 'ABONNEMENT', prixHT: 20.00 },
    { reference: 'ABO-OPE-FAX', nom: 'Licence Fax to mail', type: 'Opérateur', categorie: 'ABONNEMENT', prixHT: 10.00 },
    { reference: 'ABO-OPE-LIC-USER', nom: 'Licence user', type: 'Opérateur', categorie: 'ABONNEMENT', prixHT: 14.00 },
    { reference: 'ABO-OPE-SVI', nom: 'SVI', type: 'Opérateur', categorie: 'ABONNEMENT', prixHT: 10.00 },
    { reference: 'ABO-OPE-SDA', nom: 'SDA', type: 'Opérateur', categorie: 'ABONNEMENT', prixHT: 1.00 },
    { reference: 'ABO-OPE-MOB-20GO', nom: 'Forfait mobile 20 Go', type: 'Opérateur mobile', categorie: 'ABONNEMENT', prixHT: 19.90 },
    { reference: 'ABO-OPE-MOB-40GO', nom: 'Forfait mobile 40 Go', type: 'Opérateur mobile', categorie: 'ABONNEMENT', prixHT: 24.90 },
    { reference: 'ABO-OPE-MOB-100GO', nom: 'Forfait mobile 100 Go', type: 'Opérateur mobile', categorie: 'ABONNEMENT', prixHT: 39.90 },
    { reference: 'ABO-OPE-CS-PBACK', nom: 'Agent de backup et protection de poste de travail', type: 'Cyber-Sécurité', categorie: 'ABONNEMENT', prixHT: 9.00 },
    { reference: 'ABO-OPE-CS-SBACK', nom: 'Agent de backup et protection de serveur physique', type: 'Cyber-Sécurité', categorie: 'ABONNEMENT', prixHT: 49.00 },
    { reference: 'ABO-OPE-CS-MVIRT', nom: "Agent de backup et protection d'une machine virtuelle", type: 'Cyber-Sécurité', categorie: 'ABONNEMENT', prixHT: 19.00 },
    { reference: 'ABO-OPE-CS-100G', nom: 'Stockage DATA 100Go', type: 'Cyber-Sécurité', categorie: 'ABONNEMENT', prixHT: 15.00 },
    { reference: 'ABO-OPE-CS-1T', nom: 'Stockage DATA 1T', type: 'Cyber-Sécurité', categorie: 'ABONNEMENT', prixHT: 25.00 },
    { reference: 'ABO-M-NIV1', nom: 'Maintenance niveau 1', type: 'Maintenance', categorie: 'ABONNEMENT', prixHT: 19.00 },
    { reference: 'ABO-M-NIV2', nom: 'Maintenance niveau 2', type: 'Maintenance', categorie: 'ABONNEMENT', prixHT: 49.00 },
    // Location de matériel
    { reference: 'ABO-LOC-TEL-ROUT', nom: 'Routeur', type: 'Matériel de téléphonie', categorie: 'LOCATION', prixHT: 10.00 },
    { reference: 'ABO-LOC-TEL-ROUT-AUTRE', nom: 'Routeur autres', type: 'Matériel de téléphonie', categorie: 'LOCATION', prixHT: 11.45 },
    { reference: 'ABO-LOC-TEL-SW8PO', nom: 'Switch 8 ports 10/100 PoE', type: 'Matériel de téléphonie', categorie: 'LOCATION', prixHT: 5.80 },
    { reference: 'ABO-LOC-TEL-YT53W', nom: 'Yealink T53 W', type: 'Matériel de téléphonie', categorie: 'LOCATION', prixHT: 11.45 },
    { reference: 'ABO-LOC-TEL-YT54W', nom: 'Yealink T54 W', type: 'Matériel de téléphonie', categorie: 'LOCATION', prixHT: 11.45 },
    { reference: 'ABO-LOC-TEL-YT57W', nom: 'Yealink T57 W', type: 'Matériel de téléphonie', categorie: 'LOCATION', prixHT: 5.00 },
    { reference: 'ABO-LOC-TEL-YW73P', nom: 'Yealink W73P', type: 'Matériel de téléphonie', categorie: 'LOCATION', prixHT: 10.75 },
    { reference: 'ABO-LOC-TEL-YW73H', nom: 'Yealink W73H', type: 'Matériel de téléphonie', categorie: 'LOCATION', prixHT: 5.80 },
    { reference: 'ABO-LOC-TEL-YW77P', nom: 'Yealink W77P (Robuste)', type: 'Matériel de téléphonie', categorie: 'LOCATION', prixHT: 11.45 },
    { reference: 'ABO-LOC-TEL-YW57R', nom: 'Yealink W57R (Robuste)', type: 'Matériel de téléphonie', categorie: 'LOCATION', prixHT: 5.80 },
    { reference: 'ABO-LOC-TEL-RT30', nom: 'RT30', type: 'Matériel de téléphonie', categorie: 'LOCATION', prixHT: 11.45 },
    { reference: 'ABO-LOC-TEL-DECT', nom: 'Borne DECT IP W75 (max 3)', type: 'Matériel de téléphonie', categorie: 'LOCATION', prixHT: 11.45 },
    { reference: 'ABO-LOC-TEL-OMADA', nom: 'Contrôleur Omada 3 en 1', type: 'Matériel de téléphonie', categorie: 'LOCATION', prixHT: 5.00 },
    { reference: 'ABO-LOC-TEL-EAP723', nom: 'EAP-723 indoor', type: 'Matériel de téléphonie', categorie: 'LOCATION', prixHT: 10.75 },
    { reference: 'ABO-LOC-TEL-EAP773', nom: 'EAP-773 indoor', type: 'Matériel de téléphonie', categorie: 'LOCATION', prixHT: 10.00 },
    { reference: 'ABO-LOC-TEL-EAP772', nom: 'EAP-772 outdoor', type: 'Matériel de téléphonie', categorie: 'LOCATION', prixHT: 10.00 },
    { reference: 'ABO-LOC-SEC-CBULLET8', nom: 'Caméra intérieur 8MGPX Bullet', type: 'Matériel de sécurité', categorie: 'LOCATION', prixHT: 5.80 },
    { reference: 'ABO-LOC-SEC-CBULLET4K', nom: 'Caméra intérieur 4K Bullet', type: 'Matériel de sécurité', categorie: 'LOCATION', prixHT: 11.45 },
    { reference: 'ABO-LOC-SEC-CDOME8', nom: 'Caméra intérieur 8MGPX Dome', type: 'Matériel de sécurité', categorie: 'LOCATION', prixHT: 5.80 },
    { reference: 'ABO-LOC-SEC-CDOME4K', nom: 'Caméra intérieur 4K Dome', type: 'Matériel de sécurité', categorie: 'LOCATION', prixHT: 11.45 },
    { reference: 'ABO-LOC-SEC-ECRAN', nom: 'Ecran', type: 'Matériel de sécurité', categorie: 'LOCATION', prixHT: 11.45 },
    { reference: 'ABO-LOC-SEC-STOC4T', nom: 'Stockeur 4T', type: 'Matériel de sécurité', categorie: 'LOCATION', prixHT: 5.00 },
    { reference: 'ABO-LOC-SEC-MVR', nom: 'Enregistreur MVR', type: 'Matériel de sécurité', categorie: 'LOCATION', prixHT: 10.75 },
    { reference: 'ABO-SOCLE-M-ADV', nom: 'Gestion ADV', type: 'Socle', categorie: 'LOCATION', prixHT: 4.83 },
    { reference: 'ABO-SOCLE-M-INSTALL-RES', nom: "Installation d'équipements réseaux", type: 'Socle', categorie: 'LOCATION', prixHT: 8.33 },
    { reference: 'ABO-SOCLE-M-INST-CEN1-2', nom: 'Installation centrex forfait 1 à 2 postes', type: 'Socle', categorie: 'LOCATION', prixHT: 5.00 },
    { reference: 'ABO-SOCLE-M-INST-CEN3-5', nom: 'Installation centrex forfait 3 à 5 postes', type: 'Socle', categorie: 'LOCATION', prixHT: 15.00 },
    { reference: 'ABO-SOCLE-M-POST-CEN-SUP', nom: 'Forfait poste centrex supplémentaire', type: 'Socle', categorie: 'LOCATION', prixHT: 0.67 },
    { reference: 'ABO-SOCLE-M-INST-WIFI1-5', nom: 'Installation Wifi de 1 à 5 bornes', type: 'Socle', categorie: 'LOCATION', prixHT: 15.00 },
    { reference: 'ABO-SOCLE-M-BORNE-W-SUP', nom: 'Forfait borne wifi supplémentaire', type: 'Socle', categorie: 'LOCATION', prixHT: 1.17 },
    { reference: 'ABO-SOCLE-M-INST-IPBX1-5', nom: 'Installation IPBX forfait 1 à 5 postes', type: 'Socle', categorie: 'LOCATION', prixHT: 15.00 },
    { reference: 'ABO-SOCLE-M-POST-IPBX-SUP', nom: 'Forfait poste IPBX supplémentaire', type: 'Socle', categorie: 'LOCATION', prixHT: 0.67 },
    { reference: 'ABO-SOCLE-M-INST-INF1-5', nom: 'Installation informatique de 1 à 5 PC', type: 'Socle', categorie: 'LOCATION', prixHT: 15.00 },
  ]

  const prestations = [
    { reference: 'FAS-OPE-FIBRE', nom: 'FAS Fibre FTTH', type: 'FAS', prixHT: 150.00 },
    { reference: 'FAS-OPE-4G-BACK', nom: 'FAS Backup 4G', type: 'FAS', prixHT: 20.00 },
    { reference: 'FAS-OPE-VPN-FW', nom: 'FAS VPN Firewall', type: 'FAS', prixHT: 20.00 },
    { reference: 'FAS-OPE-SUBNET', nom: 'FAS Subnet /30 (2adresses)', type: 'FAS', prixHT: 20.00 },
    { reference: 'FAS-OPE-FAX', nom: 'FAS Licence Fax to mail', type: 'FAS', prixHT: 10.00 },
    { reference: 'FAS-OPE-LIC-USER', nom: 'FAS Licence user', type: 'FAS', prixHT: 20.00 },
    { reference: 'FAS-OPE-SVI', nom: 'FAS SVI', type: 'FAS', prixHT: 10.00 },
    { reference: 'FAS-OPE-PORTA', nom: 'FAS Portabilité', type: 'FAS', prixHT: 70.00 },
    { reference: 'VENTE-TEL-ROUT-AUTRE', nom: 'Vente Routeur autres', type: 'Vente matériel de téléphonie', prixHT: 600.00 },
    { reference: 'VENTE-TEL-SW8PO', nom: 'Vente Switch 8 ports 10/100 PoE', type: 'Vente matériel de téléphonie', prixHT: 210.00 },
    { reference: 'VENTE-TEL-YT53W', nom: 'Vente Yealink T53 W', type: 'Vente matériel de téléphonie', prixHT: 300.00 },
    { reference: 'VENTE-TEL-YT54W', nom: 'Vente Yealink T54 W', type: 'Vente matériel de téléphonie', prixHT: 360.00 },
    { reference: 'VENTE-TEL-YT57W', nom: 'Vente Yealink T57 W', type: 'Vente matériel de téléphonie', prixHT: 510.00 },
    { reference: 'VENTE-TEL-YW73P', nom: 'Vente Yealink W73P', type: 'Vente matériel de téléphonie', prixHT: 270.00 },
    { reference: 'VENTE-TEL-YW73H', nom: 'Vente Yealink W73H', type: 'Vente matériel de téléphonie', prixHT: 165.00 },
    { reference: 'VENTE-TEL-YW77P', nom: 'Vente Yealink W77P (Robuste)', type: 'Vente matériel de téléphonie', prixHT: 357.00 },
    { reference: 'VENTE-TEL-YW57R', nom: 'Vente Yealink W57R (Robuste)', type: 'Vente matériel de téléphonie', prixHT: 249.00 },
    { reference: 'VENTE-TEL-RT30', nom: 'Vente RT30', type: 'Vente matériel de téléphonie', prixHT: 348.00 },
    { reference: 'VENTE-TEL-DECT-W75', nom: 'Vente Borne DECT IP W75 (max 3)', type: 'Vente matériel de téléphonie', prixHT: 348.00 },
    { reference: 'VENTE-TEL-OMADA', nom: 'Vente Contrôleur Omada 3 en 1', type: 'Vente matériel de téléphonie', prixHT: 600.00 },
    { reference: 'VENTE-TEL-EAP723', nom: 'Vente EAP-723 indoor', type: 'Vente matériel de téléphonie', prixHT: 300.00 },
    { reference: 'VENTE-TEL-EAP773', nom: 'Vente EAP-773 indoor', type: 'Vente matériel de téléphonie', prixHT: 600.00 },
    { reference: 'VENTE-TEL-EAP772', nom: 'Vente EAP-772 outdoor', type: 'Vente matériel de téléphonie', prixHT: 600.00 },
    { reference: 'VENTE-SECU-CBULLET8', nom: 'Vente Caméra intérieur 8MGPX Bullet', type: 'Vente matériel de sécurité', prixHT: 348.00 },
    { reference: 'VENTE-SECU-CBULLET4K', nom: 'Vente Caméra intérieur 4K Bullet', type: 'Vente matériel de sécurité', prixHT: 687.00 },
    { reference: 'VENTE-SECU-CDOME8', nom: 'Vente Caméra intérieur 8MGPX Dome', type: 'Vente matériel de sécurité', prixHT: 348.00 },
    { reference: 'VENTE-SECU-CDOME4K', nom: 'Vente Caméra intérieur 4K Dome', type: 'Vente matériel de sécurité', prixHT: 687.00 },
    { reference: 'VENTE-SECU-ECRAN', nom: 'Vente Ecran', type: 'Vente matériel de sécurité', prixHT: 687.00 },
    { reference: 'VENTE-SECU-STOC4T', nom: 'Vente Stockeur 4T', type: 'Vente matériel de sécurité', prixHT: 300.00 },
    { reference: 'VENTE-SECU-MVR', nom: 'Vente Enregistreur MVR', type: 'Vente matériel de sécurité', prixHT: 645.00 },
    { reference: 'PREST-GEST-ADV', nom: 'Gestion ADV', type: 'Frais Installation', prixHT: 290.00 },
    { reference: 'PREST-PRE-VISITE', nom: 'Pré-visite', type: 'Frais Installation', prixHT: 250.00 },
    { reference: 'PREST-INSTALL-RES', nom: "Installation d'équipements réseaux", type: 'Frais Installation', prixHT: 500.00 },
    { reference: 'PREST-INST-CEN1-2', nom: 'Installation centrex forfait 1 à 2 postes', type: 'Frais Installation', prixHT: 300.00 },
    { reference: 'PREST-INST-CEN3-5', nom: 'Installation centrex forfait 3 à 5 postes', type: 'Frais Installation', prixHT: 900.00 },
    { reference: 'PREST-POST-CEN-SUP', nom: 'Forfait poste centrex supplémentaire', type: 'Frais Installation', prixHT: 40.00 },
    { reference: 'PREST-INST-WIFI1-5', nom: 'Installation Wifi de 1 à 5 bornes', type: 'Frais Installation', prixHT: 900.00 },
    { reference: 'PREST-BORNE-W-SUP', nom: 'Forfait borne wifi supplémentaire', type: 'Frais Installation', prixHT: 70.00 },
    { reference: 'PREST-INST-IPBX1-5', nom: 'Installation IPBX forfait 1 à 5 postes', type: 'Frais Installation', prixHT: 900.00 },
    { reference: 'PREST-POST-IPBX-SUP', nom: 'Forfait poste IPBX supplémentaire', type: 'Frais Installation', prixHT: 40.00 },
    { reference: 'PREST-INST-INF1-5', nom: 'Installation informatique de 1 à 5 PC', type: 'Frais Installation', prixHT: 900.00 },
    { reference: 'DG-MATERIEL', nom: 'DG matériel', type: 'Frais Installation', prixHT: 300.00 },
  ]

  for (const abo of abonnements) {
    await prisma.abonnement.upsert({
      where: { reference: abo.reference },
      update: { ...abo, actif: true },
      create: { ...abo, actif: true },
    })
  }

  for (const prest of prestations) {
    await prisma.prestation.upsert({
      where: { reference: prest.reference },
      update: { ...prest, actif: true },
      create: { ...prest, actif: true },
    })
  }

  console.log(`Seeded ${abonnements.length} abonnements et ${prestations.length} prestations.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
