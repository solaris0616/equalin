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
- **Data Fetching**: `GroupPage` is a Server Component. `GroupDashboardUseCase` assembles data and settlement through repositories. Client mutations reload the dashboard; settlement display consumes those results without another request.

## Critical Notes

- **Case Conversion**: Database uses snake_case, but the Application layer and above MUST use camelCase. Infrastructure repositories are responsible for this conversion.
- **Rounding**: Perform calculations in integers to avoid floating-point errors. Use `Math.round` only when necessary during display.

## Verification

```bash
bun run typecheck
bun run check
bun run test
```

Always verify these three commands pass before concluding a task.

`check` is read-only. Use `bun run format` intentionally to apply formatting.
Database tests use PGlite with stubbed Supabase identities and no production credentials.
Also run `bun run build` with the two public Supabase variables configured.
Next/font needs Google Fonts access during builds.

## Database rollout

Back up and apply the 20261005 migrations on staging first. Invalid historical
payment membership or amounts stop migration instead of silently deleting data.
Release database and app together in a maintenance window; older clients' direct
table writes are intentionally rejected by the new grants.

Staging checks: anonymous sign-in, expired-cookie refresh, invitation joining,
collaborator creation versus owner edit/delete, cross-group rejection, referenced
member protection, concurrent deletes/edits, >1,000 payment history, network errors
versus zero settlement, and mobile keyboard navigation.

Local tests do not modify remote databases or exercise PostgREST, real Supabase
Auth, or multi-connection locking. Retention, restore drills, abuse limits and
performance budgets need deployment configuration. See `REVIEW.md` for remaining work.

## Supabase GitHub Integration

Database migrations are managed through the Supabase GitHub Integration.
Keep `supabase/config.toml` and `supabase/migrations/` in version control.
The working directory is `.` for this repository. Production deployment requires
**Deploy to production** to be enabled for the intended production branch.

`.github/workflows/ci.yml` continues to run application typechecking, lint,
tests and builds. Supabase Integration does not replace those checks.
The separate manual migration workflow has been removed; its GitHub deployment
secrets are not required by the remaining CI workflow.

Check the Supabase deployment status and migration history after merging.
Coordinate database and app releases as described above, especially when changing
permissions or introducing incompatible schema changes.

Reference: [Supabase GitHub Integration](https://supabase.com/docs/guides/deployment/branching/github-integration).
