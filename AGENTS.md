# Agent Guide for Equalin

## 1. Documentation Map
Refer to the following documents in `docs/` for specific details. **Do not reinvent architectural patterns; follow existing ones.**

- **[docs/OVERVIEW.md](docs/OVERVIEW.md)**: High-level project purpose and tech stack.
- **[docs/CODING_STANDARDS.md](docs/CODING_STANDARDS.md)**: Architecture rules (Clean Architecture), naming conventions, and essential React/Next.js patterns.
- **[docs/SUPABASE.md](docs/SUPABASE.md)**: Database schema, RLS policy patterns, client usage, and common error handling (e.g., upsert usage).
- **[docs/MAINTENANCE.md](docs/MAINTENANCE.md)**: Deployment and environment setup info.

## 2. Mandatory Workflow
Every feature or bug fix must satisfy the following before completion:

1. **Linting & Formatting**: Run `npm run check:apply` to fix issues automatically.
2. **Type Safety**: Run `npm run type-check` (`tsc --noEmit`). **Zero errors allowed.**
3. **Testing**: Run `npm run test` (`bun test`). Business logic must be covered by tests.
4. **Documentation**: If you change the database schema, RLS, or architectural patterns, **update the corresponding file in `docs/` immediately.**

## 3. Key Constraints
- **Communication**: Always respond to the user in **Japanese**, while keeping internal documentation in English for token efficiency.
- **Authentication**: Using **Supabase Anonymous Auth**. Do not use manual localStorage for user identity.
- **RLS**: Strictly enforced at the DB level. Every new table must have RLS enabled with group-member-level checks.
- **IDs**: Use `UUID` for users/payments and `NanoID` for group share links.
- **Repository Pattern**: All Supabase calls must be encapsulated in `src/core/infrastructure/repositories`. Interacting layers should only use interfaces.
