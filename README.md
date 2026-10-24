<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Jigsaw Atelier

## Multiplayer production configuration

Set `SUPABASE_SERVICE_ROLE_KEY` and a long, random `MULTIPLAYER_TOKEN_SECRET` in the server environment. Do not expose either as a `NEXT_PUBLIC_*` variable. For an existing database, apply `supabase/migrations/20261024140000_secure_multiplayer.sql`; it restricts database writes to the server API and adds the one-winner race constraint.

Tactile jigsaw puzzle campaign with mathematical interlocking tab/blank pieces, adaptive difficulty, sharp 3D anime & cartoon artwork, and real-time multiplayer 1v1 puzzle battles built for the Passizy platform.

## Run Locally

**Prerequisites:** Node.js 18+ & pnpm

1. Install dependencies:
   ```bash
   pnpm install
   ```
2. Run development server:
   ```bash
   pnpm dev
   ```
3. Build for production:
   ```bash
   pnpm build
   ```
