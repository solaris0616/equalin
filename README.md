# Equalin

**Equalin** is an open-source web application that helps you split bills **fairly and effortlessly**.

Share expenses with friends, colleagues, or teams — everyone pays their equal share, no stress attached.

## ✨ Features

- 💸 Simple and transparent bill splitting
- 👥 Group-based expense tracking
- 📱 Responsive design (mobile & desktop friendly)
- 🌐 No sign-up required (Supabase Anonymous Auth)
- ☁️ Shared group data stored in Supabase

## Development

Install Bun 1.3.14, run `bun install --frozen-lockfile`, and copy `.env.example`
to `.env.local` with your Supabase URL and publishable key. Enable Anonymous Auth
and apply all migrations on a development Supabase project. Start with `bun run dev`.
Use `bun.lock` as the dependency lockfile.

Before changes are merged, run `bun run typecheck`, `bun run check`, `bun run test`
and `bun run build`. CI runs these checks without production credentials.
See [maintenance](docs/MAINTENANCE.md), [database security](docs/SUPABASE.md)
and the [2026-10-05 review](docs/REVIEW.md) for rollout requirements and remaining work.

Database migrations are managed through the Supabase GitHub Integration.
See the [migration deployment instructions](docs/MAINTENANCE.md#supabase-github-integration).
