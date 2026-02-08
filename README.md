# Guluzada Client Portal

Production-oriented client portal for sharing domain and hosting credentials securely.

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- Supabase Auth (email/password) for authentication/session
- Supabase Postgres (via Prisma) for app data
- Supabase Storage for private documents
- AES-256-GCM secret encryption (`node:crypto`)
- Zod + React Hook Form for validated forms

## What Is Implemented

- Supabase Auth login/logout and session refresh middleware (`proxy.ts`)
- Role-aware access model (`ADMIN` vs `CLIENT`)
- Per-client data isolation for client users
- Prisma schema + migration for all required models
- Encrypted credential storage and reveal API with access logging
- Admin CRUD routes/pages for clients, users, invites, domains, hosting, credentials, documents
- Client routes for dashboard, domains, hosting, documents, support tickets
- Supabase private document upload and signed download flow

## 1. Supabase Setup

1. Create a Supabase project.
2. Copy the Postgres connection string into `DATABASE_URL`.
3. In Storage, create a private bucket named `client-documents`.
4. In Authentication, enable Email provider (email/password login).
5. Copy:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SUPABASE_ANON_KEY`

## 2. Environment Variables

Copy `.env.example` to `.env.local` and fill values.

Generate `ENCRYPTION_KEY` as 32-byte base64, example:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Set `ADMIN_EMAILS` as comma-separated admin emails.

## 3. Install and Run Locally

```bash
npm install
npx prisma migrate dev
npm run prisma:seed
npm run dev
```

App runs at `http://localhost:3000`.

## 4. Deployment (Vercel)

1. Push this app to your Git repository.
2. Create a Vercel project pointing to this repository.
3. Add all env vars from `.env.example` in Vercel project settings.
4. Ensure Supabase bucket `client-documents` exists and is private.
5. Deploy.

## 5. Connect `portal.guluzada.dev`

1. In Vercel project domains, add `portal.guluzada.dev`.
2. In DNS provider, create CNAME for `portal` to Vercel target.
3. In Supabase Authentication URL config, add:
   - Site URL: `https://portal.guluzada.dev`
   - Redirect URL: `https://portal.guluzada.dev`

## Security Notes

- Secrets are encrypted before DB storage (AES-256-GCM).
- Secrets are only decrypted server-side in `POST /api/credentials/reveal`.
- Every reveal is logged in `SecretAccessLog`.
- Clients only read records that match their `clientId`.

## Route Map

Public:
- `/`
- `/login`
- `/logout`
- `/not-authorized`

Client area:
- `/dashboard`
- `/domains`
- `/domains/[id]`
- `/hosting`
- `/hosting/[id]`
- `/documents`
- `/support`

Admin area:
- `/admin`
- `/admin/clients`
- `/admin/clients/[id]`
- `/admin/users`
- `/admin/invites`
