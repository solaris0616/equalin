# Maintenance Guide

This guide provides instructions for AI agents and developers to maintain the project efficiently.

## Feature Implementation Steps
1. **Domain**: Define types in `src/core/domain/entities/` and add interfaces to `src/core/domain/repositories/`.
2. **Infrastructure**: Implement the repository (e.g., Supabase) in `src/core/infrastructure/repositories/`.
3. **Application**: Create use-cases in `src/core/application/use-cases/` if business flows involve multiple repositories.
4. **Registry**: Instantiate and export the new implementation in `src/core/registry.ts`.
5. **Presentation**: Consume the instance from Server Actions or UI components.

## Data Update Flow
- **UI Refresh**: Use `router.refresh()` or Server Action's `revalidatePath` for data updates.
- **Data Fetching**: Currently, `GroupPage` uses `useEffect`. Future migration to Server Components is recommended for performance.

## Critical Notes
- **Case Conversion**: Database uses snake_case, but the Application layer and above MUST use camelCase. Infrastructure repositories are responsible for this conversion.
- **Rounding**: Perform calculations in integers to avoid floating-point errors. Use `Math.round` only when necessary during display.

## Verification
```bash
npm run type-check
npm run test
npm run check:apply
```
Always verify these three commands pass before concluding a task.
