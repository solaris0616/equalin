# Coding Standards for Equalin

## 1. Architectural Principles
We strictly adhere to Clean Architecture:
- **Domain Layer**: Must have zero external dependencies. Use standard TypeScript only.
- **Infrastructure Layer**: Encapsulate external SDKs (like Supabase) here.
- **Presentation Layer**: Server Actions must obtain repositories/use-cases via `src/core/registry.ts`. Never instantiate `SupabaseRepository` directly in components or actions.

## 2. Naming Conventions
- **Entities**: Use camelCase (`payerId`, `createdAt`).
- **Interfaces**: Prefix with `I` (`IGroupRepository`).
- **Files**:
  - React Components: PascalCase (`PaymentForm.tsx`)
  - Logic/Classes: PascalCase (`SettlementService.ts`, `SupabasePaymentRepository.ts`)
  - Utilities: camelCase

## 3. Type Safety
- **Strict No-Any**: Avoid `any`. Use `unknown` with type guards or explicit casting if necessary.
- **Source of Truth**: Use domain entities as the primary types. Minimize type transformations in the Presentation layer.
- **Validation**: Always run `npm run type-check` (`tsc --noEmit`) before deployment or commit. **Zero type errors allowed.**

## 4. Database
- **Currency**: Store amounts as `BIGINT` (minimal units/cents). Keep as `number` in application logic.
- **Timestamps**: Use `TIMESTAMPTZ`.
- **ID Design**:
  - Use `UUID` for Users and Payments (compatibility with Supabase Auth).
  - Use `NanoID (TEXT)` for Group IDs (shareable and user-friendly URLs).
- **Updates**: Use `upsert` for junction tables (e.g., `payment_participants`) to prevent race conditions and duplicate key errors.

## 5. Testing & Documentation
- **Regression**: Run `npm run test` (`bun test`) after changing business logic.
- **New Features**: Must include unit tests for domain services.
- **Synchronization**: Always update tests and `docs/` when changing code or schema.

## 6. React/Next.js Best Practices
- **Supabase Client**: 
  - Use `@/lib/supabase/server` for Server Actions/Components.
  - Use `@/lib/supabase/client` for Client Components.
- **Hooks**: Wrap functions passed to `useEffect` dependency arrays in `useCallback` to prevent infinite re-renders.
