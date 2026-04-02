# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Install dependencies
npm install

# Setup database (first time and after schema changes)
npx prisma db push

# Seed catalogue data (abonnements + prestations)
npx prisma db seed

# Start development server
npm run dev

# Open database GUI
npm run db:studio
```

## Architecture

Next.js 14 App Router, TypeScript, Tailwind CSS, Prisma + SQLite, Nodemailer.

**Route groups:**
- `src/app/(app)/` — all main app pages with sidebar layout
- `src/app/print/` — print-only views (no nav, server components reading Prisma directly)
- `src/app/api/` — REST API routes

**Data flow:** Client pages use `fetch()` to call API routes for all mutations. Print pages are server components that import Prisma directly (no HTTP).

**Key lib files:**
- `src/lib/totals.ts` — `calculerTotaux(lignes)` — shared between server (API routes) and client (live devis preview)
- `src/lib/numbering.ts` — generates `DEV-YYYY-NNN` / `BDC-YYYY-NNN` sequential numbers
- `src/lib/email.ts` — Nodemailer transport; requires `export const runtime = 'nodejs'` in any route that imports it

## Business Logic

**Statuts:**
- Contact: `PROSPECT` | `CLIENT`
- Devis: `BROUILLON` → `ENVOYE` → `ACCEPTE` | `REFUSE`
- BDC: `EN_COURS` → `LIVRE` | `ANNULE`

**Accept devis → BDC** (`POST /api/devis/[id]/accept`):
- Atomic `$transaction`: update devis statut, promote contact to `CLIENT`, create `BonDeCommande` + `LigneBdc` records (full snapshot copy)
- Returns the new BDC object

**Totals formula:**
- `totalAbonnementHT` = sum of ABONNEMENT lines (monthly recurring)
- `totalPrestationsHT` = sum of PRESTATION lines (one-time)
- `tva` = (totalAbonnementHT + totalPrestationsHT) × 0.20
- `totalTTC` = totalHT + tva

**Editing devis:** Blocked (`403`) once statut is `ACCEPTE`. The PUT route deletes all existing `LigneDevis` then recreates from the submitted array.

**Email routes** must include `export const runtime = 'nodejs'` at the top of the file.

## Environment

Copy `.env.example` to `.env` and fill in SMTP credentials and company info. Company fields appear on all printed documents. The app runs on `http://localhost:3000`.
