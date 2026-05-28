# Agent Guide for Equalin

## 1. Documentation Map

Refer to the following documents in `docs/` for specific details. **Do not reinvent architectural patterns; follow existing ones.**

- **[docs/OVERVIEW.md](docs/OVERVIEW.md)**: High-level project purpose and tech stack.
- **[docs/CODING_STANDARDS.md](docs/CODING_STANDARDS.md)**: Architecture rules (Clean Architecture), naming conventions, and essential React/Next.js patterns.
- **[docs/SUPABASE.md](docs/SUPABASE.md)**: Database schema, RLS policy patterns, client usage, and common error handling.
- **[docs/MAINTENANCE.md](docs/MAINTENANCE.md)**: Verification (linting, typecheck, tests), deployment, and environment setup info.

## 2. Agent Behavior

To ensure high-quality and consistent assistance, you must always adhere to the following behavioral rules:

1. **Thinking & Communication**: Think in English internally for token efficiency, but always respond to the user concisely in Japanese.
2. **Documentation Sync**: When modifying the code, always ensure that any relevant documentation is updated.
3. **Verification**: After modifying the code, always run the validation commands specified in [docs/MAINTENANCE.md](docs/MAINTENANCE.md) using the `bun` runtime before concluding.
