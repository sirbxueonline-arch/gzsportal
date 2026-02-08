# Guluzada Client Portal

Production-oriented client portal for sharing domain and hosting credentials securely.

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- Auth0 (`@auth0/nextjs-auth0`) for authentication/session
- Supabase Postgres (via Prisma) for app data
- Supabase Storage for private documents
- AES-256-GCM secret encryption (`node:crypto`)
- Zod + React Hook Form for validated forms

## What Is Implemented

- Auth0 login/logout and session middleware (`proxy.ts`)
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
4. Copy:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SUPABASE_ANON_KEY`

## 2. Auth0 Setup

1. Create a **Regular Web Application** in Auth0.
2. Configure callback/logout URLs for local development:
   - Allowed Callback URLs: `http://localhost:3000/auth/callback`
   - Allowed Logout URLs: `http://localhost:3000`
3. Copy and set:
   - `AUTH0_ISSUER_BASE_URL`
   - `AUTH0_CLIENT_ID`
   - `AUTH0_CLIENT_SECRET`
   - `AUTH0_SECRET`
4. Set `AUTH0_BASE_URL=http://localhost:3000` for local.
5. (Optional for admin password provisioning) Create a **Machine to Machine** app authorized for Auth0 Management API with scopes:
   - `read:users`
   - `create:users`
   - `update:users`
6. Set:
   - `AUTH0_M2M_CLIENT_ID`
   - `AUTH0_M2M_CLIENT_SECRET`
   - `AUTH0_DB_CONNECTION` (example: `Username-Password-Authentication`)
   - `AUTH0_MANAGEMENT_AUDIENCE` (optional, defaults to `${AUTH0_ISSUER_BASE_URL}/api/v2/`)

## 3. Environment Variables

Copy `.env.example` to `.env.local` and fill values.

Generate `ENCRYPTION_KEY` as 32-byte base64, example:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Set `ADMIN_EMAILS` as comma-separated admin emails.

If you want admin to create/update Auth0 passwords from `/admin/users`, configure the Auth0 Management API variables above.

## 4. Install and Run Locally

```bash
npm install
npx prisma migrate dev
npm run prisma:seed
npm run dev
```

App runs at `http://localhost:3000`.

## 5. Deployment (Vercel)

1. Push this `portal/` app to your Git repository.
2. Create a Vercel project pointing to this folder.
3. Add all env vars from `.env.example` in Vercel project settings.
4. Ensure Supabase bucket `client-documents` exists and is private.
5. Deploy.

## 6. Connect `portal.guluzada.dev`

1. In Vercel project domains, add `portal.guluzada.dev`.
2. In DNS provider, create CNAME for `portal` to Vercel target.
3. Update Auth0 app settings:
   - Allowed Callback URLs includes `https://portal.guluzada.dev/auth/callback`
   - Allowed Logout URLs includes `https://portal.guluzada.dev`
4. Set `AUTH0_BASE_URL=https://portal.guluzada.dev` in production env vars.

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
